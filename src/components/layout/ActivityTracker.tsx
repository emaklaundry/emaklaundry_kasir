import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useAppContext from '../../contexts/useAppContext';
import { flushAudit, setAuditActor, trackAudit, AuditEntryInput } from '../../utils/auditTracker';

/**
 * Mencatat setiap interaksi pengguna ke log audit:
 * buka halaman, klik tombol/tautan/tab, isi kolom form, pilihan dropdown,
 * centang, cetak, salin, pindah tab browser, online/offline, dan error aplikasi.
 *
 * Privasi: isi kolom teks & password TIDAK pernah dicatat, hanya nama kolomnya.
 * Elemen di dalam [data-audit-ignore] dilewati.
 */

const CLICKABLE =
  'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], summary, input[type="submit"], input[type="button"], input[type="reset"]';
/** Tipe input yang nilainya aman & berguna dicatat (filter tanggal, jumlah, dll.) */
const VALUE_SAFE_INPUT_TYPES = new Set(['date', 'datetime-local', 'month', 'week', 'time', 'number', 'range', 'color']);
const MAX_LABEL = 80;
const DEDUPE_MS = 400;
const MAX_ERRORS_PER_MINUTE = 10;

const clean = (text: string | null | undefined) =>
  (text || '').replace(/\s+/g, ' ').trim().slice(0, MAX_LABEL);

function labelOf(el: Element): string {
  const aria = el.getAttribute('aria-label');
  if (aria) return clean(aria);

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent)
      .join(' ');
    if (clean(text)) return clean(text);
  }

  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    const fromLabel = el.labels?.[0]?.textContent;
    if (clean(fromLabel)) return clean(fromLabel);
    if (el instanceof HTMLInputElement && (el.type === 'submit' || el.type === 'button')) {
      return clean(el.value);
    }
    if ('placeholder' in el && el.placeholder) return clean(el.placeholder);
  }

  const title = el.getAttribute('title');
  const text = (el instanceof HTMLElement && el.innerText) || el.textContent;
  return clean(text) || clean(title) || clean(el.getAttribute('name')) || clean(el.id) || el.tagName.toLowerCase();
}

/** Judul dialog/modal tempat elemen berada, supaya log jelas konteksnya. */
function contextOf(el: Element): string | undefined {
  const dialog = el.closest('[role="dialog"], dialog');
  if (!dialog) return undefined;
  const labelId = dialog.getAttribute('aria-labelledby');
  const title =
    (labelId && document.getElementById(labelId)?.textContent) ||
    dialog.getAttribute('aria-label') ||
    dialog.querySelector('h1, h2, h3')?.textContent;
  return clean(title) || undefined;
}

const withContext = (action: string, el: Element) => {
  const ctx = contextOf(el);
  return ctx ? `${action} (di "${ctx}")` : action;
};

const ignored = (el: Element) => !!el.closest('[data-audit-ignore]');

const ActivityTracker: React.FC<{ pageTitle: string }> = ({ pageTitle }) => {
  const { currentUser } = useAppContext();
  const location = useLocation();
  const lastPath = useRef<string | null>(null);
  const lastEntry = useRef<{ action: string; at: number }>({ action: '', at: 0 });
  const errorTimes = useRef<number[]>([]);
  const isLoggedIn = !!currentUser;
  const userId = currentUser?.id;

  // Effect anak berjalan sebelum effect AppContext, jadi identitas diset di sini juga
  // agar log navigasi & awal sesi pertama tidak terbuang.
  const userName = currentUser?.name;
  const userStoreId = currentUser?.storeId ?? null;
  useEffect(() => {
    if (userName) setAuditActor({ name: userName, storeId: userStoreId });
  }, [userName, userStoreId]);

  // Awal sesi (sekali per tab browser per pengguna, bukan tiap refresh halaman)
  useEffect(() => {
    if (!userId) return;
    const key = `audit_session_started_${userId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      /* sessionStorage tidak tersedia */
    }
    trackAudit({
      action: 'Membuka aplikasi (sesi dimulai)',
      category: 'sesi',
      metadata: {
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`,
        online: navigator.onLine,
      },
    });
  }, [userId]);

  // Navigasi halaman
  useEffect(() => {
    if (!isLoggedIn) return;
    const path = `${location.pathname}${location.search}`;
    if (lastPath.current === path) return;
    const from = lastPath.current;
    lastPath.current = path;
    trackAudit({
      action: `Membuka halaman "${pageTitle}"`,
      category: 'navigasi',
      metadata: { path, from },
    });
  }, [isLoggedIn, location.pathname, location.search, pageTitle]);

  // Interaksi di seluruh dokumen
  useEffect(() => {
    if (!isLoggedIn) return;

    const log = (entry: AuditEntryInput) => {
      const now = Date.now();
      if (lastEntry.current.action === entry.action && now - lastEntry.current.at < DEDUPE_MS) return;
      lastEntry.current = { action: entry.action, at: now };
      trackAudit(entry);
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const el = target?.closest?.(CLICKABLE);
      if (!el || ignored(el)) return;
      if (el.getAttribute('aria-disabled') === 'true' || (el as HTMLButtonElement).disabled) return;

      const label = labelOf(el);
      let action: string;
      const metadata: Record<string, unknown> = {};

      if (el instanceof HTMLAnchorElement) {
        const url = new URL(el.href, window.location.href);
        const external = url.origin !== window.location.origin;
        action = external ? `Membuka tautan luar "${label}"` : `Klik tautan "${label}"`;
        // Tautan luar (mis. wa.me berisi nomor HP) hanya dicatat domainnya.
        metadata.href = external ? url.host : `${url.pathname}${url.search}`;
      } else if (el.getAttribute('role') === 'tab') {
        action = `Membuka tab "${label}"`;
      } else {
        action = `Klik tombol "${label}"`;
      }
      log({ action: withContext(action, el), category: 'klik', metadata });
    };

    const onChange = (event: Event) => {
      const el = event.target as Element | null;
      if (!el || ignored(el)) return;
      const label = labelOf(el);

      if (el instanceof HTMLSelectElement) {
        const chosen = clean(el.selectedOptions[0]?.textContent) || el.value;
        log({ action: withContext(`Memilih "${chosen}" pada "${label}"`, el), category: 'klik' });
      } else if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') {
          log({
            action: withContext(`${el.checked ? 'Mencentang' : 'Menghapus centang'} "${label}"`, el),
            category: 'klik',
          });
        } else if (el.type === 'radio') {
          log({ action: withContext(`Memilih opsi "${label}"`, el), category: 'klik' });
        } else if (el.type === 'file') {
          log({
            action: withContext(`Memilih ${el.files?.length ?? 0} file pada "${label}"`, el),
            category: 'aktivitas',
          });
        } else if (el.type === 'password') {
          log({ action: withContext(`Mengisi kolom "${label}"`, el), category: 'klik' });
        } else if (VALUE_SAFE_INPUT_TYPES.has(el.type)) {
          log({
            action: withContext(`Mengisi "${label}" = ${clean(el.value) || '(kosong)'}`, el),
            category: 'klik',
          });
        } else {
          log({
            action: withContext(`${el.value ? 'Mengisi' : 'Mengosongkan'} kolom "${label}"`, el),
            category: 'klik',
          });
        }
      } else if (el instanceof HTMLTextAreaElement) {
        log({
          action: withContext(`${el.value ? 'Mengisi' : 'Mengosongkan'} kolom "${label}"`, el),
          category: 'klik',
        });
      }
    };

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      if (!form || ignored(form)) return;
      const name = clean(form.getAttribute('aria-label') || form.getAttribute('name') || form.id);
      log({
        action: withContext(name ? `Mengirim formulir "${name}"` : 'Mengirim formulir', form),
        category: 'klik',
      });
    };

    const onCopy = () => log({ action: 'Menyalin teks', category: 'klik' });
    const onPrint = () => log({ action: 'Mencetak halaman', category: 'aktivitas' });

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        trackAudit({ action: 'Meninggalkan tab aplikasi', category: 'sesi' });
        void flushAudit();
      } else {
        trackAudit({ action: 'Kembali ke tab aplikasi', category: 'sesi' });
      }
    };
    const onOnline = () => {
      trackAudit({ action: 'Koneksi internet tersambung kembali', category: 'sesi' });
      void flushAudit();
    };
    const onOffline = () => trackAudit({ action: 'Koneksi internet terputus (offline)', category: 'sesi' });
    const onPageHide = () => void flushAudit();

    const logError = (message: string, extra: Record<string, unknown>) => {
      const now = Date.now();
      errorTimes.current = errorTimes.current.filter((t) => now - t < 60_000);
      if (errorTimes.current.length >= MAX_ERRORS_PER_MINUTE) return;
      errorTimes.current.push(now);
      trackAudit({ action: `Error aplikasi: ${clean(message) || 'tidak diketahui'}`, category: 'error', metadata: extra });
    };
    const onError = (event: ErrorEvent) =>
      logError(event.message, { source: event.filename, line: event.lineno });
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string } | string | undefined;
      logError(typeof reason === 'string' ? reason : reason?.message || 'Promise ditolak', {});
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('copy', onCopy);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeprint', onPrint);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('change', onChange, true);
      document.removeEventListener('submit', onSubmit, true);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeprint', onPrint);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [isLoggedIn]);

  return null;
};

export default ActivityTracker;

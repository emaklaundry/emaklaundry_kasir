import { supabase } from './supabaseClient';

/**
 * Kategori log audit (kolom audit_logs.category).
 * - data: perubahan baris di database, ditulis trigger server (bukan dari sini)
 * - aktivitas: aksi bisnis yang dicatat aplikasi (simpan, hapus, cetak, kirim WA, ekspor...)
 * - navigasi: membuka halaman
 * - klik: tombol, tautan, tab, pilihan yang ditekan
 * - sesi: login, logout, online/offline, pindah tab browser
 * - error: error aplikasi yang tidak tertangani
 */
export type AuditCategory = 'data' | 'aktivitas' | 'navigasi' | 'klik' | 'sesi' | 'error';

export interface AuditEntryInput {
  action: string;
  category?: AuditCategory;
  storeId?: string | null;
  metadata?: Record<string, unknown>;
}

interface QueuedEntry {
  timestamp: string;
  user: string;
  action: string;
  category: AuditCategory;
  storeId: string | null;
  page: string;
  metadata: Record<string, unknown> | null;
}

export interface AuditActor {
  name: string;
  storeId: string | null;
}

const FLUSH_DELAY_MS = 3000;
const MAX_BATCH = 50;
const MAX_QUEUE = 500;

let actor: AuditActor | null = null;
let queue: QueuedEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let flushing: Promise<void> | null = null;

/** Diset oleh ActivityTracker / AppContext saat pengguna login; null saat logout. */
export function setAuditActor(next: AuditActor | null) {
  actor = next;
}

export function getAuditActor() {
  return actor;
}

function currentPage() {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Masukkan satu log ke antrean. Log dikirim berkelompok (maks. tiap 3 detik)
 * supaya klik-klik kecil tidak membuat satu request per klik.
 * `immediate` mengirim antrean sekarang juga (dipakai untuk aksi penting & logout).
 */
export function trackAudit(entry: AuditEntryInput, options: { immediate?: boolean } = {}) {
  const who = actor;
  if (!who) return;

  queue.push({
    timestamp: new Date().toISOString(),
    // Nama asli diisi ulang oleh trigger server dari profil auth.uid(); ini hanya cadangan.
    user: who.name,
    action: entry.action.slice(0, 500),
    category: entry.category ?? 'aktivitas',
    storeId: entry.storeId || who.storeId || null,
    page: currentPage(),
    metadata: entry.metadata ?? null,
  });
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);

  if (options.immediate || queue.length >= MAX_BATCH) {
    void flushAudit();
  } else if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      void flushAudit();
    }, FLUSH_DELAY_MS);
  }
}

/** Kirim semua log di antrean. Jika gagal (mis. offline), log dikembalikan ke antrean. */
export function flushAudit(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  // Pengiriman yang sedang berjalan akan lanjut mengirim sisa antrean jika berhasil.
  if (flushing) return flushing;
  if (queue.length === 0) return Promise.resolve();

  const batch = queue.splice(0, MAX_BATCH);
  flushing = (async () => {
    try {
      const { error } = await supabase.from('audit_logs').insert(batch);
      if (error) throw error;
    } catch (error) {
      console.error('Gagal mengirim log audit:', error);
      // simpan lagi agar terkirim saat koneksi pulih
      queue = [...batch, ...queue].slice(-MAX_QUEUE);
      return;
    } finally {
      flushing = null;
    }
    if (queue.length) await flushAudit();
  })();
  return flushing;
}

/** Hanya untuk test. */
export function __resetAuditTracker() {
  actor = null;
  queue = [];
  flushing = null;
  if (timer) clearTimeout(timer);
  timer = null;
}

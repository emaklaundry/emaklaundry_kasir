import React, { useEffect, useId, useRef, useState } from 'react';
import { BookOpenIcon } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import useAppContext from '../contexts/useAppContext';
import useToday from '../hooks/useToday';
import { getSopCategoriesForRole } from '../config/sop';

interface SOPItem {
  id: string;
  title: string;
  category: string;
  content: string;
  display_order: number | null;
}

const ackKey = (userId: string, date: string) => `sop-ack:${userId}:${date}`;

const hasAcknowledged = (key: string) => {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

/**
 * Pop up SOP wajib baca untuk Kasir & Operator. Muncul sekali per hari per
 * pengguna (saat pertama kali membuka aplikasi hari itu) dan hanya bisa
 * ditutup setelah pengguna menyatakan sudah membaca.
 */
const SOPReminder: React.FC = () => {
  const { currentUser } = useAppContext();
  const today = useToday();
  const categories = getSopCategoriesForRole(currentUser?.role);
  const key = currentUser ? ackKey(currentUser.id, today) : '';

  const [sops, setSops] = useState<SOPItem[] | null>(null);
  const [acknowledgedKey, setAcknowledgedKey] = useState('');
  const needsAck = Boolean(categories) && key !== acknowledgedKey && !hasAcknowledged(key);

  useEffect(() => {
    if (!categories || !needsAck) return;
    let cancelled = false;
    supabase
      .from('standard_operating_procedures')
      .select('id, title, category, content, display_order')
      .in('category', categories)
      .order('display_order')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('SOP gagal dimuat:', error.message);
          setSops([]);
          return;
        }
        const order = (c: string) => categories.indexOf(c);
        setSops(
          [...(data ?? [])].sort(
            (a, b) =>
              order(a.category) - order(b.category) ||
              (a.display_order ?? 0) - (b.display_order ?? 0),
          ),
        );
      });
    return () => {
      cancelled = true;
    };
    // categories berasal dari konstanta per peran, cukup bergantung pada peran.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.role, needsAck]);

  const isOpen = needsAck && sops !== null && sops.length > 0;

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(key, '1');
    } catch {
      // Penyimpanan diblokir: cukup tutup untuk sesi ini.
    }
    setAcknowledgedKey(key);
  };

  if (!isOpen || !currentUser) return null;

  return (
    <SOPReminderDialog
      roleLabel={currentUser.role}
      userName={currentUser.name}
      sops={sops ?? []}
      onAcknowledge={handleAcknowledge}
    />
  );
};

interface SOPReminderDialogProps {
  roleLabel: string;
  userName?: string;
  sops: SOPItem[];
  onAcknowledge: () => void;
}

const SOPReminderDialog: React.FC<SOPReminderDialogProps> = ({
  roleLabel,
  userName,
  sops,
  onAcknowledge,
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const checkboxId = useId();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  const grouped = sops.reduce<Record<string, SOPItem[]>>((acc, sop) => {
    (acc[sop.category] ??= []).push(sop);
    return acc;
  }, {});

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Wajib dibaca: Escape tidak menutup pop up.
      onCancel={(event) => event.preventDefault()}
      className="modal-dialog fixed inset-0 z-[70] m-0 h-full w-full max-h-none max-w-none items-end justify-center overflow-hidden border-0 bg-transparent p-0 sm:items-center"
    >
      <div
        className="relative mx-0 flex w-full max-w-2xl flex-col rounded-t-3xl bg-white shadow-2xl dark:bg-slate-800 sm:mx-4 sm:rounded-xl"
        style={{ maxHeight: '92vh' }}
      >
        <div className="flex-shrink-0 border-b p-4 dark:border-slate-700 sm:p-5">
          <h2
            id={titleId}
            className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl"
          >
            <BookOpenIcon className="h-6 w-6 text-brand-blue-600 dark:text-brand-blue-400" />
            SOP {roleLabel} – wajib dibaca
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {userName ? `Halo ${userName}, ` : ''}baca prosedur kerja di bawah ini sebelum mulai
            bekerja hari ini.
          </p>
        </div>

        <div className="mobile-scroll flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category}>
              <h3 className="mb-3 border-b border-slate-200 pb-1 text-sm font-bold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {category}
              </h3>
              <div className="space-y-4">
                {items.map((sop) => (
                  <article
                    key={sop.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40"
                  >
                    <h4 className="mb-2 font-semibold text-slate-900 dark:text-white">
                      {sop.title}
                    </h4>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {sop.content}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="flex flex-shrink-0 flex-col gap-3 border-t border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <label
            htmlFor={checkboxId}
            className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200"
          >
            <input
              id={checkboxId}
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
            Saya sudah membaca dan akan mengikuti SOP ini.
          </label>
          <button
            type="button"
            disabled={!confirmed}
            onClick={onAcknowledge}
            className="btn btn-primary btn-sm"
          >
            Mulai bekerja
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default SOPReminder;

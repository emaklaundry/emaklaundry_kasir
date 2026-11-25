import React, { useMemo, useState } from 'react';
import Modal from './Modal';
import useAppContext from '../contexts/useAppContext';
import { UserRole } from '../types';
import {
  getLocalDateString,
  getMonthPeriod,
  getOutstandingMonthlyTemplates,
} from '../utils/monthlyExpenses';
import {
  useMonthlyExpenseRecords,
  useMonthlyExpenseTemplates,
  useSaveMonthlyExpenses,
} from '../hooks/useMonthlyExpenses';
import useToasts from '../contexts/useToasts';

const MonthlyExpenseReminder: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const period = getMonthPeriod(new Date());
  const storeIds = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === UserRole.SuperAdmin) {
      return selectedStoreId === 'all'
        ? stores.filter((store) => store.isActive).map((store) => store.id)
        : [selectedStoreId];
    }
    return currentUser.storeId ? [currentUser.storeId] : [];
  }, [currentUser, selectedStoreId, stores]);
  const templatesQuery = useMonthlyExpenseTemplates(storeIds);
  const recordsQuery = useMonthlyExpenseRecords(storeIds, period);
  const [dismissedKey, setDismissedKey] = useState('');

  const nextStore = storeIds
    .map((storeId) => ({
      storeId,
      templates: getOutstandingMonthlyTemplates(
        templatesQuery.templates,
        recordsQuery.data ?? [],
        storeId,
        period,
      ),
    }))
    .find((store) => store.templates.length > 0);

  const scopeId =
    currentUser?.role === UserRole.SuperAdmin ? selectedStoreId : (currentUser?.storeId ?? '');
  const reminderKey = `${scopeId}:${period}`;
  const isOpen =
    Boolean(currentUser) &&
    !templatesQuery.isLoading &&
    !recordsQuery.isLoading &&
    !templatesQuery.error &&
    !recordsQuery.error &&
    Boolean(nextStore) &&
    dismissedKey !== reminderKey;
  const storeName = stores.find((store) => store.id === nextStore?.storeId)?.name;
  const monthLabel = new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${period}T12:00:00`));

  const closeReminder = () => setDismissedKey(reminderKey);

  const queryError = templatesQuery.error || recordsQuery.error;
  if (queryError) {
    return (
      <div
        role="alert"
        className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex max-w-xl items-center justify-between gap-4 rounded-lg border border-red-300 bg-white p-4 text-sm text-red-800 shadow-lg dark:border-red-800 dark:bg-slate-900 dark:text-red-200"
      >
        <span>Pengingat pengeluaran bulanan gagal dimuat.</span>
        <button
          type="button"
          onClick={() => {
            void templatesQuery.refetch();
            void recordsQuery.refetch();
          }}
          className="shrink-0 rounded-md px-3 py-2 font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-slate-800"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  return nextStore ? (
    <MonthlyExpenseReminderDialog
      key={`${nextStore.storeId}:${period}`}
      isOpen={isOpen}
      storeId={nextStore.storeId}
      storeName={storeName}
      templates={nextStore.templates}
      period={period}
      monthLabel={monthLabel}
      onClose={closeReminder}
    />
  ) : null;
};

interface MonthlyExpenseReminderDialogProps {
  isOpen: boolean;
  storeId: string;
  storeName?: string;
  templates: ReturnType<typeof getOutstandingMonthlyTemplates>;
  period: string;
  monthLabel: string;
  onClose: () => void;
}

const MonthlyExpenseReminderDialog: React.FC<MonthlyExpenseReminderDialogProps> = ({
  isOpen,
  storeId,
  storeName,
  templates,
  period,
  monthLabel,
  onClose,
}) => {
  const { addToast } = useToasts();
  const saveMonthlyExpenses = useSaveMonthlyExpenses();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const hasInvalidAmount = templates.some((template) => {
      const value = amounts[template.id];
      return (
        value === undefined ||
        value.trim() === '' ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
      );
    });
    if (hasInvalidAmount) {
      setSaveError('Masukkan jumlah yang valid untuk setiap tagihan.');
      return;
    }

    setSaveError(null);
    try {
      await saveMonthlyExpenses.mutateAsync(
        templates.map((template) => ({
          storeId,
          templateId: template.id,
          period,
          date: getLocalDateString(new Date()),
          description: `${template.name} - ${monthLabel}`,
          category: template.category,
          amount: Number(amounts[template.id]),
        })),
      );
      addToast('Pengeluaran bulanan berhasil disimpan.', 'success');
    } catch {
      setSaveError(
        'Tagihan belum tersimpan. Periksa koneksi, lalu coba lagi; data yang sudah tersimpan tetap aman.',
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Pengeluaran bulanan ${monthLabel}`}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            Nanti
          </button>
          <button
            type="submit"
            form="monthly-expense-reminder-form"
            disabled={saveMonthlyExpenses.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saveMonthlyExpenses.isPending ? 'Menyimpan…' : 'Simpan tagihan'}
          </button>
        </>
      }
    >
      <form id="monthly-expense-reminder-form" onSubmit={handleSave} className="space-y-4">
        <div>
          <p className="font-medium text-slate-900 dark:text-white">
            {storeName ? `Cabang ${storeName}` : 'Lengkapi tagihan cabang ini'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Catat jumlah tagihan rutin bulan ini. Anda dapat menundanya dan pengingat akan muncul
            kembali saat masuk berikutnya.
          </p>
        </div>
        {templates.map((template, index) => (
          <div key={template.id} className="space-y-1">
            <label
              htmlFor={`monthly-expense-${template.id}`}
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              {template.name} (Rp)
            </label>
            <input
              autoFocus={index === 0}
              id={`monthly-expense-${template.id}`}
              name={`monthly-expense-${template.id}`}
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={amounts[template.id] ?? ''}
              onChange={(event) =>
                setAmounts((previous) => ({
                  ...previous,
                  [template.id]: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              required
            />
          </div>
        ))}
        {saveError && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">
            {saveError}
          </p>
        )}
      </form>
    </Modal>
  );
};

export default MonthlyExpenseReminder;

import React, { useState } from 'react';
import Modal from './Modal';
import { useMonthlyExpenseTemplates } from '../hooks/useMonthlyExpenses';
import { useSettings } from '../contexts/SettingsContext';
import {
  MAX_REMINDER_DAY,
  MIN_REMINDER_DAY,
  MonthlyExpenseTemplate,
  normalizeReminderDay,
} from '../utils/monthlyExpenses';

const categories = ['Operasional', 'Listrik', 'Air', 'Gaji', 'Perlengkapan', 'Lainnya'];
const reminderDays = Array.from(
  { length: MAX_REMINDER_DAY - MIN_REMINDER_DAY + 1 },
  (_, index) => MIN_REMINDER_DAY + index,
);

const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID').format(value);

/** '' = tanpa nominal default; selain itu harus angka >= 0. undefined = tidak valid. */
const parseDefaultAmount = (value: string): number | null | undefined => {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const amount = Number(trimmed);
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined;
};

const getErrorCode = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : '';

const MonthlyExpensesManager: React.FC<{ storeId: string }> = ({ storeId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Operasional');
  const [defaultAmount, setDefaultAmount] = useState('');
  const [editing, setEditing] = useState<{
    id: string;
    name: string;
    category: string;
    defaultAmount: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { settings, updateSettings } = useSettings();
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const {
    templates,
    isLoading,
    error,
    refetch,
    addTemplate,
    isAddingTemplate,
    setTemplateActive,
    updateTemplate,
    deleteTemplate,
    isUpdatingTemplate,
  } = useMonthlyExpenseTemplates(storeId ? [storeId] : []);

  const reminderEnabled = settings?.monthlyExpenseReminderEnabled !== false;
  const reminderDay = normalizeReminderDay(settings?.monthlyExpenseReminderDay);

  const saveReminderSettings = async (
    patch: { monthlyExpenseReminderEnabled: boolean } | { monthlyExpenseReminderDay: number },
  ) => {
    setErrorMessage(null);
    setIsSavingSettings(true);
    try {
      await updateSettings(patch);
    } catch {
      setErrorMessage('Pengaturan pop-up gagal disimpan. Periksa koneksi, lalu coba lagi.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama tagihan wajib diisi.');
      return;
    }
    const parsedAmount = parseDefaultAmount(defaultAmount);
    if (parsedAmount === undefined) {
      setErrorMessage('Nominal default harus berupa angka 0 atau lebih.');
      return;
    }

    setErrorMessage(null);
    try {
      await addTemplate({
        storeId,
        name: trimmedName,
        category,
        sortOrder: templates.length + 1,
        defaultAmount: parsedAmount,
      });
      setName('');
      setDefaultAmount('');
    } catch {
      setErrorMessage('Tagihan gagal ditambahkan. Pastikan namanya belum digunakan.');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    setErrorMessage(null);
    try {
      await setTemplateActive({ id, isActive: !isActive });
    } catch {
      setErrorMessage('Status tagihan gagal diperbarui.');
    }
  };

  const startEdit = (template: MonthlyExpenseTemplate) => {
    setConfirmDeleteId(null);
    setErrorMessage(null);
    setEditing({
      id: template.id,
      name: template.name,
      category: template.category,
      defaultAmount: template.defaultAmount === null ? '' : String(template.defaultAmount),
    });
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const trimmedName = editing.name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama tagihan wajib diisi.');
      return;
    }
    const parsedAmount = parseDefaultAmount(editing.defaultAmount);
    if (parsedAmount === undefined) {
      setErrorMessage('Nominal default harus berupa angka 0 atau lebih.');
      return;
    }
    setErrorMessage(null);
    try {
      await updateTemplate({
        id: editing.id,
        name: trimmedName,
        category: editing.category,
        defaultAmount: parsedAmount,
      });
      setEditing(null);
    } catch {
      setErrorMessage('Tagihan gagal diperbarui. Pastikan namanya belum digunakan.');
    }
  };

  const handleDelete = async (template: MonthlyExpenseTemplate) => {
    setErrorMessage(null);
    try {
      await deleteTemplate(template.id);
      setConfirmDeleteId(null);
    } catch (deleteError) {
      setConfirmDeleteId(null);
      setErrorMessage(
        getErrorCode(deleteError) === '23503'
          ? `${template.name} sudah punya riwayat pengeluaran, jadi tidak bisa dihapus. Nonaktifkan saja agar tidak muncul lagi di pop-up.`
          : 'Tagihan gagal dihapus. Periksa koneksi, lalu coba lagi.',
      );
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
    setConfirmDeleteId(null);
    setErrorMessage(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        Tagihan bulanan
      </button>
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title="Kelola tagihan bulanan"
        footer={
          <>
            <button type="button" onClick={closeModal} className="btn btn-secondary btn-sm">
              Selesai
            </button>
            <button
              type="submit"
              form="monthly-expense-template-form"
              disabled={isAddingTemplate}
              className="btn btn-primary btn-sm"
            >
              {isAddingTemplate ? 'Menyimpan…' : 'Tambah tagihan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <legend className="px-1 font-semibold text-slate-900 dark:text-white">
              Pengaturan pop-up
            </legend>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={reminderEnabled}
                disabled={isSavingSettings || !settings}
                onChange={(event) =>
                  void saveReminderSettings({
                    monthlyExpenseReminderEnabled: event.target.checked,
                  })
                }
                className="mt-1 h-4 w-4"
              />
              <span>
                <span className="block font-medium text-slate-900 dark:text-white">
                  Tampilkan pop-up pengingat
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Jika dimatikan, tagihan tetap bisa dicatat lewat Tambah Pengeluaran.
                </span>
              </span>
            </label>
            <div>
              <label htmlFor="monthly-expense-reminder-day" className="form-label">
                Mulai muncul setiap tanggal
              </label>
              <select
                id="monthly-expense-reminder-day"
                value={reminderDay}
                disabled={isSavingSettings || !settings || !reminderEnabled}
                onChange={(event) =>
                  void saveReminderSettings({
                    monthlyExpenseReminderDay: Number(event.target.value),
                  })
                }
                className="form-input px-3 py-2"
              >
                {reminderDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pop-up muncul dari tanggal ini sampai tagihan bulan itu diisi. Berlaku untuk semua
                cabang.
              </p>
            </div>
          </fieldset>

          <form id="monthly-expense-template-form" onSubmit={handleAdd} className="space-y-4">
            <div>
              <label htmlFor="monthly-expense-template-name" className="form-label">
                Nama tagihan
              </label>
              <input
                id="monthly-expense-template-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                autoComplete="off"
                className="form-input px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="monthly-expense-template-category" className="form-label">
                Kategori pengeluaran
              </label>
              <select
                id="monthly-expense-template-category"
                name="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="form-input px-3 py-2"
              >
                {categories.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="monthly-expense-template-amount" className="form-label">
                Nominal default (Rp, opsional)
              </label>
              <input
                id="monthly-expense-template-amount"
                name="defaultAmount"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={defaultAmount}
                onChange={(event) => setDefaultAmount(event.target.value)}
                className="form-input px-3 py-2"
              />
            </div>
          </form>

          {error && (
            <div role="alert" className="text-sm text-red-700 dark:text-red-300">
              Gagal memuat daftar tagihan.{' '}
              <button
                type="button"
                onClick={() => void refetch()}
                className="font-semibold underline"
              >
                Coba lagi
              </button>
            </div>
          )}
          {errorMessage && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </p>
          )}

          <div className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Daftar tagihan</h3>
            {isLoading ? (
              <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
                Memuat tagihan…
              </p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Belum ada tagihan untuk cabang ini.
              </p>
            ) : (
              <ul className="space-y-2">
                {templates.map((template) =>
                  editing?.id === template.id ? (
                    <li
                      key={template.id}
                      className="space-y-3 rounded-lg border border-primary-300 p-3 dark:border-primary-700"
                    >
                      <div>
                        <label htmlFor={`edit-name-${template.id}`} className="form-label">
                          Nama tagihan
                        </label>
                        <input
                          id={`edit-name-${template.id}`}
                          value={editing.name}
                          onChange={(event) => setEditing({ ...editing, name: event.target.value })}
                          maxLength={80}
                          autoComplete="off"
                          className="form-input px-3 py-2"
                        />
                      </div>
                      <div>
                        <label htmlFor={`edit-category-${template.id}`} className="form-label">
                          Kategori pengeluaran
                        </label>
                        <select
                          id={`edit-category-${template.id}`}
                          value={editing.category}
                          onChange={(event) =>
                            setEditing({ ...editing, category: event.target.value })
                          }
                          className="form-input px-3 py-2"
                        >
                          {[...new Set([...categories, editing.category])].map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`edit-amount-${template.id}`} className="form-label">
                          Nominal default (Rp, opsional)
                        </label>
                        <input
                          id={`edit-amount-${template.id}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={editing.defaultAmount}
                          onChange={(event) =>
                            setEditing({ ...editing, defaultAmount: event.target.value })
                          }
                          className="form-input px-3 py-2"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(null)}
                          className="btn btn-secondary btn-sm"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSaveEdit()}
                          disabled={isUpdatingTemplate}
                          className="btn btn-primary btn-sm"
                        >
                          {isUpdatingTemplate ? 'Menyimpan…' : 'Simpan'}
                        </button>
                      </div>
                    </li>
                  ) : (
                    <li
                      key={template.id}
                      className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                    >
                      <span className="block min-w-0">
                        <span className="block truncate font-medium text-slate-900 dark:text-white">
                          {template.name}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {template.category} · {template.isActive ? 'Aktif' : 'Nonaktif'}
                          {template.defaultAmount !== null &&
                            ` · Default Rp ${formatRupiah(template.defaultAmount)}`}
                        </span>
                      </span>
                      {confirmDeleteId === template.id ? (
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className="text-sm text-slate-700 dark:text-slate-200">
                            Hapus {template.name}?
                          </span>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="btn btn-secondary btn-sm"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(template)}
                            disabled={isUpdatingTemplate}
                            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(template)}
                            disabled={isUpdatingTemplate}
                            className="rounded-md px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-300 dark:hover:bg-slate-700"
                            aria-label={`Ubah ${template.name}`}
                          >
                            Ubah
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggle(template.id, template.isActive)}
                            disabled={isUpdatingTemplate}
                            className="rounded-md px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-300 dark:hover:bg-slate-700"
                            aria-label={`${template.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${template.name}`}
                          >
                            {template.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(null);
                              setConfirmDeleteId(template.id);
                            }}
                            disabled={isUpdatingTemplate}
                            className="rounded-md px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-slate-700"
                            aria-label={`Hapus ${template.name}`}
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </li>
                  ),
                )}
              </ul>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menonaktifkan tagihan menghentikan pengingat tanpa menghapus riwayat. Tagihan yang
              sudah punya riwayat pengeluaran tidak bisa dihapus.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MonthlyExpensesManager;

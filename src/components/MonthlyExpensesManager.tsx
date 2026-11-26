import React, { useState } from 'react';
import Modal from './Modal';
import { useMonthlyExpenseTemplates } from '../hooks/useMonthlyExpenses';

const categories = ['Operasional', 'Listrik', 'Air', 'Gaji', 'Perlengkapan', 'Lainnya'];

const MonthlyExpensesManager: React.FC<{ storeId: string }> = ({ storeId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Operasional');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    templates,
    isLoading,
    error,
    refetch,
    addTemplate,
    isAddingTemplate,
    setTemplateActive,
    isUpdatingTemplate,
  } = useMonthlyExpenseTemplates(storeId ? [storeId] : []);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama tagihan wajib diisi.');
      return;
    }

    setErrorMessage(null);
    try {
      await addTemplate({
        storeId,
        name: trimmedName,
        category,
        sortOrder: templates.length + 1,
      });
      setName('');
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
        onClose={() => setIsOpen(false)}
        title="Kelola tagihan bulanan"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-secondary btn-sm"
            >
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
                {templates.map((template) => (
                  <li
                    key={template.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900 dark:text-white">
                        {template.name}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {template.category} · {template.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => void handleToggle(template.id, template.isActive)}
                      disabled={isUpdatingTemplate}
                      className="shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50 dark:text-primary-300 dark:hover:bg-slate-700"
                      aria-label={`${template.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${template.name}`}
                    >
                      {template.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Menonaktifkan tagihan akan menghentikan pengingat baru tanpa menghapus riwayat.
            </p>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default MonthlyExpensesManager;

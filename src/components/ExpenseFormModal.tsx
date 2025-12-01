import React, { useState, useMemo } from 'react';
import { Expense } from '../../types';
import { formatRupiah, parseRupiah, convertLocalDateToISOString } from '../utils/formatting';
import Modal from './Modal';

interface ExpenseFormModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id' | 'storeId'>) => void;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  expense,
  isOpen,
  onClose,
  onSave,
}) => {
  const initialFormData = useMemo(() => {
    if (expense) {
      return {
        date: expense.date
          ? String(expense.date).split('T')[0]
          : new Date().toISOString().split('T')[0],
        description: expense.description || '',
        category: expense.category || 'Operasional',
        amount: expense.amount || 0,
      };
    } else {
      return {
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Operasional',
        amount: 0,
      };
    }
  }, [expense]);

  const [formData, setFormData] = useState(initialFormData);

  // Reset formData when modal is opened or expense changes
  React.useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData((prev) => ({ ...prev, amount: parseRupiah(value) }));
    } else if (name === 'date') {
      setFormData((prev) => ({ ...prev, date: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gunakan helper agar DRY
    const iso = convertLocalDateToISOString(formData.date);
    onSave({ ...formData, date: iso });
  };

  return (
    <Modal
      key={isOpen ? (expense ? `edit-${expense.id}` : 'new') : 'closed'}
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
      footer={
        <>
          <button
            onClick={onClose}
            className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
          >
            Batal
          </button>
          <button
            type="submit"
            form="expense-form"
            className="ml-2 text-white bg-primary-600 hover:bg-primary-700 font-medium rounded-lg text-lg px-6 py-3"
          >
            Simpan
          </button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block mb-1 font-medium">
            Tanggal
          </label>
          <input
            id="date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="block mb-1 font-medium">
            Deskripsi
          </label>
          <input
            id="description"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="category" className="block mb-1 font-medium">
            Kategori
          </label>
          <input
            id="category"
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="amount" className="block mb-1 font-medium">
            Jumlah
          </label>
          <input
            id="amount"
            type="text"
            name="amount"
            value={formatRupiah(formData.amount)}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseFormModal;

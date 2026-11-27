import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { formatRupiah, parseRupiah, convertLocalDateToISOString } from '../utils/formatting';
import Modal from './Modal';
import { EXPENSE_CATEGORIES } from '../config/expenseCategories';

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
      let dateValue = new Date().toISOString().split('T')[0];
      if (expense.date) {
        const expDate = new Date(expense.date);
        if (!isNaN(expDate.getTime())) {
          dateValue = expDate.toISOString().split('T')[0];
        }
      }
      return {
        date: dateValue,
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
  const categoryOptions = useMemo(
    () =>
      formData.category && !EXPENSE_CATEGORIES.includes(formData.category)
        ? [...EXPENSE_CATEGORIES, formData.category]
        : EXPENSE_CATEGORIES,
    [formData.category],
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset formData when modal is opened or expense changes
  React.useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'amount') {
      setFormData((prev) => ({ ...prev, amount: parseRupiah(value) }));
    } else if (name === 'date') {
      setFormData((prev) => ({ ...prev, date: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const iso = convertLocalDateToISOString(formData.date);
      await onSave({ ...formData, date: new Date(iso) });
      setFormData(initialFormData); // Reset form setelah sukses
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      key={isOpen ? (expense ? `edit-${expense.id}` : 'new') : 'closed'}
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
            Batal
          </button>
          <button
            type="submit"
            form="expense-form"
            className="btn btn-primary ml-2"
            disabled={isSaving}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </>
      }
    >
      <form id="expense-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="date" className="form-label">
            Tanggal
          </label>
          <input
            id="date"
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="description" className="form-label">
            Deskripsi Pengeluaran
          </label>
          <input
            id="description"
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Contoh: Beli deterjen, bayar listrik, dll."
            className="form-input"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="form-label">
            Kategori
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-input"
            required
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="amount" className="form-label">
            Jumlah (Rp)
          </label>
          <input
            id="amount"
            type="text"
            name="amount"
            value={formatRupiah(formData.amount)}
            onChange={handleChange}
            placeholder="Contoh: 10000"
            className="form-input"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default ExpenseFormModal;

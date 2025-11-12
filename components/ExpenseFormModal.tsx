
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Expense } from '../types';
import { formatRupiah, parseRupiah } from '../utils/formatting';

interface ExpenseFormModalProps {
    expense: Expense | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (expense: Omit<Expense, 'id' | 'storeId'>) => void;
}

const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({ expense, isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        // store date as YYYY-MM-DD string to avoid timezone issues
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Operasional',
        amount: 0,
    });

    useEffect(() => {
        setFormData({
            date: expense?.date ? String(expense.date).split('T')[0] : new Date().toISOString().split('T')[0],
            description: expense?.description || '',
            category: expense?.category || 'Operasional',
            amount: expense?.amount || 0,
        });
    }, [expense, isOpen]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        if (name === 'amount') {
            setFormData(prev => ({ ...prev, amount: parseRupiah(value) }));
        } else if (name === 'date') {
            setFormData(prev => ({ ...prev, date: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // convert YYYY-MM-DD to ISO at local midnight to avoid timezone shift
        const [y, m, d] = (formData.date || '').split('-').map(Number);
        const iso = isNaN(y) ? new Date().toISOString() : new Date(y, (m || 1) - 1, d || 1).toISOString();
        onSave({ ...formData, date: iso } as any);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={expense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
            footer={
                <>
                    <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
                    <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
                </>
            }
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="description" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Deskripsi</label>
                    <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="category" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Kategori</label>
                        <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                    <div>
                        <label htmlFor="amount" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Jumlah (Rp)</label>
                        <input type="text" name="amount" id="amount" value={formatRupiah(formData.amount)} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                </div>
                <div>
                    <label htmlFor="date" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Tanggal</label>
                        <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
            </form>
        </Modal>
    );
};

export default ExpenseFormModal;

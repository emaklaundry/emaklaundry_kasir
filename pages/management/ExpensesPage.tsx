

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mockExpenses } from '../../data/mockData';
import { Expense } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon } from '../../components/icons';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';

const ExpensesPage: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.openModal) {
            handleOpenFormModal();
            // Clear the state to prevent modal from re-opening on refresh
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, navigate]);

    const handleOpenFormModal = (expense: Expense | null = null) => {
        setCurrentExpense(expense);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentExpense(null);
    };

    const handleSaveExpense = (expense: Expense) => {
        if (currentExpense && currentExpense.id) {
            setExpenses(expenses.map(e => e.id === expense.id ? expense : e));
        } else {
            setExpenses([...expenses, { ...expense, id: Date.now() }]);
        }
        handleCloseFormModal();
    };

    const handleDelete = (expense: Expense) => {
        setExpenseToDelete(expense);
    };

    const confirmDelete = () => {
        if (expenseToDelete) {
            setExpenses(expenses.filter(e => e.id !== expenseToDelete.id));
            setExpenseToDelete(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Pengeluaran</h1>
                <button onClick={() => handleOpenFormModal()} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Tambah Pengeluaran
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Deskripsi</th>
                            <th className="px-4 py-3">Kategori</th>
                            <th className="px-4 py-3 text-right">Jumlah</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.map(expense => (
                            <tr key={expense.id} className="border-b dark:border-slate-700">
                                <td className="px-4 py-3">{new Date(expense.date).toLocaleDateString('id-ID')}</td>
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{expense.description}</td>
                                <td className="px-4 py-3">{expense.category}</td>
                                <td className="px-4 py-3 text-right">Rp {expense.amount.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 flex items-center space-x-2">
                                    <button onClick={() => handleOpenFormModal(expense)} className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(expense)} className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <ExpenseFormModal 
                    expense={currentExpense} 
                    onClose={handleCloseFormModal}
                    onSave={handleSaveExpense}
                />
            )}

            {expenseToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setExpenseToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Pengeluaran"
                    message={`Apakah Anda yakin ingin menghapus pengeluaran "${expenseToDelete.description}"?`}
                />
            )}
        </div>
    );
};

const ExpenseFormModal: React.FC<{ expense: Expense | null, onClose: () => void, onSave: (expense: Expense) => void }> = ({ expense, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
        date: expense?.date || new Date(),
        description: expense?.description || '',
        category: expense?.category || 'Operasional',
        amount: expense?.amount || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'date' ? new Date(value) : type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: expense?.id || 0 });
    };

    return (
        <Modal
            isOpen={true}
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
                        <input type="number" name="amount" id="amount" value={formData.amount} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                </div>
                <div>
                    <label htmlFor="date" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Tanggal</label>
                    <input type="date" name="date" id="date" value={formData.date.toISOString().split('T')[0]} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
            </form>
        </Modal>
    );
};

export default ExpensesPage;
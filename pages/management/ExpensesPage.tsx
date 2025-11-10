import React, { useState, useMemo } from 'react';
import { Expense, UserRole } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, DollarSignIcon, SearchIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useExpenses } from '../../contexts/ExpenseContext';
import ExpenseFormModal from '../../components/ExpenseFormModal';
import { useAppContext } from '../../contexts/AppContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';

const ExpensesPage: React.FC = () => {
    const { expenses, setExpenses } = useExpenses();
    const { currentUser, selectedStoreId, stores } = useAppContext();
    const { addAuditLog } = useAuditLogs();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
   
    const handleOpenFormModal = (expense: Expense | null = null) => {
        setCurrentExpense(expense);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentExpense(null);
    };

    const handleSaveExpense = (expense: Omit<Expense, 'id' | 'storeId'>) => {
        const storeId = currentExpense?.storeId || (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
        if (!storeId || storeId === 'all') {
            alert('Silakan pilih cabang spesifik untuk menambah atau mengedit pengeluaran.');
            return;
        }

        if (currentExpense && currentExpense.id) {
            setExpenses(prev => prev.map(e => e.id === currentExpense.id ? { ...currentExpense, ...expense } : e));
            addAuditLog(`Memperbarui pengeluaran: "${expense.description}".`, storeId);
        } else {
            setExpenses(prev => [...prev, { ...expense, id: Date.now(), storeId }]);
            addAuditLog(`Mencatat pengeluaran baru: "${expense.description}".`, storeId);
        }
        handleCloseFormModal();
    };

    const handleDelete = (expense: Expense) => {
        setExpenseToDelete(expense);
    };

    const confirmDelete = () => {
        if (expenseToDelete) {
            setExpenses(prev => prev.filter(e => e.id !== expenseToDelete.id));
            addAuditLog(`Menghapus pengeluaran: "${expenseToDelete.description}".`, expenseToDelete.storeId);
            setExpenseToDelete(null);
        }
    };
    
    const expensesWithStore = useMemo(() => expenses.map(expense => ({
        ...expense,
        storeName: stores.find(s => s.id === expense.storeId)?.name || 'N/A'
    })), [expenses, stores]);

    const filteredExpenses = useMemo(() => expensesWithStore.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [expensesWithStore, searchTerm]);

    const canAddNewExpense = !(currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Pengeluaran</h1>
                <div className="w-full md:w-auto flex items-center gap-4">
                     <div className="relative w-full md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari pengeluaran..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenFormModal()} 
                        className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        disabled={!canAddNewExpense}
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Tambah Pengeluaran
                    </button>
                </div>
            </div>
             {!canAddNewExpense && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">Pilih cabang spesifik di header untuk menambah pengeluaran baru.</p>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Tanggal</th>
                            <th className="px-4 py-3">Deskripsi</th>
                            {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && <th className="px-4 py-3">Toko</th>}
                            <th className="px-4 py-3">Kategori</th>
                            <th className="px-4 py-3 text-right">Jumlah</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.length > 0 ? (
                            filteredExpenses.map(expense => (
                                <tr key={expense.id} className="border-b dark:border-slate-700">
                                    <td className="px-4 py-3">{new Date(expense.date).toLocaleDateString('id-ID')}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{expense.description}</td>
                                    {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && <td className="px-4 py-3">{expense.storeName}</td>}
                                    <td className="px-4 py-3">{expense.category}</td>
                                    <td className="px-4 py-3 text-right">Rp {expense.amount.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 flex items-center space-x-2">
                                        <button onClick={() => handleOpenFormModal(expense)} className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(expense)} className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr>
                                <td colSpan={currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 6 : 5} className="text-center py-12">
                                    <DollarSignIcon className="mx-auto w-12 h-12 text-slate-400" />
                                    <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">{searchTerm ? 'Pengeluaran Tidak Ditemukan' : 'Belum Ada Pengeluaran'}</h3>
                                    <p className="mt-1 text-base text-slate-500">{searchTerm ? 'Coba kata kunci lain atau tambahkan pengeluaran baru.' : 'Mulai dengan menambahkan data pengeluaran pertama Anda.'}</p>
                                    <div className="mt-6">
                                        <button 
                                            onClick={() => handleOpenFormModal()} 
                                            disabled={!canAddNewExpense}
                                            className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto disabled:bg-blue-400 disabled:cursor-not-allowed"
                                        >
                                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                                            Tambah Pengeluaran
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ExpenseFormModal 
                isOpen={isFormModalOpen}
                expense={currentExpense} 
                onClose={handleCloseFormModal}
                onSave={handleSaveExpense}
            />

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

export default ExpensesPage;
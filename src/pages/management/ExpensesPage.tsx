import { useState, useMemo } from 'react';
import { Expense, UserRole } from '@/types';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  DollarSignIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useExpenses } from '../../contexts/ExpenseContext';
import ExpenseFormModal from '../../components/ExpenseFormModal';
import { useAppContext } from '../../contexts/AppContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';
import { useSortableData } from '../../hooks/useSortableData';

function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSavingExpense, setIsSavingExpense] = useState(false);

  const handleOpenFormModal = (expense: Expense | null = null) => {
    setCurrentExpense(expense);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentExpense(null);
  };

  const handleSaveExpense = async (expense: Omit<Expense, 'id' | 'storeId'>) => {
    const storeId =
      currentExpense?.storeId ||
      (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
    if (!storeId || storeId === 'all') {
      addToast(
        'Silakan pilih cabang spesifik untuk menambah atau mengedit pengeluaran.',
        'warning',
      );
      return;
    }
    const toastId = addToast('Menyimpan pengeluaran...', 'info');
    setIsSavingExpense(true);
    try {
      if (currentExpense && typeof currentExpense.id === 'string') {
        await updateExpense(currentExpense.id, { ...expense, storeId });
        addAuditLog(`Memperbarui pengeluaran: "${expense.description}".`, storeId);
        updateToast(toastId, 'Data pengeluaran berhasil diperbarui!', 'success');
      } else {
        await addExpense({ ...expense, storeId });
        addAuditLog(`Mencatat pengeluaran baru: "${expense.description}".`, storeId);
        updateToast(toastId, 'Pengeluaran berhasil dicatat!', 'success');
      }
      handleCloseFormModal();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal menyimpan: ${errMsg}`, 'error');
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      const toastId = addToast('Menghapus pengeluaran...', 'info');
      setIsSavingExpense(true);
      try {
        await deleteExpense(expenseToDelete.id);
        addAuditLog(
          `Menghapus pengeluaran: "${expenseToDelete.description}".`,
          expenseToDelete.storeId,
        );
        setExpenseToDelete(null);
        updateToast(toastId, 'Pengeluaran berhasil dihapus!', 'success');
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        updateToast(toastId, `Gagal menghapus: ${errMsg}`, 'error');
      } finally {
        setIsSavingExpense(false);
      }
    }
  };

  const expensesWithStore = useMemo(
    () =>
      expenses.map((expense) => ({
        ...expense,
        storeName: stores.find((s) => s.id === expense.storeId)?.name || 'N/A',
      })),
    [expenses, stores],
  );

  type ExpenseWithStore = (typeof expensesWithStore)[0];

  const filteredExpenses = useMemo(
    () =>
      expensesWithStore.filter(
        (expense) =>
          expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.category.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [expensesWithStore, searchTerm],
  );

  const {
    items: sortedExpenses,
    requestSort,
    sortConfig,
  } = useSortableData<ExpenseWithStore>(filteredExpenses, { key: 'date', direction: 'descending' });

  const getSortIcon = (key: keyof ExpenseWithStore) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const canAddNewExpense = !(currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

  return (
    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      {isSavingExpense && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/60 flex items-center justify-center rounded-lg z-20">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span className="text-slate-700 dark:text-slate-200 font-medium">Memproses...</span>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Manajemen Pengeluaran
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pengeluaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">
          Pilih cabang spesifik di header untuk menambah pengeluaran baru.
        </p>
      )}

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('date')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Tanggal {getSortIcon('date')}
                </button>
              </th>
              <th className="px-4 py-3">Deskripsi</th>
              {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                <th className="px-4 py-3">
                  <button
                    onClick={() => requestSort('storeName')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Toko {getSortIcon('storeName')}
                  </button>
                </th>
              )}
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('category')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Kategori {getSortIcon('category')}
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => requestSort('amount')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 ml-auto"
                >
                  Jumlah {getSortIcon('amount')}
                </button>
              </th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.length > 0 ? (
              sortedExpenses.map((expense) => (
                <tr key={expense.id} className="border-b dark:border-slate-700">
                  <td className="px-4 py-3">
                    {new Date(expense.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {expense.description}
                  </td>
                  {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                    <td className="px-4 py-3">{expense.storeName}</td>
                  )}
                  <td className="px-4 py-3">{expense.category}</td>
                  <td className="px-4 py-3 text-right">
                    Rp {expense.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenFormModal(expense)}
                      className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense)}
                      className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={
                    currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 6 : 5
                  }
                >
                  <EmptyState
                    icon={<DollarSignIcon className="mx-auto w-12 h-12 text-slate-400" />}
                    title={searchTerm ? 'Pengeluaran Tidak Ditemukan' : 'Belum Ada Pengeluaran'}
                    description={
                      searchTerm
                        ? 'Coba kata kunci lain atau tambahkan pengeluaran baru.'
                        : 'Mulai dengan menambahkan data pengeluaran pertama Anda.'
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedExpenses.length > 0 ? (
          sortedExpenses.map((expense) => (
            <div
              key={expense.id}
              className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                    {expense.description}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{expense.category}</p>
                  {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {expense.storeName}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenFormModal(expense)}
                    className="p-2 rounded-md text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense)}
                    className="p-2 rounded-md text-red-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    <Trash2Icon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center text-sm border-t dark:border-slate-600 pt-2">
                <span className="text-slate-500 dark:text-slate-400">
                  {new Date(expense.date).toLocaleDateString('id-ID')}
                </span>
                <span className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                  Rp {expense.amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<DollarSignIcon className="mx-auto w-12 h-12 text-slate-400" />}
            title={searchTerm ? 'Pengeluaran Tidak Ditemukan' : 'Belum Ada Pengeluaran'}
            description={
              searchTerm
                ? 'Coba kata kunci lain.'
                : 'Mulai dengan menambahkan data pengeluaran pertama Anda.'
            }
          />
        )}
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
}

export default ExpensesPage;

import React, { useState, useMemo } from 'react';
import { SearchIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useExpenses } from '../../contexts/ExpenseContext';
import { useAssets } from '../../contexts/AssetContext';
import ExpenseFormModal from '../../components/ExpenseFormModal';
import useAppContext from '../../contexts/useAppContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import { Expense, UserRole } from '@/types';

// Definisikan tipe gabungan untuk tampilan
type CombinedExpenseItem = {
  id: string;
  date: string; // ISO string
  description: string;
  category: string;
  amount: number;
  source: 'expense' | 'asset'; // Penanda sumber data
};

const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses();
  const { assets } = useAssets();
  const { currentUser, selectedStoreId } = useAppContext();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
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
    if (!currentUser) {
      addToast('User context tidak tersedia.', 'error');
      return;
    }
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

  // Gabungkan data expenses dan assets dengan Deduplikasi Cerdas
  const allFinancialItems: CombinedExpenseItem[] = useMemo(() => {
    // 1. Mapping data operasional (dari tabel expenses)
    const operationalExpenses: CombinedExpenseItem[] = expenses.map((item) => ({
      id: item.id,
      date: item.date instanceof Date ? item.date.toISOString() : String(item.date),
      description: item.description,
      category: item.category,
      amount: Number(item.amount),
      source: 'expense',
    }));

    // 2. Mapping data pembelian aset (dari tabel assets)
    // HANYA jika belum ada di tabel expenses (Mencegah Duplikat Tampilan)
    const assetExpenses: CombinedExpenseItem[] = assets
      .filter((asset) => asset.purchaseCost && asset.purchaseCost > 0)
      .filter((asset) => {
        // Cek apakah aset ini sudah tercatat di expenses (berdasarkan nama & tanggal)
        const assetDateStr = asset.purchaseDate ? String(asset.purchaseDate).split('T')[0] : '';
        // Cari duplikat
        const existsInExpenses = operationalExpenses.some(exp => {
           const expDateStr = exp.date.split('T')[0];
           // Cek kecocokan Tanggal DAN Deskripsi yang mengandung nama aset
           return (
             expDateStr === assetDateStr && 
             exp.description.includes(asset.name)
           );
        });
        return !existsInExpenses; // Jika sudah ada, jangan masukkan lagi
      })
      .map((asset) => ({
        id: asset.id,
        date: asset.purchaseDate ? String(asset.purchaseDate) : new Date().toISOString(),
        description: `Pembelian Aset: ${asset.name}`,
        category: 'Aset / Inventaris',
        amount: Number(asset.purchaseCost),
        source: 'asset',
      }));

    // Gabung dan urutkan
    return [...operationalExpenses, ...assetExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [expenses, assets]);

  // Filter pencarian dan kategori
  const filteredItems = useMemo(() => {
    return allFinancialItems.filter((item) => {
      const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allFinancialItems, searchTerm, categoryFilter]);

  // Pagination dan summary
  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalExpense = filteredItems.reduce((sum, item) => sum + item.amount, 0);

  // Export ke Excel
  const handleExport = () => {
    const dataToExport = filteredItems.map((item) => ({
      Tanggal: new Date(item.date).toLocaleDateString('id-ID'),
      Keterangan: item.description,
      Kategori: item.category,
      Jumlah: item.amount,
      Sumber: item.source === 'asset' ? 'Tabel Aset' : 'Tabel Pengeluaran',
    }));
    // @ts-expect-error: dynamic import xlsx for export only, type not needed
    import('xlsx').then((XLSX) => {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Rincian Pengeluaran');
      XLSX.writeFile(wb, 'Laporan_Pengeluaran_Lengkap.xlsx');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Rincian Pengeluaran
          <span className="block text-sm font-normal text-slate-500 mt-1">
            Mencakup Operasional & Pembelian Aset
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
            disabled={isSavingExpense}
          >
            {isSavingExpense ? 'Menyimpan...' : 'Download'}
          </button>
          <button
            onClick={() => handleOpenFormModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isSavingExpense}
          >
            {isSavingExpense ? 'Menyimpan...' : 'Tambah Pengeluaran'}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-2">
          Total Pengeluaran (Filtered)
        </h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          Rp {totalExpense.toLocaleString('id-ID')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pengeluaran..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full pl-3 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="Aset / Inventaris">Aset / Inventaris</option>
            <option value="Operasional">Operasional</option>
            <option value="Pemeliharaan">Pemeliharaan</option>
            <option value="Gaji">Gaji</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Keterangan</th>
                <th className="px-6 py-3">Kategori</th>
                <th className="px-6 py-3 text-right">Jumlah</th>
                <th className="px-6 py-3 text-center">Sumber</th>
                <th className="px-6 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedItems.length > 0 ? (
                paginatedItems.map((item) => (
                  <tr
                    key={`${item.source}-${item.id}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-slate-900 dark:text-white whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">{item.description}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          item.category === 'Aset / Inventaris' || item.category === 'Pembelian Aset'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      Rp {item.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-slate-500">
                      {item.source === 'asset' ? 'Aset' : 'Pengeluaran'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.source === 'expense' && (
                        <button
                          onClick={() => setExpenseToDelete(expenses.find(e => e.id === item.id) || null)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-xs font-medium"
                        >
                          Hapus
                        </button>
                      )}
                      {item.source === 'asset' && (
                        <span className="text-slate-400 italic text-xs">Kelola di Aset</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    Tidak ada data pengeluaran ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <nav className="inline-flex -space-x-px">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border border-slate-300 dark:border-slate-600 ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              } rounded-lg mx-1`}
            >
              {page}
            </button>
          ))}
        </nav>
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
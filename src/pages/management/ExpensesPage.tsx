
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

type CombinedExpenseItem = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  source: 'expense' | 'asset';
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
    const storeId = currentExpense?.storeId || (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
    
    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik.', 'warning');
      return;
    }

    const toastId = addToast('Menyimpan pengeluaran...', 'info');
    setIsSavingExpense(true);
    try {
      if (currentExpense && typeof currentExpense.id === 'string') {
        await updateExpense(currentExpense.id, { ...expense, storeId });
        addAuditLog(`Update pengeluaran: "${expense.description}"`, storeId);
        updateToast(toastId, 'Berhasil diperbarui!', 'success');
      } else {
        await addExpense({ ...expense, storeId });
        addAuditLog(`Tambah pengeluaran: "${expense.description}"`, storeId);
        updateToast(toastId, 'Berhasil disimpan!', 'success');
      }
      handleCloseFormModal();
    } catch (error: any) {
      updateToast(toastId, `Gagal: ${error.message || 'Error'}`, 'error');
    } finally {
      setIsSavingExpense(false);
    }
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    const toastId = addToast('Menghapus...', 'info');
    setIsSavingExpense(true);
    try {
      await deleteExpense(expenseToDelete.id);
      addAuditLog(`Hapus pengeluaran: "${expenseToDelete.description}"`, expenseToDelete.storeId);
      setExpenseToDelete(null);
      updateToast(toastId, 'Berhasil dihapus!', 'success');
    } catch (error: any) {
      updateToast(toastId, `Gagal: ${error.message}`, 'error');
    } finally {
      setIsSavingExpense(false);
    }
  };

  // PERBAIKAN 2: Logika "Smart Merge" untuk mencegah duplikasi tampilan
  const allFinancialItems: CombinedExpenseItem[] = useMemo(() => {
    // 1. Data dari tabel expenses
    const operationalExpenses: CombinedExpenseItem[] = expenses.map((item) => ({
      id: item.id,
      date: item.date instanceof Date ? item.date.toISOString() : String(item.date),
      description: item.description,
      category: item.category,
      amount: Number(item.amount),
      source: 'expense',
    }));

    // 2. Data dari tabel assets (hanya jika belum ada di expenses)
    const assetExpenses: CombinedExpenseItem[] = assets
      .filter((asset) => asset.purchaseCost && asset.purchaseCost > 0)
      .filter((asset) => {
        // Cek Duplikasi: Apakah aset ini sudah tercatat di expenses?
        const assetDateStr = asset.purchaseDate ? String(asset.purchaseDate).split('T')[0] : '';
        
        const isDuplicate = operationalExpenses.some(exp => {
           const expDateStr = exp.date.split('T')[0];
           // Jika tanggal sama DAN deskripsi mengandung nama aset, anggap duplikat
           return (
             expDateStr === assetDateStr && 
             exp.description.toLowerCase().includes(asset.name.toLowerCase())
           );
        });
        return !isDuplicate; // Tampilkan hanya jika BUKAN duplikat
      })
      .map((asset) => ({
        id: asset.id,
        date: asset.purchaseDate ? String(asset.purchaseDate) : new Date().toISOString(),
        description: `Pembelian Aset: ${asset.name}`,
        category: 'Aset / Inventaris',
        amount: Number(asset.purchaseCost),
        source: 'asset',
      }));

    return [...operationalExpenses, ...assetExpenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [expenses, assets]);

  const filteredItems = useMemo(() => {
    return allFinancialItems.filter((item) => {
      const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allFinancialItems, searchTerm, categoryFilter]);

  const itemsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalExpense = filteredItems.reduce((sum, item) => sum + item.amount, 0);

  const handleExport = () => {
    const dataToExport = filteredItems.map((item) => ({
      Tanggal: new Date(item.date).toLocaleDateString('id-ID'),
      Keterangan: item.description,
      Kategori: item.category,
      Jumlah: item.amount,
      Sumber: item.source === 'asset' ? 'Tabel Aset' : 'Tabel Pengeluaran',
    }));    addAuditLog(
      `Export data pengeluaran (${dataToExport.length} item) ke Excel.`,
      storeId !== 'all' ? storeId : undefined,
    );    import('exceljs').then(({ Workbook }) => {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Rincian Pengeluaran');
      
      // Set columns
      worksheet.columns = [
        { header: 'Tanggal', key: 'Tanggal', width: 15 },
        { header: 'Deskripsi', key: 'Deskripsi', width: 30 },
        { header: 'Kategori', key: 'Kategori', width: 20 },
        { header: 'Jumlah', key: 'Jumlah', width: 15 },
        { header: 'Sumber', key: 'Sumber', width: 20 }
      ];
      
      // Add rows
      worksheet.addRows(dataToExport);
      
      // Generate and download
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Laporan_Pengeluaran.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Rincian Pengeluaran <span className="block text-sm font-normal text-slate-500 mt-1">Mencakup Operasional & Aset</span>
        </h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white">Download</button>
          <button onClick={() => handleOpenFormModal()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tambah Pengeluaran</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700">
        <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-2">Total Pengeluaran</h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">Rp {totalExpense.toLocaleString('id-ID')}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="all">Semua Kategori</option>
          <option value="Aset / Inventaris">Aset / Inventaris</option>
          <option value="Operasional">Operasional</option>
          <option value="Pemeliharaan">Pemeliharaan</option>
          <option value="Gaji">Gaji</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 uppercase">
            <tr>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Keterangan</th>
              <th className="px-6 py-3">Kategori</th>
              <th className="px-6 py-3 text-right">Jumlah</th>
              <th className="px-6 py-3 text-center">Sumber</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item) => (
                <tr key={`${item.source}-${item.id}`} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${item.category.includes('Aset') ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 dark:text-white">Rp {item.amount.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-center">{item.source === 'asset' ? 'Aset' : 'Pengeluaran'}</td>
                  <td className="px-6 py-4 text-center">
                    {item.source === 'expense' ? (
                      <button 
                        onClick={() => setExpenseToDelete(expenses.find(e => e.id === item.id) || null)}
                        className="text-red-600 hover:underline"
                      >
                        Hapus
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">Kelola di Aset</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="px-6 py-8 text-center">Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Simple Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-white border'}`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      <ExpenseFormModal
        isOpen={isFormModalOpen}
        expense={currentExpense}
        onClose={handleCloseFormModal}
        onSave={handleSaveExpense}
      />
      
      <ConfirmationModal
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={confirmDelete}
        title="Hapus Pengeluaran"
        message="Yakin ingin menghapus data ini?"
      />
    </div>
  );
};

export default ExpensesPage;
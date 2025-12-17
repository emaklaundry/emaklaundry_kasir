import React, { useState, useMemo, useRef } from 'react';
import { SearchIcon, DownloadIcon, UploadIcon } from '../../components/icons';
import {
  exportExpensesToExcel,
  importExpensesFromExcel,
  downloadExpenseTemplate,
} from '../../utils/excelUtils';
import { supabase } from '../../utils/supabaseClient';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

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
      addToast('Silakan pilih cabang spesifik.', 'warning');
      return;
    }

    const toastId = addToast('Menyimpan pengeluaran...', 'info');
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      updateToast(toastId, `Gagal: ${error.message || 'Error'}`, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    const toastId = addToast('Menghapus...', 'info');
    try {
      await deleteExpense(expenseToDelete.id);
      addAuditLog(`Hapus pengeluaran: "${expenseToDelete.description}"`, expenseToDelete.storeId);
      setExpenseToDelete(null);
      updateToast(toastId, 'Berhasil dihapus!', 'success');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      updateToast(toastId, `Gagal: ${error.message}`, 'error');
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
        // FIXED: More strict duplicate detection - require exact description match or ID
        const assetDateStr = asset.purchaseDate ? String(asset.purchaseDate).split('T')[0] : '';

        const isDuplicate = operationalExpenses.some((exp) => {
          const expDateStr = exp.date.split('T')[0];
          const assetDescription = `Pembelian Aset: ${asset.name}`;
          // Exact match on date AND (exact description OR contains asset ID)
          return (
            expDateStr === assetDateStr &&
            (exp.description === assetDescription || exp.description.includes(asset.id))
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
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const totalExpense = filteredItems.reduce((sum, item) => sum + item.amount, 0);

  // Excel Export
  const handleExportToExcel = async () => {
    const toastId = addToast('Mengekspor pengeluaran...', 'info');
    try {
      // Fetch SEMUA pengeluaran dari database
      updateToast(toastId, 'Mengambil semua data pengeluaran...', 'info');
      
      let query = supabase.from('expenses').select('*');
      
      // Filter by store if needed
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }
      
      const { data: allExpenses, error } = await query;
      
      if (error) throw error;
      if (!allExpenses || allExpenses.length === 0) {
        updateToast(toastId, 'Tidak ada pengeluaran untuk diekspor.', 'warning');
        return;
      }
      
      updateToast(toastId, `Mengekspor ${allExpenses.length} pengeluaran...`, 'info');
      
      const expensesToExport = allExpenses.map((e) => ({
        ...e,
        storeId: e.storeId ??undefined,
      })) as unknown as Expense[];
      
      await exportExpensesToExcel(expensesToExport);
      updateToast(toastId, `Berhasil mengekspor ${allExpenses.length} pengeluaran ke Excel.`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      addToast('Gagal export data ke Excel', 'error');
    }
  };

  // Excel Import
  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = addToast('Memproses import data...', 'info');

    try {
      const importedExpenses = await importExpensesFromExcel(file);

      let successCount = 0;
      let errorCount = 0;
      let skipCount = 0;

      for (const expense of importedExpenses) {
        try {
          if (expense.id) {
            // Validate UUID format before UPDATE
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(expense.id)) {
              console.warn('Invalid UUID skipped:', expense.id);
              skipCount++;
              continue;
            }

            // Update existing expense
            const updatePayload: Partial<Expense> = {
              date: expense.date!,
              description: expense.description!,
              category: expense.category!,
              amount: expense.amount!,
            };

            if (selectedStoreId !== 'all') {
              updatePayload.storeId = selectedStoreId;
            }

            await updateExpense(expense.id, updatePayload);
            successCount++;
          } else {
            // Check for duplicate before adding new expense
            const existingExpense = expenses.find(
              (e) =>
                e.date === expense.date! &&
                e.description.toLowerCase() === expense.description!.toLowerCase(),
            );
            if (existingExpense) {
              console.warn('Duplicate expense skipped:', expense.description);
              skipCount++;
              continue;
            }

            // Ensure storeId is set for INSERT (RLS policy requirement)
            const storeId = selectedStoreId === 'all' ? currentUser?.storeId : selectedStoreId;

            if (!storeId) {
              console.error('storeId is required for new expenses');
              errorCount++;
              continue;
            }

            // Add new expense
            await addExpense({
              date: expense.date!,
              description: expense.description!,
              category: expense.category!,
              amount: expense.amount!,
              storeId: storeId,
            });
            successCount++;
          }
        } catch (error) {
          console.error('Error importing expense:', expense, error);
          errorCount++;
        }
      }

      if (skipCount > 0) {
        updateToast(
          toastId,
          `Import selesai: ${successCount} berhasil, ${errorCount} gagal, ${skipCount} dilewati (duplikat/invalid)`,
          'warning',
        );
      } else if (errorCount > 0) {
        updateToast(
          toastId,
          `Import selesai: ${successCount} berhasil, ${errorCount} gagal`,
          'warning',
        );
      } else {
        updateToast(toastId, `Berhasil import ${successCount} pengeluaran`, 'success');
      }

      addAuditLog(
        `Import ${successCount} pengeluaran dari Excel`,
        selectedStoreId === 'all' ? undefined : selectedStoreId,
      );
    } catch (error) {
      console.error('Import error:', error);
      updateToast(toastId, 'Gagal import data dari Excel', 'error');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download Template
  const handleDownloadTemplate = async () => {
    try {
      await downloadExpenseTemplate();
      addToast('Template Excel berhasil didownload', 'success');
    } catch (error) {
      console.error('Download template error:', error);
      addToast('Gagal download template', 'error');
    }
  };

  /* Unused function - kept for future reference
  const handleExport = () => {
    const dataToExport = filteredItems.map((item) => ({
      Tanggal: new Date(item.date).toLocaleDateString('id-ID'),
      Keterangan: item.description,
      Kategori: item.category,
      Jumlah: item.amount,
      Sumber: item.source === 'asset' ? 'Tabel Aset' : 'Tabel Pengeluaran',
    }));
    addAuditLog(
      `Export data pengeluaran (${dataToExport.length} item) ke Excel.`,
      selectedStoreId !== 'all' ? selectedStoreId : undefined,
    );
    import('exceljs').then(({ Workbook }) => {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet('Rincian Pengeluaran');

      // Set columns
      worksheet.columns = [
        { header: 'Tanggal', key: 'Tanggal', width: 15 },
        { header: 'Deskripsi', key: 'Deskripsi', width: 30 },
        { header: 'Kategori', key: 'Kategori', width: 20 },
        { header: 'Jumlah', key: 'Jumlah', width: 15 },
        { header: 'Sumber', key: 'Sumber', width: 20 },
      ];

      // Add rows
      worksheet.addRows(dataToExport);

      // Generate and download
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Laporan_Pengeluaran.xlsx';
        a.click();
        URL.revokeObjectURL(url);
      });
    });
  };
  */

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Pengeluaran</h1>
        <div className="flex gap-2">
          {/* Excel Import/Export Buttons */}
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
            title="Download Template Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Template</span>
          </button>

          <input
            ref={fileInputRef}
            id="expense-import-file"
            name="expense-import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFromExcel}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
            title="Import dari Excel"
          >
            <UploadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Import</span>
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={expenses.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            title="Export ke Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Export</span>
          </button>

          <button
            onClick={() => handleOpenFormModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tambah Pengeluaran
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border dark:border-slate-700">
        <h3 className="text-slate-500 dark:text-slate-400 font-medium mb-2">Total Pengeluaran</h3>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">
          Rp {totalExpense.toLocaleString('id-ID')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            id="expense-search"
            name="expense-search"
            placeholder="Cari..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            autoComplete="off"
          />
        </div>
        <select
          id="expense-category-filter"
          name="expense-category-filter"
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
                <tr
                  key={`${item.source}-${item.id}`}
                  className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="px-6 py-4">{new Date(item.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {item.description}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${item.category.includes('Aset') ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                    Rp {item.amount.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.source === 'asset' ? 'Aset' : 'Pengeluaran'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.source === 'expense' ? (
                      <button
                        onClick={() =>
                          setExpenseToDelete(expenses.find((e) => e.id === item.id) || null)
                        }
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
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Simple Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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




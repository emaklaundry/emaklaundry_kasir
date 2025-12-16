import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DownloadIcon,
  UploadIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '../../components/icons';
import { fetchCustomers } from '../../contexts/CustomerContext';
import { useServices } from '../../contexts/ServiceContext';
import { fetchInventory } from '../../contexts/InventoryContext';
import { useAssets } from '../../contexts/AssetContext';
import { useExpenses } from '../../contexts/ExpenseContext';
import { useTransactions } from '../../contexts/TransactionContext';
import useToasts from '../../contexts/useToasts';
import useAppContext from '../../contexts/useAppContext';
import { exportAllData, importAllData } from '../../utils/excelUtils';
import { UserRole, Transaction, TransactionItem } from '@/types';
import type { Json } from '@/types/supabase';

const BackupRestorePage: React.FC = () => {
  const { currentUser } = useAppContext();
  const { addToast, updateToast } = useToasts();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Fetch all data
  const customersQuery = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 10000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 10000 }),
  });

  const customers = Array.isArray(customersQuery.data)
    ? customersQuery.data
    : (customersQuery.data?.data ?? []);

  const { services } = useServices();

  const inventoryQuery = useQuery({
    queryKey: ['inventory', { page: 1, pageSize: 10000 }],
    queryFn: () => fetchInventory({ page: 1, pageSize: 10000 }),
  });

  const inventory = useMemo(() => {
    return Array.isArray(inventoryQuery.data)
      ? inventoryQuery.data
      : (inventoryQuery.data?.data ?? []);
  }, [inventoryQuery.data]);

  const { assets } = useAssets();
  const { expenses } = useExpenses();
  
  // Fetch all transactions without filters
  const transactionsQuery = useQuery({
    queryKey: ['transactions', { page: 1, pageSize: 10000 }],
    queryFn: async () => {
      const { supabase } = await import('../../utils/supabaseClient');
      const { data, error } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('createdAt', { ascending: false })
        .range(0, 9999);
      
      if (error) throw error;
      
      // Convert database format to Transaction type
      return (data || []).map((t) => ({
        ...t,
        customerId: t.customerId || '',
        createdByUserId: t.createdByUserId || '',
        createdAt: new Date(t.createdAt || new Date()),
        estimatedCompletionDate: t.estimatedCompletionDate ?? undefined,
        paymentMethod: t.paymentMethod ?? undefined,
        items: (t.items as unknown) as TransactionItem[],
      })) as Transaction[];
    },
  });

  const transactions = transactionsQuery.data || [];

  // Calculate stats
  const totalRecords =
    customers.length +
    services.length +
    inventory.length +
    assets.length +
    expenses.length +
    transactions.length;

  const lastBackupDate = localStorage.getItem('lastBackupDate');

  // Handle Full Export
  const handleFullExport = async () => {
    if (currentUser?.role === UserRole.Cashier) {
      addToast('Anda tidak memiliki izin untuk melakukan backup.', 'error');
      return;
    }

    setIsExporting(true);
    const toastId = addToast('Mempersiapkan full backup...', 'info');

    try {
      await exportAllData(customers, services, inventory, assets, expenses, transactions);

      // Save last backup date
      const now = new Date().toISOString();
      localStorage.setItem('lastBackupDate', now);

      updateToast(toastId, `Berhasil backup ${totalRecords} data!`, 'success');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal backup: ${errMsg}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle Import (placeholder for now)
  const handleImport = async () => {
    if (currentUser?.role === UserRole.Cashier) {
      addToast('Anda tidak memiliki izin untuk melakukan restore.', 'error');
      return;
    }

    if (!fileInputRef.current?.files?.[0]) {
      fileInputRef.current?.click();
      return;
    }

    const file = fileInputRef.current.files[0];
    
    // Confirmation
    const confirmed = window.confirm(
      `⚠️ PERINGATAN PENTING ⚠️\n\n` +
      `Restore data akan MENIMPA semua data yang ada saat ini!\n\n` +
      `Data yang akan direstore dari file: ${file.name}\n\n` +
      `Apakah Anda yakin ingin melanjutkan?\n\n` +
      `Disarankan untuk melakukan backup terlebih dahulu sebelum restore.`
    );

    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    const toastId = addToast('Membaca file backup...', 'info');

    try {
      // Import data from Excel
      updateToast(toastId, 'Memproses data dari file...', 'info');
      const importedData = await importAllData(file);

      // Count total records
      const totalImported =
        importedData.customers.length +
        importedData.services.length +
        importedData.inventory.length +
        importedData.assets.length +
        importedData.expenses.length +
        importedData.transactions.length;

      updateToast(
        toastId,
        `Ditemukan ${totalImported} data. Mulai restore ke database...`,
        'info',
      );

      // Import to database using Supabase
      const { supabase } = await import('../../utils/supabaseClient');

      // Clear existing data (optional - bisa dikomentari jika ingin merge)
      updateToast(toastId, 'Menghapus data lama...', 'info');
      
      await supabase.from('transactions').delete().neq('id', '');
      await supabase.from('expenses').delete().neq('id', '');
      await supabase.from('assets').delete().neq('id', '');
      await supabase.from('inventory_items').delete().neq('id', '');
      await supabase.from('services').delete().neq('id', '');
      await supabase.from('customers').delete().neq('id', '');

      // Insert new data
      let insertedCount = 0;

      if (importedData.customers.length > 0) {
        updateToast(toastId, `Restore pelanggan (${importedData.customers.length})...`, 'info');
        // Convert Customer to database format
        const dbCustomers = importedData.customers.map(c => ({
          ...c,
          createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
          phone: c.phone ?? null,
          address: c.address ?? null,
          notes: c.notes ?? null,
        }));
        const { error } = await supabase.from('customers').insert(dbCustomers);
        if (error) throw new Error(`Gagal restore pelanggan: ${error.message}`);
        insertedCount += importedData.customers.length;
      }

      if (importedData.services.length > 0) {
        updateToast(toastId, `Restore layanan (${importedData.services.length})...`, 'info');
        const { error } = await supabase.from('services').insert(importedData.services);
        if (error) throw new Error(`Gagal restore layanan: ${error.message}`);
        insertedCount += importedData.services.length;
      }

      if (importedData.inventory.length > 0) {
        updateToast(toastId, `Restore inventaris (${importedData.inventory.length})...`, 'info');
        const { error } = await supabase.from('inventory_items').insert(importedData.inventory);
        if (error) throw new Error(`Gagal restore inventaris: ${error.message}`);
        insertedCount += importedData.inventory.length;
      }

      if (importedData.assets.length > 0) {
        updateToast(toastId, `Restore aset (${importedData.assets.length})...`, 'info');
        // Convert Asset to database format
        const dbAssets = importedData.assets.map(a => ({
          ...a,
          maintenanceHistory: a.maintenanceHistory as unknown as Json,
          serialNumber: a.serialNumber ?? null,
          purchaseDate: typeof a.purchaseDate === 'string' ? a.purchaseDate : a.purchaseDate?.toISOString?.() ?? null,
          purchaseCost: a.purchaseCost ?? null,
          storeId: a.storeId ?? null,
        }));
        const { error } = await supabase.from('assets').insert(dbAssets);
        if (error) throw new Error(`Gagal restore aset: ${error.message}`);
        insertedCount += importedData.assets.length;
      }

      if (importedData.expenses.length > 0) {
        updateToast(toastId, `Restore pengeluaran (${importedData.expenses.length})...`, 'info');
        // Convert Expense to database format
        const dbExpenses = importedData.expenses.map(e => ({
          ...e,
          date: e.date instanceof Date ? e.date.toISOString().split('T')[0] : e.date,
          storeId: e.storeId ?? null,
        }));
        const { error } = await supabase.from('expenses').insert(dbExpenses);
        if (error) throw new Error(`Gagal restore pengeluaran: ${error.message}`);
        insertedCount += importedData.expenses.length;
      }

      if (importedData.transactions.length > 0) {
        updateToast(toastId, `Restore transaksi (${importedData.transactions.length})...`, 'info');
        // Convert Transaction to database format
        const dbTransactions = importedData.transactions.map(t => ({
          ...t,
          items: t.items as unknown as Json,
          createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
          customerId: t.customerId ?? null,
          createdByUserId: t.createdByUserId ?? null,
          estimatedCompletionDate: t.estimatedCompletionDate ?? null,
          paymentMethod: t.paymentMethod ?? null,
          invoiceCode: t.invoiceCode ?? null,
          notes: t.notes ?? null,
          storeId: t.storeId ?? null,
        }));
        const { error } = await supabase.from('transactions').insert(dbTransactions);
        if (error) throw new Error(`Gagal restore transaksi: ${error.message}`);
        insertedCount += importedData.transactions.length;
      }

      updateToast(
        toastId,
        `✅ Berhasil restore ${insertedCount} data! Halaman akan di-refresh...`,
        'success',
      );

      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `❌ Gagal restore: ${errMsg}`, 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Check if user has permission
  const canBackup = currentUser?.role !== UserRole.Cashier;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Backup & Restore
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Backup semua data aplikasi atau restore dari backup sebelumnya
          </p>
        </div>
      </div>

      {!canBackup && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">
                Akses Terbatas
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Hanya Admin dan Super Admin yang dapat melakukan backup & restore data.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Overview */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 p-6 rounded-lg shadow-lg text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-100 mb-1">Total Data Aplikasi</p>
            <p className="text-4xl font-bold">{totalRecords.toLocaleString('id-ID')}</p>
            <p className="text-sm text-blue-100 mt-2">
              {lastBackupDate
                ? `Backup terakhir: ${new Date(lastBackupDate).toLocaleDateString('id-ID')} ${new Date(lastBackupDate).toLocaleTimeString('id-ID')}`
                : 'Belum pernah backup'}
            </p>
          </div>
          <div className="p-4 bg-white/20 rounded-lg">
            <DatabaseIcon className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      {/* Detailed Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pelanggan</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {customers.length}
          </p>
          <div className="mt-2 h-1 bg-green-200 dark:bg-green-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 dark:bg-green-400"
              style={{ width: `${(customers.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Layanan</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {services.length}
          </p>
          <div className="mt-2 h-1 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-400"
              style={{ width: `${(services.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Inventori</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {inventory.length}
          </p>
          <div className="mt-2 h-1 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 dark:bg-purple-400"
              style={{ width: `${(inventory.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Aset</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {assets.length}
          </p>
          <div className="mt-2 h-1 bg-orange-200 dark:bg-orange-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600 dark:bg-orange-400"
              style={{ width: `${(assets.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pengeluaran</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {expenses.length}
          </p>
          <div className="mt-2 h-1 bg-red-200 dark:bg-red-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 dark:bg-red-400"
              style={{ width: `${(expenses.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Transaksi</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {transactions.length}
          </p>
          <div className="mt-2 h-1 bg-cyan-200 dark:bg-cyan-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-600 dark:bg-cyan-400"
              style={{ width: `${(transactions.length / totalRecords) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Full Backup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <DownloadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Export Full Backup
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Download semua data aplikasi dalam satu file Excel. File akan berisi semua
                pelanggan, layanan, inventori, aset, pengeluaran, dan transaksi.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Semua data dalam 1 file</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Format Excel dengan multiple sheets</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Siap untuk disaster recovery</span>
                </div>
              </div>
              <button
                onClick={handleFullExport}
                disabled={!canBackup || isExporting}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isExporting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
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
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <DownloadIcon className="w-5 h-5" />
                    <span>Download Full Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Import Full Backup */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <UploadIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Import Full Backup
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Restore semua data dari file backup sebelumnya. Gunakan fitur ini untuk
                disaster recovery atau migrasi sistem.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Validasi format Excel</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Konfirmasi sebelum restore</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangleIcon className="w-4 h-4" />
                  <span>Data lama akan ditimpa!</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                id="backup-restore-file"
                name="backup-restore-file"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleImport}
              />
              <button
                onClick={handleImport}
                disabled={!canBackup || isImporting}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                {isImporting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="w-5 h-5" />
                    <span>Import Full Backup</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              📋 Tentang Backup & Restore
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Full Backup</strong> mencakup semua data: pelanggan, layanan,
                  inventori, aset, pengeluaran, dan transaksi dalam satu file Excel.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Backup Per Halaman</strong> tetap tersedia di masing-masing
                  halaman untuk backup selektif (misalnya hanya pelanggan atau transaksi).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  Simpan file backup di tempat yang aman seperti Google Drive, OneDrive,
                  atau hard drive eksternal.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  Disarankan untuk melakukan backup rutin (mingguan atau bulanan) untuk
                  mengantisipasi kehilangan data.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestorePage;

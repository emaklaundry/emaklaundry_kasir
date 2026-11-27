import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  DownloadIcon,
  UploadIcon,
  DatabaseIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SpinnerIcon,
} from '../../components/icons';
import useToasts from '../../contexts/useToasts';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import useAppContext from '../../contexts/useAppContext';
import { exportAllData, importAllData } from '../../utils/excelUtils';
import {
  BACKUP_TABLES,
  BackupData,
  BackupRow,
  dedupeById,
  downloadBackup,
  exportBackup,
  fetchAllRows,
  fetchExistingProfileIds,
  importBackup,
  readBackupFile,
  upsertInBatches,
  validateBackup,
} from '../../utils/backupUtils';
import {
  UserRole,
  Transaction,
  TransactionItem,
  Expense,
  Customer,
  Service,
  InventoryItem,
  Asset,
} from '@/types';

interface RestoreReport {
  title: string;
  tone: 'success' | 'warning' | 'error';
  lines: string[];
  errors: string[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const toDateOnly = (value: unknown): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return isValidDate(date) ? date.toISOString().split('T')[0] : null;
};

const toIsoOrNull = (value: unknown): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return isValidDate(date) ? date.toISOString() : null;
};

const BackupRestorePage: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addToast, updateToast } = useToasts();
  const [confirm, confirmDialog] = useConfirmDialog();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // JSON Backup states
  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isImportingJson, setIsImportingJson] = useState(false);
  const [importJsonProgress, setImportJsonProgress] = useState(0);
  const [pendingJsonBackup, setPendingJsonBackup] = useState<BackupData | null>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const [restoreReport, setRestoreReport] = useState<RestoreReport | null>(null);
  const [lastBackupDate, setLastBackupDate] = useState(() =>
    localStorage.getItem('lastBackupDate'),
  );

  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
  const canBackup = !!currentUser && currentUser.role !== UserRole.Cashier;

  // Cabang yang di-backup/restore. null = semua cabang (hanya Super Admin).
  const scopeStoreId: string | null = isSuperAdmin
    ? selectedStoreId && selectedStoreId !== 'all'
      ? selectedStoreId
      : null
    : selectedStoreId && selectedStoreId !== 'all'
      ? selectedStoreId
      : (currentUser?.storeId ?? null);

  const markBackupDone = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastBackupDate', now);
    setLastBackupDate(now);
  };

  // Ambil semua data (dengan paginasi, melewati batas 1.000 baris Supabase).
  const backupDataQuery = useQuery({
    queryKey: ['backup-data-all', scopeStoreId],
    enabled: canBackup,
    queryFn: async () => {
      const filter = scopeStoreId ? { column: 'storeId', value: scopeStoreId } : undefined;
      const [customerRows, serviceRows, inventoryRows, assetRows, expenseRows, transactionRows] =
        await Promise.all([
          fetchAllRows('customers', { filter }),
          fetchAllRows('services', { filter }),
          fetchAllRows('inventory_items', { filter }),
          fetchAllRows('assets', { filter }),
          fetchAllRows('expenses', { filter }),
          fetchAllRows('transactions', { filter }),
        ]);

      const customers = customerRows.map((c) => ({
        ...c,
        address: c.address ?? undefined,
        notes: c.notes ?? undefined,
        phone: c.phone ?? undefined,
        storeId: c.storeId ?? undefined,
      })) as unknown as Customer[];

      const services = serviceRows.map((s) => ({
        ...s,
        storeId: s.storeId ?? undefined,
        washType: s.wash_type,
      })) as unknown as Service[];

      const inventory = inventoryRows.map((i) => ({
        ...i,
        storeId: i.storeId ?? undefined,
      })) as unknown as InventoryItem[];

      const assets = assetRows.map((a) => ({
        ...a,
        purchaseDate: a.purchaseDate ?? undefined,
        serialNumber: a.serialNumber ?? undefined,
        purchaseCost: a.purchaseCost ?? undefined,
        storeId: a.storeId ?? undefined,
        maintenanceHistory: Array.isArray(a.maintenanceHistory) ? a.maintenanceHistory : [],
      })) as unknown as Asset[];

      const expenses = expenseRows.map((e) => ({
        ...e,
        date: new Date(String(e.date)),
        storeId: e.storeId ?? '',
        recurringTemplateId: e.recurringTemplateId ?? undefined,
        recurringPeriod: e.recurringPeriod ?? undefined,
      })) as unknown as Expense[];

      const transactions = transactionRows.map((t) => ({
        ...t,
        customerId: t.customerId || '',
        createdByUserId: t.createdByUserId || '',
        createdAt: new Date(String(t.createdAt)),
        estimatedCompletionDate: t.estimatedCompletionDate ?? undefined,
        paymentMethod: t.paymentMethod ?? undefined,
        items: (Array.isArray(t.items) ? t.items : []) as TransactionItem[],
      })) as unknown as Transaction[];

      return { customers, services, inventory, assets, expenses, transactions };
    },
  });

  const customers = backupDataQuery.data?.customers ?? [];
  const services = backupDataQuery.data?.services ?? [];
  const inventory = backupDataQuery.data?.inventory ?? [];
  const assets = backupDataQuery.data?.assets ?? [];
  const expenses = backupDataQuery.data?.expenses ?? [];
  const transactions = backupDataQuery.data?.transactions ?? [];

  const totalRecords =
    customers.length +
    services.length +
    inventory.length +
    assets.length +
    expenses.length +
    transactions.length;

  const percentOfTotal = (count: number) =>
    totalRecords > 0 ? `${(count / totalRecords) * 100}%` : '0%';

  // ============================================
  // Full Backup (Excel)
  // ============================================

  const handleFullExport = async () => {
    if (!canBackup) {
      addToast('Anda tidak memiliki izin untuk melakukan backup.', 'error');
      return;
    }
    if (!backupDataQuery.data) {
      addToast(
        backupDataQuery.isError
          ? 'Data gagal dimuat. Muat ulang halaman lalu coba lagi.'
          : 'Data masih dimuat, coba lagi sebentar.',
        'error',
      );
      return;
    }

    setIsExporting(true);
    const toastId = addToast('Mempersiapkan full backup...', 'info');

    try {
      await exportAllData(customers, services, inventory, assets, expenses, transactions);
      markBackupDone();
      updateToast(toastId, `Berhasil backup ${totalRecords} data!`, 'success');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal backup: ${errMsg}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!canBackup) {
      addToast('Anda tidak memiliki izin untuk melakukan restore.', 'error');
      return;
    }

    if (!fileInputRef.current?.files?.[0]) {
      fileInputRef.current?.click();
      return;
    }

    const file = fileInputRef.current.files[0];

    const confirmed = await confirm({
      title: 'Restore data dari file Excel?',
      message:
        `Data dari ${file.name} yang belum ada di sistem akan ditambahkan. ` +
        `Data yang sudah ada (ID sama) TIDAK diubah.\n\n` +
        `Untuk mengembalikan data persis seperti saat backup (menimpa data yang ada), ` +
        `gunakan Quick Backup (JSON).`,
      confirmText: 'Mulai restore',
    });

    if (!confirmed) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    setRestoreReport(null);
    const toastId = addToast('Membaca file backup...', 'info');

    try {
      const importedData = await importAllData(file);

      const totalInFile =
        importedData.customers.length +
        importedData.services.length +
        importedData.inventory.length +
        importedData.assets.length +
        importedData.expenses.length +
        importedData.transactions.length;

      if (totalInFile === 0) {
        updateToast(toastId, 'File tidak berisi data yang bisa dipulihkan.', 'error');
        return;
      }

      // Selain Super Admin, semua data dipaksa masuk ke cabang sendiri (sesuai RLS).
      const resolveStoreId = (storeId: string | undefined | null): string | null =>
        isSuperAdmin ? storeId || null : scopeStoreId;

      const lines: string[] = [];
      const errors: string[] = [];
      let savedTotal = 0;

      const run = async (label: string, tableName: string, rows: BackupRow[]) => {
        if (rows.length === 0) return;
        updateToast(toastId, `Restore ${label} (${rows.length})...`, 'info');
        const unique = dedupeById(rows);
        const result = await upsertInBatches(tableName, unique, { ignoreDuplicates: true });
        savedTotal += result.saved;
        lines.push(`${label}: ${result.saved} baris diproses`);
        if (result.failed > 0) {
          errors.push(`${label}: ${result.failed} baris gagal — ${result.errors.join('; ')}`);
        }
      };

      await run(
        'Pelanggan',
        'customers',
        importedData.customers.map((c) => {
          const row: BackupRow = {
            id: c.id,
            name: c.name,
            phone: c.phone ?? null,
            address: c.address ?? null,
            notes: c.notes ?? null,
            storeId: resolveStoreId(c.storeId),
          };
          const createdAt = toIsoOrNull(c.createdAt);
          if (createdAt) row.createdAt = createdAt;
          return row;
        }),
      );

      await run(
        'Layanan',
        'services',
        importedData.services.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category,
          wash_type: s.washType || 'Pakaian',
          price: s.price,
          unit: s.unit,
          durationDays: s.durationDays,
          storeId: resolveStoreId(s.storeId),
        })),
      );

      await run(
        'Inventaris',
        'inventory_items',
        importedData.inventory.map((i) => ({
          id: i.id,
          name: i.name,
          stock: i.stock,
          lowStockThreshold: i.lowStockThreshold,
          unit: i.unit,
          storeId: resolveStoreId(i.storeId),
        })),
      );

      await run(
        'Aset',
        'assets',
        importedData.assets.map((a) => ({
          id: a.id,
          name: a.name,
          status: a.status,
          serialNumber: a.serialNumber ?? null,
          purchaseDate: toDateOnly(a.purchaseDate),
          purchaseCost: a.purchaseCost ?? null,
          maintenanceHistory: a.maintenanceHistory ?? [],
          storeId: resolveStoreId(a.storeId),
        })),
      );

      await run(
        'Pengeluaran',
        'expenses',
        importedData.expenses.map((e) => ({
          // Id non-UUID (mis. dari backup lama) diganti agar diterima database.
          id: UUID_REGEX.test(e.id) ? e.id : crypto.randomUUID(),
          date: toDateOnly(e.date),
          description: e.description,
          category: e.category,
          amount: e.amount,
          storeId: resolveStoreId(e.storeId),
        })),
      );

      if (importedData.transactions.length > 0) {
        const profileIds = await fetchExistingProfileIds();
        let invalidDates = 0;

        const rows = importedData.transactions.map((t) => {
          let createdAt = toIsoOrNull(t.createdAt);
          if (!createdAt) {
            invalidDates++;
            createdAt = new Date().toISOString();
          }
          // invoiceCode tidak dikirim: trigger database selalu membuat kode baru saat insert.
          return {
            id: t.id,
            customerId: t.customerId || null,
            items: t.items,
            subtotal: t.subtotal,
            discount: t.discount,
            tax: t.tax,
            total: t.total,
            orderStatus: t.orderStatus,
            paymentStatus: t.paymentStatus,
            amountPaid: t.amountPaid,
            change: t.change,
            paymentMethod: t.paymentMethod ?? null,
            estimatedCompletionDate: toIsoOrNull(t.estimatedCompletionDate),
            notes: t.notes || null,
            createdAt,
            storeId: resolveStoreId(t.storeId),
            createdByUserId:
              t.createdByUserId && profileIds.has(t.createdByUserId) ? t.createdByUserId : null,
          };
        });

        await run('Transaksi', 'transactions', rows);
        if (invalidDates > 0) {
          errors.push(
            `Transaksi: ${invalidDates} baris tanggalnya tidak terbaca, diisi tanggal hari ini.`,
          );
        }
      }

      setRestoreReport({
        title:
          errors.length === 0 ? 'Restore Excel selesai' : 'Restore Excel selesai dengan masalah',
        tone: errors.length === 0 ? 'success' : 'warning',
        lines: [
          ...lines,
          'Data yang sudah ada dengan ID sama dilewati (tidak diubah). Transaksi baru mendapat kode invoice baru.',
        ],
        errors,
      });
      updateToast(
        toastId,
        errors.length === 0
          ? `Restore selesai: ${savedTotal} data diproses.`
          : `Restore selesai dengan ${errors.length} masalah. Lihat rincian di halaman.`,
        errors.length === 0 ? 'success' : 'warning',
      );
      void backupDataQuery.refetch();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal restore: ${errMsg}`, 'error');
      setRestoreReport({
        title: 'Restore Excel gagal',
        tone: 'error',
        lines: [],
        errors: [errMsg],
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ============================================
  // Quick Backup (JSON)
  // ============================================

  const handleExportJson = async () => {
    if (!canBackup) return;
    setIsExportingJson(true);
    const toastId = addToast('Mengekspor data ke JSON...', 'info');
    try {
      const backup = await exportBackup({
        storeId: scopeStoreId,
        onProgress: (label, percent) =>
          updateToast(toastId, `Mengekspor ${label} (${percent}%)...`, 'info'),
      });
      downloadBackup(backup);
      markBackupDone();
      const total = Object.values(backup.data).reduce((sum, rows) => sum + rows.length, 0);
      updateToast(toastId, `Backup JSON berhasil didownload (${total} baris).`, 'success');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateToast(toastId, `Gagal export JSON: ${errMsg}`, 'error');
    } finally {
      setIsExportingJson(false);
    }
  };

  const handleJsonFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readBackupFile(file);
      if (!validateBackup(data)) {
        addToast('File backup tidak valid atau format tidak sesuai.', 'error');
        return;
      }
      setRestoreReport(null);
      setPendingJsonBackup(data);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addToast(`Gagal membaca file: ${errMsg}`, 'error');
    } finally {
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
    }
  };

  const handleImportJson = async () => {
    if (!pendingJsonBackup || !canBackup) return;

    const confirmed = await confirm({
      title: 'Restore dari backup JSON?',
      message:
        `Data dengan ID yang sama akan DITIMPA dengan isi backup ` +
        `(${new Date(pendingJsonBackup.exportedAt).toLocaleString('id-ID')}). ` +
        `Data yang dibuat setelah backup tidak dihapus.\n\n` +
        `Sebaiknya download backup terbaru terlebih dahulu.`,
      confirmText: 'Timpa & restore',
    });
    if (!confirmed) return;

    setIsImportingJson(true);
    setImportJsonProgress(0);
    setRestoreReport(null);
    const toastId = addToast('Mengimpor data JSON...', 'info');

    try {
      const result = await importBackup(pendingJsonBackup, {
        restrictToStoreId: scopeStoreId,
        canOverwriteTransactions: isSuperAdmin,
        canRestoreStores: isSuperAdmin,
        onProgress: (_label, progress) => setImportJsonProgress(progress),
      });

      const restoredTotal = Object.values(result.restored).reduce((a, b) => a + b, 0);
      const lines = BACKUP_TABLES.filter((t) => result.restored[t.name] !== undefined).map(
        (t) => `${t.label}: ${result.restored[t.name]} baris dipulihkan`,
      );
      if (restoredTotal === 0 && result.errors.length === 0) {
        lines.push(
          scopeStoreId
            ? 'Tidak ada data untuk cabang ini di file backup.'
            : 'File backup tidak berisi data.',
        );
      }

      setRestoreReport({
        title: result.success ? 'Restore JSON selesai' : 'Restore JSON selesai dengan masalah',
        tone: result.success ? 'success' : 'warning',
        lines: [...lines, ...result.skipped],
        errors: result.errors,
      });
      updateToast(
        toastId,
        result.success
          ? `Restore JSON berhasil: ${restoredTotal} baris.`
          : `Restore JSON selesai dengan ${result.errors.length} masalah. Lihat rincian di halaman.`,
        result.success ? 'success' : 'warning',
      );
      setPendingJsonBackup(null);
      void backupDataQuery.refetch();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      updateToast(toastId, `Gagal import: ${errMsg}`, 'error');
      setRestoreReport({ title: 'Restore JSON gagal', tone: 'error', lines: [], errors: [errMsg] });
    } finally {
      setIsImportingJson(false);
      setImportJsonProgress(0);
    }
  };

  const getStoreName = (storeId: string | null | undefined) => {
    if (!storeId) return 'Semua Cabang';
    return stores.find((s) => s.id === storeId)?.name || 'Cabang Tidak Dikenal';
  };

  const pendingScopeMismatch =
    pendingJsonBackup && scopeStoreId && pendingJsonBackup.storeId !== scopeStoreId;

  const reportStyles: Record<RestoreReport['tone'], string> = {
    success:
      'border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-900/20 dark:text-green-200',
    warning:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200',
    error:
      'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200',
  };

  return (
    <div className="space-y-6">
      {/* Store Info Header */}
      <div className="card p-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Data Backup & Restore:{' '}
          <span className="text-blue-600 dark:text-blue-400">{getStoreName(scopeStoreId)}</span>
        </h2>
        {isSuperAdmin && !scopeStoreId && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            Mode gabungan - Data dari semua cabang akan di-backup/restore
          </p>
        )}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Backup semua data aplikasi atau restore dari backup sebelumnya
      </p>

      {!canBackup && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Akses Terbatas</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                Hanya Admin dan Super Admin yang dapat melakukan backup & restore data.
              </p>
            </div>
          </div>
        </div>
      )}

      {backupDataQuery.isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
          Gagal memuat data:{' '}
          {backupDataQuery.error instanceof Error ? backupDataQuery.error.message : 'error'}. Backup
          Excel tidak bisa dibuat sampai data berhasil dimuat.
        </div>
      )}

      {restoreReport && (
        <div className={`rounded-lg border p-4 ${reportStyles[restoreReport.tone]}`} role="status">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-semibold">{restoreReport.title}</h3>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium underline"
            >
              Muat ulang halaman
            </button>
          </div>
          {restoreReport.lines.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {restoreReport.lines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
          {restoreReport.errors.length > 0 && (
            <>
              <p className="mt-3 text-sm font-semibold">Masalah:</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm break-words">
                {restoreReport.errors.map((err) => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Statistics Overview */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-400">Total Data Aplikasi</p>
            <p className="text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
              {backupDataQuery.isLoading ? '…' : totalRecords.toLocaleString('id-ID')}
            </p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {lastBackupDate
                ? `Backup terakhir di perangkat ini: ${new Date(lastBackupDate).toLocaleDateString('id-ID')} ${new Date(lastBackupDate).toLocaleTimeString('id-ID')}`
                : 'Belum pernah backup dari perangkat ini'}
            </p>
          </div>
          <div className="rounded-lg bg-slate-100 p-4 dark:bg-slate-700">
            <DatabaseIcon className="h-10 w-10 text-slate-500 dark:text-slate-300" />
          </div>
        </div>
      </div>

      {/* Detailed Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pelanggan</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{customers.length}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-brand-blue-600 dark:bg-brand-blue-400"
              style={{ width: percentOfTotal(customers.length) }}
            />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Layanan</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{services.length}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-brand-blue-600 dark:bg-brand-blue-400"
              style={{ width: percentOfTotal(services.length) }}
            />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Inventori</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{inventory.length}</p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-brand-blue-600 dark:bg-brand-blue-400"
              style={{ width: percentOfTotal(inventory.length) }}
            />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Aset</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{assets.length}</p>
          <div className="mt-2 h-1 bg-orange-200 dark:bg-orange-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-600 dark:bg-orange-400"
              style={{ width: percentOfTotal(assets.length) }}
            />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Pengeluaran</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{expenses.length}</p>
          <div className="mt-2 h-1 bg-red-200 dark:bg-red-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 dark:bg-red-400"
              style={{ width: percentOfTotal(expenses.length) }}
            />
          </div>
        </div>

        <div className="card p-4">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Transaksi</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{transactions.length}</p>
          <div className="mt-2 h-1 bg-cyan-200 dark:bg-cyan-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-600 dark:bg-cyan-400"
              style={{ width: percentOfTotal(transactions.length) }}
            />
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Full Backup */}
        <div className="card p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <DownloadIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Export Full Backup (Excel)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Download data utama dalam satu file Excel: pelanggan, layanan, inventori, aset,
                pengeluaran, dan transaksi. Mudah dibaca dan diolah.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Semua baris ikut, tanpa batas jumlah</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Format Excel dengan multiple sheets</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  <span>Tanggal & item transaksi tersimpan utuh</span>
                </div>
              </div>
              <button
                onClick={handleFullExport}
                disabled={!canBackup || isExporting || backupDataQuery.isLoading}
                className="btn btn-primary mt-6 w-full"
              >
                {isExporting || backupDataQuery.isLoading ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 text-white" />
                    <span>{isExporting ? 'Memproses...' : 'Memuat data...'}</span>
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
        <div className="card p-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
              <UploadIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Import Full Backup (Excel)
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Kembalikan data yang hilang dari file backup Excel. Cocok untuk memulihkan data yang
                terhapus atau memindahkan data ke sistem baru.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Menambahkan data yang belum ada</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>Rincian hasil & error ditampilkan</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangleIcon className="w-4 h-4" />
                  <span>Data yang sudah ada tidak diubah</span>
                </div>
              </div>
              <input
                ref={fileInputRef}
                id="backup-restore-file"
                name="backup-restore-file"
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={handleImport}
              />
              <button
                onClick={handleImport}
                disabled={!canBackup || isImporting}
                className="btn btn-success mt-6 w-full"
              >
                {isImporting ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 text-white" />
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

      {/* JSON Backup & Restore Section */}
      <div className="bg-slate-50 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <DatabaseIcon className="w-5 h-5 text-slate-500" />
          Quick Backup (JSON)
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Backup paling lengkap: termasuk pengaturan, karyawan, absensi, kasbon, penggajian, jadwal
          perawatan, dan template biaya bulanan. Restore JSON mengembalikan data persis seperti saat
          backup (menimpa data dengan ID yang sama).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Export JSON */}
          <button
            onClick={handleExportJson}
            disabled={!canBackup || isExportingJson}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExportingJson ? (
              <SpinnerIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            ) : (
              <DownloadIcon className="w-5 h-5" />
            )}
            Download JSON Backup
          </button>

          {/* Import JSON */}
          <div className="flex gap-2">
            <input
              type="file"
              accept=".json,application/json"
              ref={jsonFileInputRef}
              onChange={handleJsonFileSelect}
              className="hidden"
            />
            <button
              onClick={() => jsonFileInputRef.current?.click()}
              disabled={!canBackup || isImportingJson}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UploadIcon className="w-5 h-5" />
              Pilih File JSON
            </button>
          </div>
        </div>

        {/* JSON Import Confirmation */}
        {pendingJsonBackup && (
          <div className="mt-4 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                  Konfirmasi Restore JSON
                </h4>
                <div className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-300">
                  <p>Versi Backup: {pendingJsonBackup.version}</p>
                  <p>
                    Tanggal:{' '}
                    {new Date(pendingJsonBackup.exportedAt).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'medium',
                    })}
                  </p>
                  {pendingJsonBackup.storeId !== undefined && (
                    <p>Cakupan backup: {getStoreName(pendingJsonBackup.storeId)}</p>
                  )}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 p-2 bg-blue-100 dark:bg-blue-900/40 rounded">
                    {BACKUP_TABLES.filter((t) => pendingJsonBackup.data[t.name] !== undefined).map(
                      (t) => (
                        <p key={t.name}>
                          {t.label}: {pendingJsonBackup.data[t.name].length}
                        </p>
                      ),
                    )}
                  </div>
                  {pendingScopeMismatch && (
                    <p className="mt-2 text-amber-700 dark:text-amber-300">
                      Hanya data milik cabang {getStoreName(scopeStoreId)} yang akan dipulihkan.
                    </p>
                  )}
                  {!isSuperAdmin && (
                    <p className="mt-2 text-amber-700 dark:text-amber-300">
                      Sebagai Admin, transaksi yang sudah ada tidak ditimpa dan data cabang tidak
                      diubah. Hubungi Super Admin untuk restore penuh.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleImportJson}
                    disabled={isImportingJson}
                    className="btn btn-primary btn-sm"
                  >
                    {isImportingJson ? (
                      <>
                        <SpinnerIcon className="w-4 h-4 text-white" />
                        <span>Memproses {importJsonProgress}%...</span>
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-4 h-4" />
                        Restore Sekarang
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setPendingJsonBackup(null);
                      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
                    }}
                    disabled={isImportingJson}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <DatabaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
              Tentang Backup & Restore
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>JSON</strong> adalah backup utama untuk pemulihan: paling lengkap dan
                  mengembalikan data persis. <strong>Excel</strong> cocok untuk arsip yang mudah
                  dibaca dan untuk mengembalikan data yang terhapus.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  Akun login tidak dipulihkan dari backup (akun dikelola lewat menu Akun Login).
                  Transaksi yang dipulihkan karena terhapus mendapat kode invoice baru.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  <strong>Backup Per Halaman</strong> tetap tersedia di masing-masing halaman untuk
                  backup selektif (misalnya hanya pelanggan atau transaksi).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span>
                  Simpan file backup di tempat yang aman seperti Google Drive, OneDrive, atau hard
                  drive eksternal, dan lakukan backup rutin (mingguan atau bulanan).
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      {confirmDialog}
    </div>
  );
};

export default BackupRestorePage;

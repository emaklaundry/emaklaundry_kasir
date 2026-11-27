import React, { useState, useMemo, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import { useSearchParams } from 'react-router-dom';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  HistoryIcon,
  WrenchIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DownloadIcon,
  UploadIcon,
} from '../../components/icons';
import {
  exportAssetsToExcel,
  importAssetsFromExcel,
  downloadAssetTemplate,
} from '../../utils/excelUtils';
import { supabase } from '../../utils/supabaseClient';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAssets } from '../../contexts/AssetContext';
import useAppContext from '../../contexts/useAppContext';
import AssetFormModal from '../../components/AssetFormModal';
import MaintenanceFormModal from '../../components/MaintenanceFormModal';
import MaintenanceHistoryModal from '../../components/MaintenanceHistoryModal';
import ScheduledMaintenanceModal from '../../components/ScheduledMaintenanceModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import { useScheduledMaintenances } from '../../contexts/ScheduledMaintenanceContext';
import { useSortableData } from '../../hooks/useSortableData';
import { getStatusBadge, getAssetStatusLabel } from '@/utils/uiHelpers';
import { getStartOfDay } from '@/utils/dateHelpers';
import { Asset, AssetStatus, MaintenanceLog, UserRole } from '@/types';
import SearchInput from '../../components/SearchInput';

type StatusFilter = 'in_use' | 'all' | AssetStatus;

const DAY_MS = 24 * 60 * 60 * 1000;
const formatRp = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;

/** Kartu ringkasan kecil di atas daftar aset. */
const SummaryCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  highlight?: boolean;
  active?: boolean;
  onClick?: () => void;
}> = ({ label, value, sub, highlight, active, onClick }) => {
  const tone = highlight
    ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20'
    : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800';
  const content = (
    <>
      <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
        {label}
      </p>
      <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-2xl">
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </>
  );
  const className = `h-full w-full rounded-lg border p-4 text-left ${tone} ${
    active ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''
  }`;
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${className} transition hover:brightness-95`}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
};

const AssetsPage: React.FC = () => {
  const { assets, addAsset, updateAsset, deleteAsset, appendMaintenanceLog, isLoading } =
    useAssets();
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const { scheduledMaintenances } = useScheduledMaintenances();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const [isAssetFormModalOpen, setIsAssetFormModalOpen] = useState(false);
  const [isMaintenanceFormModalOpen, setIsMaintenanceFormModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [maintenanceFilter, setMaintenanceFilter] = useState<'all' | 'due'>(() =>
    searchParams.get('filter') === 'maintenance_due' ? 'due' : 'all',
  );
  // Default: sembunyikan aset yang sudah diberhentikan.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('in_use');

  const handleOpenAssetForm = (asset: Asset | null = null) => {
    setCurrentAsset(asset);
    setIsAssetFormModalOpen(true);
  };

  const handleOpenMaintenanceForm = (asset: Asset) => {
    setCurrentAsset(asset);
    setIsMaintenanceFormModalOpen(true);
  };

  const handleOpenHistory = (asset: Asset) => {
    setCurrentAsset(asset);
    setIsHistoryModalOpen(true);
  };

  const handleOpenSchedule = (asset: Asset) => {
    setCurrentAsset(asset);
    setIsScheduleModalOpen(true);
  };

  const handleSaveAsset = async (asset: Omit<Asset, 'id' | 'maintenanceHistory' | 'storeId'>) => {
    if (!currentUser) {
      addToast('User context belum siap.', 'error');
      return;
    }
    const storeId =
      currentAsset?.storeId ||
      (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk menambah atau mengedit aset.', 'warning');
      return;
    }
    const toastId = addToast('Menyimpan aset...', 'info');
    try {
      if (currentAsset && currentAsset.id) {
        // Edit Mode: Hanya update data aset
        await updateAsset(currentAsset.id, { ...asset, storeId });
        addAuditLog(`Memperbarui data aset: "${asset.name}".`, storeId);
        updateToast(toastId, 'Data aset berhasil diperbarui!', 'success');
      } else {
        // Create Mode: Tambah aset saja, tidak perlu catat ke pengeluaran
        await addAsset({ ...asset, maintenanceHistory: [], storeId });
        addAuditLog(`Menambahkan aset baru: "${asset.name}".`, storeId);
        updateToast(toastId, 'Aset baru berhasil ditambahkan!', 'success');
      }
      setIsAssetFormModalOpen(false);
      setCurrentAsset(null);
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal menyimpan: ${errMsg}`, 'error');
    }
  };

  const handleAddMaintenance = async (log: Omit<MaintenanceLog, 'id'>) => {
    if (!currentAsset) return;
    try {
      // Ambil riwayat terbaru dari DB lalu tambahkan — mencegah log saling menimpa.
      await appendMaintenanceLog(currentAsset.id, log);
      addAuditLog(
        `Menambahkan log pemeliharaan untuk aset "${currentAsset.name}": ${log.description}.`,
        currentAsset.storeId,
      );
      addToast('Log perawatan berhasil disimpan.', 'success');
      // Modal hanya ditutup jika berhasil, agar isian tidak hilang saat gagal.
      setIsMaintenanceFormModalOpen(false);
      setCurrentAsset(null);
    } catch (error: unknown) {
      console.error('Error updating asset maintenance:', error);
      const errMsg = error instanceof Error ? error.message : '';
      addToast(`Gagal menyimpan log perawatan${errMsg ? `: ${errMsg}` : '.'}`, 'error');
    }
  };

  const handleDelete = (asset: Asset) => {
    setAssetToDelete(asset);
  };

  const confirmDelete = async () => {
    if (assetToDelete) {
      const toastId = addToast('Menghapus aset...', 'info');
      try {
        await deleteAsset(assetToDelete.id);
        addAuditLog(`Menghapus aset: "${assetToDelete.name}".`, assetToDelete.storeId);
        updateToast(toastId, 'Aset berhasil dihapus!', 'success');
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'message' in error) {
          updateToast(
            toastId,
            `Gagal menghapus: ${(error as { message: string }).message}`,
            'error',
          );
        } else {
          updateToast(toastId, 'Gagal menghapus: Unknown error', 'error');
        }
      } finally {
        setAssetToDelete(null);
      }
    }
  };

  // Cabang aktif: Super Admin mengikuti pilihan di header, peran lain cabangnya sendiri.
  const storeScope =
    currentUser?.role === UserRole.SuperAdmin ? selectedStoreId : currentUser?.storeId;
  const isAllStores = !storeScope || storeScope === 'all';

  const assetsWithStore = useMemo(
    () =>
      (isAllStores ? assets : assets.filter((a) => a.storeId === storeScope)).map((asset) => ({
        ...asset,
        storeName: stores.find((s) => s.id === asset.storeId)?.name || 'N/A',
      })),
    [assets, stores, isAllStores, storeScope],
  );

  type AssetWithStore = (typeof assetsWithStore)[0];

  // Jadwal perawatan terdekat per aset -> selisih hari dari hari ini (negatif = terlambat).
  const daysUntilDueByAsset = useMemo(() => {
    const today = getStartOfDay(new Date()).getTime();
    const map = new Map<string, number>();
    scheduledMaintenances.forEach((sm) => {
      const due = getStartOfDay(new Date(sm.nextDueDate)).getTime();
      const days = Math.round((due - today) / DAY_MS);
      const current = map.get(sm.assetId);
      if (current === undefined || days < current) map.set(sm.assetId, days);
    });
    return map;
  }, [scheduledMaintenances]);

  const summary = useMemo(() => {
    const now = new Date();
    let activeValue = 0;
    let decommissioned = 0;
    let dueCount = 0;
    let monthCost = 0;
    assetsWithStore.forEach((asset) => {
      if (asset.status === 'Decommissioned') {
        decommissioned++;
      } else {
        activeValue += Number(asset.purchaseCost) || 0;
        if ((daysUntilDueByAsset.get(asset.id) ?? Infinity) <= 0) dueCount++;
      }
      asset.maintenanceHistory.forEach((log) => {
        const d = new Date(log.date);
        if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
          monthCost += Number(log.cost) || 0;
        }
      });
    });
    return { total: assetsWithStore.length, decommissioned, activeValue, dueCount, monthCost };
  }, [assetsWithStore, daysUntilDueByAsset]);

  const filteredAssets = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    return assetsWithStore.filter((asset) => {
      if (statusFilter === 'in_use' && asset.status === 'Decommissioned') return false;
      if (statusFilter !== 'in_use' && statusFilter !== 'all' && asset.status !== statusFilter) {
        return false;
      }
      if (maintenanceFilter === 'due') {
        const days = daysUntilDueByAsset.get(asset.id);
        if (asset.status === 'Decommissioned' || days === undefined || days > 0) return false;
      }
      if (!term) return true;
      return (
        asset.name.toLowerCase().includes(term) ||
        (asset.serialNumber ?? '').toLowerCase().includes(term) ||
        asset.storeName.toLowerCase().includes(term)
      );
    });
  }, [assetsWithStore, debouncedSearch, statusFilter, maintenanceFilter, daysUntilDueByAsset]);

  const hasNoAssetsAtAll = assetsWithStore.length === 0;

  const renderDueBadge = (asset: Asset) => {
    if (asset.status === 'Decommissioned') return null;
    const days = daysUntilDueByAsset.get(asset.id);
    if (days === undefined || days > 7) return null;
    if (days < 0) {
      return <span className="badge badge-danger">Perawatan terlambat {-days} hari</span>;
    }
    if (days === 0) return <span className="badge badge-warning">Perawatan hari ini</span>;
    return <span className="badge badge-info">Perawatan {days} hari lagi</span>;
  };

  const {
    items: sortedAssets,
    requestSort,
    sortConfig,
  } = useSortableData<AssetWithStore>(filteredAssets);

  const getSortIcon = (key: keyof AssetWithStore) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const canAddNewAsset =
    !!currentUser && !(currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

  const handleFilterChange = (filter: 'all' | 'due') => {
    setMaintenanceFilter(filter);
    if (filter === 'due') {
      searchParams.set('filter', 'maintenance_due');
    } else {
      searchParams.delete('filter');
    }
    setSearchParams(searchParams);
  };

  // Excel Export
  const handleExportToExcel = async () => {
    const toastId = addToast('Mengekspor aset...', 'info');
    try {
      // Fetch SEMUA aset dari database
      updateToast(toastId, 'Mengambil semua data aset...', 'info');

      let query = supabase.from('assets').select('*');

      // Filter by store if needed
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      const { data: allAssets, error } = await query;

      if (error) throw error;
      if (!allAssets || allAssets.length === 0) {
        updateToast(toastId, 'Tidak ada aset untuk diekspor.', 'warning');
        return;
      }

      updateToast(toastId, `Mengekspor ${allAssets.length} aset...`, 'info');

      const assetsToExport = allAssets.map((a) => ({
        ...a,
        storeId: a.storeId ?? undefined,
        purchaseDate: a.purchaseDate ?? undefined,
        purchaseCost: a.purchaseCost ?? undefined,
        serialNumber: a.serialNumber ?? undefined,
      })) as unknown as Asset[];

      await exportAssetsToExcel(assetsToExport);
      updateToast(toastId, `Berhasil mengekspor ${allAssets.length} aset ke Excel.`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      updateToast(toastId, 'Gagal export data ke Excel', 'error');
    }
  };

  // Excel Import
  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const toastId = addToast('Memproses import data...', 'info');

    try {
      const importedAssets = await importAssetsFromExcel(file);

      let successCount = 0;
      let errorCount = 0;
      let skipCount = 0;

      for (const asset of importedAssets) {
        try {
          if (asset.id) {
            // Validate UUID format before UPDATE
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(asset.id)) {
              console.warn('Invalid UUID skipped:', asset.id);
              skipCount++;
              continue;
            }

            // Update aset yang sudah ada. storeId sengaja TIDAK diubah, agar import
            // file dari cabang lain tidak memindahkan aset ke cabang yang sedang aktif.
            const updatePayload: Partial<Asset> = {
              name: asset.name!,
              serialNumber: asset.serialNumber,
              purchaseDate: asset.purchaseDate!,
              purchaseCost: asset.purchaseCost!,
              status: asset.status!,
            };

            await updateAsset(asset.id, updatePayload);
            successCount++;
          } else {
            // Check for duplicate before adding new asset
            const existingAsset = assets.find((a) => {
              if (asset.serialNumber) {
                return a.serialNumber === asset.serialNumber;
              } else {
                return a.name.toLowerCase() === asset.name!.toLowerCase();
              }
            });
            if (existingAsset) {
              console.warn('Duplicate asset skipped:', asset.name);
              skipCount++;
              continue;
            }

            // Ensure storeId is set for INSERT (RLS policy requirement)
            const storeId = selectedStoreId === 'all' ? currentUser?.storeId : selectedStoreId;

            if (!storeId) {
              console.error('storeId is required for new assets');
              errorCount++;
              continue;
            }

            // Add new asset
            await addAsset({
              name: asset.name!,
              serialNumber: asset.serialNumber,
              purchaseDate: asset.purchaseDate!,
              purchaseCost: asset.purchaseCost!,
              status: asset.status!,
              maintenanceHistory: [],
              storeId: storeId,
            });
            successCount++;
          }
        } catch (error) {
          console.error('Error importing asset:', asset, error);
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
        updateToast(toastId, `Berhasil import ${successCount} aset`, 'success');
      }

      addAuditLog(
        `Import ${successCount} aset dari Excel`,
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
      await downloadAssetTemplate();
      addToast('Template Excel berhasil didownload', 'success');
    } catch (error) {
      console.error('Download template error:', error);
      addToast('Gagal download template', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Excel Import/Export Buttons */}
          <button
            onClick={handleDownloadTemplate}
            className="btn btn-secondary btn-sm"
            title="Download Template Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Template</span>
          </button>

          <input
            ref={fileInputRef}
            id="asset-import-file"
            name="asset-import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFromExcel}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddNewAsset}
            className="btn btn-secondary btn-sm"
            title="Import dari Excel"
          >
            <UploadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Import</span>
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={assets.length === 0}
            className="btn btn-primary btn-sm"
            title="Export ke Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Export</span>
          </button>

          <button
            onClick={() => handleOpenAssetForm()}
            className="btn btn-primary btn-sm"
            disabled={!canAddNewAsset}
          >
            Tambah Aset
          </button>
        </div>
      </div>
      {!canAddNewAsset && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Pilih cabang spesifik di header untuk menambah aset baru.
        </p>
      )}

      {!isLoading && !hasNoAssetsAtAll && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Total aset"
            value={summary.total}
            sub={
              summary.decommissioned > 0
                ? `${summary.decommissioned} diberhentikan`
                : 'Semua masih dipakai'
            }
          />
          <SummaryCard
            label="Nilai aset aktif"
            value={formatRp(summary.activeValue)}
            sub="Berdasarkan harga beli"
          />
          <SummaryCard
            label="Perawatan jatuh tempo"
            value={summary.dueCount}
            sub={
              maintenanceFilter === 'due'
                ? 'Klik untuk tampilkan semua'
                : summary.dueCount > 0
                  ? 'Klik untuk lihat'
                  : 'Tidak ada yang tertunda'
            }
            highlight={summary.dueCount > 0}
            active={maintenanceFilter === 'due'}
            onClick={
              summary.dueCount > 0 || maintenanceFilter === 'due'
                ? () => handleFilterChange(maintenanceFilter === 'due' ? 'all' : 'due')
                : undefined
            }
          />
          <SummaryCard
            label="Biaya perawatan bulan ini"
            value={formatRp(summary.monthCost)}
            sub={new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          id="asset-search"
          name="asset-search"
          label="Cari aset"
          placeholder="Cari nama, nomor serial, atau toko..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          wrapperClassName="flex-1"
        />
        <select
          id="asset-maintenance-filter"
          name="asset-maintenance-filter"
          aria-label="Filter jadwal perawatan"
          value={maintenanceFilter}
          onChange={(e) => handleFilterChange(e.target.value as 'all' | 'due')}
          className="w-full sm:w-48 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="all">Semua Jadwal</option>
          <option value="due">Perawatan Jatuh Tempo</option>
        </select>
        <select
          id="asset-status-filter"
          name="asset-status-filter"
          aria-label="Filter status aset"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="w-full sm:w-48 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="in_use">Masih Dipakai</option>
          <option value="all">Semua Status</option>
          <option value="Active">Aktif</option>
          <option value="Under Maintenance">Dalam Perbaikan</option>
          <option value="Decommissioned">Diberhentikan</option>
        </select>
      </div>

      <div className="card p-4">
        {isLoading ? (
          <p className="py-10 text-center text-slate-500 dark:text-slate-400" role="status">
            Memuat data aset...
          </p>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5">No</th>
                    <th className="px-4 py-2.5">
                      <button
                        onClick={() => requestSort('name')}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                      >
                        Nama Aset {getSortIcon('name')}
                      </button>
                    </th>
                    {currentUser &&
                      currentUser.role === UserRole.SuperAdmin &&
                      selectedStoreId === 'all' && (
                        <th className="px-4 py-2.5">
                          <button
                            onClick={() => requestSort('storeName')}
                            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                          >
                            Toko {getSortIcon('storeName')}
                          </button>
                        </th>
                      )}
                    <th className="px-4 py-2.5">
                      <button
                        onClick={() => requestSort('purchaseDate')}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                      >
                        Tanggal Beli {getSortIcon('purchaseDate')}
                      </button>
                    </th>
                    <th className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => requestSort('purchaseCost')}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 ml-auto"
                      >
                        Biaya Beli {getSortIcon('purchaseCost')}
                      </button>
                    </th>
                    <th className="px-4 py-2.5">
                      <button
                        onClick={() => requestSort('status')}
                        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                      >
                        Status {getSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-4 py-2.5">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAssets.length > 0 ? (
                    sortedAssets.map((asset, index) => (
                      <tr key={asset.id} className="border-b dark:border-slate-700">
                        <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-slate-900 dark:text-white">{asset.name}</p>
                          {asset.serialNumber && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              SN: {asset.serialNumber}
                            </p>
                          )}
                          {renderDueBadge(asset) && (
                            <div className="mt-1">{renderDueBadge(asset)}</div>
                          )}
                        </td>
                        {currentUser &&
                          currentUser.role === UserRole.SuperAdmin &&
                          selectedStoreId === 'all' && (
                            <td className="px-4 py-2.5">{asset.storeName}</td>
                          )}
                        <td className="px-4 py-2.5">
                          {asset.purchaseDate
                            ? new Date(asset.purchaseDate).toLocaleDateString('id-ID')
                            : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {asset.purchaseCost
                            ? `Rp ${asset.purchaseCost.toLocaleString('id-ID')}`
                            : '-'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`badge ${getStatusBadge(asset.status)}`}>
                            {getAssetStatusLabel(asset.status)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center space-x-2">
                            <button
                              aria-label={`Edit ${asset.name}`}
                              onClick={() => handleOpenAssetForm(asset)}
                              title="Edit Aset"
                              className="btn btn-ghost btn-icon"
                            >
                              <EditIcon className="w-5 h-5" />
                            </button>
                            <button
                              aria-label={`Hapus ${asset.name}`}
                              onClick={() => handleDelete(asset)}
                              title="Hapus Aset"
                              className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
                            >
                              <Trash2Icon className="w-5 h-5" />
                            </button>
                            <button
                              aria-label={`Catat pemeliharaan ${asset.name}`}
                              onClick={() => handleOpenMaintenanceForm(asset)}
                              title="Tambah Log Pemeliharaan"
                              className="btn btn-ghost btn-icon"
                            >
                              <PlusCircleIcon className="w-5 h-5" />
                            </button>
                            <button
                              aria-label={`Jadwal perawatan ${asset.name}`}
                              onClick={() => handleOpenSchedule(asset)}
                              title="Jadwal Perawatan"
                              className="btn btn-ghost btn-icon"
                            >
                              <CalendarIcon className="w-5 h-5" />
                            </button>
                            <button
                              aria-label={`Riwayat pemeliharaan ${asset.name}`}
                              onClick={() => handleOpenHistory(asset)}
                              title="Lihat Riwayat Pemeliharaan"
                              className="btn btn-ghost btn-icon"
                            >
                              <HistoryIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all'
                            ? 7
                            : 6
                        }
                      >
                        <EmptyState
                          icon={<WrenchIcon className="mx-auto w-12 h-12 text-slate-400" />}
                          title={hasNoAssetsAtAll ? 'Belum Ada Aset' : 'Aset Tidak Ditemukan'}
                          description={
                            hasNoAssetsAtAll
                              ? 'Mulai dengan menambahkan aset pertama Anda.'
                              : 'Coba kata kunci atau filter lain.'
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
              {sortedAssets.length > 0 ? (
                sortedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                          {asset.name}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className={`badge ${getStatusBadge(asset.status)}`}>
                            {getAssetStatusLabel(asset.status)}
                          </span>
                          {renderDueBadge(asset)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-0">
                        <button
                          aria-label={`Edit ${asset.name}`}
                          onClick={() => handleOpenAssetForm(asset)}
                          title="Edit Aset"
                          className="btn btn-ghost btn-icon"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button
                          aria-label={`Hapus ${asset.name}`}
                          onClick={() => handleDelete(asset)}
                          title="Hapus Aset"
                          className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
                        >
                          <Trash2Icon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    {currentUser &&
                      currentUser.role === UserRole.SuperAdmin &&
                      selectedStoreId === 'all' && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {asset.storeName}
                        </p>
                      )}
                    <div className="mt-3 space-y-1 text-sm border-t dark:border-slate-600 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Tgl Beli:</span>
                        <span className="font-medium">
                          {asset.purchaseDate
                            ? new Date(asset.purchaseDate).toLocaleDateString('id-ID')
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Biaya:</span>
                        <span className="font-medium">
                          {asset.purchaseCost
                            ? `Rp ${asset.purchaseCost.toLocaleString('id-ID')}`
                            : '-'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                      <button
                        onClick={() => handleOpenMaintenanceForm(asset)}
                        className="flex items-center gap-1 py-1 px-3 rounded-md bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                      >
                        <PlusCircleIcon className="w-4 h-4" /> Log
                      </button>
                      <button
                        onClick={() => handleOpenSchedule(asset)}
                        className="flex items-center gap-1 py-1 px-3 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                      >
                        <CalendarIcon className="w-4 h-4" /> Jadwal
                      </button>
                      <button
                        onClick={() => handleOpenHistory(asset)}
                        className="flex items-center gap-1 py-1 px-3 rounded-md bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-slate-200"
                      >
                        <HistoryIcon className="w-4 h-4" /> Riwayat
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={<WrenchIcon className="mx-auto w-12 h-12 text-slate-400" />}
                  title={hasNoAssetsAtAll ? 'Belum Ada Aset' : 'Aset Tidak Ditemukan'}
                  description={
                    hasNoAssetsAtAll
                      ? 'Mulai dengan menambahkan aset pertama Anda.'
                      : 'Coba kata kunci atau filter lain.'
                  }
                />
              )}
            </div>
          </>
        )}
      </div>

      {isAssetFormModalOpen && (
        <AssetFormModal
          asset={currentAsset}
          onClose={() => setIsAssetFormModalOpen(false)}
          onSave={handleSaveAsset}
        />
      )}
      {isMaintenanceFormModalOpen && currentAsset && (
        <MaintenanceFormModal
          assetName={currentAsset.name}
          onClose={() => setIsMaintenanceFormModalOpen(false)}
          onSave={handleAddMaintenance}
        />
      )}
      {isHistoryModalOpen && currentAsset && (
        <MaintenanceHistoryModal
          asset={assets.find((a) => a.id === currentAsset.id) ?? currentAsset}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
      {isScheduleModalOpen && currentAsset && (
        <ScheduledMaintenanceModal
          asset={assets.find((a) => a.id === currentAsset.id) ?? currentAsset}
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
        />
      )}
      {assetToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setAssetToDelete(null)}
          onConfirm={confirmDelete}
          title="Hapus Aset"
          message={`Anda yakin ingin menghapus aset "${assetToDelete.name}"? Riwayat dan jadwal perawatan aset ini juga akan ikut terhapus.`}
        />
      )}
    </div>
  );
};

export default AssetsPage;

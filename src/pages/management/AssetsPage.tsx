import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Asset, MaintenanceLog, UserRole } from '@/types';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  HistoryIcon,
  WrenchIcon,
  CalendarIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAssets } from '../../contexts/AssetContext';
import { useAppContext } from '../../contexts/AppContext';
import AssetFormModal from '../../components/AssetFormModal';
import MaintenanceFormModal from '../../components/MaintenanceFormModal';
import MaintenanceHistoryModal from '../../components/MaintenanceHistoryModal';
import ScheduledMaintenanceModal from '../../components/ScheduledMaintenanceModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';
import { useScheduledMaintenances } from '../../contexts/ScheduledMaintenanceContext';
import { useSortableData } from '../../hooks/useSortableData';

const AssetsPage: React.FC = () => {
  const { assets, addAsset, updateAsset, deleteAsset } = useAssets();
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const { scheduledMaintenances } = useScheduledMaintenances();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isAssetFormModalOpen, setIsAssetFormModalOpen] = useState(false);
  const [isMaintenanceFormModalOpen, setIsMaintenanceFormModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [maintenanceFilter, setMaintenanceFilter] = useState<'all' | 'due'>(() =>
    searchParams.get('filter') === 'maintenance_due' ? 'due' : 'all',
  );

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
    const storeId =
      currentAsset?.storeId ||
      (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk menambah atau mengedit aset.', 'warning');
      return;
    }
    const toastId = addToast('Menyimpan aset...', 'info');
    setIsSavingAsset(true);
    try {
      if (currentAsset && currentAsset.id) {
        await updateAsset(currentAsset.id, { ...asset, storeId });
        addAuditLog(`Memperbarui data aset: "${asset.name}".`, storeId);
        updateToast(toastId, 'Data aset berhasil diperbarui!', 'success');
      } else {
        await addAsset({ ...asset, maintenanceHistory: [], storeId });
        addAuditLog(`Menambahkan aset baru: "${asset.name}".`, storeId);
        updateToast(toastId, 'Aset baru berhasil ditambahkan!', 'success');
      }
      setIsAssetFormModalOpen(false);
      setCurrentAsset(null);
    } catch (error: any) {
      updateToast(toastId, `Gagal menyimpan: ${error.message}`, 'error');
    } finally {
      setIsSavingAsset(false);
    }
  };

  const handleAddMaintenance = async (log: Omit<MaintenanceLog, 'id'>) => {
    if (currentAsset) {
      const newLog = { ...log, id: Date.now().toString() };
      const updatedHistory = [...currentAsset.maintenanceHistory, newLog];
      await updateAsset(currentAsset.id, { maintenanceHistory: updatedHistory });
      addAuditLog(
        `Menambahkan log pemeliharaan untuk aset "${currentAsset.name}": ${log.description}.`,
        currentAsset.storeId,
      );
    }
    setIsMaintenanceFormModalOpen(false);
    setCurrentAsset(null);
  };

  const handleDelete = (asset: Asset) => {
    setAssetToDelete(asset);
  };

  const confirmDelete = async () => {
    if (assetToDelete) {
      const toastId = addToast('Menghapus aset...', 'info');
      setIsSavingAsset(true);
      try {
        await deleteAsset(assetToDelete.id);
        addAuditLog(`Menghapus aset: "${assetToDelete.name}".`, assetToDelete.storeId);
        updateToast(toastId, 'Aset berhasil dihapus!', 'success');
      } catch (error: any) {
        updateToast(toastId, `Gagal menghapus: ${error.message}`, 'error');
      } finally {
        setAssetToDelete(null);
        setIsSavingAsset(false);
      }
    }
  };

  const getStatusBadge = (status: Asset['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'Under Maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'Decommissioned':
        return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const assetsWithStore = useMemo(
    () =>
      assets.map((asset) => ({
        ...asset,
        storeName: stores.find((s) => s.id === asset.storeId)?.name || 'N/A',
      })),
    [assets, stores],
  );

  type AssetWithStore = (typeof assetsWithStore)[0];

  const dueMaintenanceAssetIds = useMemo(() => {
    if (maintenanceFilter !== 'due') return new Set();
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    return new Set(
      scheduledMaintenances.filter((sm) => new Date(sm.nextDueDate) <= now).map((sm) => sm.assetId),
    );
  }, [scheduledMaintenances, maintenanceFilter]);

  const filteredAssets = useMemo(
    () =>
      assetsWithStore.filter((asset) => {
        if (maintenanceFilter === 'due' && !dueMaintenanceAssetIds.has(asset.id)) {
          return false;
        }
        return (
          asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (asset.serialNumber &&
            asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }),
    [assetsWithStore, searchTerm, maintenanceFilter, dueMaintenanceAssetIds],
  );

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

  const canAddNewAsset = !(currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

  const handleFilterChange = (filter: 'all' | 'due') => {
    setMaintenanceFilter(filter);
    if (filter === 'due') {
      searchParams.set('filter', 'maintenance_due');
    } else {
      searchParams.delete('filter');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      {isSavingAsset && (
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
          Manajemen Aset & Pemeliharaan
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <button
            onClick={() => handleOpenAssetForm()}
            className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={!canAddNewAsset}
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Tambah Aset
          </button>
        </div>
      </div>
      {!canAddNewAsset && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">
          Pilih cabang spesifik di header untuk menambah aset baru.
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${maintenanceFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        >
          Semua Aset
        </button>
        <button
          onClick={() => handleFilterChange('due')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${maintenanceFilter === 'due' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        >
          Perawatan Jatuh Tempo
        </button>
      </div>

      {/* Desktop Table View */}
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Nama Aset {getSortIcon('name')}
                </button>
              </th>
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
                  onClick={() => requestSort('purchaseDate')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Tanggal Beli {getSortIcon('purchaseDate')}
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => requestSort('purchaseCost')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 ml-auto"
                >
                  Biaya Beli {getSortIcon('purchaseCost')}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('status')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Status {getSortIcon('status')}
                </button>
              </th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedAssets.length > 0 ? (
              sortedAssets.map((asset) => (
                <tr key={asset.id} className="border-b dark:border-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {asset.name}
                  </td>
                  {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                    <td className="px-4 py-3">{asset.storeName}</td>
                  )}
                  <td className="px-4 py-3">
                    {new Date(asset.purchaseDate).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    Rp {asset.purchaseCost.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(asset.status)}`}
                    >
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenAssetForm(asset)}
                      title="Edit Aset"
                      className="p-2 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset)}
                      title="Hapus Aset"
                      className="p-2 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenMaintenanceForm(asset)}
                      title="Tambah Log Pemeliharaan"
                      className="p-2 rounded-md text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <PlusCircleIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenSchedule(asset)}
                      title="Jadwal Perawatan"
                      className="p-2 rounded-md text-purple-600 hover:text-purple-900 dark:text-purple-500 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <CalendarIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleOpenHistory(asset)}
                      title="Lihat Riwayat Pemeliharaan"
                      className="p-2 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <HistoryIcon className="w-5 h-5" />
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
                    icon={<WrenchIcon className="mx-auto w-12 h-12 text-slate-400" />}
                    title={
                      searchTerm || maintenanceFilter !== 'all'
                        ? 'Aset Tidak Ditemukan'
                        : 'Belum Ada Aset'
                    }
                    description={
                      searchTerm || maintenanceFilter !== 'all'
                        ? 'Coba kata kunci atau filter lain.'
                        : 'Mulai dengan menambahkan aset pertama Anda.'
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
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(asset.status)}`}
                  >
                    {asset.status}
                  </span>
                </div>
                <div className="flex items-center space-x-0">
                  <button
                    onClick={() => handleOpenAssetForm(asset)}
                    title="Edit Aset"
                    className="p-2 rounded-md text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(asset)}
                    title="Hapus Aset"
                    className="p-2 rounded-md text-red-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                  >
                    <Trash2Icon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{asset.storeName}</p>
              )}
              <div className="mt-3 space-y-1 text-sm border-t dark:border-slate-600 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Tgl Beli:</span>
                  <span className="font-medium">
                    {new Date(asset.purchaseDate).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Biaya:</span>
                  <span className="font-medium">
                    Rp {asset.purchaseCost.toLocaleString('id-ID')}
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
                  className="flex items-center gap-1 py-1 px-3 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
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
            title={
              searchTerm || maintenanceFilter !== 'all' ? 'Aset Tidak Ditemukan' : 'Belum Ada Aset'
            }
            description={
              searchTerm || maintenanceFilter !== 'all'
                ? 'Coba kata kunci atau filter lain.'
                : 'Mulai dengan menambahkan aset pertama Anda.'
            }
          />
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
          asset={currentAsset}
          onClose={() => setIsHistoryModalOpen(false)}
        />
      )}
      {isScheduleModalOpen && currentAsset && (
        <ScheduledMaintenanceModal
          asset={currentAsset}
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
          message={`Anda yakin ingin menghapus aset "${assetToDelete.name}"?`}
        />
      )}
    </div>
  );
};

export default AssetsPage;

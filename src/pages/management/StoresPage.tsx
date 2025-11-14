import React, { useState } from 'react';
import { Store } from '@/types';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  PowerIcon,
  TruckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useStores } from '../../contexts/StoreContext';
import { useAppContext } from '../../contexts/AppContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useAssets } from '../../contexts/AssetContext';
import { useExpenses } from '../../contexts/ExpenseContext';
import StoreFormModal from '../../components/StoreFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';
import { useSortableData } from '../../hooks/useSortableData';

function StoresPage() {
  const { stores, addStore, updateStore, deleteStore } = useStores();
  const { selectedStoreId } = useAppContext();
  const { customers } = useCustomers();
  const { transactions } = useTransactions();
  const { inventory } = useInventory();
  const { assets } = useAssets();
  const { expenses } = useExpenses();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [isSavingStore, setIsSavingStore] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [storeToToggle, setStoreToToggle] = useState<Store | null>(null);
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

  const { items: sortedStores, requestSort, sortConfig } = useSortableData<Store>(stores);

  const getSortIcon = (key: keyof Store) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const handleOpenFormModal = (store: Store | null = null) => {
    setCurrentStore(store);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentStore(null);
  };

  const handleSaveStore = async (storeData: Omit<Store, 'id' | 'isActive'>) => {
    const toastId = addToast('Menyimpan cabang...', 'info');
    setIsSavingStore(true);
    try {
      if (currentStore) {
        await updateStore(currentStore.id, storeData);
        addAuditLog(`Memperbarui data cabang: "${storeData.name}".`);
        updateToast(toastId, 'Data cabang berhasil diperbarui.', 'success');
      } else {
        await addStore({ ...storeData, isActive: true });
        addAuditLog(`Menambahkan cabang baru: "${storeData.name}".`);
        updateToast(toastId, 'Cabang baru berhasil ditambahkan.', 'success');
      }
      handleCloseFormModal();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal menyimpan: ${errMsg}`, 'error');
    } finally {
      setIsSavingStore(false);
    }
  };

  const handleToggleStatus = (store: Store) => {
    setStoreToToggle(store);
  };

  const handleDelete = (store: Store) => {
    if (selectedStoreId !== 'all') {
      addToast('Pilih "Semua Cabang" pada filter di header sebelum menghapus.', 'warning');
      return;
    }

    const isStoreInUse =
      customers.some((c) => c.storeId === store.id) ||
      transactions.some((t) => t.storeId === store.id) ||
      inventory.some((i) => i.storeId === store.id) ||
      assets.some((a) => a.storeId === store.id) ||
      expenses.some((e) => e.storeId === store.id);

    if (isStoreInUse) {
      addToast(`Cabang "${store.name}" tidak dapat dihapus karena masih digunakan.`, 'error');
      return;
    }

    setStoreToDelete(store);
  };

  const confirmToggleStatus = async () => {
    if (storeToToggle) {
      const toastId = addToast(
        `${storeToToggle.isActive ? 'Menonaktifkan' : 'Mengaktifkan'} cabang...`,
        'info',
      );
      setIsSavingStore(true);
      try {
        const newStatus = !storeToToggle.isActive;
        await updateStore(storeToToggle.id, { isActive: newStatus });
        addAuditLog(
          `Mengubah status cabang "${storeToToggle.name}" menjadi ${newStatus ? 'Aktif' : 'Tidak Aktif'}.`,
        );
        updateToast(
          toastId,
          `Status cabang ${storeToToggle.name} diubah menjadi ${newStatus ? 'Aktif' : 'Tidak Aktif'}.`,
          'success',
        );
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        updateToast(toastId, `Gagal mengubah status: ${errMsg}`, 'error');
      } finally {
        setStoreToToggle(null);
        setIsSavingStore(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (storeToDelete) {
      const toastId = addToast('Menghapus cabang...', 'info');
      setIsSavingStore(true);
      try {
        await deleteStore(storeToDelete.id);
        addAuditLog(`Menghapus cabang: "${storeToDelete.name}".`);
        updateToast(toastId, 'Cabang berhasil dihapus.', 'success');
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        updateToast(toastId, `Gagal menghapus: ${errMsg}`, 'error');
      } finally {
        setStoreToDelete(null);
        setIsSavingStore(false);
      }
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      {isSavingStore && (
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Cabang</h1>
        <button
          onClick={() => handleOpenFormModal()}
          className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3"
        >
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Tambah Cabang
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
                  Nama Cabang {getSortIcon('name')}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('address')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Alamat {getSortIcon('address')}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('isActive')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Status {getSortIcon('isActive')}
                </button>
              </th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedStores.length > 0 ? (
              (sortedStores || []).map((store) => (
                <tr key={store.id} className="border-b dark:border-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {store.name}
                  </td>
                  <td className="px-4 py-3">{store.address}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-sm font-medium rounded-full ${store.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}
                    >
                      {store.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenFormModal(store)}
                      title="Edit"
                      className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(store)}
                      title={store.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      className={`p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${store.isActive ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-500 dark:hover:text-yellow-400' : 'text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400'}`}
                    >
                      <PowerIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(store)}
                      title="Hapus"
                      className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    icon={<TruckIcon className="mx-auto w-12 h-12 text-slate-400" />}
                    title="Belum Ada Cabang"
                    description="Mulai dengan menambahkan cabang pertama Anda."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedStores.length > 0 ? (
          (sortedStores || []).map((store) => (
            <div
              key={store.id}
              className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                    {store.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{store.address}</p>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${store.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}
                >
                  {store.isActive ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2 border-t dark:border-slate-600 pt-2">
                <button
                  onClick={() => handleOpenFormModal(store)}
                  title="Edit"
                  className="p-2 rounded-md text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <EditIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleToggleStatus(store)}
                  title={store.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  className={`p-2 rounded-md ${store.isActive ? 'text-yellow-600' : 'text-green-600'} hover:bg-slate-200 dark:hover:bg-slate-600`}
                >
                  <PowerIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(store)}
                  title="Hapus"
                  className="p-2 rounded-md text-red-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <Trash2Icon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={<TruckIcon className="mx-auto w-12 h-12 text-slate-400" />}
            title="Belum Ada Cabang"
            description="Mulai dengan menambahkan cabang pertama Anda."
          />
        )}
      </div>

      {isFormModalOpen && (
        <StoreFormModal
          store={currentStore}
          onClose={handleCloseFormModal}
          onSave={handleSaveStore}
        />
      )}

      {storeToToggle && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setStoreToToggle(null)}
          onConfirm={confirmToggleStatus}
          title={`${storeToToggle.isActive ? 'Nonaktifkan' : 'Aktifkan'} Cabang`}
          message={`Apakah Anda yakin ingin ${storeToToggle.isActive ? 'menonaktifkan' : 'mengaktifkan'} cabang "${storeToToggle.name}"?`}
          confirmText={storeToToggle.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          confirmColor={
            storeToToggle.isActive
              ? 'bg-yellow-500 hover:bg-yellow-600'
              : 'bg-green-500 hover:bg-green-600'
          }
        />
      )}

      {storeToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setStoreToDelete(null)}
          onConfirm={confirmDelete}
          title="Hapus Cabang"
          message={`Apakah Anda yakin ingin menghapus cabang "${storeToDelete.name}" secara permanen? Tindakan ini tidak dapat diurungkan.`}
        />
      )}
    </div>
  );
}

export default StoresPage;

import React, { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  PackageIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { fetchInventory, useInventoryMutations } from '../../contexts/InventoryContext';
import { useAppContext } from '../../contexts/AppContext';
import InventoryFormModal from '../../components/InventoryFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';
import { useSortableData } from '../../hooks/useSortableData';
import { useDebounce } from '../../hooks/useDebounce';

import Pagination from '../../components/Pagination';
import { InventoryItem, UserRole } from '@/types';

const InventoryPage: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: result = { data: [], count: 0 },
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'inventory',
      { page, pageSize, searchTerm: debouncedSearchTerm, storeId: selectedStoreId },
    ],
    queryFn: () =>
      fetchInventory({ page, pageSize, searchTerm: debouncedSearchTerm, storeId: selectedStoreId }),
    keepPreviousData: true,
  });
  const inventory = result.data;
  const totalCount = result.count;
  const totalPages = Math.ceil(totalCount / pageSize);

  const { addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventoryMutations();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const addInventoryMutation = useMutation({
    mutationFn: async (data: any) => addInventoryItem(data),
  });
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => updateInventoryItem(id, data),
  });
  const deleteInventoryMutation = useMutation({
    mutationFn: async (id: string) => deleteInventoryItem(id),
  });
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'low_stock'>(() =>
    searchParams.get('filter') === 'low_stock' ? 'low_stock' : 'all',
  );

  useEffect(() => {
    if (location.state?.openModal) {
      handleOpenFormModal();
      navigate(location.pathname, { replace: true, state: {} });
    }
    const filterParam = searchParams.get('filter');
    setFilter(filterParam === 'low_stock' ? 'low_stock' : 'all');
  }, [location.state, location.pathname, navigate, searchParams]);

  const handleOpenFormModal = (item: InventoryItem | null = null) => {
    setCurrentItem(item);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentItem(null);
  };

  const handleSaveItem = async (item: Omit<InventoryItem, 'id' | 'storeId'>) => {
    const storeId =
      currentItem?.storeId ||
      (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk menambah atau mengedit item.', 'warning');
      return;
    }
    const toastId = addToast('Menyimpan item inventaris...', 'info');
    try {
      if (currentItem && currentItem.id) {
        await updateInventoryMutation.mutateAsync({
          id: currentItem.id,
          data: { ...item, storeId },
        });
        addAuditLog(`Memperbarui item inventaris: "${item.name}".`, storeId);
        updateToast(toastId, 'Data inventaris berhasil diperbarui!', 'success');
      } else {
        await addInventoryMutation.mutateAsync({ ...item, storeId });
        addAuditLog(`Menambahkan item inventaris baru: "${item.name}".`, storeId);
        updateToast(toastId, 'Item inventaris berhasil ditambahkan!', 'success');
      }
      handleCloseFormModal();
    } catch (error: any) {
      updateToast(toastId, `Gagal menyimpan: ${error.message}`, 'error');
    }
  };

  const handleDelete = (item: InventoryItem) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      const toastId = addToast('Menghapus item inventaris...', 'info');
      try {
        await deleteInventoryMutation.mutateAsync(itemToDelete.id);
        addAuditLog(`Menghapus item inventaris: "${itemToDelete.name}".`, itemToDelete.storeId);
        updateToast(toastId, 'Item inventaris berhasil dihapus!', 'success');
      } catch (error: any) {
        updateToast(toastId, `Gagal menghapus: ${error.message}`, 'error');
      } finally {
        setItemToDelete(null);
      }
    }
  };

  const inventoryWithStore = useMemo(
    () =>
      inventory.map((item) => ({
        ...item,
        storeName: stores.find((s) => s.id === item.storeId)?.name || 'N/A',
      })),
    [inventory, stores],
  );

  type InventoryWithStore = (typeof inventoryWithStore)[0];

  const filteredInventory = useMemo(
    () =>
      inventoryWithStore.filter((item) => {
        if (filter === 'low_stock') {
          return item.stock <= item.lowStockThreshold;
        }
        return true;
      }),
    [inventoryWithStore, filter],
  );

  const {
    items: sortedInventory,
    requestSort,
    sortConfig,
  } = useSortableData<InventoryWithStore>(filteredInventory);
  // Pagination handled by server, so just use sortedInventory
  const paginatedInventory = sortedInventory;

  const getSortIcon = (key: keyof InventoryWithStore) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const canAddNewItem = !(currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

  const handleFilterChange = (newFilter: 'all' | 'low_stock') => {
    setFilter(newFilter);
    if (newFilter === 'low_stock') {
      searchParams.set('filter', 'low_stock');
    } else {
      searchParams.delete('filter');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="relative bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
      {(addInventoryMutation.isPending ||
        updateInventoryMutation.isPending ||
        deleteInventoryMutation.isPending) && (
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
          Manajemen Inventaris
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <button
            onClick={() => handleOpenFormModal()}
            className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={!canAddNewItem}
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Tambah Item
          </button>
        </div>
      </div>
      {!canAddNewItem && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">
          Pilih cabang spesifik di header untuk menambah item baru.
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-4">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        >
          Semua Item
        </button>
        <button
          onClick={() => handleFilterChange('low_stock')}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${filter === 'low_stock' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
        >
          Stok Rendah
        </button>
      </div>

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Nama Item {getSortIcon('name')}
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
                  onClick={() => requestSort('stock')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Stok {getSortIcon('stock')}
                </button>
              </th>
              <th className="px-4 py-3">Ambang Batas</th>
              <th className="px-4 py-3">Satuan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedInventory.length > 0 ? (
              sortedInventory.map((item) => {
                let stockStatus = '';
                let statusClass = '';
                if (item.stock === 0) {
                  stockStatus = 'Stok Habis';
                  statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
                } else if (item.stock > 0 && item.stock <= item.lowStockThreshold) {
                  stockStatus = 'Stok Rendah';
                  statusClass =
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
                } else {
                  stockStatus = 'Aman';
                  statusClass =
                    'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
                }
                return (
                  <tr key={item.id} className="border-b dark:border-slate-700">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                      <td className="px-4 py-3">{item.storeName}</td>
                    )}
                    <td
                      className={`px-4 py-3 ${item.stock === 0 ? 'text-red-500 font-bold' : item.stock <= item.lowStockThreshold ? 'text-yellow-600 font-bold' : 'text-slate-900 dark:text-white'}`}
                    >
                      {item.stock}
                    </td>
                    <td className="px-4 py-3">{item.lowStockThreshold}</td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-sm font-medium rounded-full ${statusClass}`}>
                        {stockStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenFormModal(item)}
                        className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <Trash2Icon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 7 : 6
                  }
                >
                  <EmptyState
                    icon={<PackageIcon className="mx-auto w-12 h-12 text-slate-400" />}
                    title={
                      debouncedSearchTerm || filter !== 'all'
                        ? 'Item Tidak Ditemukan'
                        : 'Belum Ada Item Inventaris'
                    }
                    description={
                      debouncedSearchTerm || filter !== 'all'
                        ? 'Coba kata kunci atau filter lain.'
                        : 'Mulai dengan menambahkan item pertama Anda.'
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {sortedInventory.length > 0 ? (
          sortedInventory.map((item) => {
            let stockStatus = '';
            let statusClass = '';
            if (item.stock === 0) {
              stockStatus = 'Stok Habis';
              statusClass = 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            } else if (item.stock > 0 && item.stock <= item.lowStockThreshold) {
              stockStatus = 'Stok Rendah';
              statusClass =
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            } else {
              stockStatus = 'Aman';
              statusClass = 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            }
            return (
              <div
                key={item.id}
                className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                      {item.name}
                    </p>
                    {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {item.storeName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenFormModal(item)}
                      className="p-2 rounded-md text-blue-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-md text-red-600 hover:bg-slate-200 dark:hover:bg-slate-600"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-4 text-sm border-t dark:border-slate-600 pt-2">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Stok Saat Ini</p>
                    <p
                      className={`font-semibold text-lg ${item.stock === 0 ? 'text-red-500' : item.stock <= item.lowStockThreshold ? 'text-yellow-600' : 'text-slate-800 dark:text-slate-200'}`}
                    >
                      {item.stock} {item.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Status Stok</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusClass}`}>
                      {stockStatus}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            icon={<PackageIcon className="mx-auto w-12 h-12 text-slate-400" />}
            title={
              debouncedSearchTerm || filter !== 'all'
                ? 'Item Tidak Ditemukan'
                : 'Belum Ada Item Inventaris'
            }
            description={
              debouncedSearchTerm || filter !== 'all'
                ? 'Coba kata kunci atau filter lain.'
                : 'Mulai dengan menambahkan item pertama Anda.'
            }
          />
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {isFormModalOpen && (
        <InventoryFormModal
          item={currentItem}
          onClose={handleCloseFormModal}
          onSave={handleSaveItem}
        />
      )}

      {itemToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setItemToDelete(null)}
          onConfirm={confirmDelete}
          title="Hapus Item Inventaris"
          message={`Apakah Anda yakin ingin menghapus item "${itemToDelete.name}"?`}
        />
      )}
    </div>
  );
};

export default InventoryPage;

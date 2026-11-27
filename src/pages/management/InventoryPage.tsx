import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  EditIcon,
  Trash2Icon,
  PackageIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DownloadIcon,
  UploadIcon,
  SettingsIcon,
  CheckCircleIcon,
} from '../../components/icons';
import {
  exportInventoryToExcel,
  importInventoryFromExcel,
  downloadInventoryTemplate,
} from '../../utils/excelUtils';
import { supabase } from '../../utils/supabaseClient';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
  fetchInventory,
  useInventoryMutations,
  InventorySortKey,
} from '../../contexts/InventoryContext';
import useAppContext from '../../contexts/useAppContext';
import InventoryFormModal from '../../components/InventoryFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import { useServerSort } from '../../hooks/useServerSort';
import { useDebounce } from '../../hooks/useDebounce';

import Pagination from '../../components/Pagination';
import { InventoryItem, UserRole } from '@/types';
import RecipeConfigModal from '../../components/RecipeConfigModal';
import StockOpnameModal from '../../components/StockOpnameModal';

const InventoryPage: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Urutan dikerjakan server agar berlaku untuk semua halaman; ganti urutan → kembali ke halaman 1
  const { sortConfig, requestSort } = useServerSort<InventorySortKey>(
    { key: 'name', direction: 'ascending' },
    () => setPage(1),
  );
  const sortBy = sortConfig.key;
  const sortAscending = sortConfig.direction === 'ascending';

  const { data: result = { data: [], count: 0 } } = useQuery({
    queryKey: [
      'inventory',
      {
        page,
        pageSize,
        searchTerm: debouncedSearchTerm,
        storeId: selectedStoreId,
        sortBy,
        sortAscending,
      },
    ],
    queryFn: () =>
      fetchInventory({
        page,
        pageSize,
        searchTerm: debouncedSearchTerm,
        storeId: selectedStoreId,
        sortBy,
        sortAscending,
      }),
    placeholderData: (previousData) => previousData,
  });
  const inventory = result.data;
  const totalCount = result.count;
  const totalPages = Math.ceil(totalCount / pageSize);

  const { addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventoryMutations();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  type InventoryInput = Omit<InventoryItem, 'id'>;
  const addInventoryMutation = useMutation({
    mutationFn: async (data: InventoryInput) => addInventoryItem(data),
  });
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      updateInventoryItem(id, data),
  });
  const deleteInventoryMutation = useMutation({
    mutationFn: async (id: string) => deleteInventoryItem(id),
  });
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
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
      (currentUser?.role === UserRole.SuperAdmin ? selectedStoreId : currentUser?.storeId);
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
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        updateToast(toastId, `Gagal menyimpan: ${(error as { message: string }).message}`, 'error');
      } else {
        updateToast(toastId, 'Gagal menyimpan: Unknown error', 'error');
      }
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
        addAuditLog(`Menghapus item inventaris: "${itemToDelete.name}".`, itemToDelete.storeId!);
        updateToast(toastId, 'Item inventaris berhasil dihapus!', 'success');
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

  const filteredInventory = useMemo(
    () =>
      inventoryWithStore.filter((item) => {
        if (filter === 'low_stock') {
          // FIXED: Exclude items with threshold=0 (monitoring disabled)
          return item.lowStockThreshold > 0 && item.stock <= item.lowStockThreshold;
        }
        return true;
      }),
    [inventoryWithStore, filter],
  );

  // Data sudah diurutkan oleh server (lihat useServerSort di atas)
  const sortedInventory = filteredInventory;

  const getSortIcon = (key: InventorySortKey) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const canAddNewItem = !(currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all');

  const handleFilterChange = (newFilter: 'all' | 'low_stock') => {
    setFilter(newFilter);
    if (newFilter === 'low_stock') {
      searchParams.set('filter', 'low_stock');
    } else {
      searchParams.delete('filter');
    }
    setSearchParams(searchParams);
  };

  // Excel Export
  const handleExportToExcel = async () => {
    const toastId = addToast('Mengekspor inventaris...', 'info');
    try {
      // Fetch SEMUA item inventaris dengan filter yang sama, tanpa pagination
      updateToast(toastId, 'Mengambil semua data inventaris...', 'info');

      let query = supabase.from('inventory_items').select('*', { count: 'exact' });

      // Terapkan filter store yang sama
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      // Terapkan search term jika ada
      if (debouncedSearchTerm) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`);
      }

      const { data: allInventory, error } = await query;

      if (error) throw error;
      if (!allInventory || allInventory.length === 0) {
        updateToast(toastId, 'Tidak ada item inventaris untuk diekspor.', 'warning');
        return;
      }

      updateToast(toastId, `Mengekspor ${allInventory.length} item...`, 'info');

      // Convert null to undefined untuk kompatibilitas
      const inventoryToExport = allInventory.map((item) => ({
        ...item,
        storeId: item.storeId ?? undefined,
      })) as unknown as InventoryItem[];

      await exportInventoryToExcel(inventoryToExport);
      updateToast(
        toastId,
        `Berhasil mengekspor ${allInventory.length} item inventaris ke Excel.`,
        'success',
      );
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
      const importedItems = await importInventoryFromExcel(file);

      let successCount = 0;
      let errorCount = 0;
      let skipCount = 0;

      for (const item of importedItems) {
        try {
          if (item.id) {
            // Validate UUID format before UPDATE
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(item.id)) {
              console.warn('Invalid UUID skipped:', item.id);
              skipCount++;
              continue;
            }

            // Update existing item
            const updatePayload: Partial<InventoryItem> = {
              name: item.name!,
              stock: item.stock!,
              unit: item.unit!,
              lowStockThreshold: item.lowStockThreshold!,
            };

            if (selectedStoreId !== 'all') {
              updatePayload.storeId = selectedStoreId;
            }

            await updateInventoryMutation.mutateAsync({
              id: item.id,
              data: updatePayload,
            });
            successCount++;
          } else {
            // Check for duplicate before adding new item
            const existingItem = inventory?.find(
              (i) => i.name.toLowerCase() === item.name!.toLowerCase(),
            );
            if (existingItem) {
              console.warn('Duplicate item skipped:', item.name);
              skipCount++;
              continue;
            }

            // Ensure storeId is set for INSERT (RLS policy requirement)
            const storeId = selectedStoreId === 'all' ? currentUser?.storeId : selectedStoreId;

            if (!storeId) {
              console.error('storeId is required for new items');
              errorCount++;
              continue;
            }

            // Add new item
            await addInventoryMutation.mutateAsync({
              name: item.name!,
              stock: item.stock!,
              unit: item.unit!,
              lowStockThreshold: item.lowStockThreshold!,
              storeId: storeId!,
            });
            successCount++;
          }
        } catch (error) {
          console.error('Error importing item:', item, error);
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
        updateToast(toastId, `Berhasil import ${successCount} item inventaris`, 'success');
      }

      addAuditLog(
        `Import ${successCount} item inventaris dari Excel`,
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
      await downloadInventoryTemplate();
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
          {/* Recipe Config & Stock Opname Buttons */}
          <button
            onClick={() => setIsRecipeModalOpen(true)}
            disabled={!canAddNewItem}
            className="btn btn-secondary btn-sm"
            title="Konfigurasi Resep Bahan"
          >
            <SettingsIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Resep</span>
          </button>

          <button
            onClick={() => setIsOpnameModalOpen(true)}
            disabled={inventory.length === 0}
            className="btn btn-secondary btn-sm"
            title="Stock Opname"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Opname</span>
          </button>

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
            id="inventory-import-file"
            name="inventory-import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFromExcel}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!canAddNewItem}
            className="btn btn-secondary btn-sm"
            title="Import dari Excel"
          >
            <UploadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Import</span>
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={inventory.length === 0}
            className="btn btn-primary btn-sm"
            title="Export ke Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Export</span>
          </button>

          <button
            onClick={() => handleOpenFormModal()}
            disabled={!canAddNewItem}
            className="btn btn-primary btn-sm"
          >
            Tambah Item
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            id="inventory-search"
            name="inventory-search"
            placeholder="Cari item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            autoComplete="off"
          />
        </div>
        <select
          id="inventory-filter"
          name="inventory-filter"
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as typeof filter)}
          className="w-full sm:w-48 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="all">Semua Item</option>
          <option value="low_stock">Stok Rendah</option>
        </select>
      </div>

      {!canAddNewItem && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Pilih cabang spesifik di header untuk menambah item baru.
        </p>
      )}

      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 uppercase">
            <tr>
              <th className="px-4 py-2.5">No</th>
              <th className="px-4 py-2.5">
                <button
                  onClick={() => requestSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Nama Item {getSortIcon('name')}
                </button>
              </th>
              {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
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
                  onClick={() => requestSort('stock')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Stok {getSortIcon('stock')}
                </button>
              </th>
              <th className="px-4 py-2.5">Ambang Batas</th>
              <th className="px-4 py-2.5">Satuan</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedInventory.length > 0 ? (
              sortedInventory.map((item, index) => {
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
                  <tr
                    key={item.id}
                    className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                      {(page - 1) * pageSize + index + 1}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                      {item.name}
                    </td>
                    {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                      <td className="px-4 py-2.5">{item.storeName}</td>
                    )}
                    <td
                      className={`px-6 py-4 ${item.stock === 0 ? 'text-red-500 font-bold' : item.stock <= item.lowStockThreshold ? 'text-yellow-600 font-bold' : 'text-slate-900 dark:text-white'}`}
                    >
                      {item.stock}
                    </td>
                    <td className="px-4 py-2.5">{item.lowStockThreshold}</td>
                    <td className="px-4 py-2.5">{item.unit}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-1 text-sm font-medium rounded-full ${statusClass}`}>
                        {stockStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center space-x-2">
                        <button
                          aria-label={`Edit ${item.name}`}
                          onClick={() => handleOpenFormModal(item)}
                          className="btn btn-ghost btn-icon"
                        >
                          <EditIcon className="w-5 h-5" />
                        </button>
                        <button
                          aria-label={`Hapus ${item.name}`}
                          onClick={() => handleDelete(item)}
                          className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
                        >
                          <Trash2Icon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={
                    currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 7 : 6
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
                    {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {item.storeName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      aria-label={`Edit ${item.name}`}
                      onClick={() => handleOpenFormModal(item)}
                      className="btn btn-ghost btn-icon"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      aria-label={`Hapus ${item.name}`}
                      onClick={() => handleDelete(item)}
                      className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
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

      {isRecipeModalOpen && selectedStoreId && selectedStoreId !== 'all' && (
        <RecipeConfigModal
          isOpen={isRecipeModalOpen}
          onClose={() => setIsRecipeModalOpen(false)}
          inventoryItems={inventory}
          storeId={selectedStoreId}
        />
      )}

      {isOpnameModalOpen && selectedStoreId && selectedStoreId !== 'all' && (
        <StockOpnameModal
          isOpen={isOpnameModalOpen}
          onClose={() => setIsOpnameModalOpen(false)}
          inventoryItems={inventory}
          storeId={selectedStoreId}
        />
      )}
    </div>
  );
};

export default InventoryPage;

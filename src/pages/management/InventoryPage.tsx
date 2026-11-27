import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  EditIcon,
  Trash2Icon,
  PackageIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DownloadIcon,
  UploadIcon,
  CheckCircleIcon,
  HistoryIcon,
  PlusIcon,
  BoltIcon,
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
  fetchInventorySummary,
  useInventoryMutations,
  InventorySortKey,
} from '../../contexts/InventoryContext';
import {
  adjustInventoryStock,
  useInventorySettings,
  useRecipes,
} from '../../contexts/InventoryRecipeContext';
import useAppContext from '../../contexts/useAppContext';
import InventoryFormModal from '../../components/InventoryFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import { useServerSort } from '../../hooks/useServerSort';
import { useDebounce } from '../../hooks/useDebounce';
import Pagination from '../../components/Pagination';
import { InventoryItem, StockAdjustMode, UserRole } from '@/types';
import RecipeConfigModal from '../../components/RecipeConfigModal';
import StockOpnameModal from '../../components/StockOpnameModal';
import StockAdjustModal from '../../components/StockAdjustModal';
import StockHistoryModal from '../../components/StockHistoryModal';
import { formatQty, getStockLevel, STOCK_LEVEL_META } from '../../utils/inventoryFormat';
import SearchInput from '../../components/SearchInput';

type StockFilter = 'all' | 'low_stock' | 'out_of_stock';

const parseFilter = (value: string | null): StockFilter =>
  value === 'low_stock' || value === 'out_of_stock' ? value : 'all';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const InventoryPage: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseFilter(searchParams.get('filter'));

  // Urutan dikerjakan server agar berlaku untuk semua halaman; ganti urutan → kembali ke halaman 1
  const { sortConfig, requestSort } = useServerSort<InventorySortKey>(
    { key: 'name', direction: 'ascending' },
    () => setPage(1),
  );
  const sortBy = sortConfig.key;
  const sortAscending = sortConfig.direction === 'ascending';

  // Pencarian/filter/cabang baru → kembali ke halaman 1 (hindari halaman kosong).
  useEffect(() => {
    setPage(1);
  }, [debouncedSearchTerm, filter, selectedStoreId]);

  const isAllStores = selectedStoreId === 'all';
  const showStoreColumn = currentUser?.role === UserRole.SuperAdmin && isAllStores;
  const canAddNewItem = !(currentUser?.role === UserRole.SuperAdmin && isAllStores);
  const activeStoreId = !isAllStores ? selectedStoreId : undefined;

  const { data: result = { data: [], count: 0 }, isFetching } = useQuery({
    queryKey: [
      'inventory',
      {
        page,
        pageSize,
        searchTerm: debouncedSearchTerm,
        storeId: selectedStoreId,
        sortBy,
        sortAscending,
        filter,
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
        lowStockOnly: filter === 'low_stock',
        outOfStockOnly: filter === 'out_of_stock',
      }),
    placeholderData: (previousData) => previousData,
  });
  const inventory = result.data;
  const totalCount = result.count;
  const totalPages = Math.ceil(totalCount / pageSize);

  const { data: summary } = useQuery({
    queryKey: ['inventory_summary', selectedStoreId],
    queryFn: () => fetchInventorySummary(selectedStoreId),
  });

  const { data: recipes = [] } = useRecipes(activeStoreId);
  const { data: inventorySettings } = useInventorySettings(activeStoreId);
  const autoItemIds = useMemo(
    () => new Set(recipes.filter((r) => r.isActive).map((r) => r.inventoryItemId)),
    [recipes],
  );
  const activeRuleCount = recipes.filter((r) => r.isActive).length;

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
  const [adjustTarget, setAdjustTarget] = useState<{
    item: InventoryItem;
    mode: StockAdjustMode;
  } | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (location.state?.openModal) {
      setCurrentItem(null);
      setIsFormModalOpen(true);
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  const handleOpenFormModal = (item: InventoryItem | null = null) => {
    setCurrentItem(item);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentItem(null);
  };

  const errorMessage = (error: unknown) =>
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : 'Unknown error';

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
        // Stok tidak ikut diubah di sini — pakai Sesuaikan Stok agar tercatat di riwayat.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { stock: _stock, ...rest } = item;
        await updateInventoryMutation.mutateAsync({
          id: currentItem.id,
          data: { ...rest, storeId },
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
      updateToast(toastId, `Gagal menyimpan: ${errorMessage(error)}`, 'error');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const toastId = addToast('Menghapus item inventaris...', 'info');
    try {
      await deleteInventoryMutation.mutateAsync(itemToDelete.id);
      addAuditLog(`Menghapus item inventaris: "${itemToDelete.name}".`, itemToDelete.storeId!);
      updateToast(toastId, 'Item inventaris berhasil dihapus!', 'success');
    } catch (error: unknown) {
      updateToast(toastId, `Gagal menghapus: ${errorMessage(error)}`, 'error');
    } finally {
      setItemToDelete(null);
    }
  };

  const storeNameById = useMemo(() => new Map(stores.map((s) => [s.id, s.name])), [stores]);

  const getSortIcon = (key: InventorySortKey) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const handleFilterChange = (newFilter: StockFilter) => {
    const next = new URLSearchParams(searchParams);
    if (newFilter === 'all') next.delete('filter');
    else next.set('filter', newFilter);
    setSearchParams(next);
  };

  /** Semua item (tanpa paginasi) sesuai cabang & pencarian aktif. */
  const fetchAllInventory = async (opts: { search?: string; storeId?: string } = {}) => {
    let query = supabase.from('inventory_items').select('*').order('name');
    const storeId = opts.storeId ?? selectedStoreId;
    if (storeId && storeId !== 'all') query = query.eq('storeId', storeId);
    if (opts.search) query = query.ilike('name', `%${opts.search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((item) => ({
      ...item,
      stock: Number(item.stock) || 0,
      lowStockThreshold: Number(item.lowStockThreshold) || 0,
      storeId: item.storeId ?? undefined,
    })) as unknown as InventoryItem[];
  };

  const handleExportToExcel = async () => {
    const toastId = addToast('Mengambil semua data inventaris...', 'info');
    try {
      const allInventory = await fetchAllInventory({ search: debouncedSearchTerm });
      if (allInventory.length === 0) {
        updateToast(toastId, 'Tidak ada item inventaris untuk diekspor.', 'warning');
        return;
      }
      await exportInventoryToExcel(allInventory);
      updateToast(
        toastId,
        `Berhasil mengekspor ${allInventory.length} item inventaris ke Excel.`,
        'success',
      );
    } catch (error) {
      console.error('Export error:', error);
      updateToast(toastId, 'Gagal export data ke Excel', 'error');
    }
  };

  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const storeId = isAllStores ? currentUser?.storeId : selectedStoreId;
    if (!storeId) {
      addToast('Pilih cabang spesifik sebelum import.', 'warning');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    const toastId = addToast('Memproses import data...', 'info');

    try {
      const [importedItems, existing] = await Promise.all([
        importInventoryFromExcel(file),
        fetchAllInventory({ storeId }),
      ]);
      // Cek duplikat terhadap SELURUH item cabang, bukan hanya halaman yang tampil.
      const byId = new Map(existing.map((i) => [i.id, i]));
      const byName = new Map(existing.map((i) => [i.name.trim().toLowerCase(), i]));

      let successCount = 0;
      let errorCount = 0;
      let skipCount = 0;

      for (const item of importedItems) {
        try {
          const nameKey = (item.name ?? '').trim().toLowerCase();
          if (!nameKey) {
            skipCount++;
            continue;
          }
          const target =
            (item.id && UUID_RE.test(item.id) ? byId.get(item.id) : undefined) ??
            byName.get(nameKey);

          if (item.id && !target) {
            // ID dari cabang lain / tidak dikenal
            skipCount++;
            continue;
          }

          if (target) {
            await updateInventoryMutation.mutateAsync({
              id: target.id,
              data: {
                name: item.name!.trim(),
                unit: item.unit!,
                lowStockThreshold: item.lowStockThreshold!,
              },
            });
            if (item.stock !== undefined && Number(item.stock) !== target.stock) {
              await adjustInventoryStock({
                itemId: target.id,
                mode: 'set',
                value: Math.max(0, Number(item.stock) || 0),
                note: 'Import Excel',
              });
            }
          } else {
            const created = await addInventoryMutation.mutateAsync({
              name: item.name!.trim(),
              stock: Math.max(0, Number(item.stock) || 0),
              unit: item.unit!,
              lowStockThreshold: item.lowStockThreshold!,
              storeId,
            });
            if (created) byName.set(nameKey, created as unknown as InventoryItem);
          }
          successCount++;
        } catch (error) {
          console.error('Error importing item:', item, error);
          errorCount++;
        }
      }

      const parts = [`${successCount} berhasil`];
      if (errorCount) parts.push(`${errorCount} gagal`);
      if (skipCount) parts.push(`${skipCount} dilewati`);
      updateToast(
        toastId,
        `Import selesai: ${parts.join(', ')}`,
        errorCount || skipCount ? 'warning' : 'success',
      );
      addAuditLog(`Import ${successCount} item inventaris dari Excel`, storeId);
    } catch (error) {
      console.error('Import error:', error);
      updateToast(toastId, 'Gagal import data dari Excel', 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadInventoryTemplate();
      addToast('Template Excel berhasil didownload', 'success');
    } catch (error) {
      console.error('Download template error:', error);
      addToast('Gagal download template', 'error');
    }
  };

  const summaryCards: {
    key: StockFilter | 'rules';
    label: string;
    value: number | undefined;
    tone: string;
  }[] = [
    {
      key: 'all',
      label: 'Total Item',
      value: summary?.total,
      tone: 'text-slate-900 dark:text-white',
    },
    {
      key: 'low_stock',
      label: 'Perlu Restok',
      value: summary?.lowStock,
      tone: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      key: 'out_of_stock',
      label: 'Stok Habis',
      value: summary?.outOfStock,
      tone: 'text-red-600 dark:text-red-400',
    },
  ];

  const hasQuery = !!debouncedSearchTerm || filter !== 'all';
  const emptyState = (
    <EmptyState
      icon={<PackageIcon className="mx-auto w-12 h-12 text-slate-400" />}
      title={hasQuery ? 'Item Tidak Ditemukan' : 'Belum Ada Item Inventaris'}
      description={
        hasQuery
          ? 'Coba kata kunci atau filter lain.'
          : 'Mulai dengan menambahkan item pertama Anda.'
      }
    />
  );

  const renderActions = (item: InventoryItem) => (
    <>
      <button
        aria-label={`Sesuaikan stok ${item.name}`}
        title="Sesuaikan stok (restok / kurangi)"
        onClick={() => setAdjustTarget({ item, mode: 'tambah' })}
        className="btn btn-ghost btn-icon text-green-600 dark:text-green-400"
      >
        <PlusIcon className="w-5 h-5" />
      </button>
      <button
        aria-label={`Riwayat stok ${item.name}`}
        title="Riwayat stok"
        onClick={() => setHistoryItem(item)}
        className="btn btn-ghost btn-icon"
      >
        <HistoryIcon className="w-5 h-5" />
      </button>
      <button
        aria-label={`Edit ${item.name}`}
        title="Edit item"
        onClick={() => handleOpenFormModal(item)}
        className="btn btn-ghost btn-icon"
      >
        <EditIcon className="w-5 h-5" />
      </button>
      <button
        aria-label={`Hapus ${item.name}`}
        title="Hapus item"
        onClick={() => setItemToDelete(item)}
        className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
      >
        <Trash2Icon className="w-5 h-5" />
      </button>
    </>
  );

  const autoBadge = (item: InventoryItem) =>
    autoItemIds.has(item.id) && (
      <span
        className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 text-[11px] font-medium text-blue-700 dark:text-blue-300 align-middle"
        title="Stok dipotong otomatis setiap nota"
      >
        <BoltIcon className="w-3 h-3" /> Otomatis
      </span>
    );

  const columnCount = showStoreColumn ? 8 : 7;

  return (
    <div className="space-y-6">
      {/* Ringkasan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => handleFilterChange(card.key as StockFilter)}
            aria-pressed={filter === card.key}
            className={`card p-3 text-left transition ring-offset-2 ${
              filter === card.key ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className={`text-2xl font-bold ${card.tone}`}>{card.value ?? '–'}</p>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIsRecipeModalOpen(true)}
          disabled={!canAddNewItem}
          className="card p-3 text-left hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          title={canAddNewItem ? 'Atur potong stok otomatis' : 'Pilih cabang spesifik'}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BoltIcon className="w-3.5 h-3.5" /> Potong Otomatis
          </p>
          {canAddNewItem && inventorySettings && !inventorySettings.autoDeductEnabled ? (
            <p className="text-2xl font-bold text-slate-400 dark:text-slate-500">
              Mati
              <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                saklar dimatikan
              </span>
            </p>
          ) : (
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {canAddNewItem ? activeRuleCount : '–'}
              <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
                aturan aktif
              </span>
            </p>
          )}
        </button>
      </div>

      {canAddNewItem && activeRuleCount === 0 && (summary?.total ?? 0) > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-800 dark:text-blue-200">
          <BoltIcon className="w-5 h-5 flex-shrink-0" />
          <p className="flex-1">
            Belum ada aturan potong stok otomatis. Atur takaran sabun, pewangi, atau plastik per
            kg/nota agar stok berkurang sendiri setiap transaksi.
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsRecipeModalOpen(true)}>
            Atur Sekarang
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <div className="flex gap-2 flex-wrap justify-end">
          <button
            onClick={() => setIsRecipeModalOpen(true)}
            disabled={!canAddNewItem}
            className="btn btn-secondary btn-sm"
            title="Atur potong stok otomatis per transaksi"
          >
            <BoltIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Potong Otomatis</span>
          </button>

          <button
            onClick={() => setIsOpnameModalOpen(true)}
            disabled={!canAddNewItem || (summary?.total ?? 0) === 0}
            className="btn btn-secondary btn-sm"
            title="Stock Opname"
          >
            <CheckCircleIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Opname</span>
          </button>

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
            disabled={!canAddNewItem || isImporting}
            className="btn btn-secondary btn-sm"
            title="Import dari Excel"
          >
            <UploadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">
              {isImporting ? 'Mengimpor…' : 'Import'}
            </span>
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={(summary?.total ?? totalCount) === 0}
            className="btn btn-secondary btn-sm"
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
        <SearchInput
          id="inventory-search"
          name="inventory-search"
          label="Cari item inventaris"
          placeholder="Cari item..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          wrapperClassName="flex-1"
        />
        <select
          id="inventory-filter"
          name="inventory-filter"
          aria-label="Filter stok"
          value={filter}
          onChange={(e) => handleFilterChange(e.target.value as StockFilter)}
          className="w-full sm:w-48 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="all">Semua Item</option>
          <option value="low_stock">Perlu Restok</option>
          <option value="out_of_stock">Stok Habis</option>
        </select>
      </div>

      {!canAddNewItem && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Pilih cabang spesifik di header untuk menambah item, mengatur potong otomatis, atau stock
          opname.
        </p>
      )}

      <div
        className={`card overflow-x-auto hidden md:block transition-opacity ${isFetching ? 'opacity-70' : ''}`}
      >
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
              {showStoreColumn && (
                <th className="px-4 py-2.5">
                  <button
                    onClick={() => requestSort('storeName')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Toko {getSortIcon('storeName')}
                  </button>
                </th>
              )}
              <th className="px-4 py-2.5 text-right">
                <button
                  onClick={() => requestSort('stock')}
                  className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Stok {getSortIcon('stock')}
                </button>
              </th>
              <th className="px-4 py-2.5 text-right">Ambang Batas</th>
              <th className="px-4 py-2.5">Satuan</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map((item, index) => {
                const level = STOCK_LEVEL_META[getStockLevel(item)];
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
                      {autoBadge(item)}
                    </td>
                    {showStoreColumn && (
                      <td className="px-4 py-2.5">
                        {(item.storeId && storeNameById.get(item.storeId)) || 'N/A'}
                      </td>
                    )}
                    <td className={`px-4 py-2.5 text-right tabular-nums ${level.text}`}>
                      {formatQty(item.stock)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {item.lowStockThreshold > 0 ? formatQty(item.lowStockThreshold) : '–'}
                    </td>
                    <td className="px-4 py-2.5">{item.unit}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-1 text-sm font-medium rounded-full ${level.badge}`}>
                        {level.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">{renderActions(item)}</div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columnCount}>{emptyState}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {inventory.length > 0
          ? inventory.map((item) => {
              const level = STOCK_LEVEL_META[getStockLevel(item)];
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-lg text-slate-800 dark:text-slate-200 break-words">
                        {item.name}
                        {autoBadge(item)}
                      </p>
                      {showStoreColumn && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {(item.storeId && storeNameById.get(item.storeId)) || 'N/A'}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${level.badge}`}
                    >
                      {level.label}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-4 text-sm border-t dark:border-slate-600 pt-2">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Stok Saat Ini</p>
                      <p className={`font-semibold text-lg ${level.text}`}>
                        {formatQty(item.stock)} {item.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Ambang Batas</p>
                      <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                        {item.lowStockThreshold > 0 ? formatQty(item.lowStockThreshold) : '–'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-end gap-1 border-t dark:border-slate-600 pt-2">
                    {renderActions(item)}
                  </div>
                </div>
              );
            })
          : emptyState}
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
          message={`Apakah Anda yakin ingin menghapus item "${itemToDelete.name}"?${
            autoItemIds.has(itemToDelete.id) ? ' Aturan potong otomatisnya juga ikut terhapus.' : ''
          } Riwayat stoknya akan hilang.`}
        />
      )}

      {adjustTarget && (
        <StockAdjustModal
          item={adjustTarget.item}
          initialMode={adjustTarget.mode}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      {historyItem && <StockHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />}

      {isRecipeModalOpen && activeStoreId && (
        <RecipeConfigModal
          isOpen={isRecipeModalOpen}
          onClose={() => setIsRecipeModalOpen(false)}
          storeId={activeStoreId}
        />
      )}

      {isOpnameModalOpen && activeStoreId && (
        <StockOpnameModal
          isOpen={isOpnameModalOpen}
          onClose={() => setIsOpnameModalOpen(false)}
          storeId={activeStoreId}
        />
      )}
    </div>
  );
};

export default InventoryPage;

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { XIcon, CheckCircleIcon, AlertTriangleIcon } from './icons';
import { InventoryItem } from '../types';
import { fetchInventory } from '../contexts/InventoryContext';
import { useStockOpnameMutations } from '../contexts/InventoryRecipeContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';
import { formatQty, formatQtyDelta } from '../utils/inventoryFormat';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  storeId: string;
}

const StockOpnameModal: React.FC<StockOpnameModalProps> = ({ isOpen, onClose, storeId }) => {
  const { recordOpname, isLoading } = useStockOpnameMutations();
  const { addAuditLog } = useAuditLogs();
  // Semua item cabang (bukan hanya halaman tabel yang tampil). Tidak di-refetch selama
  // modal terbuka supaya "stok sistem" tidak bergeser di tengah penghitungan.
  const { data: inventoryResult, isLoading: loadingItems } = useQuery({
    queryKey: ['inventory', { page: 1, pageSize: 1000, storeId, purpose: 'opname' }],
    queryFn: () => fetchInventory({ page: 1, pageSize: 1000, storeId }),
    enabled: isOpen,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const inventoryItems = useMemo(() => inventoryResult?.data ?? [], [inventoryResult]);
  const { addToast } = useToasts();
  const [physicalStocks, setPhysicalStocks] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  if (!isOpen) return null;

  const handlePhysicalStockChange = (itemId: string, value: string) => {
    setPhysicalStocks((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleNotesChange = (itemId: string, value: string) => {
    setNotes((prev) => ({ ...prev, [itemId]: value }));
  };

  /** Mengembalikan `true` bila opname item berhasil dicatat. */
  const handleSaveItem = async (item: InventoryItem): Promise<boolean> => {
    const physicalStock = parseFloat((physicalStocks[item.id] || '0').replace(',', '.'));
    if (isNaN(physicalStock) || physicalStock < 0) {
      addToast(`Stok fisik ${item.name} harus berupa angka 0 atau lebih.`, 'error');
      return false;
    }

    try {
      await recordOpname({
        inventoryItemId: item.id,
        physicalStock,
        notes: notes[item.id],
      });
      if (physicalStock !== item.stock) {
        addAuditLog(
          `Stock opname "${item.name}": sistem ${formatQty(item.stock)} → fisik ${formatQty(physicalStock)} ${item.unit}.`,
          storeId,
        );
      }
      setSavedItems((prev) => [...prev, item.id]);
      return true;
    } catch (error) {
      console.error('Error recording opname:', error);
      addToast(
        `Gagal menyimpan opname ${item.name}: ${error instanceof Error ? error.message : 'coba lagi'}`,
        'error',
      );
      return false;
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    let allSaved = true;
    for (const item of inventoryItems) {
      if (!savedItems.includes(item.id) && physicalStocks[item.id]) {
        allSaved = (await handleSaveItem(item)) && allSaved;
      }
    }
    setSaving(false);
    // Modal tetap terbuka bila ada yang gagal, supaya isian bisa diperbaiki.
    if (allSaved) {
      addToast('Stock opname tersimpan.', 'success');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Stock Opname</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hitung stok fisik. Stok sistem otomatis disamakan & selisihnya tercatat di riwayat.
            </p>
          </div>
          <button aria-label="Tutup" onClick={onClose} className="btn btn-ghost btn-icon">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Nama Item</th>
                <th className="px-3 py-2 text-right font-semibold">Unit</th>
                <th className="px-3 py-2 text-right font-semibold">Stok Sistem</th>
                <th className="px-3 py-2 text-right font-semibold">Stok Fisik</th>
                <th className="px-3 py-2 text-right font-semibold">Selisih</th>
                <th className="px-3 py-2 text-left font-semibold">Catatan</th>
                <th className="px-3 py-2 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loadingItems && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-500">
                    Memuat item…
                  </td>
                </tr>
              )}
              {inventoryItems.map((item: InventoryItem) => {
                const virtualStock = item.stock;
                const physicalStock = parseFloat(
                  (physicalStocks[item.id] || '0').replace(',', '.'),
                );
                const discrepancy = virtualStock - physicalStock;
                const isSaved = savedItems.includes(item.id);

                return (
                  <tr key={item.id} className={isSaved ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">
                      {item.name}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500">{item.unit}</td>
                    <td className="px-3 py-2 text-right font-mono">{formatQty(virtualStock)}</td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Stok fisik ${item.name}`}
                        type="number"
                        step="any"
                        inputMode="decimal"
                        min="0"
                        value={physicalStocks[item.id] || ''}
                        onChange={(e) => handlePhysicalStockChange(item.id, e.target.value)}
                        disabled={isSaved}
                        className="w-24 px-2 py-1 text-right border rounded dark:bg-slate-700 dark:border-slate-600"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {physicalStocks[item.id] && (
                        <span
                          className={`font-mono font-medium ${
                            discrepancy > 0
                              ? 'text-red-600 dark:text-red-400'
                              : discrepancy < 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {formatQtyDelta(-discrepancy)}
                          {discrepancy > 0 && <AlertTriangleIcon className="inline w-4 h-4 ml-1" />}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        aria-label={`Catatan ${item.name}`}
                        type="text"
                        value={notes[item.id] || ''}
                        onChange={(e) => handleNotesChange(item.id, e.target.value)}
                        disabled={isSaved}
                        className="w-full px-2 py-1 border rounded dark:bg-slate-700 dark:border-slate-600"
                        placeholder="Catatan..."
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {isSaved ? (
                        <span className="text-green-600 dark:text-green-400 text-xs">
                          Tersimpan
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSaveItem(item)}
                          disabled={!physicalStocks[item.id] || isLoading}
                          className="btn btn-primary btn-sm"
                        >
                          Simpan
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs text-slate-500">
          <span className="text-red-600">−X</span> = Stok hilang/terbuang |{' '}
          <span className="text-blue-600">+X</span> = Stok lebih |{' '}
          <span className="text-green-600">0</span> = Cocok
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Tutup
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving || Object.keys(physicalStocks).length === 0}
            className="btn btn-primary btn-sm"
          >
            <CheckCircleIcon className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Semua'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockOpnameModal;

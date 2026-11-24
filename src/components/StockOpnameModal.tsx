import React, { useState } from 'react';
import { XIcon, CheckCircleIcon, AlertTriangleIcon } from './icons';
import { InventoryItem } from '../types';
import { useStockOpnameMutations } from '../contexts/InventoryRecipeContext';
import useAppContext from '../contexts/useAppContext';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryItems: InventoryItem[];
  storeId: string;
}

const StockOpnameModal: React.FC<StockOpnameModalProps> = ({
  isOpen,
  onClose,
  inventoryItems,
  storeId,
}) => {
  const { currentUser } = useAppContext();
  const { recordOpname, isLoading } = useStockOpnameMutations();
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

  const handleSaveItem = async (item: InventoryItem) => {
    const physicalStock = parseFloat(physicalStocks[item.id] || '0');
    if (isNaN(physicalStock) || physicalStock < 0) {
      alert('Masukkan stok fisik yang valid');
      return;
    }

    try {
      await recordOpname({
        inventoryItemId: item.id,
        virtualStock: item.virtualStock ?? item.stock,
        physicalStock,
        notes: notes[item.id],
        recordedBy: currentUser?.id || '',
        storeId,
      });
      setSavedItems((prev) => [...prev, item.id]);
    } catch (error) {
      console.error('Error recording opname:', error);
      alert('Gagal menyimpan stock opname');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    for (const item of inventoryItems) {
      if (!savedItems.includes(item.id) && physicalStocks[item.id]) {
        await handleSaveItem(item);
      }
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Stock Opname</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Catat stok fisik untuk perbandingan dengan stok virtual
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Nama Item</th>
                <th className="px-3 py-2 text-right font-semibold">Unit</th>
                <th className="px-3 py-2 text-right font-semibold">Stok Virtual</th>
                <th className="px-3 py-2 text-right font-semibold">Stok Fisik</th>
                <th className="px-3 py-2 text-right font-semibold">Selisih</th>
                <th className="px-3 py-2 text-left font-semibold">Catatan</th>
                <th className="px-3 py-2 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {inventoryItems.map((item) => {
                const virtualStock = item.virtualStock ?? item.stock;
                const physicalStock = parseFloat(physicalStocks[item.id] || '0');
                const discrepancy = virtualStock - physicalStock;
                const isSaved = savedItems.includes(item.id);

                return (
                  <tr key={item.id} className={isSaved ? 'bg-green-50 dark:bg-green-900/20' : ''}>
                    <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-200">
                      {item.name}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-500">{item.unit}</td>
                    <td className="px-3 py-2 text-right font-mono">{virtualStock.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.01"
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
                          {discrepancy > 0 ? '-' : discrepancy < 0 ? '+' : ''}
                          {Math.abs(discrepancy).toFixed(2)}
                          {discrepancy > 0 && <AlertTriangleIcon className="inline w-4 h-4 ml-1" />}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
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
                          ✓ Tersimpan
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSaveItem(item)}
                          disabled={!physicalStocks[item.id] || isLoading}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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
          <span className="text-red-600">-X.XX</span> = Stok hilang/waste |{' '}
          <span className="text-blue-600">+X.XX</span> = Stok lebih |{' '}
          <span className="text-green-600">0.00</span> = Cocok
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
            className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700 disabled:opacity-50"
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

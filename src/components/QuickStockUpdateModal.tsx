import React, { useState, useEffect } from 'react';
import { fetchInventory, useInventoryMutations } from '../contexts/InventoryContext';
import { useQuery } from '@tanstack/react-query';
import { useToasts } from '../contexts/ToastContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { useAppContext } from '../contexts/AppContext';
import Modal from './Modal';
import { InventoryItem } from '@/types';

interface QuickStockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickStockUpdateModal: React.FC<QuickStockUpdateModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, selectedStoreId } = useAppContext();
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', { page: 1, pageSize: 1000, storeId: selectedStoreId }],
    queryFn: () => fetchInventory({ page: 1, pageSize: 1000, storeId: selectedStoreId }),
  });
  const { updateInventoryItem } = useInventoryMutations();
  const { addToast, updateToast } = useToasts();
  const [isSavingStock, setIsSavingStock] = useState(false);
  const [stockUpdates, setStockUpdates] = useState<{ [key: string]: number }>({});
  const [initialStock, setInitialStock] = useState<{ [key: string]: number }>({});
  const { addAuditLog } = useAuditLogs();

  useEffect(() => {
    if (isOpen) {
      // Initialize local state with current stock values from context
      const initial = inventory.reduce(
        (acc, item) => {
          acc[item.id] = item.stock;
          return acc;
        },
        {} as { [key: string]: number },
      );
      setStockUpdates(initial);
      setInitialStock(initial);
    }
  }, [isOpen, inventory]);

  const handleStockChange = (itemId: string, newStock: number) => {
    setStockUpdates((prev) => ({
      ...prev,
      [itemId]: newStock >= 0 ? newStock : 0,
    }));
  };

  const handleSave = async () => {
    const toastId = addToast('Memperbarui stok...', 'info');
    setIsSavingStock(true);
    const storeId = currentUser.storeId || selectedStoreId;
    const updates: Promise<void>[] = [];
    const originalInventoryMap = new Map<string, InventoryItem>(
      inventory.map((i) => [i.id, i] as [string, InventoryItem]),
    );

    for (const itemId in stockUpdates) {
      const originalItem = originalInventoryMap.get(itemId);
      const newStock = stockUpdates[itemId];
      const originalStock = initialStock[itemId];
      // Only update if stock changed from initial snapshot
      if (originalItem && originalStock !== undefined && originalStock !== newStock) {
        updates.push(
          updateInventoryItem(itemId, { stock: newStock }).then(() => {
            addAuditLog(
              `Memperbarui stok cepat untuk '${originalItem.name}' dari ${originalStock} menjadi ${newStock}.`,
              storeId,
            );
          }),
        );
      }
    }

    try {
      await Promise.all(updates);
      updateToast(toastId, 'Semua stok berhasil diperbarui!', 'success');
    } catch (error: any) {
      updateToast(toastId, `Gagal memperbarui beberapa stok: ${error.message}`, 'error');
    }
    setIsSavingStock(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perbarui Stok Inventaris"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isSavingStock}
            className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={isSavingStock}
            className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 disabled:opacity-50"
          >
            Simpan Perubahan
          </button>
        </>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
        {inventory.length > 0 ? (
          inventory.map((item) => {
            const isLowStock = (stockUpdates[item.id] ?? item.stock) <= item.lowStockThreshold;
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-4 p-3 rounded-lg ${isLowStock ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}
              >
                <div className="flex items-center gap-3">
                  {isLowStock && (
                    <span
                      className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"
                      title="Stok Rendah"
                    ></span>
                  )}
                  <span
                    className={`font-medium ${isLowStock ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-800 dark:text-slate-200'}`}
                  >
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={stockUpdates[item.id] || 0}
                    onChange={(e) => handleStockChange(item.id, parseInt(e.target.value, 10) || 0)}
                    className="w-28 bg-white border border-slate-300 text-slate-900 text-base rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-right"
                    disabled={isSavingStock}
                  />
                  <span className="text-base text-slate-500 dark:text-slate-400 w-12 text-left">
                    {item.unit}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">
            Tidak ada item inventaris di cabang ini.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default QuickStockUpdateModal;

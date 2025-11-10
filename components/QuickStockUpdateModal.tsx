import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useInventory } from '../contexts/InventoryContext';
import { InventoryItem } from '../types';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { useAppContext } from '../contexts/AppContext';

interface QuickStockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickStockUpdateModal: React.FC<QuickStockUpdateModalProps> = ({ isOpen, onClose }) => {
  const { inventory, setInventory } = useInventory();
  const [stockUpdates, setStockUpdates] = useState<{ [key: string]: number }>({});
  const { addAuditLog } = useAuditLogs();
  const { currentUser, selectedStoreId } = useAppContext();

  useEffect(() => {
    if (isOpen) {
      // Initialize local state with current stock values from context
      const initialStock = inventory.reduce((acc, item) => {
        acc[item.id] = item.stock;
        return acc;
      }, {} as { [key: string]: number });
      setStockUpdates(initialStock);
    }
  }, [isOpen, inventory]);

  const handleStockChange = (itemId: string, newStock: number) => {
    setStockUpdates(prev => ({
      ...prev,
      [itemId]: newStock >= 0 ? newStock : 0,
    }));
  };

  const handleSave = () => {
    const storeId = currentUser.storeId || selectedStoreId;
    // We need to update the global state (allInventory) not the filtered one
    // setInventory function from context points to setAllInventory
    setInventory(prevInventory => 
      prevInventory.map(item => {
        if (stockUpdates[item.id] !== undefined && stockUpdates[item.id] !== item.stock) {
          addAuditLog(`Memperbarui stok cepat untuk "${item.name}" dari ${item.stock} menjadi ${stockUpdates[item.id]}.`, storeId);
          return { ...item, stock: stockUpdates[item.id] };
        }
        return item;
      })
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Perbarui Stok Inventaris"
      footer={
        <>
          <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
          <button onClick={handleSave} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan Perubahan</button>
        </>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
        {inventory.length > 0 ? inventory.map(item => {
          const isLowStock = (stockUpdates[item.id] ?? item.stock) <= item.lowStockThreshold;
          return (
            <div key={item.id} className={`flex items-center justify-between gap-4 p-3 rounded-lg ${isLowStock ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-slate-50 dark:bg-slate-700/50'}`}>
              <div className="flex items-center gap-3">
                 {isLowStock && <span className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0" title="Stok Rendah"></span>}
                 <span className={`font-medium ${isLowStock ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-800 dark:text-slate-200'}`}>{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={stockUpdates[item.id] || 0}
                  onChange={(e) => handleStockChange(item.id, parseInt(e.target.value, 10) || 0)}
                  className="w-28 bg-white border border-slate-300 text-slate-900 text-base rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white text-right"
                />
                <span className="text-base text-slate-500 dark:text-slate-400 w-12 text-left">{item.unit}</span>
              </div>
            </div>
          )
        }) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">
            Tidak ada item inventaris di cabang ini.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default QuickStockUpdateModal;
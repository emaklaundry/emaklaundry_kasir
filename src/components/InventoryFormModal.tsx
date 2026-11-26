import React, { useState } from 'react';
import { InventoryItem } from '../types';
import Modal from './Modal';

interface InventoryFormModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (item: Omit<InventoryItem, 'id' | 'storeId'>) => void;
}

const InventoryFormModal: React.FC<InventoryFormModalProps> = ({ item, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    stock: item?.stock || 0,
    lowStockThreshold: item?.lowStockThreshold || 0,
    unit: item?.unit || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumber = ['stock', 'lowStockThreshold'].includes(name);
    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? Math.max(0, parseFloat(value) || 0) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={item ? 'Edit Item' : 'Tambah Item Baru'}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button onClick={handleSubmit} className="btn btn-primary">
            Simpan
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name" className="form-label">
            Nama Item
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="stock" className="form-label">
              Stok
            </label>
            <input
              type="number"
              min="0"
              name="stock"
              id="stock"
              value={formData.stock}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="unit" className="form-label">
              Satuan
            </label>
            <input
              type="text"
              name="unit"
              id="unit"
              value={formData.unit}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="lowStockThreshold" className="form-label">
            Ambang Batas Stok Rendah
          </label>
          <input
            type="number"
            min="0"
            name="lowStockThreshold"
            id="lowStockThreshold"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default InventoryFormModal;

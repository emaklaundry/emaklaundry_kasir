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
      [name]: isNumber ? Math.max(0, Math.round((parseFloat(value) || 0) * 1000) / 1000) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, name: formData.name.trim(), unit: formData.unit.trim() });
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
            className="form-input"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="stock" className="form-label">
              {item ? 'Stok saat ini' : 'Stok awal'}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              name="stock"
              id="stock"
              value={formData.stock}
              onChange={handleChange}
              className="form-input"
              // Saat edit, stok diubah lewat "Sesuaikan Stok" agar tercatat di riwayat.
              readOnly={!!item}
              aria-describedby={item ? 'stock-hint' : undefined}
              required
            />
            {item && (
              <p id="stock-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Ubah lewat tombol Sesuaikan Stok di tabel.
              </p>
            )}
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
              className="form-input"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="lowStockThreshold" className="form-label">
            Ambang Batas Stok Rendah
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
            Isi 0 untuk mematikan peringatan stok rendah.
          </p>
          <input
            type="number"
            min="0"
            step="any"
            inputMode="decimal"
            name="lowStockThreshold"
            id="lowStockThreshold"
            value={formData.lowStockThreshold}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default InventoryFormModal;

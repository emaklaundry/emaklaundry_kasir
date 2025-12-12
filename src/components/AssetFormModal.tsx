import React, { useState } from 'react';
import { Asset } from '../../types';
import { formatRupiah, parseRupiah } from '../utils/formatting';
import Modal from './Modal';

interface AssetFormModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id' | 'maintenanceHistory' | 'storeId'>) => void;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({ asset, onClose, onSave }) => {
  // Helper untuk mendapatkan YYYY-MM-DD lokal dengan aman
  const getLocalDateStr = (dateInput?: string | Date) => {
    if (!dateInput) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    if (typeof dateInput === 'string') {
      return dateInput.split('T')[0];
    }
    const d = dateInput;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState(() => ({
    name: asset?.name || '',
    serialNumber: asset?.serialNumber || '',
    purchaseDate: getLocalDateStr(asset?.purchaseDate),
    purchaseCost: asset?.purchaseCost || 0,
    status: asset?.status || 'Active',
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'purchaseCost') {
      setFormData((prev) => ({ ...prev, purchaseCost: parseRupiah(value) }));
    } else if (name === 'purchaseDate') {
      // keep as YYYY-MM-DD string
      setFormData((prev) => ({ ...prev, purchaseDate: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before save
    if (!formData.name || formData.name.trim() === '') {
      addToast('Nama aset harus diisi.', 'error');
      return;
    }
    if (!formData.purchaseDate) {
      addToast('Tanggal pembelian harus diisi.', 'error');
      return;
    }
    if (formData.purchaseCost <= 0) {
      addToast('Harga pembelian harus lebih dari 0.', 'error');
      return;
    }
    if (!formData.status || !['Active', 'Under Maintenance', 'Decommissioned'].includes(formData.status)) {
      addToast('Status aset tidak valid.', 'error');
      return;
    }
    
    // --- PERBAIKAN 2: Jangan konversi ke ISOString! ---
    // Kirim data apa adanya (string YYYY-MM-DD) agar tanggal tidak bergeser.
    onSave(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={asset ? 'Edit Aset' : 'Tambah Aset Baru'}
      footer={
        <>
          <button
            onClick={onClose}
            className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3"
          >
            Simpan
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Nama Aset
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
          <div>
            <label
              htmlFor="serialNumber"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Nomor Serial
            </label>
            <input
              type="text"
              name="serialNumber"
              id="serialNumber"
              value={formData.serialNumber}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="purchaseDate"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Tanggal Beli
            </label>
            <input
              type="date"
              name="purchaseDate"
              id="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label
              htmlFor="purchaseCost"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Biaya Beli (Rp)
            </label>
            <input
              type="text"
              name="purchaseCost"
              id="purchaseCost"
              value={formatRupiah(formData.purchaseCost)}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="status"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Status
          </label>
          <select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            <option value="Active">Aktif</option>
            <option value="Under Maintenance">Dalam Perbaikan</option>
            <option value="Decommissioned">Diberhentikan</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default AssetFormModal;

import React, { useState } from 'react';
import { Asset } from '@/types';
import { formatRupiah, parseRupiah } from '@/utils/formatting';
import { getLocalDateString } from '@/utils/dateHelpers';
import useToasts from '@/contexts/useToasts';
import Modal from './Modal';

interface AssetFormModalProps {
  asset: Asset | null;
  onClose: () => void;
  onSave: (asset: Omit<Asset, 'id' | 'maintenanceHistory' | 'storeId'>) => void;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({ asset, onClose, onSave }) => {
  const { addToast } = useToasts();

  const [formData, setFormData] = useState(() => ({
    name: asset?.name || '',
    serialNumber: asset?.serialNumber || '',
    purchaseDate: getLocalDateString(asset?.purchaseDate),
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
    if (
      !formData.status ||
      !['Active', 'Under Maintenance', 'Decommissioned'].includes(formData.status)
    ) {
      addToast('Status aset tidak valid.', 'error');
      return;
    }

    // Convert purchaseDate string to Date object
    const assetData = {
      ...formData,
      purchaseDate: new Date(formData.purchaseDate),
    };

    onSave(assetData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={asset ? 'Edit Aset' : 'Tambah Aset Baru'}
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="form-label">
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
            <label htmlFor="serialNumber" className="form-label">
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
            <label htmlFor="purchaseDate" className="form-label">
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
            <label htmlFor="purchaseCost" className="form-label">
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
          <label htmlFor="status" className="form-label">
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

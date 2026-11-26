import React, { useState } from 'react';
import { formatRupiah, parseRupiah } from '../utils/formatting';
import Modal from './Modal';
import { Service, ServiceCategory, WashType } from '@/types';
import useToasts from '../contexts/useToasts';

interface ServiceFormModalProps {
  service: Service | null;
  onClose: () => void;
  onSave: (service: Omit<Service, 'id' | 'storeId'>) => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ service, onClose, onSave }) => {
  const { addToast } = useToasts();
  const [formData, setFormData] = useState<Omit<Service, 'id' | 'storeId'>>({
    name: service?.name || '',
    category: service?.category || ServiceCategory.Kiloan,
    washType: service?.washType || WashType.Pakaian,
    price: service?.price || 0,
    unit: service?.unit || 'kg',
    durationDays: service?.durationDays || 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'durationDays') {
      const numericValue = name === 'price' ? parseRupiah(value) : parseInt(value, 10);
      // FIXED: For price, enforce minimum of 1 instead of 0
      const minValue = name === 'price' ? 1 : 0;
      setFormData((prev) => ({
        ...prev,
        [name]: Math.max(minValue, isNaN(numericValue) ? minValue : numericValue),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIXED: Add validation before save
    if (!formData.name || formData.name.trim() === '') {
      addToast('Nama layanan harus diisi.', 'error');
      return;
    }
    if (formData.price <= 0) {
      addToast('Harga layanan harus lebih dari 0.', 'error');
      return;
    }
    if (formData.durationDays < 0) {
      addToast('Durasi tidak boleh negatif.', 'error');
      return;
    }
    onSave(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={service ? 'Edit Layanan' : 'Tambah Layanan Baru'}
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
      <form className="space-y-4">
        <div>
          <label htmlFor="name" className="form-label">
            Nama Layanan
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
          <label htmlFor="category" className="form-label">
            Kategori
          </label>
          <select
            name="category"
            id="category"
            value={formData.category}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {Object.values(ServiceCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="washType" className="form-label">
            Jenis Yang Dicuci
          </label>
          <select
            name="washType"
            id="washType"
            value={formData.washType}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {Object.values(WashType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="form-label">
              Harga
            </label>
            <input
              type="text"
              name="price"
              id="price"
              value={formatRupiah(formData.price)}
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
          <label htmlFor="durationDays" className="form-label">
            Durasi (hari)
          </label>
          <input
            type="number"
            min="0"
            name="durationDays"
            id="durationDays"
            value={formData.durationDays}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default ServiceFormModal;

import React, { useState } from 'react';
import { Customer } from '@/types';
import Modal from './Modal';
import useToasts from '@/contexts/useToasts';

interface CustomerFormModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'storeId' | 'createdAt'>) => Promise<void> | void;
  disabled?: boolean;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  customer,
  onClose,
  onSave,
  disabled,
}) => {
  const { addToast } = useToasts();
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'storeId' | 'createdAt'>>({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    notes: customer?.notes || '',
    defaultDiscount: customer?.defaultDiscount ?? 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: Math.max(0, parseFloat(value) || 0) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();

    // Validate required fields with user-friendly error messages
    if (!formData.name || formData.name.trim() === '') {
      addToast('Nama pelanggan harus diisi.', 'error');
      return;
    }

    // Validasi format nomor telepon HANYA jika diisi
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneClean = formData.phone.replace(/\s/g, '');
      if (!/^(\+62|08|62)[0-9]{8,12}$/.test(phoneClean)) {
        addToast(
          'Format nomor telepon tidak valid (contoh: 081234567890 atau +6281234567890)',
          'warning',
        );
        return;
      }
    }

    await onSave(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled}
            className="flex justify-center items-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 w-32 disabled:bg-blue-400"
          >
            Simpan
          </button>
        </>
      }
    >
      <div role="form" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="customer-name"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Nama Pelanggan
            </label>
            <input
              type="text"
              name="name"
              id="customer-name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              required
            />
          </div>
          <div>
            <label
              htmlFor="customer-phone"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Nomor Telepon (Opsional)
            </label>
            <input
              type="tel"
              name="phone"
              id="customer-phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Contoh: 081234567890"
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="customer-address"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Alamat (Opsional)
          </label>
          <input
            type="text"
            name="address"
            id="customer-address"
            autoComplete="street-address"
            value={formData.address}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="customer-discount"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Saldo Diskon (Rp)
          </label>
          <input
            type="number"
            name="defaultDiscount"
            id="customer-discount"
            min={0}
            step={1}
            inputMode="numeric"
            value={formData.defaultDiscount}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        <div>
          <label
            htmlFor="customer-notes"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Catatan (Opsional)
          </label>
          <textarea
            name="notes"
            id="customer-notes"
            autoComplete="off"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          ></textarea>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerFormModal;

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
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    // Cegah ketukan ganda: tanpa ini, tap kedua mengirim insert yang sama dan
    // ditolak database karena nomor HP sudah tersimpan oleh tap pertama.
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isSubmitting}
            className="btn btn-primary w-32"
          >
            Simpan
          </button>
        </>
      }
    >
      <div role="form" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customer-name" className="form-label">
              Nama Pelanggan
            </label>
            <input
              type="text"
              name="name"
              id="customer-name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="customer-phone" className="form-label">
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
              className="form-input"
            />
          </div>
        </div>
        <div>
          <label htmlFor="customer-address" className="form-label">
            Alamat (Opsional)
          </label>
          <input
            type="text"
            name="address"
            id="customer-address"
            autoComplete="street-address"
            value={formData.address}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label htmlFor="customer-notes" className="form-label">
            Catatan (Opsional)
          </label>
          <textarea
            name="notes"
            id="customer-notes"
            autoComplete="off"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="form-input"
          ></textarea>
        </div>
      </div>
    </Modal>
  );
};

export default CustomerFormModal;

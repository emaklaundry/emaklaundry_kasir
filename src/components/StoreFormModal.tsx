import React, { useState } from 'react';
import Modal from './Modal';
import { Store } from '@/types';

interface StoreFormModalProps {
  store: Store | null;
  onClose: () => void;
  onSave: (store: Omit<Store, 'id' | 'isActive'>) => void;
}

const StoreFormModal: React.FC<StoreFormModalProps> = ({ store, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: store?.name || '',
    address: store?.address || '',
    phone: store?.phone || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, phone: formData.phone.trim() || null });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={store ? 'Edit Cabang' : 'Tambah Cabang Baru'}
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
            Nama Cabang
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
        <div>
          <label htmlFor="address" className="form-label">
            Alamat
          </label>
          <input
            type="text"
            name="address"
            id="address"
            value={formData.address}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="form-label">
            No. HP / WhatsApp (opsional)
          </label>
          <input
            type="tel"
            inputMode="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            maxLength={30}
            placeholder="Contoh: 081234567890"
            className="form-input"
          />
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Dicetak di bagian atas struk bersama nama & alamat cabang.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default StoreFormModal;

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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={store ? 'Edit Cabang' : 'Tambah Cabang Baru'}
      footer={
        <>
          <button
            onClick={onClose}
            className="text-slate-900 bg-white border border-slate-300 focus:outline-none hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-white"
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
        <div>
          <label
            htmlFor="name"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Nama Cabang
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
            htmlFor="address"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Alamat
          </label>
          <input
            type="text"
            name="address"
            id="address"
            value={formData.address}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default StoreFormModal;

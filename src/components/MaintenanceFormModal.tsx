import React, { useState } from 'react';
import { formatRupiah, parseRupiah } from '../utils/formatting';
import Modal from './Modal';
import { MaintenanceLog } from '@/types';

interface MaintenanceFormModalProps {
  assetName: string;
  onClose: () => void;
  onSave: (log: Omit<MaintenanceLog, 'id'>) => void;
}

const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  assetName,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<Omit<MaintenanceLog, 'id'>>({
    date: new Date(),
    description: '',
    cost: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (name === 'cost') {
      setFormData((prev) => ({ ...prev, cost: parseRupiah(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: type === 'date' ? new Date(value) : value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Tambah Log untuk ${assetName}`}
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
          <label
            htmlFor="date"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Tanggal
          </label>
          <input
            type="date"
            name="date"
            id="date"
            value={formData.date.toISOString().split('T')[0]}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Deskripsi
          </label>
          <input
            type="text"
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
        <div>
          <label
            htmlFor="cost"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Biaya (Rp)
          </label>
          <input
            type="text"
            name="cost"
            id="cost"
            value={formatRupiah(formData.cost)}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default MaintenanceFormModal;

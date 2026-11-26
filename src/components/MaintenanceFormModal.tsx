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
          <label htmlFor="date" className="form-label">
            Tanggal
          </label>
          <input
            type="date"
            name="date"
            id="date"
            value={formData.date.toISOString().split('T')[0]}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div>
          <label htmlFor="description" className="form-label">
            Deskripsi
          </label>
          <input
            type="text"
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        <div>
          <label htmlFor="cost" className="form-label">
            Biaya (Rp)
          </label>
          <input
            type="text"
            name="cost"
            id="cost"
            value={formatRupiah(formData.cost)}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
      </form>
    </Modal>
  );
};

export default MaintenanceFormModal;

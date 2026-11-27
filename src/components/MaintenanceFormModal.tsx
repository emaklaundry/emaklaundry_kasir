import React, { useState } from 'react';
import { formatRupiah, parseRupiah } from '../utils/formatting';
import { getLocalDateString, parseLocalDate } from '../utils/dateHelpers';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
import { MaintenanceLog } from '@/types';

interface MaintenanceFormModalProps {
  assetName: string;
  /** Jika diisi, form berjalan dalam mode edit. */
  initialLog?: MaintenanceLog | null;
  onClose: () => void;
  onSave: (log: Omit<MaintenanceLog, 'id'>) => void | Promise<void>;
}

const MaintenanceFormModal: React.FC<MaintenanceFormModalProps> = ({
  assetName,
  initialLog,
  onClose,
  onSave,
}) => {
  const { addToast } = useToasts();
  // Tanggal disimpan sebagai string YYYY-MM-DD lokal agar tidak bergeser karena UTC.
  const [date, setDate] = useState(() =>
    getLocalDateString(initialLog?.date ? new Date(initialLog.date) : undefined),
  );
  const [description, setDescription] = useState(initialLog?.description ?? '');
  const [cost, setCost] = useState(Number(initialLog?.cost) || 0);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      addToast('Tanggal perawatan harus diisi.', 'error');
      return;
    }
    if (!description.trim()) {
      addToast('Deskripsi perawatan harus diisi.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({ date: parseLocalDate(date), description: description.trim(), cost });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={initialLog ? `Edit Log ${assetName}` : `Tambah Log untuk ${assetName}`}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" disabled={isSaving}>
            Batal
          </button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
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
            value={date}
            max={getLocalDateString()}
            onChange={(e) => setDate(e.target.value)}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
            placeholder="Contoh: Ganti bearing mesin cuci"
            required
          />
        </div>
        <div>
          <label htmlFor="cost" className="form-label">
            Biaya (Rp)
          </label>
          <input
            type="text"
            inputMode="numeric"
            name="cost"
            id="cost"
            value={formatRupiah(cost)}
            onChange={(e) => setCost(parseRupiah(e.target.value))}
            className="form-input"
          />
        </div>
      </form>
    </Modal>
  );
};

export default MaintenanceFormModal;

import React, { useState, useEffect } from 'react';
import { convertLocalDateToISOString } from '../utils/formatting';
import Modal from './Modal';
import { ScheduledMaintenance } from '@/types';

type ScheduleFormData = Omit<
  ScheduledMaintenance,
  'id' | 'assetId' | 'lastCompletedDate' | 'nextDueDate'
> & { nextDueDate: string };

interface ScheduledMaintenanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ScheduleFormData) => void | Promise<void>;
  schedule: ScheduledMaintenance | null;
}

const ScheduledMaintenanceFormModal: React.FC<ScheduledMaintenanceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schedule,
}) => {
  const getInitialFormData = React.useCallback((): ScheduleFormData => {
    if (schedule) {
      return {
        description: schedule.description,
        frequencyValue: schedule.frequencyValue,
        frequencyUnit: schedule.frequencyUnit,
        nextDueDate: schedule.nextDueDate
          ? String(schedule.nextDueDate).split('T')[0]
          : new Date().toISOString().split('T')[0],
        estimatedCost: schedule.estimatedCost || 0,
      };
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      description: '',
      frequencyValue: 1,
      frequencyUnit: 'months',
      nextDueDate: tomorrow.toISOString().split('T')[0],
      estimatedCost: 0,
    };
  }, [schedule]);

  const [formData, setFormData] = useState<ScheduleFormData>(getInitialFormData());

  useEffect(() => {
    setTimeout(() => setFormData(getInitialFormData()), 0);
  }, [schedule, isOpen, getInitialFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) || 1 }));
    } else if (type === 'date') {
      setFormData((prev) => ({ ...prev, [name]: value }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Gunakan helper agar DRY
    const iso = convertLocalDateToISOString(formData.nextDueDate);
    onSave({ ...formData, nextDueDate: iso } as ScheduleFormData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={schedule ? 'Edit Jadwal Perawatan' : 'Tambah Jadwal Perawatan'}
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
          <label htmlFor="description" className="form-label">
            Deskripsi Tugas
          </label>
          <input
            type="text"
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            className="form-input"
            required
            placeholder="Contoh: Ganti oli mesin"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="frequencyValue" className="form-label">
              Ulangi Setiap
            </label>
            <input
              type="number"
              name="frequencyValue"
              id="frequencyValue"
              min="1"
              value={formData.frequencyValue}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
          <div>
            <label htmlFor="frequencyUnit" className="form-label">
              Satuan
            </label>
            <select
              name="frequencyUnit"
              id="frequencyUnit"
              value={formData.frequencyUnit}
              onChange={handleChange}
              className="form-input"
            >
              <option value="days">Hari</option>
              <option value="weeks">Minggu</option>
              <option value="months">Bulan</option>
              <option value="years">Tahun</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="estimatedCost" className="form-label">
            Estimasi Biaya (Rp)
          </label>
          <input
            type="number"
            name="estimatedCost"
            id="estimatedCost"
            min="0"
            step="1000"
            value={formData.estimatedCost || 0}
            onChange={handleChange}
            className="form-input"
            placeholder="0"
          />
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Biaya yang akan dicatat saat perawatan selesai.
          </p>
        </div>
        <div>
          <label htmlFor="estimatedCost" className="form-label">
            Estimasi Biaya (Rp)
          </label>
          <input
            type="number"
            name="estimatedCost"
            id="estimatedCost"
            min="0"
            step="1000"
            value={formData.estimatedCost || 0}
            onChange={handleChange}
            className="form-input"
            placeholder="0"
          />
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Biaya yang akan dicatat saat perawatan selesai.
          </p>
        </div>
        <div>
          <label htmlFor="nextDueDate" className="form-label">
            Tanggal Jatuh Tempo Berikutnya
          </label>
          <input
            type="date"
            name="nextDueDate"
            id="nextDueDate"
            value={formData.nextDueDate}
            onChange={handleChange}
            className="form-input"
            required
          />
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Ini adalah tanggal pertama jadwal akan dimulai.
          </p>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduledMaintenanceFormModal;

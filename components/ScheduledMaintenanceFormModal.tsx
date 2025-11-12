import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ScheduledMaintenance } from '../types';

type ScheduleFormData = Omit<ScheduledMaintenance, 'id' | 'assetId' | 'lastCompletedDate' | 'nextDueDate'> & { nextDueDate: string };

interface ScheduledMaintenanceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ScheduleFormData) => void;
    schedule: ScheduledMaintenance | null;
}

const ScheduledMaintenanceFormModal: React.FC<ScheduledMaintenanceFormModalProps> = ({ isOpen, onClose, onSave, schedule }) => {
    
        const getInitialFormData = (): ScheduleFormData => {
            if (schedule) {
                return {
                    description: schedule.description,
                    frequencyValue: schedule.frequencyValue,
                    frequencyUnit: schedule.frequencyUnit,
                    nextDueDate: schedule.nextDueDate ? String(schedule.nextDueDate).split('T')[0] : new Date().toISOString().split('T')[0],
                };
            }
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return {
                description: '',
                frequencyValue: 1,
                frequencyUnit: 'months',
                nextDueDate: tomorrow.toISOString().split('T')[0],
            };
        };

    const [formData, setFormData] = useState<ScheduleFormData>(getInitialFormData());

    useEffect(() => {
        setFormData(getInitialFormData());
    }, [schedule, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value, 10) || 1 }));
        } else if (type === 'date') {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // convert nextDueDate YYYY-MM-DD to ISO at local midnight
        const [y, m, d] = (formData.nextDueDate || '').split('-').map(Number);
        const iso = isNaN(y) ? new Date().toISOString() : new Date(y, (m || 1) - 1, d || 1).toISOString();
        onSave({ ...formData, nextDueDate: iso } as any);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={schedule ? 'Edit Jadwal Perawatan' : 'Tambah Jadwal Perawatan'}
            footer={
                <>
                    <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
                    <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
                </>
            }
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="description" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Deskripsi Tugas</label>
                    <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required placeholder="Contoh: Ganti oli mesin" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="frequencyValue" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Ulangi Setiap</label>
                        <input type="number" name="frequencyValue" id="frequencyValue" min="1" value={formData.frequencyValue} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                     <div>
                        <label htmlFor="frequencyUnit" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Satuan</label>
                        <select name="frequencyUnit" id="frequencyUnit" value={formData.frequencyUnit} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <option value="days">Hari</option>
                            <option value="weeks">Minggu</option>
                            <option value="months">Bulan</option>
                            <option value="years">Tahun</option>
                        </select>
                    </div>
                </div>
                 <div>
                    <label htmlFor="nextDueDate" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Tanggal Jatuh Tempo Berikutnya</label>
                    <input type="date" name="nextDueDate" id="nextDueDate" value={formData.nextDueDate} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Ini adalah tanggal pertama jadwal akan dimulai.</p>
                </div>
            </form>
        </Modal>
    );
};

export default ScheduledMaintenanceFormModal;
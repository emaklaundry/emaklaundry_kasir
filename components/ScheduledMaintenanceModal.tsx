import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { Asset, ScheduledMaintenance } from '../types';
import { useScheduledMaintenances } from '../contexts/ScheduledMaintenanceContext';
import { useAssets } from '../contexts/AssetContext';
import { useToasts } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import ScheduledMaintenanceFormModal from './ScheduledMaintenanceFormModal';
import { PlusCircleIcon, EditIcon, Trash2Icon } from './icons';
import { useAuditLogs } from '../contexts/AuditLogContext';

interface ScheduledMaintenanceModalProps {
    asset: Asset;
    isOpen: boolean;
    onClose: () => void;
}

import { calculateNextDueDate } from '../utils/formatting';


const ScheduledMaintenanceModal: React.FC<ScheduledMaintenanceModalProps> = ({ asset, isOpen, onClose }) => {
    const { scheduledMaintenances, addScheduledMaintenance, updateScheduledMaintenance, deleteScheduledMaintenance } = useScheduledMaintenances();
    const { updateAsset } = useAssets();
    const { addAuditLog } = useAuditLogs();
    const { addToast } = useToasts();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ScheduledMaintenance | null>(null);
    const [deletingSchedule, setDeletingSchedule] = useState<ScheduledMaintenance | null>(null);

    const assetSchedules = useMemo(() => {
        return scheduledMaintenances
            .filter(sm => sm.assetId === asset.id)
            .sort((a,b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    }, [scheduledMaintenances, asset.id]);

    const handleOpenForm = (schedule: ScheduledMaintenance | null) => {
        setEditingSchedule(schedule);
        setIsFormOpen(true);
    };
    
    const handleCloseForm = () => {
        setEditingSchedule(null);
        setIsFormOpen(false);
    };

    const handleSaveSchedule = async (data: Omit<ScheduledMaintenance, 'id' | 'assetId' | 'lastCompletedDate'>) => {
        try {
            if(editingSchedule) { // Editing existing
                await updateScheduledMaintenance(editingSchedule.id, data);
                addAuditLog(`Memperbarui jadwal perawatan "${data.description}" untuk aset "${asset.name}".`, asset.storeId);
            } else { // Adding new
                const newScheduleData = {
                    ...data,
                    assetId: asset.id,
                    lastCompletedDate: null
                };
                await addScheduledMaintenance(newScheduleData as Omit<ScheduledMaintenance, 'id'>);
                addAuditLog(`Menambahkan jadwal perawatan "${data.description}" untuk aset "${asset.name}".`, asset.storeId);
            }
            handleCloseForm();
        } catch (error: any) {
            addToast(`Gagal menyimpan jadwal: ${error.message}`, 'error');
        }
    };

    const handleDelete = (schedule: ScheduledMaintenance) => {
        setDeletingSchedule(schedule);
    };
    
    const confirmDelete = async () => {
        if (deletingSchedule) {
            try {
                await deleteScheduledMaintenance(deletingSchedule.id);
                addAuditLog(`Menghapus jadwal perawatan "${deletingSchedule.description}" dari aset "${asset.name}".`, asset.storeId);
            } catch (error: any) {
                addToast(`Gagal menghapus jadwal: ${error.message}`, 'error');
            } finally {
                setDeletingSchedule(null);
            }
        }
    };

    const handleMarkAsComplete = async (schedule: ScheduledMaintenance) => {
        const newLog = {
            id: `LOG${Date.now()}`,
            date: new Date(),
            description: `[Jadwal] - ${schedule.description}`,
            cost: 0
        };
        const updatedHistory = [...asset.maintenanceHistory, newLog];
        const updatedScheduleData = {
            lastCompletedDate: new Date(),
            nextDueDate: calculateNextDueDate(schedule.nextDueDate, schedule.frequencyValue, schedule.frequencyUnit)
        };
        try {
            await Promise.all([
                updateAsset(asset.id, { maintenanceHistory: updatedHistory }),
                updateScheduledMaintenance(schedule.id, updatedScheduleData)
            ]);
            addAuditLog(`Menandai jadwal perawatan "${schedule.description}" sebagai selesai untuk aset "${asset.name}".`, asset.storeId);
        } catch (error: any) {
            addToast(`Gagal menandai selesai: ${error.message}`, 'error');
        }
    };


    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={`Jadwal Perawatan: ${asset.name}`}
                footer={
                    <>
                        <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Tutup</button>
                    </>
                }
            >
                <div className="space-y-4">
                     <button onClick={() => handleOpenForm(null)} className="w-full flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Tambah Jadwal Baru
                    </button>
                    <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2">
                        {assetSchedules.length > 0 ? assetSchedules.map(schedule => (
                            <div key={schedule.id} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700">
                                <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">{schedule.description}</p>
                                <p className="text-base text-slate-600 dark:text-slate-300">Setiap {schedule.frequencyValue} {schedule.frequencyUnit}</p>
                                <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
                                    Jatuh tempo: <span className="font-medium text-slate-800 dark:text-slate-200">{new Date(schedule.nextDueDate).toLocaleDateString('id-ID')}</span>
                                </p>
                                 <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Selesai terakhir: {schedule.lastCompletedDate ? new Date(schedule.lastCompletedDate).toLocaleDateString('id-ID') : 'Belum pernah'}
                                </p>
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t dark:border-slate-600">
                                    <button onClick={() => handleMarkAsComplete(schedule)} className="flex-1 text-white bg-green-600 hover:bg-green-700 font-medium rounded-md text-base px-4 py-2">Tandai Selesai</button>
                                    <button onClick={() => handleOpenForm(schedule)} className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(schedule)} className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-base text-slate-500 dark:text-slate-400 py-6">Belum ada jadwal perawatan rutin untuk aset ini.</p>
                        )}
                    </div>
                </div>
            </Modal>
            
            {isFormOpen && (
                <ScheduledMaintenanceFormModal 
                    isOpen={isFormOpen} 
                    onClose={handleCloseForm} 
                    onSave={handleSaveSchedule} 
                    schedule={editingSchedule} 
                />
            )}
            
            {deletingSchedule && (
                <ConfirmationModal 
                    isOpen={true} 
                    onClose={() => setDeletingSchedule(null)} 
                    onConfirm={confirmDelete} 
                    title="Hapus Jadwal Perawatan" 
                    message={`Anda yakin ingin menghapus jadwal "${deletingSchedule.description}"?`} 
                />
            )}
        </>
    );
};

export default ScheduledMaintenanceModal;
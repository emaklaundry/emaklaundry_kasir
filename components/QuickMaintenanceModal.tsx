
import React, { useState } from 'react';
import Modal from './Modal';
import { useAssets } from '../contexts/AssetContext';
import { MaintenanceLog } from '../types';
import { formatRupiah, parseRupiah } from '../utils/formatting';
import { useAuditLogs } from '../contexts/AuditLogContext';

interface QuickMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuickMaintenanceModal: React.FC<QuickMaintenanceModalProps> = ({ isOpen, onClose }) => {
    const { assets, setAssets } = useAssets();
    const { addAuditLog } = useAuditLogs();
    const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id || '');
    const [formData, setFormData] = useState<Omit<MaintenanceLog, 'id'>>({
        date: new Date(),
        description: '',
        cost: 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (name === 'cost') {
            setFormData(prev => ({ ...prev, cost: parseRupiah(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'date' ? new Date(value) : value }));
        }
    };
    
    const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedAssetId(e.target.value);
    };

    const handleSave = () => {
        if (!selectedAssetId || !formData.description) {
            alert("Silakan pilih aset dan isi deskripsi kerusakan.");
            return;
        }
        
        const newLog: MaintenanceLog = { ...formData, id: Date.now() };
        let assetName = '';
        let storeId = '';

        setAssets(prevAssets => prevAssets.map(asset => {
            if (asset.id === selectedAssetId) {
                assetName = asset.name;
                storeId = asset.storeId;
                return {
                    ...asset,
                    maintenanceHistory: [...asset.maintenanceHistory, newLog]
                };
            }
                const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        }));
        
        addAuditLog(`Melaporkan kerusakan cepat untuk aset "${assetName}": ${formData.description}.`, storeId);

        // Reset form
        setFormData({ date: new Date(), description: '', cost: 0 });
        setSelectedAssetId(assets[0]?.id || '');
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Laporkan Kerusakan Aset"
            footer={
              <>
                <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
                <button onClick={handleSave} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan Laporan</button>
              </>
            }
        >
                    updateAsset(prevAssets => prevAssets.map(asset => {
                <div>
                    <label htmlFor="asset" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Pilih Aset</label>
                    <select name="asset" id="asset" value={selectedAssetId} onChange={handleAssetChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="date" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Tanggal</label>
                    <input type="date" name="date" id="date" value={formData.date.toISOString().split('T')[0]} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                <div>
                    <label htmlFor="description" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Deskripsi Kerusakan</label>
                    <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Contoh: Mesin cuci bocor" required />
                </div>
                <div>
                    <label htmlFor="cost" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Biaya Perbaikan (Rp)</label>
                    <input type="text" name="cost" id="cost" value={formatRupiah(formData.cost)} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Opsional" />
                </div>
            </form>
        </Modal>
    );
};

export default QuickMaintenanceModal;
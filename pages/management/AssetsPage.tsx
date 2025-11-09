
import React, { useState } from 'react';
import { mockAssets } from '../../data/mockData';
import { Asset, MaintenanceLog } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, HistoryIcon } from '../../components/icons';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';

const AssetsPage: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>(mockAssets);
    const [isAssetFormModalOpen, setIsAssetFormModalOpen] = useState(false);
    const [isMaintenanceFormModalOpen, setIsMaintenanceFormModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    
    const [currentAsset, setCurrentAsset] = useState<Asset | null>(null);
    const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

    const handleOpenAssetForm = (asset: Asset | null = null) => {
        setCurrentAsset(asset);
        setIsAssetFormModalOpen(true);
    };

    const handleOpenMaintenanceForm = (asset: Asset) => {
        setCurrentAsset(asset);
        setIsMaintenanceFormModalOpen(true);
    };

    const handleOpenHistory = (asset: Asset) => {
        setCurrentAsset(asset);
        setIsHistoryModalOpen(true);
    };

    const handleSaveAsset = (asset: Asset) => {
        if (currentAsset && currentAsset.id) {
            setAssets(assets.map(a => a.id === asset.id ? asset : a));
        } else {
            setAssets([...assets, { ...asset, id: `ASSET${Date.now()}` }]);
        }
        setIsAssetFormModalOpen(false);
        setCurrentAsset(null);
    };
    
    const handleAddMaintenance = (log: Omit<MaintenanceLog, 'id'>) => {
        if(currentAsset) {
            const newLog = { ...log, id: Date.now() };
            const updatedAsset = { 
                ...currentAsset, 
                maintenanceHistory: [...currentAsset.maintenanceHistory, newLog] 
            };
            setAssets(assets.map(a => a.id === currentAsset.id ? updatedAsset : a));
        }
        setIsMaintenanceFormModalOpen(false);
        setCurrentAsset(null);
    };

    const handleDelete = (asset: Asset) => {
        setAssetToDelete(asset);
    };

    const confirmDelete = () => {
        if (assetToDelete) {
            setAssets(assets.filter(a => a.id !== assetToDelete.id));
            setAssetToDelete(null);
        }
    };

    const getStatusBadge = (status: Asset['status']) => {
        switch (status) {
            case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case 'Under Maintenance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case 'Decommissioned': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Aset & Pemeliharaan</h1>
                <button onClick={() => handleOpenAssetForm()} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Tambah Aset
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama Aset</th>
                            <th className="px-4 py-3">Tanggal Beli</th>
                            <th className="px-4 py-3 text-right">Biaya Beli</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => (
                            <tr key={asset.id} className="border-b dark:border-slate-700">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{asset.name}</td>
                                <td className="px-4 py-3">{new Date(asset.purchaseDate).toLocaleDateString('id-ID')}</td>
                                <td className="px-4 py-3 text-right">Rp {asset.purchaseCost.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(asset.status)}`}>{asset.status}</span></td>
                                <td className="px-4 py-3 flex items-center space-x-2">
                                    <button onClick={() => handleOpenAssetForm(asset)} title="Edit Aset" className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(asset)} title="Hapus Aset" className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                    <button onClick={() => handleOpenMaintenanceForm(asset)} title="Tambah Log Pemeliharaan" className="p-2.5 rounded-md text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700"><PlusCircleIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleOpenHistory(asset)} title="Lihat Riwayat Pemeliharaan" className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><HistoryIcon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isAssetFormModalOpen && <AssetFormModal asset={currentAsset} onClose={() => setIsAssetFormModalOpen(false)} onSave={handleSaveAsset} />}
            {isMaintenanceFormModalOpen && currentAsset && <MaintenanceFormModal assetName={currentAsset.name} onClose={() => setIsMaintenanceFormModalOpen(false)} onSave={handleAddMaintenance} />}
            {isHistoryModalOpen && currentAsset && <MaintenanceHistoryModal asset={currentAsset} onClose={() => setIsHistoryModalOpen(false)} />}
            {assetToDelete && <ConfirmationModal isOpen={true} onClose={() => setAssetToDelete(null)} onConfirm={confirmDelete} title="Hapus Aset" message={`Anda yakin ingin menghapus aset "${assetToDelete.name}"?`} />}
        </div>
    );
};


const AssetFormModal: React.FC<{ asset: Asset | null, onClose: () => void, onSave: (asset: Asset) => void }> = ({ asset, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Asset, 'id' | 'maintenanceHistory'>>({
        name: asset?.name || '',
        purchaseDate: asset?.purchaseDate || new Date(),
        purchaseCost: asset?.purchaseCost || 0,
        status: asset?.status || 'Active',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'date' ? new Date(value) : type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: asset?.id || '', maintenanceHistory: asset?.maintenanceHistory || [] });
    };

    return (
        <Modal 
          isOpen={true} 
          onClose={onClose} 
          title={asset ? 'Edit Aset' : 'Tambah Aset Baru'} 
          footer={
            <>
                <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
                <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
            </>
          }
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nama Aset</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="purchaseDate" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Tanggal Beli</label>
                        <input type="date" name="purchaseDate" id="purchaseDate" value={formData.purchaseDate.toISOString().split('T')[0]} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                    <div>
                        <label htmlFor="purchaseCost" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Biaya Beli (Rp)</label>
                        <input type="number" name="purchaseCost" id="purchaseCost" value={formData.purchaseCost} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                </div>
                <div>
                    <label htmlFor="status" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        <option value="Active">Aktif</option>
                        <option value="Under Maintenance">Dalam Perbaikan</option>
                        <option value="Decommissioned">Diberhentikan</option>
                    </select>
                </div>
            </form>
        </Modal>
    );
};

const MaintenanceFormModal: React.FC<{ assetName: string, onClose: () => void, onSave: (log: Omit<MaintenanceLog, 'id'>) => void }> = ({ assetName, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<MaintenanceLog, 'id'>>({
        date: new Date(),
        description: '',
        cost: 0
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'date' ? new Date(value) : type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Tambah Log untuk ${assetName}`} footer={
          <>
            <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
            <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
          </>
        }>
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="date" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Tanggal</label>
                    <input type="date" name="date" id="date" value={formData.date.toISOString().split('T')[0]} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                <div>
                    <label htmlFor="description" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Deskripsi</label>
                    <input type="text" name="description" id="description" value={formData.description} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                <div>
                    <label htmlFor="cost" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Biaya (Rp)</label>
                    <input type="number" name="cost" id="cost" value={formData.cost} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
            </form>
        </Modal>
    );
};

const MaintenanceHistoryModal: React.FC<{ asset: Asset, onClose: () => void }> = ({ asset, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Riwayat Pemeliharaan: ${asset.name}`} footer={<><button onClick={onClose} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Tutup</button></>}>
            {asset.maintenanceHistory.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-3">
                    {asset.maintenanceHistory.sort((a,b) => b.date.getTime() - a.date.getTime()).map(log => (
                        <div key={log.id} className="p-3 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-700">
                            <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">Tanggal: {new Date(log.date).toLocaleDateString('id-ID')}</p>
                            <p className="text-base text-slate-600 dark:text-slate-300">{log.description}</p>
                            <p className="text-base font-medium text-slate-700 dark:text-slate-200 mt-1">Biaya: Rp {log.cost.toLocaleString('id-ID')}</p>
                        </div>
                    ))}
                </div>
            ) : (<p className="text-base text-slate-500 dark:text-slate-400">Tidak ada riwayat pemeliharaan.</p>)}
        </Modal>
    );
};

export default AssetsPage;
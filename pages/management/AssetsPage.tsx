import React, { useState } from 'react';
import { Asset, MaintenanceLog, UserRole } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, HistoryIcon, WrenchIcon, CalendarIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAssets } from '../../contexts/AssetContext';
import { useAppContext } from '../../contexts/AppContext';
import AssetFormModal from '../../components/AssetFormModal';
import MaintenanceFormModal from '../../components/MaintenanceFormModal';
import MaintenanceHistoryModal from '../../components/MaintenanceHistoryModal';
import ScheduledMaintenanceModal from '../../components/ScheduledMaintenanceModal';

const AssetsPage: React.FC = () => {
    const { assets, setAssets } = useAssets();
    const { currentUser, selectedStoreId, stores } = useAppContext();
    const [isAssetFormModalOpen, setIsAssetFormModalOpen] = useState(false);
    const [isMaintenanceFormModalOpen, setIsMaintenanceFormModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    
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
    
    const handleOpenSchedule = (asset: Asset) => {
        setCurrentAsset(asset);
        setIsScheduleModalOpen(true);
    };


    const handleSaveAsset = (asset: Omit<Asset, 'id' | 'maintenanceHistory' | 'storeId'>) => {
        const storeId = currentAsset?.storeId || (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
        if (!storeId || storeId === 'all') {
            alert('Silakan pilih cabang spesifik untuk menambah atau mengedit aset.');
            return;
        }

        if (currentAsset && currentAsset.id) {
            setAssets(prev => prev.map(a => a.id === currentAsset.id ? { ...currentAsset, ...asset } : a));
        } else {
            setAssets(prev => [...prev, { ...asset, id: `ASSET${Date.now()}`, maintenanceHistory: [], storeId }]);
        }
        setIsAssetFormModalOpen(false);
        setCurrentAsset(null);
    };
    
    const handleAddMaintenance = (log: Omit<MaintenanceLog, 'id'>) => {
        if(currentAsset) {
            const newLog = { ...log, id: Date.now() };
            setAssets(prev => prev.map(a => 
                a.id === currentAsset.id 
                ? { ...a, maintenanceHistory: [...a.maintenanceHistory, newLog] } 
                : a
            ));
        }
        setIsMaintenanceFormModalOpen(false);
        setCurrentAsset(null);
    };

    const handleDelete = (asset: Asset) => {
        setAssetToDelete(asset);
    };

    const confirmDelete = () => {
        if (assetToDelete) {
            setAssets(prev => prev.filter(a => a.id !== assetToDelete.id));
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

    const assetsWithStore = assets.map(asset => ({
        ...asset,
        storeName: stores.find(s => s.id === asset.storeId)?.name || 'N/A'
    }));

    const canAddNewAsset = !(currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Aset & Pemeliharaan</h1>
                <button 
                    onClick={() => handleOpenAssetForm()} 
                    className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    disabled={!canAddNewAsset}
                >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Tambah Aset
                </button>
            </div>
            {!canAddNewAsset && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">Pilih cabang spesifik di header untuk menambah aset baru.</p>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama Aset</th>
                            {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && <th className="px-4 py-3">Toko</th>}
                            <th className="px-4 py-3">Tanggal Beli</th>
                            <th className="px-4 py-3 text-right">Biaya Beli</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assetsWithStore.length > 0 ? (
                            assetsWithStore.map(asset => (
                                <tr key={asset.id} className="border-b dark:border-slate-700">
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{asset.name}</td>
                                    {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && <td className="px-4 py-3">{asset.storeName}</td>}
                                    <td className="px-4 py-3">{new Date(asset.purchaseDate).toLocaleDateString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right">Rp {asset.purchaseCost.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(asset.status)}`}>{asset.status}</span></td>
                                    <td className="px-4 py-3 flex items-center space-x-1">
                                        <button onClick={() => handleOpenAssetForm(asset)} title="Edit Aset" className="p-2 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleDelete(asset)} title="Hapus Aset" className="p-2 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                        <button onClick={() => handleOpenMaintenanceForm(asset)} title="Tambah Log Pemeliharaan" className="p-2 rounded-md text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700"><PlusCircleIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleOpenSchedule(asset)} title="Jadwal Perawatan" className="p-2 rounded-md text-purple-600 hover:text-purple-900 dark:text-purple-500 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-700"><CalendarIcon className="w-5 h-5" /></button>
                                        <button onClick={() => handleOpenHistory(asset)} title="Lihat Riwayat Pemeliharaan" className="p-2 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"><HistoryIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 6 : 5} className="text-center py-12">
                                    <WrenchIcon className="mx-auto w-12 h-12 text-slate-400" />
                                    <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">Belum Ada Aset</h3>
                                    <p className="mt-1 text-base text-slate-500">Mulai dengan menambahkan aset pertama Anda.</p>
                                    <div className="mt-6">
                                        <button 
                                            onClick={() => handleOpenAssetForm()} 
                                            disabled={!canAddNewAsset}
                                            className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto disabled:bg-blue-400 disabled:cursor-not-allowed"
                                        >
                                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                                            Tambah Aset
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isAssetFormModalOpen && <AssetFormModal asset={currentAsset} onClose={() => setIsAssetFormModalOpen(false)} onSave={handleSaveAsset} />}
            {isMaintenanceFormModalOpen && currentAsset && <MaintenanceFormModal assetName={currentAsset.name} onClose={() => setIsMaintenanceFormModalOpen(false)} onSave={handleAddMaintenance} />}
            {isHistoryModalOpen && currentAsset && <MaintenanceHistoryModal asset={currentAsset} onClose={() => setIsHistoryModalOpen(false)} />}
            {isScheduleModalOpen && currentAsset && <ScheduledMaintenanceModal asset={currentAsset} isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} />}
            {assetToDelete && <ConfirmationModal isOpen={true} onClose={() => setAssetToDelete(null)} onConfirm={confirmDelete} title="Hapus Aset" message={`Anda yakin ingin menghapus aset "${assetToDelete.name}"?`} />}
        </div>
    );
};

export default AssetsPage;
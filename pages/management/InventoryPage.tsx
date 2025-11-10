import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { InventoryItem, UserRole } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, PackageIcon, SearchIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useInventory } from '../../contexts/InventoryContext';
import { useAppContext } from '../../contexts/AppContext';
import InventoryFormModal from '../../components/InventoryFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';

const InventoryPage: React.FC = () => {
    const { inventory, setInventory } = useInventory();
    const { currentUser, selectedStoreId, stores } = useAppContext();
    const { addAuditLog } = useAuditLogs();
    const { addToast } = useToasts();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.state?.openModal) {
            handleOpenFormModal();
            navigate(location.pathname, { replace: true });
        }
    }, [location.state, navigate]);

    const handleOpenFormModal = (item: InventoryItem | null = null) => {
        setCurrentItem(item);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentItem(null);
    };

    const handleSaveItem = (item: Omit<InventoryItem, 'id' | 'storeId'>) => {
        const storeId = currentItem?.storeId || (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
        if (!storeId || storeId === 'all') {
            addToast('Silakan pilih cabang spesifik untuk menambah atau mengedit item.', 'warning');
            return;
        }

        if (currentItem && currentItem.id) {
            setInventory(prev => prev.map(i => i.id === currentItem.id ? { ...i, ...item } : i));
            addAuditLog(`Memperbarui item inventaris: "${item.name}".`, storeId);
        } else {
            setInventory(prev => [...prev, { ...item, id: `INV${Date.now()}`, storeId }]);
            addAuditLog(`Menambahkan item inventaris baru: "${item.name}".`, storeId);
        }
        handleCloseFormModal();
    };

    const handleDelete = (item: InventoryItem) => {
        setItemToDelete(item);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            setInventory(prev => prev.filter(i => i.id !== itemToDelete.id));
            addAuditLog(`Menghapus item inventaris: "${itemToDelete.name}".`, itemToDelete.storeId);
            setItemToDelete(null);
        }
    };
    
    const inventoryWithStore = useMemo(() => inventory.map(item => ({
        ...item,
        storeName: stores.find(s => s.id === item.storeId)?.name || 'N/A'
    })), [inventory, stores]);

    const filteredInventory = useMemo(() => inventoryWithStore.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [inventoryWithStore, searchTerm]);
    
    const canAddNewItem = !(currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Inventaris</h1>
                <div className="w-full md:w-auto flex items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari item..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <button 
                        onClick={() => handleOpenFormModal()} 
                        className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        disabled={!canAddNewItem}
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Tambah Item
                    </button>
                </div>
            </div>
             {!canAddNewItem && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">Pilih cabang spesifik di header untuk menambah item baru.</p>
            )}
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama Item</th>
                            {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && <th className="px-4 py-3">Toko</th>}
                            <th className="px-4 py-3">Stok</th>
                            <th className="px-4 py-3">Ambang Batas</th>
                            <th className="px-4 py-3">Satuan</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInventory.length > 0 ? (
                            filteredInventory.map(item => {
                                const isLowStock = item.stock <= item.lowStockThreshold;
                                return (
                                    <tr key={item.id} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{item.name}</td>
                                        {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && <td className="px-4 py-3">{item.storeName}</td>}
                                        <td className={`px-4 py-3 ${isLowStock ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-white'}`}>{item.stock}</td>
                                        <td className="px-4 py-3">{item.lowStockThreshold}</td>
                                        <td className="px-4 py-3">{item.unit}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${isLowStock ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                                                {isLowStock ? 'Stok Rendah' : 'Aman'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 flex items-center space-x-2">
                                            <button onClick={() => handleOpenFormModal(item)} className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(item)} className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 7 : 6} className="text-center py-12">
                                    <PackageIcon className="mx-auto w-12 h-12 text-slate-400" />
                                    <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">{searchTerm ? 'Item Tidak Ditemukan' : 'Belum Ada Item Inventaris'}</h3>
                                    <p className="mt-1 text-base text-slate-500">{searchTerm ? 'Coba kata kunci lain atau tambahkan item baru.' : 'Mulai dengan menambahkan item pertama Anda.'}</p>
                                    <div className="mt-6">
                                        <button 
                                            onClick={() => handleOpenFormModal()} 
                                            disabled={!canAddNewItem}
                                            className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto disabled:bg-blue-400 disabled:cursor-not-allowed"
                                        >
                                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                                            Tambah Item
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <InventoryFormModal 
                    item={currentItem} 
                    onClose={handleCloseFormModal}
                    onSave={handleSaveItem}
                />
            )}

            {itemToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Item Inventaris"
                    message={`Apakah Anda yakin ingin menghapus item "${itemToDelete.name}"?`}
                />
            )}
        </div>
    );
};

export default InventoryPage;

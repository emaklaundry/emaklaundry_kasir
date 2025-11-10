

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { InventoryItem, UserRole } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon } from '../../components/icons';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useInventory } from '../../contexts/InventoryContext';
import { useAppContext } from '../../contexts/AppContext';

const InventoryPage: React.FC = () => {
    const { inventory, setInventory } = useInventory();
    const { currentUser, selectedStoreId, stores } = useAppContext();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
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
            alert('Silakan pilih cabang spesifik untuk menambah atau mengedit item.');
            return;
        }

        if (currentItem && currentItem.id) {
            setInventory(prev => prev.map(i => i.id === currentItem.id ? { ...i, ...item } : i));
        } else {
            setInventory(prev => [...prev, { ...item, id: `INV${Date.now()}`, storeId }]);
        }
        handleCloseFormModal();
    };

    const handleDelete = (item: InventoryItem) => {
        setItemToDelete(item);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            setInventory(prev => prev.filter(i => i.id !== itemToDelete.id));
            setItemToDelete(null);
        }
    };
    
    const inventoryWithStore = inventory.map(item => ({
        ...item,
        storeName: stores.find(s => s.id === item.storeId)?.name || 'N/A'
    }));
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Inventaris</h1>
                <button 
                    onClick={() => handleOpenFormModal()} 
                    className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    disabled={currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all'}
                >
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Tambah Item
                </button>
            </div>
             {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
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
                        {inventoryWithStore.map(item => {
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
                        })}
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

// Form modal sub-component
const InventoryFormModal: React.FC<{ item: InventoryItem | null, onClose: () => void, onSave: (item: Omit<InventoryItem, 'id'| 'storeId'>) => void }> = ({ item, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: item?.name || '',
        stock: item?.stock || 0,
        lowStockThreshold: item?.lowStockThreshold || 0,
        unit: item?.unit || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isNumber = ['stock', 'lowStockThreshold'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumber ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={item ? 'Edit Item' : 'Tambah Item Baru'}
            footer={
                <>
                    <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 focus:outline-none hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-white">Batal</button>
                    <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
                </>
            }
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nama Item</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="stock" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Stok</label>
                        <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                     <div>
                        <label htmlFor="unit" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Satuan</label>
                        <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                 </div>
                <div>
                    <label htmlFor="lowStockThreshold" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Ambang Batas Stok Rendah</label>
                    <input type="number" name="lowStockThreshold" id="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
            </form>
        </Modal>
    );
};

export default InventoryPage;
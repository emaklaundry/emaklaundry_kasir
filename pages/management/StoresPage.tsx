
import React, { useState } from 'react';
import { Store } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, PowerIcon } from '../../components/icons';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useStores } from '../../contexts/StoreContext';
import { useAppContext } from '../../contexts/AppContext';
import { useCustomers } from '../../contexts/CustomerContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useAssets } from '../../contexts/AssetContext';
import { useExpenses } from '../../contexts/ExpenseContext';

const StoresPage: React.FC = () => {
    const { stores, setStores } = useStores();
    const { allUsers, selectedStoreId } = useAppContext();
    const { customers } = useCustomers();
    const { transactions } = useTransactions();
    const { inventory } = useInventory();
    const { assets } = useAssets();
    const { expenses } = useExpenses();

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentStore, setCurrentStore] = useState<Store | null>(null);
    const [storeToToggle, setStoreToToggle] = useState<Store | null>(null);
    const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);

    const handleOpenFormModal = (store: Store | null = null) => {
        setCurrentStore(store);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentStore(null);
    };

    const handleSaveStore = (storeData: Omit<Store, 'id' | 'isActive'>) => {
        if (currentStore) {
            // Edit existing store
            setStores(prev => prev.map(s => s.id === currentStore.id ? { ...s, ...storeData } : s));
        } else {
            // Add new store
            const newStore: Store = {
                ...storeData,
                id: `STORE${Date.now()}`,
                isActive: true,
            };
            setStores(prev => [...prev, newStore]);
        }
        handleCloseFormModal();
    };

    const handleToggleStatus = (store: Store) => {
        setStoreToToggle(store);
    };
    
    const handleDelete = (store: Store) => {
        if (selectedStoreId !== 'all') {
            alert('Untuk memastikan integritas data, silakan pilih "Semua Cabang" pada filter di header sebelum menghapus cabang.');
            return;
        }

        const isStoreInUse = allUsers.some(u => u.storeId === store.id) ||
                             customers.some(c => c.storeId === store.id) ||
                             transactions.some(t => t.storeId === store.id) ||
                             inventory.some(i => i.storeId === store.id) ||
                             assets.some(a => a.storeId === store.id) ||
                             expenses.some(e => e.storeId === store.id);

        if (isStoreInUse) {
            alert(`Cabang "${store.name}" tidak dapat dihapus karena masih digunakan oleh data lain (pengguna, pelanggan, transaksi, dll.).`);
            return;
        }

        setStoreToDelete(store);
    };

    const confirmToggleStatus = () => {
        if (storeToToggle) {
            setStores(prev => prev.map(s => s.id === storeToToggle.id ? { ...s, isActive: !s.isActive } : s));
            setStoreToToggle(null);
        }
    };
    
    const confirmDelete = () => {
        if (storeToDelete) {
            setStores(prev => prev.filter(s => s.id !== storeToDelete.id));
            setStoreToDelete(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Cabang</h1>
                <button onClick={() => handleOpenFormModal()} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Tambah Cabang
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama Cabang</th>
                            <th className="px-4 py-3">Alamat</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stores.map(store => (
                            <tr key={store.id} className="border-b dark:border-slate-700">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{store.name}</td>
                                <td className="px-4 py-3">{store.address}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-sm font-medium rounded-full ${store.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                        {store.isActive ? 'Aktif' : 'Tidak Aktif'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 flex items-center space-x-2">
                                    <button onClick={() => handleOpenFormModal(store)} title="Edit" className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                    <button 
                                        onClick={() => handleToggleStatus(store)} 
                                        title={store.isActive ? "Nonaktifkan" : "Aktifkan"} 
                                        className={`p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${store.isActive ? 'text-yellow-600 hover:text-yellow-900 dark:text-yellow-500 dark:hover:text-yellow-400' : 'text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400'}`}
                                    >
                                        <PowerIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(store)} title="Hapus" className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <StoreFormModal 
                    store={currentStore} 
                    onClose={handleCloseFormModal}
                    onSave={handleSaveStore}
                />
            )}

            {storeToToggle && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setStoreToToggle(null)}
                    onConfirm={confirmToggleStatus}
                    title={`${storeToToggle.isActive ? 'Nonaktifkan' : 'Aktifkan'} Cabang`}
                    message={`Apakah Anda yakin ingin ${storeToToggle.isActive ? 'menonaktifkan' : 'mengaktifkan'} cabang "${storeToToggle.name}"?`}
                    confirmText={storeToToggle.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    confirmColor={storeToToggle.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}
                />
            )}
            
            {storeToDelete && (
                 <ConfirmationModal
                    isOpen={true}
                    onClose={() => setStoreToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Cabang"
                    message={`Apakah Anda yakin ingin menghapus cabang "${storeToDelete.name}" secara permanen? Tindakan ini tidak dapat diurungkan.`}
                />
            )}
        </div>
    );
};

const StoreFormModal: React.FC<{ store: Store | null, onClose: () => void, onSave: (store: Omit<Store, 'id' | 'isActive'>) => void }> = ({ store, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: store?.name || '',
        address: store?.address || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={store ? 'Edit Cabang' : 'Tambah Cabang Baru'}
            footer={
                <>
                    <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 focus:outline-none hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-white">Batal</button>
                    <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
                </>
            }
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nama Cabang</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                 <div>
                    <label htmlFor="address" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Alamat</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
            </form>
        </Modal>
    );
};

export default StoresPage;

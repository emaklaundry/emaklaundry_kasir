import React, { useState } from 'react';
import Modal from './Modal';
import { InventoryItem } from '../types';

interface InventoryFormModalProps {
    item: InventoryItem | null,
    onClose: () => void,
    onSave: (item: Omit<InventoryItem, 'id'| 'storeId'>) => void
}

const InventoryFormModal: React.FC<InventoryFormModalProps> = ({ item, onClose, onSave }) => {
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

export default InventoryFormModal;

import React, { useState } from 'react';
import Modal from './Modal';
import { Customer } from '../types';

interface CustomerFormModalProps {
    customer: Customer | null;
    onClose: () => void;
    onSave: (customer: Omit<Customer, 'id' | 'storeId'>) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Customer, 'id' | 'storeId'>>({
        name: customer?.name || '',
        phone: customer?.phone || '',
        address: customer?.address || '',
        notes: customer?.notes || '',
        defaultDiscount: customer?.defaultDiscount || 0,
        createdAt: customer?.createdAt || new Date(),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: Math.max(0, parseFloat(value) || 0) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={customer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
            footer={
                <>
                    <button type="button" onClick={onClose} className="text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600">Batal</button>
                    <button type="submit" onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
                </>
            }
        >
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="name" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nama Pelanggan</label>
                        <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                    <div>
                        <label htmlFor="phone" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nomor Telepon</label>
                        <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                </div>
                <div>
                    <label htmlFor="address" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Alamat (Opsional)</label>
                    <input type="text" name="address" id="address" value={formData.address} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="defaultDiscount" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Diskon Standar (%)</label>
                    <input type="number" name="defaultDiscount" id="defaultDiscount" min="0" max="100" value={formData.defaultDiscount} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Diskon ini akan otomatis diterapkan saat membuat transaksi baru.</p>
                </div>
                <div>
                    <label htmlFor="notes" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Catatan (Opsional)</label>
                    <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"></textarea>
                </div>
            </form>
        </Modal>
    );
};

export default CustomerFormModal;
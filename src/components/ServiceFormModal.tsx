import React, { useState } from 'react';
import Modal from './Modal';
import { Service, ServiceCategory } from '../../types';
import { formatRupiah, parseRupiah } from '../../utils/formatting';

interface ServiceFormModalProps {
    service: Service | null,
    onClose: () => void,
    onSave: (service: Omit<Service, 'id' | 'storeId'>) => void
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ service, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Service, 'id' | 'storeId'>>({
        name: service?.name || '',
        category: service?.category || ServiceCategory.Kiloan,
        price: service?.price || 0,
        unit: service?.unit || 'kg',
        durationDays: service?.durationDays || 0,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'price' || name === 'durationDays') {
            const numericValue = name === 'price' ? parseRupiah(value) : parseInt(value, 10);
            setFormData(prev => ({ ...prev, [name]: Math.max(0, isNaN(numericValue) ? 0 : numericValue) }));
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
            title={service ? 'Edit Layanan' : 'Tambah Layanan Baru'}
            footer={
                <>
                    <button onClick={onClose} className="text-slate-900 bg-white border border-slate-300 focus:outline-none hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-white">Batal</button>
                    <button onClick={handleSubmit} className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">Simpan</button>
                </>
            }
        >
            <form className="space-y-4">
                <div>
                    <label htmlFor="name" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Nama Layanan</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
                 <div>
                    <label htmlFor="category" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Kategori</label>
                    <select name="category" id="category" value={formData.category} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                        {Object.values(ServiceCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="price" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Harga</label>
                        <input type="text" name="price" id="price" value={formatRupiah(formData.price)} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                     <div>
                        <label htmlFor="unit" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Satuan</label>
                        <input type="text" name="unit" id="unit" value={formData.unit} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                    </div>
                 </div>
                <div>
                    <label htmlFor="durationDays" className="block mb-2 text-base font-medium text-slate-900 dark:text-white">Durasi (hari)</label>
                    <input type="number" min="0" name="durationDays" id="durationDays" value={formData.durationDays} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
            </form>
        </Modal>
    );
};

export default ServiceFormModal;
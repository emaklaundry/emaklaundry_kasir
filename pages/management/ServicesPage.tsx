
import React, { useState } from 'react';
import { mockServices } from '../../data/mockData';
import { Service, ServiceCategory } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon } from '../../components/icons';
import Modal from '../../components/Modal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { formatRupiah, parseRupiah } from '../../utils/formatting';

const ServicesPage: React.FC = () => {
    const [services, setServices] = useState<Service[]>(mockServices);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState<Service | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

    const handleOpenFormModal = (service: Service | null = null) => {
        setCurrentService(service);
        setIsFormModalOpen(true);
    };

    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setCurrentService(null);
    };

    const handleSaveService = (service: Service) => {
        if (currentService && currentService.id) {
            setServices(services.map(s => s.id === service.id ? service : s));
        } else {
            setServices([...services, { ...service, id: `S${Date.now()}` }]);
        }
        handleCloseFormModal();
    };

    const handleDelete = (service: Service) => {
        setServiceToDelete(service);
    };

    const confirmDelete = () => {
        if (serviceToDelete) {
            setServices(services.filter(s => s.id !== serviceToDelete.id));
            setServiceToDelete(null);
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Layanan</h1>
                <button onClick={() => handleOpenFormModal()} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Tambah Layanan
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3">Nama Layanan</th>
                            <th className="px-4 py-3">Kategori</th>
                            <th className="px-4 py-3">Harga</th>
                            <th className="px-4 py-3">Durasi</th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {services.map(service => (
                            <tr key={service.id} className="border-b dark:border-slate-700">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{service.name}</td>
                                <td className="px-4 py-3">{service.category}</td>
                                <td className="px-4 py-3">Rp {service.price.toLocaleString('id-ID')} / {service.unit}</td>
                                <td className="px-4 py-3">{service.durationDays} hari</td>
                                <td className="px-4 py-3 flex items-center space-x-2">
                                    <button onClick={() => handleOpenFormModal(service)} className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"><EditIcon className="w-5 h-5" /></button>
                                    <button onClick={() => handleDelete(service)} className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"><Trash2Icon className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isFormModalOpen && (
                <ServiceFormModal 
                    service={currentService} 
                    onClose={handleCloseFormModal}
                    onSave={handleSaveService}
                />
            )}

            {serviceToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setServiceToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Layanan"
                    message={`Apakah Anda yakin ingin menghapus layanan "${serviceToDelete.name}"? Tindakan ini tidak dapat diurungkan.`}
                />
            )}
        </div>
    );
};

// Sub-component for the form inside the modal
const ServiceFormModal: React.FC<{ service: Service | null, onClose: () => void, onSave: (service: Service) => void }> = ({ service, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Service, 'id'>>({
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
            setFormData(prev => ({ ...prev, [name]: isNaN(numericValue) ? 0 : numericValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: service?.id || '' });
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
                    <input type="number" name="durationDays" id="durationDays" value={formData.durationDays} onChange={handleChange} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white" required />
                </div>
            </form>
        </Modal>
    );
};

export default ServicesPage;

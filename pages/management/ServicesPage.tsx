import React, { useState } from 'react';
import { Service, ServiceCategory } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, PackageIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useServices } from '../../contexts/ServiceContext';
import ServiceFormModal from '../../components/ServiceFormModal';

const ServicesPage: React.FC = () => {
    const { services, setServices } = useServices();
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

    const handleSaveService = (serviceData: Omit<Service, 'id'>) => {
        if (currentService) {
            setServices(prev => prev.map(s => s.id === currentService.id ? { ...currentService, ...serviceData } : s));
        } else {
            setServices(prev => [...prev, { ...serviceData, id: `S${Date.now()}` }]);
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
                        {services.length > 0 ? (
                            services.map(service => (
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
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-12">
                                    <PackageIcon className="mx-auto w-12 h-12 text-slate-400" />
                                    <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">Belum Ada Layanan</h3>
                                    <p className="mt-1 text-base text-slate-500">Mulai dengan menambahkan layanan pertama Anda.</p>
                                    <div className="mt-6">
                                        <button onClick={() => handleOpenFormModal()} className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto">
                                            <PlusCircleIcon className="h-5 w-5 mr-2" />
                                            Tambah Layanan
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )}
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

export default ServicesPage;

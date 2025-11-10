import React, { useState, useMemo } from 'react';
import { Service, ServiceCategory } from '../../types';
import { PlusCircleIcon, EditIcon, Trash2Icon, PackageIcon, SearchIcon, ArrowUpIcon, ArrowDownIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useServices } from '../../contexts/ServiceContext';
import ServiceFormModal from '../../components/ServiceFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useSortableData } from '../../hooks/useSortableData';

const ServicesPage: React.FC = () => {
    const { services, setServices } = useServices();
    const { addAuditLog } = useAuditLogs();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [currentService, setCurrentService] = useState<Service | null>(null);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredServices = useMemo(() => services.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase())
    ), [services, searchTerm]);

    const { items: sortedServices, requestSort, sortConfig } = useSortableData<Service>(filteredServices);
    
    const getSortIcon = (key: keyof Service) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
        return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
    };

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
            addAuditLog(`Memperbarui layanan: "${serviceData.name}".`);
        } else {
            setServices(prev => [...prev, { ...serviceData, id: `S${Date.now()}` }]);
            addAuditLog(`Menambahkan layanan baru: "${serviceData.name}".`);
        }
        handleCloseFormModal();
    };

    const handleDelete = (service: Service) => {
        setServiceToDelete(service);
    };

    const confirmDelete = () => {
        if (serviceToDelete) {
            setServices(services.filter(s => s.id !== serviceToDelete.id));
            addAuditLog(`Menghapus layanan: "${serviceToDelete.name}".`);
            setServiceToDelete(null);
        }
    };
    
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Layanan</h1>
                <div className="w-full md:w-auto flex items-center gap-4">
                    <div className="relative w-full md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari layanan..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <button onClick={() => handleOpenFormModal()} className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Tambah Layanan
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                        <tr>
                            <th className="px-4 py-3"><button onClick={() => requestSort('name')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Nama Layanan {getSortIcon('name')}</button></th>
                            <th className="px-4 py-3"><button onClick={() => requestSort('category')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Kategori {getSortIcon('category')}</button></th>
                            <th className="px-4 py-3"><button onClick={() => requestSort('price')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Harga {getSortIcon('price')}</button></th>
                            <th className="px-4 py-3"><button onClick={() => requestSort('durationDays')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Durasi {getSortIcon('durationDays')}</button></th>
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedServices.length > 0 ? (
                            sortedServices.map(service => (
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
                                    <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">{searchTerm ? 'Layanan Tidak Ditemukan' : 'Belum Ada Layanan'}</h3>
                                    <p className="mt-1 text-base text-slate-500">{searchTerm ? 'Coba kata kunci lain atau tambahkan layanan baru.' : 'Mulai dengan menambahkan layanan pertama Anda.'}</p>
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
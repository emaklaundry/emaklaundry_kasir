import React, { useState, useMemo } from 'react';
import { Service, ServiceCategory, UserRole } from '@/types';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  PackageIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useServices } from '../../contexts/ServiceContext';
import { useToasts } from '../../contexts/ToastContext';
import ServiceFormModal from '../../components/ServiceFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useSortableData } from '../../hooks/useSortableData';
import { useAppContext } from '../../contexts/AppContext';

const ServicesPage: React.FC = () => {
  const { services, addService, updateService, deleteService } = useServices();
  const { addAuditLog } = useAuditLogs();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast, updateToast } = useToasts();
  const [isSavingService, setIsSavingService] = useState(false);
  const { currentUser, selectedStoreId } = useAppContext();

  const filteredServices = useMemo(
    () =>
      services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          service.category.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [services, searchTerm],
  );

  const {
    items: sortedServices,
    requestSort,
    sortConfig,
  } = useSortableData<Service>(filteredServices);

  const getSortIcon = (key: keyof Service) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
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

  const handleSaveService = async (serviceData: Omit<Service, 'id' | 'storeId'>) => {
    // Determine storeId to attach to the service so inserts/updates comply with RLS policies.
    const storeId =
      currentService?.storeId ||
      (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);

    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk menambah atau mengedit layanan.', 'warning');
      return;
    }

    const toastId = addToast('Menyimpan layanan...', 'info');
    setIsSavingService(true);
    try {
      if (currentService) {
        // include storeId when updating since the form doesn't include it
        await updateService(currentService.id, { ...serviceData, storeId });
        addAuditLog(`Memperbarui layanan: "${serviceData.name}".`, storeId);
        updateToast(toastId, 'Layanan berhasil diperbarui.', 'success');
      } else {
        await addService({ ...serviceData, storeId });
        addAuditLog(`Menambahkan layanan baru: "${serviceData.name}".`, storeId);
        updateToast(toastId, 'Layanan baru berhasil ditambahkan.', 'success');
      }
      handleCloseFormModal();
    } catch (error: any) {
      updateToast(toastId, `Gagal menyimpan layanan: ${error.message}`, 'error');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDelete = (service: Service) => {
    setServiceToDelete(service);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      const toastId = addToast('Menghapus layanan...', 'info');
      setIsSavingService(true);
      try {
        await deleteService(serviceToDelete.id);
        addAuditLog(`Menghapus layanan: "${serviceToDelete.name}".`);
        updateToast(toastId, 'Layanan berhasil dihapus.', 'success');
      } catch (error: any) {
        updateToast(toastId, `Gagal menghapus layanan: ${error.message}`, 'error');
      } finally {
        setServiceToDelete(null);
        setIsSavingService(false);
      }
    }
  };

  return (
    <div className="relative bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
      {isSavingService && (
        <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/60 flex items-center justify-center rounded-lg z-20">
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <span className="text-slate-700 dark:text-slate-200 font-medium">Memproses...</span>
          </div>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Manajemen Layanan</h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari layanan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <button
            onClick={() => handleOpenFormModal()}
            className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Tambah Layanan
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Nama Layanan {getSortIcon('name')}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('category')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Kategori {getSortIcon('category')}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('price')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Harga {getSortIcon('price')}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('durationDays')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Durasi {getSortIcon('durationDays')}
                </button>
              </th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedServices.length > 0 ? (
              sortedServices.map((service) => (
                <tr key={service.id} className="border-b dark:border-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    {service.name}
                  </td>
                  <td className="px-4 py-3">{service.category}</td>
                  <td className="px-4 py-3">
                    Rp {service.price.toLocaleString('id-ID')} / {service.unit}
                  </td>
                  <td className="px-4 py-3">{service.durationDays} hari</td>
                  <td className="px-4 py-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenFormModal(service)}
                      className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(service)}
                      className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<PackageIcon className="mx-auto w-12 h-12 text-slate-400" />}
                    title={searchTerm ? 'Layanan Tidak Ditemukan' : 'Belum Ada Layanan'}
                    description={
                      searchTerm
                        ? 'Coba kata kunci lain atau tambahkan layanan baru.'
                        : 'Mulai dengan menambahkan layanan pertama Anda.'
                    }
                  >
                    <button
                      onClick={() => handleOpenFormModal()}
                      className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto"
                    >
                      <PlusCircleIcon className="h-5 w-5 mr-2" />
                      Tambah Layanan
                    </button>
                  </EmptyState>
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

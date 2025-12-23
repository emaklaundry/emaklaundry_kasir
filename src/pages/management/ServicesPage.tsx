import React, { useState, useMemo, useRef } from 'react';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  PackageIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DownloadIcon,
  UploadIcon,
} from '../../components/icons';
import {
  exportServicesToExcel,
  importServicesFromExcel,
  downloadServiceTemplate,
} from '../../utils/excelUtils';
import { supabase } from '../../utils/supabaseClient';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useServices } from '../../contexts/ServiceContext';
import { useTransactions } from '../../contexts/TransactionContext';
import useToasts from '../../contexts/useToasts';
import ServiceFormModal from '../../components/ServiceFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useSortableData } from '../../hooks/useSortableData';
import useAppContext from '../../contexts/useAppContext';
import { Service, UserRole } from '@/types';

const ServicesPage: React.FC = () => {
  const { services, addService, updateService, deleteService } = useServices();
  const { transactions } = useTransactions();
  const { addAuditLog } = useAuditLogs();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast, updateToast } = useToasts();
  const [isSavingService, setIsSavingService] = useState(false);
  const { currentUser, selectedStoreId } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'Kiloan' | 'Satuan' | 'Express' | 'Khusus'
  >('all');

  const filteredServices = useMemo(() => {
    let filtered = services.filter(
      (service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.category.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((service) => service.category === categoryFilter);
    }

    return filtered;
  }, [services, searchTerm, categoryFilter]);

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
      (currentUser?.role === UserRole.SuperAdmin ? selectedStoreId : currentUser?.storeId);

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
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal menyimpan layanan: ${errMsg}`, 'error');
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDelete = (service: Service) => {
    // FIXED: Check if service is used in any transaction
    const transactionsWithService = transactions.filter((tx) =>
      tx.items?.some((item) => item.serviceId === service.id),
    );

    if (transactionsWithService.length > 0) {
      addToast(
        `Layanan "${service.name}" tidak dapat dihapus karena masih digunakan dalam ${transactionsWithService.length} transaksi.`,
        'error',
      );
      addAuditLog(
        `Gagal menghapus layanan "${service.name}" - masih digunakan dalam ${transactionsWithService.length} transaksi.`,
      );
      return;
    }

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
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'message' in error) {
          updateToast(
            toastId,
            `Gagal menghapus layanan: ${(error as { message: string }).message}`,
            'error',
          );
        } else {
          updateToast(toastId, 'Gagal menghapus layanan: Unknown error', 'error');
        }
      } finally {
        setServiceToDelete(null);
        setIsSavingService(false);
      }
    }
  };

  // Excel Export
  const handleExportToExcel = async () => {
    const toastId = addToast('Mengekspor layanan...', 'info');
    try {
      // Fetch SEMUA layanan dari database
      updateToast(toastId, 'Mengambil semua data layanan...', 'info');

      let query = supabase.from('services').select('*');

      // Filter by store if needed
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      const { data: allServices, error } = await query;

      if (error) throw error;
      if (!allServices || allServices.length === 0) {
        updateToast(toastId, 'Tidak ada layanan untuk diekspor.', 'warning');
        return;
      }

      updateToast(toastId, `Mengekspor ${allServices.length} layanan...`, 'info');

      const servicesToExport = allServices.map((s) => ({
        ...s,
        storeId: s.storeId ?? undefined,
      })) as unknown as Service[];

      await exportServicesToExcel(servicesToExport);
      updateToast(
        toastId,
        `Berhasil mengekspor ${allServices.length} layanan ke Excel.`,
        'success',
      );
    } catch (error) {
      console.error('Export error:', error);
      addToast('Gagal export data ke Excel', 'error');
    }
  };

  // Excel Import
  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSavingService(true);
    const toastId = addToast('Memproses import data...', 'info');

    try {
      const importedServices = await importServicesFromExcel(file);

      let successCount = 0;
      let errorCount = 0;
      let skipCount = 0;

      for (const service of importedServices) {
        try {
          if (service.id) {
            // Validate UUID format before UPDATE
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(service.id)) {
              console.warn('Invalid UUID skipped:', service.id);
              skipCount++;
              continue;
            }

            // Update existing service
            // Update existing service
            const updatePayload: Partial<Service> = {
              name: service.name!,
              category: service.category!,
              washType: service.washType, // Include washType
              price: service.price!,
              unit: service.unit!,
              durationDays: service.durationDays!,
            };

            if (selectedStoreId !== 'all') {
              updatePayload.storeId = selectedStoreId;
            }

            await updateService(service.id, updatePayload);
            successCount++;
          } else {
            // Check for duplicate service (same name + category)
            const existingService = services.find(
              (s) =>
                s.name.toLowerCase() === service.name?.toLowerCase() &&
                s.category === service.category,
            );

            if (existingService) {
              console.warn('Duplicate service skipped:', service.name, service.category);
              skipCount++;
              continue;
            }

            // Ensure storeId is set for INSERT (RLS policy requirement)
            const storeId = selectedStoreId === 'all' ? currentUser?.storeId : selectedStoreId;

            if (!storeId) {
              console.error('storeId is required for new services');
              errorCount++;
              continue;
            }

            // Add new service
            await addService({
              name: service.name!,
              category: service.category!,
              washType: service.washType!, // Include washType
              price: service.price!,
              unit: service.unit!,
              durationDays: service.durationDays!,
              storeId: storeId!,
            });
            successCount++;
          }
        } catch (error) {
          console.error('Error importing service:', service, error);
          errorCount++;
        }
      }

      if (skipCount > 0) {
        updateToast(
          toastId,
          `Import selesai: ${successCount} berhasil, ${errorCount} gagal, ${skipCount} dilewati (duplikat/invalid)`,
          'warning',
        );
      } else if (errorCount > 0) {
        updateToast(
          toastId,
          `Import selesai: ${successCount} berhasil, ${errorCount} gagal`,
          'warning',
        );
      } else {
        updateToast(toastId, `Berhasil import ${successCount} layanan`, 'success');
      }

      addAuditLog(`Import ${successCount} layanan dari Excel.`, currentUser?.storeId);
    } catch (error) {
      console.error('Import error:', error);
      updateToast(toastId, 'Gagal import data dari Excel', 'error');
    } finally {
      setIsSavingService(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download Template
  const handleDownloadTemplate = async () => {
    try {
      await downloadServiceTemplate();
      addToast('Template Excel berhasil didownload', 'success');
    } catch (error) {
      console.error('Download template error:', error);
      addToast('Gagal download template', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Layanan</h1>
        <div className="flex gap-2">
          {/* Excel Import/Export Buttons */}
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600"
            title="Download Template Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Template</span>
          </button>

          <input
            ref={fileInputRef}
            id="service-import-file"
            name="service-import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFromExcel}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSavingService}
            className="flex items-center gap-2 px-3 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
            title="Import dari Excel"
          >
            <UploadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Import</span>
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={services.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            title="Export ke Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Export</span>
          </button>

          <button
            onClick={() => handleOpenFormModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tambah Layanan
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            id="service-search"
            name="service-search"
            placeholder="Cari layanan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            autoComplete="off"
          />
        </div>
        <select
          id="service-category-filter"
          name="service-category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
          className="w-full sm:w-48 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="all">Semua Kategori</option>
          <option value="Kiloan">Kiloan</option>
          <option value="Satuan">Satuan</option>
          <option value="Express">Express</option>
          <option value="Khusus">Khusus</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 uppercase">
            <tr>
              <th className="px-6 py-3">No</th>
              <th className="px-6 py-3">
                <button
                  onClick={() => requestSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Nama Layanan {getSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => requestSort('category')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Kategori {getSortIcon('category')}
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => requestSort('washType')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Jenis Cucian {getSortIcon('washType')}
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => requestSort('price')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Harga {getSortIcon('price')}
                </button>
              </th>
              <th className="px-6 py-3">
                <button
                  onClick={() => requestSort('durationDays')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Durasi {getSortIcon('durationDays')}
                </button>
              </th>
              <th className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedServices.length > 0 ? (
              sortedServices.map((service, index) => (
                <tr
                  key={service.id}
                  className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {service.name}
                  </td>
                  <td className="px-6 py-4">{service.category}</td>
                  <td className="px-6 py-4">{service.washType}</td>
                  <td className="px-6 py-4">
                    Rp {service.price.toLocaleString('id-ID')}/{service.unit}
                  </td>
                  <td className="px-6 py-4">{service.durationDays} hari</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
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
                    </div>
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

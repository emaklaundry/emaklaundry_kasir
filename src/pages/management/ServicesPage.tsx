import React, { useState, useMemo, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  PackageIcon,
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
import { formatMinQuantity } from '../../utils/serviceMinimum';
import SearchInput from '../../components/SearchInput';

const ServicesPage: React.FC = () => {
  const { services, addService, updateService, deleteService } = useServices();
  const { transactions } = useTransactions();
  const { addAuditLog } = useAuditLogs();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
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
        service.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        service.category.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((service) => service.category === categoryFilter);
    }

    return filtered;
  }, [services, debouncedSearch, categoryFilter]);

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
        washType: s.wash_type,
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
      <div className="flex justify-end">
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Excel Import/Export Buttons */}
          <button
            onClick={handleDownloadTemplate}
            className="btn btn-secondary btn-sm"
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
            className="btn btn-secondary btn-sm"
            title="Import dari Excel"
          >
            <UploadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Import</span>
          </button>

          <button
            onClick={handleExportToExcel}
            disabled={services.length === 0}
            className="btn btn-primary btn-sm"
            title="Export ke Excel"
          >
            <DownloadIcon className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Export</span>
          </button>

          <button onClick={() => handleOpenFormModal()} className="btn btn-primary btn-sm">
            Tambah Layanan
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchInput
          id="service-search"
          name="service-search"
          label="Cari layanan"
          placeholder="Cari layanan..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          wrapperClassName="flex-1"
        />
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

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 uppercase">
            <tr>
              <th className="hidden sm:table-cell px-3 sm:px-4 py-2.5">No</th>
              <th className="px-3 sm:px-4 py-2.5">
                <button
                  onClick={() => requestSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Nama Layanan {getSortIcon('name')}
                </button>
              </th>
              <th className="px-3 sm:px-4 py-2.5">
                <button
                  onClick={() => requestSort('category')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Kategori {getSortIcon('category')}
                </button>
              </th>
              <th className="hidden md:table-cell px-3 sm:px-4 py-2.5">
                <button
                  onClick={() => requestSort('washType')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Jenis Cucian {getSortIcon('washType')}
                </button>
              </th>
              <th className="px-3 sm:px-4 py-2.5">
                <button
                  onClick={() => requestSort('price')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Harga {getSortIcon('price')}
                </button>
              </th>
              <th className="hidden md:table-cell px-3 sm:px-4 py-2.5">
                <button
                  onClick={() => requestSort('durationDays')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Durasi {getSortIcon('durationDays')}
                </button>
              </th>
              <th className="px-3 sm:px-4 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedServices.length > 0 ? (
              sortedServices.map((service, index) => (
                <tr
                  key={service.id}
                  className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="hidden sm:table-cell px-3 sm:px-4 py-2.5 sm:py-4 text-slate-500 dark:text-slate-400">
                    {index + 1}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-4 font-medium text-slate-900 dark:text-white">
                    {service.name}
                    {service.showOnWeb && (
                      <span
                        className="ml-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        title="Harga layanan ini tampil di website"
                      >
                        Di web
                      </span>
                    )}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-4">{service.category}</td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-2.5 sm:py-4">
                    {service.washType}
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-4 whitespace-nowrap tabular-nums">
                    Rp {service.price.toLocaleString('id-ID')}/{service.unit}
                    {(service.minQuantity ?? 0) > 0 && (
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        Min. {formatMinQuantity(service.minQuantity!)} {service.unit}
                      </span>
                    )}
                  </td>
                  <td className="hidden md:table-cell px-3 sm:px-4 py-2.5 sm:py-4 whitespace-nowrap">
                    {service.durationDays} hari
                  </td>
                  <td className="px-3 sm:px-4 py-2.5 sm:py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenFormModal(service)}
                        aria-label={`Ubah ${service.name}`}
                        title="Ubah"
                        className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        aria-label={`Hapus ${service.name}`}
                        title="Hapus"
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
                <td colSpan={7}>
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
                      className="btn btn-primary mx-auto"
                    >
                      <PlusCircleIcon className="h-5 w-5" />
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

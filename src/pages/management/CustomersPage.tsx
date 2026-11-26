import React, { useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  SearchIcon,
  UsersIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DownloadIcon,
  UploadIcon,
  RefreshCwIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import {
  fetchCustomersWithStats,
  CustomerActivity,
  CustomerSortKey,
  findCustomerByPhone,
  useCustomerMutations,
} from '../../contexts/CustomerContext';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { can } from '../../config/permissions';
import useAppContext from '../../contexts/useAppContext';
import CustomerFormModal from '../../components/CustomerFormModal';
import { normalizePhone } from '../../utils/phone';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import { useServerSort } from '../../hooks/useServerSort';
import { useDebounce } from '../../hooks/useDebounce';
// import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';
import { Customer, UserRole } from '@/types';
import {
  exportCustomersToExcel,
  importCustomersFromExcel,
  downloadCustomerTemplate,
} from '../../utils/excelUtils';
import { supabase } from '../../utils/supabaseClient';
import GoogleContactsImportModal from '../../components/GoogleContactsImportModal';
import { GoogleContact, useGoogleContacts } from '../../hooks/useGoogleContacts';

const CustomersPage: React.FC = () => {
  const { currentUser, selectedStoreId } = useAppContext();
  // Kasir boleh membuka halaman ini untuk tambah & ubah pelanggan;
  // hapus, import, export, dan sinkron Google tetap khusus Admin.
  const canManageCustomers = can(currentUser?.role, 'branch.manage');
  const {
    createContact,
    signIn,
    isAuthenticated,
    isLoading: isGoogleLoading,
  } = useGoogleContacts();
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [activityFilter, setActivityFilter] = useState<CustomerActivity>('all');

  // Urutan, filter aktivitas & paginasi dikerjakan server (view customers_with_stats)
  // agar berlaku untuk semua pelanggan, bukan hanya halaman aktif.
  const { sortConfig, requestSort } = useServerSort<CustomerSortKey>(
    { key: 'createdAt', direction: 'descending' },
    () => setPage(1),
  );
  const sortBy = sortConfig.key;
  const sortAscending = sortConfig.direction === 'ascending';

  const { data: result = { data: [], count: 0 } } = useQuery({
    queryKey: [
      'customers',
      {
        page,
        pageSize,
        searchTerm: debouncedSearchTerm,
        storeId: selectedStoreId,
        sortBy,
        sortAscending,
        activity: activityFilter,
      },
    ],
    queryFn: () =>
      fetchCustomersWithStats({
        page,
        pageSize,
        searchTerm: debouncedSearchTerm,
        storeId: selectedStoreId,
        sortBy,
        sortAscending,
        activity: activityFilter,
      }),
    placeholderData: (previousData) => previousData,
  });
  const customers = result.data;
  const totalCount = result.count;
  const totalPages = Math.ceil(totalCount / pageSize);

  const { addCustomer, updateCustomer, deleteCustomer } = useCustomerMutations();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [confirm, confirmDialog] = useConfirmDialog();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGoogleImportModalOpen, setIsGoogleImportModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // type CustomerInput = Omit<Customer, 'id'>;
  // const addCustomerMutation = useMutation({
  //   mutationFn: async (data: CustomerInput) => addCustomer(data),
  // });
  // const updateCustomerMutation = useMutation({
  //   mutationFn: async ({ id, data }: { id: string; data: CustomerInput }) =>
  //     updateCustomer(id, data),
  // });

  // Data sudah diurutkan & difilter server
  const paginatedCustomers = customers;

  const getSortIcon = (key: CustomerSortKey) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending') {
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    }
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const handleOpenFormModal = (customer?: Customer | null) => {
    setCurrentCustomer(customer ?? null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentCustomer(null);
  };

  const handleSaveCustomer = async (
    customerData: Omit<Customer, 'id' | 'storeId' | 'createdAt'>,
  ) => {
    // Pilih storeId sesuai role user
    const storeId =
      currentCustomer?.storeId ||
      (currentUser?.role === UserRole.SuperAdmin ? selectedStoreId : currentUser?.storeId);
    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk menambah atau mengedit pelanggan.', 'warning');
      return;
    }
    // Normalisasi nomor telepon hanya jika diisi
    // Format 08xxx sama dengan data yang sudah tersimpan, agar cek duplikat akurat.
    const phone = normalizePhone(customerData.phone);
    if (phone) {
      // Cek langsung ke database: daftar di layar hanya berisi satu halaman hasil.
      // Kalau pengecekan gagal (mis. koneksi), lanjut simpan; database tetap menolak nomor ganda.
      const owner = await findCustomerByPhone(phone, storeId).catch(() => null);
      if (owner && owner.id !== currentCustomer?.id) {
        addAuditLog(
          `Gagal menyimpan pelanggan "${customerData.name}" - nomor telepon ${phone} sudah digunakan oleh "${owner.name}".`,
          storeId,
        );
        const openOwner = await confirm({
          title: 'Nomor Sudah Terdaftar',
          message: `Nomor ${phone} sudah terdaftar atas nama "${owner.name}". Buka data pelanggan tersebut?`,
          confirmText: 'Lihat Pelanggan',
          confirmVariant: 'primary',
        });
        if (openOwner) {
          handleCloseFormModal();
          navigate(`/management/customers/${owner.id}`);
        }
        // Batal: form tetap terbuka agar nomor bisa dibetulkan.
        return;
      }
    }

    const toastId = addToast('Menyimpan pelanggan...', 'info');
    setIsSaving(true);
    try {
      if (currentCustomer && currentCustomer.id) {
        await updateCustomer(currentCustomer.id, {
          ...customerData,
          phone: phone || undefined,
          storeId,
        });
        addAuditLog(`Memperbarui data pelanggan: "${customerData.name}".`, storeId);

        updateToast(toastId, 'Data pelanggan berhasil diperbarui!', 'success');
      } else {
        await addCustomer({
          ...customerData,
          phone: phone || undefined,
          createdAt: new Date(),
          storeId,
        });
        addAuditLog(`Menambahkan pelanggan baru: "${customerData.name}".`, storeId);
        updateToast(toastId, 'Pelanggan baru berhasil ditambahkan!', 'success');
      }
      handleCloseFormModal();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        updateToast(toastId, `Gagal menyimpan: ${(error as { message: string }).message}`, 'error');
      } else {
        updateToast(toastId, 'Gagal menyimpan: Unknown error', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (customer: Customer) => {
    // Prevent deleting a customer that is referenced by transactions
    const hasTransactions =
      (customers.find((c) => c.id === customer.id)?.transactionCount ?? 0) > 0;
    if (hasTransactions) {
      addToast(
        `Pelanggan "${customer.name}" tidak dapat dihapus karena masih memiliki transaksi.`,
        'error',
      );
      return;
    }

    setCustomerToDelete(customer);
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      const toastId = addToast('Menghapus pelanggan...', 'info');
      setIsSaving(true);
      try {
        await deleteCustomer(customerToDelete.id);
        addAuditLog(`Menghapus pelanggan: "${customerToDelete.name}".`, customerToDelete.storeId!);
        updateToast(toastId, 'Pelanggan berhasil dihapus!', 'success');
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'message' in error) {
          updateToast(
            toastId,
            `Gagal menghapus: ${(error as { message: string }).message}`,
            'error',
          );
        } else {
          updateToast(toastId, 'Gagal menghapus: Unknown error', 'error');
        }
      } finally {
        setCustomerToDelete(null);
        setIsSaving(false);
      }
    }
  };

  const canAddNewCustomer = !(
    currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all'
  );

  // Excel Export
  const handleExportToExcel = async () => {
    const toastId = addToast('Mengekspor pelanggan...', 'info');
    try {
      // Fetch SEMUA pelanggan dengan filter yang sama, tanpa pagination
      updateToast(toastId, 'Mengambil semua data pelanggan...', 'info');

      let query = supabase.from('customers').select('*', { count: 'exact' });

      // Terapkan filter store yang sama
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      // Terapkan search term jika ada
      if (debouncedSearchTerm) {
        query = query.ilike('name', `%${debouncedSearchTerm}%`);
      }

      const { data: allCustomers, error } = await query;

      if (error) throw error;
      if (!allCustomers || allCustomers.length === 0) {
        updateToast(toastId, 'Tidak ada pelanggan untuk diekspor.', 'warning');
        return;
      }

      updateToast(toastId, `Mengekspor ${allCustomers.length} pelanggan...`, 'info');

      // Convert null to undefined untuk kompatibilitas
      const customersToExport = allCustomers.map((c) => ({
        ...c,
        address: c.address ?? undefined,
        notes: c.notes ?? undefined,
        phone: c.phone ?? undefined,
        storeId: c.storeId ?? undefined,
      })) as unknown as Customer[];

      await exportCustomersToExcel(customersToExport);
      updateToast(
        toastId,
        `Berhasil mengekspor ${allCustomers.length} pelanggan ke Excel.`,
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

    setIsSaving(true);
    const toastId = addToast('Memproses import data...', 'info');

    try {
      const importedCustomers = await importCustomersFromExcel(file);

      let successCount = 0;
      let errorCount = 0;
      let skipCount = 0;

      for (const customer of importedCustomers) {
        try {
          if (customer.id) {
            // Update existing customer - ensure storeId is set properly
            // Update existing customer - ensure storeId is set properly
            const updatePayload: Partial<Customer> = {
              name: customer.name!,
              phone: customer.phone || '',
              address: customer.address,
              notes: customer.notes,
            };

            if (selectedStoreId !== 'all') {
              updatePayload.storeId = selectedStoreId;
            }

            await updateCustomer(customer.id, updatePayload);
            successCount++;
          } else {
            // Check for duplicate phone number before adding new customer
            if (customer.phone) {
              const normalizedPhone = customer.phone.replace(/\D/g, '');
              const existingCustomer = customers.find(
                (c) => c.phone?.replace(/\D/g, '') === normalizedPhone,
              );

              if (existingCustomer) {
                console.warn('Duplicate phone number skipped:', customer.name, customer.phone);
                skipCount++;
                continue;
              }
            }

            // Determine storeId - must not be null for RLS policy
            const storeId =
              (selectedStoreId === 'all' ? currentUser?.storeId : selectedStoreId) || '';

            if (!storeId) {
              console.error('storeId is required for new customers');
              errorCount++;
              continue;
            }

            // Add new customer
            await addCustomer({
              name: customer.name!,
              phone: customer.phone || '',
              address: customer.address,
              notes: customer.notes,
              storeId: storeId!,
            } as Omit<Customer, 'id'>);
            successCount++;
          }
        } catch (error) {
          console.error('Error importing customer:', customer, error);
          errorCount++;
        }
      }

      if (skipCount > 0) {
        updateToast(
          toastId,
          `Import selesai: ${successCount} berhasil, ${errorCount} gagal, ${skipCount} dilewati (duplikat nomor HP)`,
          'warning',
        );
      } else if (errorCount > 0) {
        updateToast(
          toastId,
          `Import selesai: ${successCount} berhasil, ${errorCount} gagal`,
          'warning',
        );
      } else {
        updateToast(toastId, `Berhasil import ${successCount} pelanggan`, 'success');
      }

      addAuditLog(
        `Import ${successCount} pelanggan dari Excel.`,
        selectedStoreId !== 'all' ? selectedStoreId : undefined,
      );
    } catch (error) {
      console.error('Import error:', error);
      updateToast(toastId, 'Gagal import data dari Excel', 'error');
    } finally {
      setIsSaving(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Download Template
  const handleDownloadTemplate = async () => {
    try {
      await downloadCustomerTemplate();
      addToast('Template Excel berhasil didownload', 'success');
    } catch (error) {
      console.error('Download template error:', error);
      addToast('Gagal download template', 'error');
    }
  };

  // Google Contacts Import
  const handleGoogleContactsImport = async (contacts: GoogleContact[]) => {
    const storeId =
      currentUser?.role === UserRole.SuperAdmin ? selectedStoreId : currentUser?.storeId;
    if (!storeId || storeId === 'all') {
      addToast('Pilih cabang spesifik untuk import kontak.', 'warning');
      return;
    }

    const toastId = addToast(`Mengimport ${contacts.length} kontak...`, 'info');
    setIsSaving(true);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const contact of contacts) {
      try {
        // Normalize phone number
        let phone = contact.phone.replace(/\D/g, '');
        if (phone.startsWith('0')) {
          phone = '62' + phone.substring(1);
        } else if (phone.startsWith('8')) {
          phone = '62' + phone;
        }

        // Check for duplicate
        const existingCustomer = customers.find((c) => c.phone?.replace(/\D/g, '') === phone);
        if (existingCustomer) {
          skipCount++;
          continue;
        }

        await addCustomer({
          name: contact.name,
          phone: phone,
          address: contact.address || undefined,
          notes: `Imported from Google Contacts`,
          storeId: storeId,
          createdAt: new Date(),
        });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setIsSaving(false);

    if (skipCount > 0 || errorCount > 0) {
      updateToast(
        toastId,
        `Import selesai: ${successCount} berhasil, ${skipCount} duplikat, ${errorCount} gagal`,
        skipCount > 0 ? 'warning' : 'error',
      );
    } else {
      updateToast(toastId, `Berhasil import ${successCount} kontak dari Google!`, 'success');
    }

    addAuditLog(`Import ${successCount} pelanggan dari Google Contacts.`, storeId);
  };

  // Google Contacts Sync (Export)
  const handleSyncToGoogle = async () => {
    if (!isAuthenticated) {
      signIn();
      return;
    }

    if (customers.length === 0) {
      addToast('Tidak ada pelanggan untuk disinkronisasi.', 'warning');
      return;
    }

    const toastId = addToast('Sinkronisasi ke Google Contacts...', 'info');
    setIsSyncing(true);

    let successCount = 0;
    let errorCount = 0;

    // Filter customers who have valid names and phones
    const customersToSync = customers.filter((c) => c.name && c.phone);

    updateToast(toastId, `Memproses ${customersToSync.length} kontak...`, 'info');

    for (const customer of customersToSync) {
      try {
        await createContact({
          name: customer.name,
          phone: customer.phone!, // Filtered above
          address: customer.address || undefined,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to sync ${customer.name}:`, error);
        errorCount++;
      }
    }

    setIsSyncing(false);

    if (errorCount > 0) {
      updateToast(
        toastId,
        `Sinkronisasi selesai: ${successCount} berhasil, ${errorCount} gagal.`,
        'warning',
      );
    } else {
      updateToast(toastId, `Berhasil sinkronisasi ${successCount} kontak ke Google!`, 'success');
    }

    addAuditLog(
      `Sync ${successCount} pelanggan ke Google Contacts.`,
      selectedStoreId !== 'all' ? selectedStoreId : undefined,
    );
  };

  // Get existing phone numbers for deduplication
  const existingPhones = useMemo(() => {
    return customers.map((c) => c.phone || '').filter(Boolean);
  }, [customers]);

  const NoCustomersFound = () => (
    <EmptyState
      icon={<UsersIcon className="mx-auto w-12 h-12 text-slate-400" />}
      title={debouncedSearchTerm ? 'Pelanggan Tidak Ditemukan' : 'Belum Ada Pelanggan'}
      description={
        debouncedSearchTerm
          ? 'Coba kata kunci lain atau tambahkan pelanggan baru.'
          : 'Mulai dengan menambahkan pelanggan pertama Anda.'
      }
    >
      <button
        onClick={() => handleOpenFormModal()}
        disabled={!canAddNewCustomer}
        className="btn btn-primary mx-auto"
      >
        <PlusCircleIcon className="h-5 w-5" />
        Tambah Pelanggan
      </button>
    </EmptyState>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex gap-2 flex-wrap justify-end">
          {/* Import/Export/Sync: khusus Admin. Kasir hanya tambah & ubah pelanggan. */}
          {canManageCustomers && (
            <>
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
                id="customer-import-file"
                name="customer-import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportFromExcel}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!canAddNewCustomer || isSaving}
                className="btn btn-secondary btn-sm"
                title="Import dari Excel"
              >
                <UploadIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Excel</span>
              </button>

              <button
                onClick={() => setIsGoogleImportModalOpen(true)}
                disabled={!canAddNewCustomer || isSaving}
                className="btn btn-secondary btn-sm"
                title="Import dari Google Contacts"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="hidden sm:inline text-sm">Import Google</span>
              </button>

              <button
                onClick={handleSyncToGoogle}
                disabled={customers.length === 0 || isSyncing || isGoogleLoading}
                className="btn btn-secondary btn-sm"
                title="Sinkronisasi ke Google Contacts"
              >
                {isSyncing ? (
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2v9.67z" />
                  </svg>
                )}
                <span className="hidden sm:inline text-sm">Sync to Google</span>
              </button>

              <button
                onClick={handleExportToExcel}
                disabled={customers.length === 0}
                className="btn btn-primary btn-sm"
                title="Export ke Excel"
              >
                <DownloadIcon className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Export</span>
              </button>
            </>
          )}

          <button
            onClick={() => handleOpenFormModal()}
            disabled={!canAddNewCustomer}
            className="btn btn-primary btn-sm"
          >
            Tambah Pelanggan
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            id="customer-search"
            name="customer-search"
            placeholder="Cari pelanggan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            autoComplete="off"
          />
        </div>
        <select
          id="customer-activity-filter"
          name="customer-activity-filter"
          value={activityFilter}
          onChange={(e) => {
            setActivityFilter(e.target.value as CustomerActivity);
            setPage(1);
          }}
          className="w-full sm:w-48 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="all">Semua Pelanggan</option>
          <option value="active">Aktif (Ada Transaksi)</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
      </div>
      {!canAddNewCustomer && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">
          Pilih cabang spesifik di header untuk menambah pelanggan baru.
        </p>
      )}

      <div className="card overflow-x-auto hidden md:block">
        <table className="w-full text-left text-sm text-slate-500 dark:text-slate-400">
          <thead className="bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-400 uppercase">
            <tr>
              <th className="px-6 py-3">No</th>
              <th className="px-6 py-3">
                <button
                  onClick={() => requestSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Nama {getSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-3">No. Telepon</th>
              {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                <th className="px-6 py-3">
                  <button
                    onClick={() => requestSort('storeName')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Toko {getSortIcon('storeName')}
                  </button>
                </th>
              )}
              <th className="px-6 py-3 text-center">
                <button
                  onClick={() => requestSort('transactionCount')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 mx-auto"
                >
                  Total Transaksi {getSortIcon('transactionCount')}
                </button>
              </th>
              <th className="px-6 py-3 text-right">
                <button
                  onClick={() => requestSort('totalSpent')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 ml-auto"
                >
                  Total Belanja {getSortIcon('totalSpent')}
                </button>
              </th>
              <th className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((customer, index) => (
                <tr
                  key={customer.id}
                  className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {(page - 1) * pageSize + index + 1}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    <Link
                      to={`/management/customers/${customer.id}`}
                      className="hover:underline text-blue-600 dark:text-blue-400"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{customer.phone}</td>
                  {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                    <td className="px-6 py-4">{customer.storeName}</td>
                  )}
                  <td className="px-6 py-4 text-center">{customer.transactionCount}</td>
                  <td className="px-6 py-4 text-right">
                    Rp {customer.totalSpent.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        aria-label={`Edit ${customer.name}`}
                        onClick={() => handleOpenFormModal(customer)}
                        className="btn btn-ghost btn-icon"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      {canManageCustomers && (
                        <button
                          aria-label={`Hapus ${customer.name}`}
                          onClick={() => handleDelete(customer)}
                          className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
                        >
                          <Trash2Icon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={
                    currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 7 : 6
                  }
                >
                  <NoCustomersFound />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {paginatedCustomers.length > 0 ? (
          paginatedCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Link
                    to={`/management/customers/${customer.id}`}
                    className="font-bold text-lg text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {customer.name}
                  </Link>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{customer.phone}</p>
                  {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {customer.storeName}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    aria-label={`Edit ${customer.name}`}
                    onClick={() => handleOpenFormModal(customer)}
                    className="btn btn-ghost btn-icon"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  {canManageCustomers && (
                    <button
                      aria-label={`Hapus ${customer.name}`}
                      onClick={() => handleDelete(customer)}
                      className="btn btn-ghost btn-icon text-red-600 dark:text-red-400"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 min-[360px]:grid-cols-2 gap-3 text-center border-t border-slate-200 dark:border-slate-600 pt-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Transaksi</p>
                  <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                    {customer.transactionCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Belanja</p>
                  <p className="font-semibold text-base text-slate-800 dark:text-slate-200">
                    Rp {customer.totalSpent.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <NoCustomersFound />
        )}
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      {isFormModalOpen && (
        <CustomerFormModal
          customer={currentCustomer}
          onClose={handleCloseFormModal}
          onSave={handleSaveCustomer}
          disabled={isSaving}
        />
      )}

      {confirmDialog}

      {customerToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={confirmDelete}
          title="Hapus Pelanggan"
          message={`Apakah Anda yakin ingin menghapus pelanggan "${customerToDelete.name}"? Semua data transaksi terkait akan tetap ada.`}
        />
      )}

      <GoogleContactsImportModal
        isOpen={isGoogleImportModalOpen}
        onClose={() => setIsGoogleImportModalOpen(false)}
        onImport={handleGoogleContactsImport}
        existingPhones={existingPhones}
      />
    </div>
  );
};

export default CustomersPage;

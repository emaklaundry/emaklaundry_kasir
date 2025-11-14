import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Customer, UserRole } from '@/types';
import {
  PlusCircleIcon,
  EditIcon,
  Trash2Icon,
  SearchIcon,
  UsersIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useCustomers } from '../../contexts/CustomerContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { useAppContext } from '../../contexts/AppContext';
import CustomerFormModal from '../../components/CustomerFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';
import { useSortableData } from '../../hooks/useSortableData';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';

function CustomersPage() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { transactions } = useTransactions();
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const customerStats = useMemo(() => {
    const stats: { [key: string]: { transactionCount: number; totalSpent: number } } = {};

    customers.forEach((customer) => {
      stats[customer.id] = { transactionCount: 0, totalSpent: 0 };
    });

    transactions.forEach((transaction) => {
      if (stats[transaction.customerId]) {
        stats[transaction.customerId].transactionCount += 1;
        stats[transaction.customerId].totalSpent += transaction.total;
      }
    });

    return (customers || []).map((customer) => {
      const store = stores.find((s) => s.id === customer.storeId);
      return {
        ...customer,
        transactionCount: stats[customer.id].transactionCount,
        totalSpent: stats[customer.id].totalSpent,
        storeName: store ? store.name : 'N/A',
      };
    });
  }, [customers, transactions, stores]);

  type CustomerWithStats = (typeof customerStats)[0];

  const filteredCustomers = useMemo(
    () =>
      customerStats.filter(
        (c) =>
          c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          c.phone.includes(debouncedSearchTerm),
      ),
    [customerStats, debouncedSearchTerm],
  );

  const {
    items: sortedCustomers,
    requestSort,
    sortConfig,
  } = useSortableData<CustomerWithStats>(filteredCustomers);
  const {
    currentData: paginatedCustomers,
    currentPage,
    totalPages,
    onPageChange,
  } = usePagination(sortedCustomers);

  const getSortIcon = (key: keyof CustomerWithStats) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const handleOpenFormModal = (customer: Customer | null = null) => {
    setCurrentCustomer(customer);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentCustomer(null);
  };

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'storeId'>) => {
    const storeId =
      currentCustomer?.storeId ||
      (currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId);
    if (!storeId || storeId === 'all') {
      addToast('Silakan pilih cabang spesifik untuk menambah atau mengedit pelanggan.', 'warning');
      return;
    }
    const toastId = addToast('Menyimpan pelanggan...', 'info');
    setIsSaving(true);
    try {
      if (currentCustomer && currentCustomer.id) {
        await updateCustomer(currentCustomer.id, { ...customerData, storeId });
        addAuditLog(`Memperbarui data pelanggan: "${customerData.name}".`, storeId);
        updateToast(toastId, 'Data pelanggan berhasil diperbarui!', 'success');
      } else {
        await addCustomer({ ...customerData, storeId });
        addAuditLog(`Menambahkan pelanggan baru: "${customerData.name}".`, storeId);
        updateToast(toastId, 'Pelanggan baru berhasil ditambahkan!', 'success');
      }
      handleCloseFormModal();
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal menyimpan: ${errMsg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (customer: Customer) => {
    // Prevent deleting a customer that is referenced by transactions
    const hasTransactions = transactions.some((t) => t.customerId === customer.id);
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
        addAuditLog(`Menghapus pelanggan: "${customerToDelete.name}".`, customerToDelete.storeId);
        updateToast(toastId, 'Pelanggan berhasil dihapus!', 'success');
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        updateToast(toastId, `Gagal menghapus: ${errMsg}`, 'error');
      } finally {
        setCustomerToDelete(null);
        setIsSaving(false);
      }
    }
  };

  const canAddNewCustomer = !(
    currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all'
  );

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
        className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5 mx-auto disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        <PlusCircleIcon className="h-5 w-5 mr-2" />
        Tambah Pelanggan
      </button>
    </EmptyState>
  );

  return (
    <div className="relative bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      {isSaving && (
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
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Manajemen Pelanggan
        </h1>
        <div className="w-full md:w-auto flex items-center gap-4">
          <div className="relative w-full md:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
          <button
            onClick={() => handleOpenFormModal()}
            className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={!canAddNewCustomer}
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Tambah Pelanggan
          </button>
        </div>
      </div>
      {!canAddNewCustomer && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4 -mt-2">
          Pilih cabang spesifik di header untuk menambah pelanggan baru.
        </p>
      )}

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('name')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Nama {getSortIcon('name')}
                </button>
              </th>
              <th className="px-4 py-3">No. Telepon</th>
              {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                <th className="px-4 py-3">
                  <button
                    onClick={() => requestSort('storeName')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Toko {getSortIcon('storeName')}
                  </button>
                </th>
              )}
              <th className="px-4 py-3 text-center">
                <button
                  onClick={() => requestSort('transactionCount')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 mx-auto"
                >
                  Total Transaksi {getSortIcon('transactionCount')}
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => requestSort('totalSpent')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 ml-auto"
                >
                  Total Belanja {getSortIcon('totalSpent')}
                </button>
              </th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCustomers.length > 0 ? (
              (paginatedCustomers || []).map((customer) => (
                <tr key={customer.id} className="border-b dark:border-slate-700">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                    <Link
                      to={`/management/customers/${customer.id}`}
                      className="hover:underline text-blue-600 dark:text-blue-400"
                    >
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                    <td className="px-4 py-3">{customer.storeName}</td>
                  )}
                  <td className="px-4 py-3 text-center">{customer.transactionCount}</td>
                  <td className="px-4 py-3 text-right">
                    Rp {customer.totalSpent.toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3 flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenFormModal(customer)}
                      className="p-2.5 rounded-md text-blue-600 hover:text-blue-900 dark:text-blue-500 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer)}
                      className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={
                    currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 6 : 5
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
          (paginatedCustomers || []).map((customer) => (
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
                  {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {customer.storeName}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleOpenFormModal(customer)}
                    className="p-2 rounded-md text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer)}
                    className="p-2 rounded-md text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Trash2Icon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center border-t border-slate-200 dark:border-slate-600 pt-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Transaksi</p>
                  <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">
                    {customer.transactionCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Belanja</p>
                  <p className="font-semibold text-lg text-slate-800 dark:text-slate-200">
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
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />

      {isFormModalOpen && (
        <CustomerFormModal
          customer={currentCustomer}
          onClose={handleCloseFormModal}
          onSave={handleSaveCustomer}
          disabled={isSaving}
        />
      )}

      {customerToDelete && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setCustomerToDelete(null)}
          onConfirm={confirmDelete}
          title="Hapus Pelanggan"
          message={`Apakah Anda yakin ingin menghapus pelanggan "${customerToDelete.name}"? Semua data transaksi terkait akan tetap ada.`}
        />
      )}
    </div>
  );
}

export default CustomersPage;

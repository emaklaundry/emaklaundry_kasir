import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useSortableData } from '../../hooks/useSortableData';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';

import { useTransactions } from '../../contexts/TransactionContext';
import { fetchCustomers } from '../../contexts/CustomerContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';

import {
  PlusCircleIcon,
  SearchIcon,
  PrinterIcon,
  SendIcon,
  EyeIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import PaymentModal from '../../components/PaymentModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import Pagination from '../../components/Pagination';

import { Transaction, OrderStatus, PaymentStatus, Customer } from '@/types';
import { getStatusBadge, getPaymentStatusBadge } from '@/utils/uiHelpers';

// Tipe kustom untuk transaksi dengan nama pelanggan
type TransactionWithCustomer = Transaction & { customerName: string; customerPhone: string };

const TransactionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>(() => {
    const status = searchParams.get('status');
    return status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? (status as OrderStatus)
      : 'all';
  });
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
  const [customerFilter, setCustomerFilter] = useState<string | 'all'>('all');

  // Modal & selection state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [transactionForWhatsApp, setTransactionForWhatsApp] = useState<Transaction | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [bulkActionStatus, setBulkActionStatus] = useState<OrderStatus | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  // Pagination and data
  const customersQuery = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });

  const customers = useMemo(() => {
    return Array.isArray(customersQuery.data)
      ? customersQuery.data
      : (customersQuery.data?.data ?? []);
  }, [customersQuery.data]);

  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();

  // State untuk halaman
  // page and setPage are assigned a value but never used

  // Proses sort dan pagination di client
  // These hooks must be declared before any useEffect or code that references their variables

  // Ambil data transaksi dari server (tanpa filter parsial, biarkan filter client-side yang mengatur)
  const { transactions, updateTransaction } = useTransactions({
    page: 1,
    pageSize: 1000,
  });

  const transactionsWithCustomer = useMemo(() => {
    return transactions.map((t: Transaction): TransactionWithCustomer => {
      const customer = customers.find((c: Customer) => c.id === t.customerId);
      return {
        ...t,
        customerName: customer ? customer.name : 'N/A',
        customerPhone: customer ? customer.phone : 'N/A',
      };
    });
  }, [transactions, customers]);

  const filteredTransactions = useMemo(() => {
    return transactionsWithCustomer.filter((t: TransactionWithCustomer) => {
      const transactionDate = new Date(t.createdAt);

      if (statusFilter !== 'all' && t.orderStatus !== statusFilter) return false;
      if (paymentFilter !== 'all' && t.paymentStatus !== paymentFilter) return false;
      if (customerFilter !== 'all' && t.customerId !== customerFilter) return false;

      if (selectedDate) {
        const parts = selectedDate.split('-').map((p) => parseInt(p, 10));
        const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setHours(23, 59, 59, 999);
        if (transactionDate < startOfDay || transactionDate > endOfDay) return false;
      }

      if (!debouncedSearchTerm) return true;
      const term = debouncedSearchTerm.toLowerCase();
      return (
        t.id.toLowerCase().includes(term) ||
        (t.invoiceCode && t.invoiceCode.toLowerCase().includes(term)) ||
        t.customerName.toLowerCase().includes(term) ||
        t.customerPhone.includes(term)
      );
    });
  }, [
    transactionsWithCustomer,
    debouncedSearchTerm,
    selectedDate,
    statusFilter,
    paymentFilter,
    customerFilter,
  ]);

  // Hanya satu deklarasi useSortableData di sini
  const {
    items: sortedTransactions,
    requestSort,
    sortConfig,
  } = useSortableData<TransactionWithCustomer>(filteredTransactions, {
    key: 'createdAt',
    direction: 'descending',
  });
  const {
    currentData: paginatedTransactions,
    currentPage,
    totalPages,
    onPageChange,
  } = usePagination(sortedTransactions, 15);

  const getSortIcon = (key: keyof TransactionWithCustomer) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const handleOrderStatusChange = async (id: string, newStatus: OrderStatus) => {
    const targetTransaction = transactions.find((t: Transaction) => t.id === id);
    if (!targetTransaction) return;

    // --- TAMBAHAN GUARD CLAUSE ---
    if (
      newStatus === OrderStatus.Completed &&
      targetTransaction.paymentStatus !== PaymentStatus.Paid
    ) {
      addToast('Pesanan tidak dapat diselesaikan karena belum lunas.', 'error');
      // Reset visual dropdown kembali ke nilai lama (opsional, tergantung implementasi UI)
      return;
    }
    // --- AKHIR TAMBAHAN ---

    const updatedTransaction = { ...targetTransaction, orderStatus: newStatus };
    const shouldShowWhatsAppModal =
      newStatus === OrderStatus.Ready && targetTransaction.orderStatus !== OrderStatus.Ready;

    const toastId = addToast('Memperbarui status...', 'info');
    try {
      await updateTransaction(id, { orderStatus: newStatus });
      addAuditLog(
        `Mengubah status transaksi ${id} menjadi "${newStatus}".`,
        targetTransaction.storeId,
      );
      updateToast(toastId, `Status transaksi ${id} diubah menjadi ${newStatus}.`, 'success');
      if (shouldShowWhatsAppModal) {
        setTransactionForWhatsApp(updatedTransaction);
        setIsWhatsAppModalOpen(true);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal memperbarui status: ${errMsg}`, 'error');
    }
  };

  const handleOpenPaymentModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = async (updatedTransaction: Transaction) => {
    const shouldShowModal =
      updatedTransaction.paymentStatus === PaymentStatus.Paid &&
      updatedTransaction.orderStatus === OrderStatus.Completed;
    setIsSavingPayment(true);
    const toastId = addToast('Menyimpan pembayaran...', 'info');
    try {
      // Send only DB columns (partial) to avoid sending client-only fields like customerName
      const payload: Partial<Transaction> = {
        amountPaid: updatedTransaction.amountPaid,
        paymentStatus: updatedTransaction.paymentStatus,
        paymentMethod: updatedTransaction.paymentMethod,
        change: updatedTransaction.change,
      };

      await updateTransaction(updatedTransaction.id, payload);
      addAuditLog(
        `Menerima pembayaran untuk transaksi ${updatedTransaction.id}. Status bayar: ${updatedTransaction.paymentStatus}.`,
        updatedTransaction.storeId,
      );
      updateToast(toastId, 'Pembayaran berhasil disimpan.', 'success');
      setIsPaymentModalOpen(false);
      setSelectedTransaction(null);
      if (shouldShowModal) {
        setTransactionForWhatsApp(updatedTransaction);
        setIsWhatsAppModalOpen(true);
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal memperbarui pembayaran: ${errMsg}`, 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleOpenWhatsAppModal = (transaction: Transaction) => {
    setTransactionForWhatsApp(transaction);
    setIsWhatsAppModalOpen(true);
  };

  const handleStatusFilterChange = (status: OrderStatus | 'all') => {
    setStatusFilter(status);
    if (status === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', status);
    }
    setSearchParams(searchParams);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedDate('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setCustomerFilter('all');
    // Reset searchParams in URL
    const params = new URLSearchParams();
    setSearchParams(params);
  };

  const customerForWhatsApp = useMemo(() => {
    if (!transactionForWhatsApp) return null;
    return customers.find((c: Customer) => c.id === transactionForWhatsApp.customerId);
  }, [transactionForWhatsApp, customers]);

  // Bulk Action Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(sortedTransactions.map((t: TransactionWithCustomer) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleBulkStatusChange = (status: OrderStatus) => {
    setBulkActionStatus(status);
    setIsBulkConfirmOpen(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkActionStatus) return;

    const transactionsToUpdate = transactions.filter((t: Transaction) => selectedIds.has(t.id));
    
    // FIXED: Extended guard clause - prevent marking unpaid transactions as Ready or Completed
    const unpaidTransactions = transactionsToUpdate.filter(
      (t: Transaction) =>
        (bulkActionStatus === OrderStatus.Ready || bulkActionStatus === OrderStatus.Completed) &&
        t.paymentStatus !== PaymentStatus.Paid,
    );

    if (unpaidTransactions.length > 0) {
      const statusText = bulkActionStatus === OrderStatus.Ready ? 'siap' : 'diselesaikan';
      addToast(
        `${unpaidTransactions.length} transaksi belum lunas dan tidak dapat ditandai ${statusText}.`,
        'error',
      );
      setIsBulkConfirmOpen(false);
      setBulkActionStatus(null);
      return;
    }

    setIsBulkProcessing(true);
    const toastId = addToast('Memproses aksi massal...', 'info');
    try {
      const updatePromises = transactionsToUpdate.map((t: Transaction) =>
        updateTransaction(t.id, { orderStatus: bulkActionStatus }),
      );
      await Promise.all(updatePromises);
      addAuditLog(
        `Mengubah status ${selectedIds.size} transaksi menjadi "${bulkActionStatus}" secara massal.`,
      );
      setSelectedIds(new Set());
      updateToast(
        toastId,
        `Berhasil mengubah status ${selectedIds.size} transaksi menjadi ${bulkActionStatus}.`,
        'success',
      );
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal memperbarui status massal: ${errMsg}`, 'error');
    } finally {
      setIsBulkConfirmOpen(false);
      setBulkActionStatus(null);
      setIsBulkProcessing(false);
    }
  };

  const statusOptions: (OrderStatus | 'all')[] = ['all', ...Object.values(OrderStatus)];

  return (
    <>
      <div className="relative bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md">
        {(isSavingPayment || isBulkProcessing) && (
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
            Daftar Transaksi
          </h1>
          <Link
            to="/transactions/new"
            className="flex-shrink-0 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-lg px-6 py-3"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Transaksi Baru
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <label htmlFor="searchTerm" className="sr-only">
              Cari Transaksi
            </label>
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="searchTerm"
              type="text"
              placeholder="Cari ID, Invoice, Nama, atau No. HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm sm:text-base rounded-lg block w-full pl-10 p-2 sm:p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="customerFilter" className="sr-only">
              Filter Pelanggan
            </label>
            <select
              id="customerFilter"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            >
              <option value="all">Semua Pelanggan</option>
              {customers.map((c: Customer) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="paymentFilter" className="sr-only">
              Filter Status Bayar
            </label>
            <select
              id="paymentFilter"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            >
              <option value="all">Semua St. Bayar</option>
              <option value={PaymentStatus.Paid}>Lunas</option>
              <option value={PaymentStatus.Unpaid}>Belum Lunas</option>
            </select>
          </div>
          <div>
            <label htmlFor="selectedDate" className="sr-only">
              Filter Tanggal
            </label>
            <input
              id="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base text-slate-600 dark:text-slate-300">Status Pesanan:</span>
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {status === 'all' ? 'Semua' : status}
              </button>
            ))}
          </div>
          <button
            onClick={resetFilters}
            className="text-base text-blue-600 dark:text-blue-400 hover:underline"
          >
            Reset Filter
          </button>
        </div>

        {selectedIds.size > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/50 p-3 rounded-lg flex items-center justify-between mb-4">
            <span className="font-semibold text-blue-800 dark:text-blue-300">
              {selectedIds.size} transaksi dipilih
            </span>
            <div className="relative">
              <select
                onChange={(e) => handleBulkStatusChange(e.target.value as OrderStatus)}
                className="pl-3 pr-8 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none appearance-none"
                value=""
              >
                <option value="" disabled>
                  Ubah Status Menjadi...
                </option>
                {Object.values(OrderStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-5 h-5 text-white absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs sm:text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
              <tr>
                <th className="px-1 sm:px-2 py-2 sm:py-3 w-8 sm:w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      sortedTransactions.length > 0 &&
                      selectedIds.size === sortedTransactions.length
                    }
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3">
                  <button
                    onClick={() => requestSort('id')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 text-xs sm:text-sm"
                  >
                    ID Transaksi {getSortIcon('id')}
                  </button>
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3">
                  <button
                    onClick={() => requestSort('customerName')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 text-xs sm:text-sm"
                  >
                    Pelanggan {getSortIcon('customerName')}
                  </button>
                </th>
                <th className="px-2 sm:px-4 py-2 sm:py-3">
                  <button
                    onClick={() => requestSort('createdAt')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Jam Masuk {getSortIcon('createdAt')}
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => requestSort('total')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 ml-auto"
                  >
                    Total {getSortIcon('total')}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => requestSort('orderStatus')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Status Pesanan {getSortIcon('orderStatus')}
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    onClick={() => requestSort('paymentStatus')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Status Bayar {getSortIcon('paymentStatus')}
                  </button>
                </th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map((t: TransactionWithCustomer) => (
                  <tr
                    key={t.id}
                    className={`border-b dark:border-slate-700 ${selectedIds.has(t.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                  >
                    <td className="px-1 sm:px-2 py-2 sm:py-3 text-center">
                      <input
                        type="checkbox"
                        onChange={() => handleSelectOne(t.id)}
                        checked={selectedIds.has(t.id)}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-900 dark:text-white text-xs sm:text-sm">
                      {t.invoiceCode || `#${t.id.substring(0, 8)}`}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">{t.customerName}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">Rp {t.total.toLocaleString('id-ID')}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <select
                        value={t.orderStatus}
                        onChange={(e) =>
                          handleOrderStatusChange(t.id, e.target.value as OrderStatus)
                        }
                        className={`px-2 py-1 text-sm font-medium rounded-full border-0 focus:ring-0 focus:outline-none appearance-none cursor-pointer ${getStatusBadge(t.orderStatus)}`}
                        title={
                          t.paymentStatus !== PaymentStatus.Paid
                            ? 'Pelunasan diperlukan untuk menyelesaikan pesanan'
                            : ''
                        }
                      >
                        {Object.values(OrderStatus).map((status) => {
                          // Tombol/toggle ke 'Selesai' hanya aktif jika sudah lunas DAN/ATAU sudah 'Siap Diambil'
                          const disableCompleted =
                            status === OrderStatus.Completed &&
                            !(
                              t.paymentStatus === PaymentStatus.Paid ||
                              t.orderStatus === OrderStatus.Ready
                            );
                          return (
                            <option
                              key={status}
                              value={status}
                              className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                              disabled={disableCompleted}
                            >
                              {status}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`px-2 py-1 text-sm font-medium rounded-full text-center ${getPaymentStatusBadge(t.paymentStatus)}`}
                      >
                        {t.paymentStatus}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center flex items-center justify-center space-x-1">
                      {t.paymentStatus !== PaymentStatus.Paid && (
                        <button
                          onClick={() => handleOpenPaymentModal(t)}
                          title="Proses Pembayaran"
                          className="p-2.5 rounded-md text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <DollarSignIcon className="w-5 h-5" />
                        </button>
                      )}
                      <Link
                        to={`/transactions/${t.id}/details`}
                        title="Lihat Detail"
                        className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 inline-block"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/transactions/${t.id}/receipt`}
                        title="Cetak Struk"
                        className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 inline-block"
                      >
                        <PrinterIcon className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => {
                          const foundCustomer = customers.find(
                            (c: Customer) => c.id === t.customerId,
                          );
                          if (foundCustomer) {
                            handleOpenWhatsAppModal(t);
                          } else {
                            addToast('Data pelanggan tidak ditemukan.', 'error');
                          }
                        }}
                        title="Kirim Struk via WhatsApp"
                        className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        <SendIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />}
                      title="Tidak Ada Transaksi"
                      description={
                        searchTerm ||
                        selectedDate ||
                        statusFilter !== 'all' ||
                        paymentFilter !== 'all' ||
                        customerFilter !== 'all'
                          ? 'Tidak ada transaksi yang cocok dengan kriteria filter Anda.'
                          : 'Belum ada transaksi yang dibuat.'
                      }
                    >
                      <Link
                        to="/transactions/new"
                        className="flex-shrink-0 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-lg px-6 py-3 mx-auto max-w-xs"
                      >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Buat Transaksi Baru
                      </Link>
                    </EmptyState>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>

        <div className="md:hidden space-y-4">
          {paginatedTransactions.length > 0 ? (
            paginatedTransactions.map((t: TransactionWithCustomer) => (
              <div
                key={t.id}
                className={`p-4 rounded-lg shadow-md text-slate-600 dark:text-slate-300 relative ${selectedIds.has(t.id) ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'bg-slate-50 dark:bg-slate-800'}`}
              >
                <div className="absolute top-3 left-2">
                  <input
                    type="checkbox"
                    onChange={() => handleSelectOne(t.id)}
                    checked={selectedIds.has(t.id)}
                    className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 dark:bg-slate-700 dark:border-slate-500 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-8">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                      {t.customerName}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    {t.invoiceCode || `#${t.id.substring(0, 8)}`}
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-base">Total:</span>
                      <span className="font-bold text-lg text-slate-900 dark:text-white">
                        Rp {t.total.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-base">
                        Status Pesanan:
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(t.orderStatus)}`}
                      >
                        {t.orderStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-base">
                        Status Bayar:
                      </span>
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}
                      >
                        {t.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-start space-x-4 text-slate-600 dark:text-slate-400">
                    {t.paymentStatus !== PaymentStatus.Paid && (
                      <button
                        onClick={() => handleOpenPaymentModal(t)}
                        title="Proses Pembayaran"
                        className="text-green-600 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400"
                      >
                        <DollarSignIcon className="w-6 h-6" />
                      </button>
                    )}
                    <Link
                      to={`/transactions/${t.id}/details`}
                      title="Lihat Detail"
                      className="hover:text-slate-900 dark:hover:text-white"
                    >
                      <EyeIcon className="w-6 h-6" />
                    </Link>
                    <Link
                      to={`/transactions/${t.id}/receipt`}
                      title="Cetak Struk"
                      className="hover:text-slate-900 dark:hover:text-white"
                    >
                      <PrinterIcon className="w-6 h-6" />
                    </Link>
                    <button
                      onClick={() => {
                        const foundCustomer = customers.find(
                          (c: Customer) => c.id === t.customerId,
                        );
                        if (foundCustomer) {
                          handleOpenWhatsAppModal(t);
                        } else {
                          addToast('Data pelanggan tidak ditemukan.', 'error');
                        }
                      }}
                      title="Kirim Struk via WhatsApp"
                      className="hover:text-slate-900 dark:hover:text-white"
                    >
                      <SendIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon={<ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />}
              title="Tidak Ada Transaksi"
              description={
                searchTerm ||
                selectedDate ||
                statusFilter !== 'all' ||
                paymentFilter !== 'all' ||
                customerFilter !== 'all'
                  ? 'Tidak ada transaksi yang cocok dengan kriteria filter Anda.'
                  : 'Belum ada transaksi yang dibuat.'
              }
            >
              <Link
                to="/transactions/new"
                className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto max-w-xs"
              >
                <PlusCircleIcon className="h-5 w-5 mr-2" />
                Buat Transaksi Baru
              </Link>
            </EmptyState>
          )}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          transaction={selectedTransaction}
          onSave={handleSavePayment}
          disabled={isSavingPayment}
        />
      )}
      {isWhatsAppModalOpen && (
        <WhatsAppModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          transaction={transactionForWhatsApp}
          customer={customerForWhatsApp}
        />
      )}
      {isBulkConfirmOpen && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setIsBulkConfirmOpen(false)}
          onConfirm={confirmBulkAction}
          title="Konfirmasi Aksi Massal"
          message={`Anda yakin ingin mengubah status ${selectedIds.size} transaksi menjadi "${bulkActionStatus}"?`}
          confirmText="Ya, Ubah"
        />
      )}
    </>
  );
};

export default TransactionPage;

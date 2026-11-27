import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useServerSort } from '../../hooks/useServerSort';
import { useDebounce } from '../../hooks/useDebounce';

import { useTransactions, TransactionSortKey } from '../../contexts/TransactionContext';
import { ALL_CUSTOMERS_QUERY_KEY, fetchAllCustomers } from '../../contexts/CustomerContext';
import { useServices } from '../../contexts/ServiceContext';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import useToasts from '../../contexts/useToasts';
import useAppContext from '../../contexts/useAppContext';
import { can, isAdminRole } from '../../config/permissions';
import { supabase } from '../../utils/supabaseClient';
import { savePayment, bulkMarkPaid } from '../../utils/paymentUpdate';

import {
  PlusCircleIcon,
  PrinterIcon,
  SendIcon,
  EyeIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronDownIcon,
  DownloadIcon,
  UploadIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import PaymentModal from '../../components/PaymentModal';
import BulkPaymentModal from '../../components/BulkPaymentModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import Pagination from '../../components/Pagination';

import { Transaction, OrderStatus, PaymentStatus, PaymentMethod, Customer } from '@/types';
import {
  getStatusBadge,
  getPaymentStatusBadge,
  formatTransactionId,
  formatDateTime,
} from '@/utils/uiHelpers';
import {
  exportTransactionsToExcel,
  downloadTransactionTemplate,
  importTransactionsFromExcel,
} from '@/utils/excelUtils';
import SearchInput from '../../components/SearchInput';

// Tipe kustom untuk transaksi dengan nama pelanggan
type TransactionWithCustomer = Transaction & { customerName: string; customerPhone: string };

const waButtonTitle = (t: Transaction) =>
  t.whatsappSentAt
    ? `Struk sudah dikirim via WhatsApp (${new Date(t.whatsappSentAt).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}). Klik untuk kirim ulang.`
    : 'Kirim Struk via WhatsApp (belum dikirim)';

/** Titik centang kecil di pojok ikon kirim: struk sudah pernah dikirim. */
const WaSentDot: React.FC = () => (
  <span
    aria-hidden="true"
    className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold leading-none text-white"
  >
    ✓
  </span>
);

const TransactionPage: React.FC = () => {
  const { currentUser } = useAppContext();
  const canCreateTransaction = can(currentUser?.role, 'transaction.create');
  const canTakePayment = can(currentUser?.role, 'transaction.payment');
  // Lunasi massal hanya untuk Admin & Super Admin (Kasir tetap melunasi satu per satu).
  const canBulkPay = canTakePayment && isAdminRole(currentUser?.role);
  const canComplete = can(currentUser?.role, 'transaction.complete');
  // Kirim WhatsApp & cetak struk butuh nomor HP / nominal: Kasir ke atas.
  const canNotify = can(currentUser?.role, 'transaction.notify');
  // Operator tidak membaca tabel customers; nama pelanggan ikut di data transaksinya.
  const canReadCustomers = can(currentUser?.role, 'customer.edit');
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
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>(() => {
    const payment = searchParams.get('payment');
    return payment && Object.values(PaymentStatus).includes(payment as PaymentStatus)
      ? (payment as PaymentStatus)
      : 'all';
  });
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
  const [isBulkPaymentOpen, setIsBulkPaymentOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Pagination and data
  const customersQuery = useQuery({
    queryKey: ALL_CUSTOMERS_QUERY_KEY,
    queryFn: fetchAllCustomers,
    enabled: canReadCustomers,
  });

  const customers = useMemo(() => {
    return Array.isArray(customersQuery.data)
      ? customersQuery.data
      : (customersQuery.data?.data ?? []);
  }, [customersQuery.data]);

  const { addAuditLog } = useAuditLogs();
  const { addToast, updateToast } = useToasts();
  const { services } = useServices();

  // State untuk server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Build date range dari selectedDate
  const dateRange = useMemo(() => {
    if (!selectedDate) return undefined;
    return {
      from: selectedDate,
      to: selectedDate,
    };
  }, [selectedDate]);

  // Urutan dikerjakan server agar berlaku untuk semua halaman; ganti urutan → kembali ke halaman 1
  const { sortConfig, requestSort } = useServerSort<TransactionSortKey>(
    { key: 'createdAt', direction: 'descending' },
    () => setCurrentPage(1),
  );

  // Ambil data transaksi dengan server-side filtering, sorting dan pagination
  const { transactions, totalCount, updateTransaction, addTransaction } = useTransactions({
    page: currentPage,
    pageSize: pageSize,
    sortBy: sortConfig.key,
    sortAscending: sortConfig.direction === 'ascending',
    dateRange: dateRange,
    orderStatus: statusFilter !== 'all' ? statusFilter : undefined,
    paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
    customerId: customerFilter !== 'all' ? customerFilter : undefined,
    searchTerm: debouncedSearchTerm || undefined,
  });

  const transactionsWithCustomer = useMemo(() => {
    return transactions.map((t: Transaction): TransactionWithCustomer => {
      const customer = customers.find((c: Customer) => c.id === t.customerId);
      return {
        ...t,
        customerName: customer ? customer.name : (t.customerName ?? 'N/A'),
        customerPhone: customer ? customer.phone || 'N/A' : 'N/A',
      };
    });
  }, [transactions, customers]);

  // Semua filter (tanggal, status, pembayaran, pelanggan, pencarian) dikerjakan server
  const filteredTransactions = transactionsWithCustomer;

  // Data sudah diurutkan oleh server (lihat useServerSort di atas)
  const sortedTransactions = filteredTransactions;

  // Total pages dari server
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginatedTransactions = sortedTransactions;

  const getSortIcon = (key: TransactionSortKey) => {
    if (sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const handleOrderStatusChange = async (id: string, newStatus: OrderStatus) => {
    const targetTransaction = transactions.find((t: Transaction) => t.id === id);
    if (!targetTransaction) return;

    if (newStatus === OrderStatus.Completed && !canComplete) {
      addToast('Hanya Kasir atau Admin yang dapat menyelesaikan pesanan.', 'error');
      return;
    }

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
      canNotify &&
      newStatus === OrderStatus.Ready &&
      targetTransaction.orderStatus !== OrderStatus.Ready;

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
    setIsSavingPayment(true);
    const toastId = addToast('Menyimpan pembayaran...', 'info');
    try {
      const orderStatus = await savePayment(updateTransaction, updatedTransaction, {
        completeIfReady: canComplete,
      });
      const autoCompleted = orderStatus !== updatedTransaction.orderStatus;
      const savedTransaction = { ...updatedTransaction, orderStatus };

      addAuditLog(
        `Menerima pembayaran untuk transaksi ${updatedTransaction.id}. Status bayar: ${updatedTransaction.paymentStatus}.` +
          (autoCompleted ? ` Status pesanan menjadi "${orderStatus}".` : ''),
        updatedTransaction.storeId,
      );
      updateToast(
        toastId,
        autoCompleted
          ? 'Pembayaran disimpan. Pesanan ditandai Selesai.'
          : 'Pembayaran berhasil disimpan.',
        'success',
      );

      setIsPaymentModalOpen(false);
      setSelectedTransaction(null);
      if (
        savedTransaction.paymentStatus === PaymentStatus.Paid &&
        savedTransaction.orderStatus === OrderStatus.Completed
      ) {
        setTransactionForWhatsApp(savedTransaction);
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

  // Handler untuk export dan template
  const handleExportTransactions = async () => {
    const toastId = addToast('Mengekspor transaksi...', 'info');
    try {
      // Fetch SEMUA transaksi dengan filter yang sama, tanpa pagination
      updateToast(toastId, 'Mengambil semua data transaksi...', 'info');

      let query = supabase.from('transactions').select('*', { count: 'exact' });

      // Terapkan filter yang sama dengan tampilan saat ini
      if (dateRange) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        query = query
          .gte('createdAt', fromDate.toISOString())
          .lte('createdAt', toDate.toISOString());
      }

      if (currentUser?.storeId) {
        query = query.eq('storeId', currentUser.storeId);
      }

      if (statusFilter !== 'all') {
        query = query.eq('orderStatus', statusFilter);
      }

      if (paymentFilter !== 'all') {
        query = query.eq('paymentStatus', paymentFilter);
      }

      // Order by createdAt descending
      query = query.order('createdAt', { ascending: false });

      const { data: allTransactions, error } = await query;

      if (error) throw error;
      if (!allTransactions || allTransactions.length === 0) {
        updateToast(toastId, 'Tidak ada transaksi untuk diekspor.', 'warning');
        return;
      }

      updateToast(toastId, `Mengekspor ${allTransactions.length} transaksi...`, 'info');

      // Convert null to undefined untuk kompatibilitas dengan Transaction type
      const transactionsToExport = allTransactions.map((t) => ({
        ...t,
        customerId: t.customerId ?? undefined,
        createdByUserId: t.createdByUserId ?? undefined,
        paymentMethod: t.paymentMethod ?? undefined,
      })) as unknown as Transaction[];

      const customersForExport = customers.map((c: Customer) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
      }));

      await exportTransactionsToExcel(transactionsToExport, customersForExport);
      updateToast(
        toastId,
        `Berhasil mengekspor ${allTransactions.length} transaksi ke Excel.`,
        'success',
      );
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal mengekspor transaksi: ${errMsg}`, 'error');
    }
  };

  const handleDownloadTemplate = async () => {
    const toastId = addToast('Mengunduh template...', 'info');
    try {
      await downloadTransactionTemplate();
      updateToast(toastId, 'Template transaksi berhasil diunduh.', 'success');
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal mengunduh template: ${errMsg}`, 'error');
    }
  };

  const handleImportFromExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = addToast('Memproses file Excel...', 'info');

    try {
      // Import transaksi dari Excel
      const result = await importTransactionsFromExcel(file, customers, services, transactions);

      // Tampilkan hasil
      if (result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
        updateToast(
          toastId,
          `Import selesai dengan ${result.errors.length} error. ${result.success.length} transaksi berhasil diimport.`,
          'warning',
        );

        // Tampilkan detail error
        result.errors.forEach((err) => {
          addToast(`Baris ${err.row}: ${err.error}`, 'error');
        });
      }

      if (result.success.length === 0) {
        updateToast(toastId, 'Tidak ada transaksi yang berhasil diimport.', 'error');
        return;
      }

      // Simpan transaksi ke database
      updateToast(toastId, `Menyimpan ${result.success.length} transaksi...`, 'info');

      let successCount = 0;
      let failCount = 0;

      for (const transaction of result.success) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...transactionData } = transaction;

          // Gunakan addTransaction dari context
          await addTransaction(transactionData);
          successCount++;

          // Audit log
          addAuditLog(
            `Import transaksi: ${transaction.invoiceCode || transaction.id}`,
            transaction.storeId,
          );
        } catch (err) {
          console.error('Error saving transaction:', err);
          failCount++;
        }
      }

      if (failCount > 0) {
        updateToast(
          toastId,
          `Import selesai: ${successCount} berhasil, ${failCount} gagal disimpan.`,
          'warning',
        );
      } else {
        updateToast(toastId, `Berhasil mengimport ${successCount} transaksi!`, 'success');
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal import: ${errMsg}`, 'error');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
    setCurrentPage(1);
    // Reset searchParams in URL
    const params = new URLSearchParams();
    setSearchParams(params);
  };

  // Handler untuk pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedIds(new Set()); // Clear selection on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset ke halaman 1 saat filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, paymentFilter, selectedDate, customerFilter, debouncedSearchTerm]);

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

    if (bulkActionStatus === OrderStatus.Completed && !canComplete) {
      addToast('Hanya Kasir atau Admin yang dapat menyelesaikan pesanan.', 'error');
      setIsBulkConfirmOpen(false);
      setBulkActionStatus(null);
      return;
    }

    // Nota belum lunas boleh "Siap Diambil" (bayar saat diambil), tapi belum boleh "Selesai".
    const unpaidTransactions = transactionsToUpdate.filter(
      (t: Transaction) =>
        bulkActionStatus === OrderStatus.Completed && t.paymentStatus !== PaymentStatus.Paid,
    );

    if (unpaidTransactions.length > 0) {
      addToast(
        `${unpaidTransactions.length} transaksi belum lunas dan tidak dapat diselesaikan.`,
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

  const selectedTransactions = useMemo(
    () => transactions.filter((t: Transaction) => selectedIds.has(t.id)),
    [transactions, selectedIds],
  );
  const selectedUnpaidCount = selectedTransactions.filter(
    (t: Transaction) => t.paymentStatus !== PaymentStatus.Paid,
  ).length;

  const confirmBulkPayment = async (method: PaymentMethod) => {
    if (!canBulkPay) {
      addToast(
        'Hanya Admin atau Super Admin yang dapat melunasi transaksi secara massal.',
        'error',
      );
      setIsBulkPaymentOpen(false);
      return;
    }

    setIsBulkProcessing(true);
    const toastId = addToast('Melunasi transaksi...', 'info');
    try {
      const { succeeded, failed } = await bulkMarkPaid(
        updateTransaction,
        selectedTransactions,
        method,
        { completeIfReady: canComplete },
      );
      const completed = succeeded.filter((s) => s.orderStatus === OrderStatus.Completed);

      if (succeeded.length > 0) {
        addAuditLog(
          `Melunasi ${succeeded.length} transaksi secara massal via ${method}: ${succeeded
            .map((s) => s.id)
            .join(', ')}.` +
            (completed.length > 0 ? ` ${completed.length} pesanan menjadi "Selesai".` : ''),
        );
      }

      if (failed.length === 0) {
        updateToast(
          toastId,
          `Berhasil melunasi ${succeeded.length} transaksi.` +
            (completed.length > 0 ? ` ${completed.length} pesanan ditandai Selesai.` : ''),
          'success',
        );
        setSelectedIds(new Set());
      } else {
        updateToast(
          toastId,
          `${succeeded.length} transaksi lunas, ${failed.length} gagal: ${failed[0].error}`,
          'error',
        );
        // Sisakan pilihan pada nota yang gagal agar bisa dicoba lagi.
        setSelectedIds(new Set(failed.map((f) => f.id)));
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal melunasi transaksi: ${errMsg}`, 'error');
    } finally {
      setIsBulkPaymentOpen(false);
      setIsBulkProcessing(false);
    }
  };

  const statusOptions: (OrderStatus | 'all')[] = ['all', ...Object.values(OrderStatus)];

  return (
    <>
      <div className="card relative p-3 sm:p-4">
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
        <div id="transaction-actions" className="flex justify-end mb-6">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isAdminRole(currentUser?.role) && (
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
                  id="transaction-import-file"
                  name="transaction-import-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFromExcel}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary btn-sm"
                  title="Import dari Excel"
                >
                  <UploadIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Import</span>
                </button>

                <button
                  onClick={handleExportTransactions}
                  disabled={transactions.length === 0}
                  className="btn btn-primary btn-sm"
                  title="Export ke Excel"
                >
                  <DownloadIcon className="w-4 h-4" />
                  <span className="hidden sm:inline text-sm">Export</span>
                </button>
              </>
            )}
            {canCreateTransaction && (
              <Link to="/transactions/new" className="btn btn-primary btn-sm">
                <PlusCircleIcon className="h-5 w-5" />
                Transaksi Baru
              </Link>
            )}
          </div>
        </div>

        <div
          id="transaction-filters"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700"
        >
          <SearchInput
            id="searchTerm"
            name="searchTerm"
            label="Cari transaksi"
            placeholder="Cari ID, Invoice, Nama, atau No. HP..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            wrapperClassName="sm:col-span-2"
          />
          {canReadCustomers && (
            <div>
              <label htmlFor="customerFilter" className="sr-only">
                Filter Pelanggan
              </label>
              <select
                id="customerFilter"
                name="customerFilter"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="form-input"
              >
                <option value="all">Semua Pelanggan</option>
                {customers.map((c: Customer) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="paymentFilter" className="sr-only">
              Filter Status Bayar
            </label>
            <select
              id="paymentFilter"
              name="paymentFilter"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentStatus | 'all')}
              className="form-input"
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
              name="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="form-input"
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
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {canBulkPay && (
                <button
                  type="button"
                  onClick={() => setIsBulkPaymentOpen(true)}
                  disabled={selectedUnpaidCount === 0}
                  className="btn btn-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    selectedUnpaidCount === 0
                      ? 'Semua transaksi terpilih sudah lunas'
                      : 'Tandai transaksi terpilih yang belum lunas menjadi Lunas'
                  }
                >
                  Tandai Lunas ({selectedUnpaidCount})
                </button>
              )}
              <div className="relative">
                <select
                  id="bulk-status-change"
                  name="bulk-status-change"
                  onChange={(e) => handleBulkStatusChange(e.target.value as OrderStatus)}
                  className="pl-3 pr-8 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 appearance-none"
                  value=""
                >
                  <option value="" disabled>
                    Ubah Status Menjadi...
                  </option>
                  {Object.values(OrderStatus).map((status) => (
                    <option
                      key={status}
                      value={status}
                      disabled={status === OrderStatus.Completed && !canComplete}
                    >
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="w-5 h-5 text-white absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div id="transaction-table" className="card hidden md:block overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-sm text-left text-slate-500 dark:text-slate-400">
              <thead className="text-xs sm:text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400 whitespace-nowrap">
                <tr>
                  <th className="px-1 sm:px-2 py-2 sm:py-3 w-8 sm:w-10 text-center">
                    <input
                      type="checkbox"
                      id="transaction-select-all"
                      name="transaction-select-all"
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
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 text-xs sm:text-sm"
                    >
                      Tgl Masuk {getSortIcon('createdAt')}
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3">
                    <button
                      onClick={() => requestSort('estimatedCompletionDate')}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 text-xs sm:text-sm"
                    >
                      Estimasi Selesai {getSortIcon('estimatedCompletionDate')}
                    </button>
                  </th>
                  {canTakePayment && (
                    <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                      <button
                        onClick={() => requestSort('total')}
                        className="flex items-center justify-end w-full gap-1 hover:text-slate-900 dark:hover:text-slate-200 text-xs sm:text-sm"
                      >
                        Total {getSortIcon('total')}
                      </button>
                    </th>
                  )}
                  <th className="px-2 sm:px-4 py-2 sm:py-3">
                    <button
                      onClick={() => requestSort('paymentStatus')}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 text-xs sm:text-sm"
                    >
                      Pembayaran {getSortIcon('paymentStatus')}
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <button
                      onClick={() => requestSort('orderStatus')}
                      className="flex items-center justify-end w-full gap-1 hover:text-slate-900 dark:hover:text-slate-200 text-xs sm:text-sm"
                    >
                      Status {getSortIcon('orderStatus')}
                    </button>
                  </th>
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-center">Aksi</th>
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
                          id={`transaction-checkbox-${t.id}`}
                          name={`transaction-checkbox-${t.id}`}
                          onChange={() => handleSelectOne(t.id)}
                          checked={selectedIds.has(t.id)}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                        />
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium text-slate-900 dark:text-white text-xs sm:text-sm">
                        {formatTransactionId(t)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                        {t.customerName}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                        {formatDateTime(t.createdAt)}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm whitespace-nowrap">
                        {formatDateTime(t.estimatedCompletionDate)}
                      </td>
                      {canTakePayment && (
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">
                          Rp {t.total.toLocaleString('id-ID')}
                        </td>
                      )}
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            t.paymentStatus === PaymentStatus.Paid
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          }`}
                        >
                          {t.paymentStatus === PaymentStatus.Paid ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                        <select
                          id={`order-status-${t.id}`}
                          name={`order-status-${t.id}`}
                          value={t.orderStatus}
                          onChange={(e) =>
                            handleOrderStatusChange(t.id, e.target.value as OrderStatus)
                          }
                          className={`badge cursor-pointer appearance-none border-0 py-1 ${getStatusBadge(t.orderStatus)}`}
                          title={
                            t.paymentStatus !== PaymentStatus.Paid
                              ? 'Belum lunas: bisa ditandai Siap Diambil, selesai otomatis saat dilunasi'
                              : ''
                          }
                        >
                          {Object.values(OrderStatus).map((status) => {
                            // 'Selesai' hanya bisa dipilih bila sudah lunas; nota belum lunas
                            // tetap boleh 'Siap Diambil' dan ditutup otomatis saat dilunasi.
                            const disableCompleted =
                              status === OrderStatus.Completed &&
                              (!canComplete || t.paymentStatus !== PaymentStatus.Paid);
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

                      <td className="px-4 py-2.5 text-center flex items-center justify-center space-x-1">
                        {canTakePayment && t.paymentStatus !== PaymentStatus.Paid && (
                          <button
                            aria-label="Proses pembayaran"
                            onClick={() => handleOpenPaymentModal(t)}
                            title="Proses Pembayaran"
                            className="btn btn-ghost btn-icon text-green-700 dark:text-green-400"
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
                        {canTakePayment && (
                          <Link
                            to={`/transactions/${t.id}/receipt`}
                            title="Cetak Struk"
                            className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 inline-block"
                          >
                            <PrinterIcon className="w-5 h-5" />
                          </Link>
                        )}
                        {canNotify && (
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
                            title={waButtonTitle(t)}
                            aria-label={waButtonTitle(t)}
                            className={`relative p-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 ${
                              t.whatsappSentAt
                                ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
                                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                          >
                            <SendIcon className="w-5 h-5" />
                            {t.whatsappSentAt && <WaSentDot />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={canTakePayment ? 9 : 8}>
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
                        {canCreateTransaction && (
                          <Link to="/transactions/new" className="btn btn-primary mx-auto max-w-xs">
                            <PlusCircleIcon className="h-5 w-5" />
                            Buat Transaksi Baru
                          </Link>
                        )}
                      </EmptyState>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="md:hidden space-y-3 sm:space-y-4">
          {paginatedTransactions.length > 0 ? (
            paginatedTransactions.map((t: TransactionWithCustomer) => (
              <div
                key={t.id}
                className={`p-3 sm:p-4 rounded-lg shadow-md text-slate-600 dark:text-slate-300 relative min-h-[120px] ${selectedIds.has(t.id) ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' : 'bg-white dark:bg-slate-800'}`}
              >
                <div className="absolute top-3 left-2">
                  <input
                    type="checkbox"
                    id={`transaction-mobile-checkbox-${t.id}`}
                    name={`transaction-mobile-checkbox-${t.id}`}
                    onChange={() => handleSelectOne(t.id)}
                    checked={selectedIds.has(t.id)}
                    className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 dark:bg-slate-700 dark:border-slate-500 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-8">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="font-bold text-lg text-slate-900 dark:text-white">
                      {t.customerName}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    {formatTransactionId(t)}
                  </p>
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-base">
                        Tgl Masuk:
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDateTime(t.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-base">
                        Estimasi Selesai:
                      </span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDateTime(t.estimatedCompletionDate)}
                      </span>
                    </div>
                    {canTakePayment && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 text-base">Total:</span>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">
                          Rp {t.total.toLocaleString('id-ID')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-base">
                        Status Pesanan:
                      </span>
                      <span className={`badge ${getStatusBadge(t.orderStatus)}`}>
                        {t.orderStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-slate-400 text-base">
                        Status Bayar:
                      </span>
                      <span className={`badge ${getPaymentStatusBadge(t.paymentStatus)}`}>
                        {t.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-start space-x-4 text-slate-600 dark:text-slate-400">
                    {canTakePayment && t.paymentStatus !== PaymentStatus.Paid && (
                      <button
                        aria-label="Proses pembayaran"
                        onClick={() => handleOpenPaymentModal(t)}
                        title="Proses Pembayaran"
                        className="btn btn-ghost btn-icon text-green-700 dark:text-green-400"
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
                    {canTakePayment && (
                      <Link
                        to={`/transactions/${t.id}/receipt`}
                        title="Cetak Struk"
                        className="hover:text-slate-900 dark:hover:text-white"
                      >
                        <PrinterIcon className="w-6 h-6" />
                      </Link>
                    )}
                    {canNotify && (
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
                        title={waButtonTitle(t)}
                        aria-label={waButtonTitle(t)}
                        className={`relative ${
                          t.whatsappSentAt
                            ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
                            : 'hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <SendIcon className="w-6 h-6" />
                        {t.whatsappSentAt && <WaSentDot />}
                      </button>
                    )}
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
              {canCreateTransaction && (
                <Link to="/transactions/new" className="btn btn-primary mx-auto max-w-xs">
                  <PlusCircleIcon className="h-5 w-5" />
                  Buat Transaksi Baru
                </Link>
              )}
            </EmptyState>
          )}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
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
      {canBulkPay && isBulkPaymentOpen && (
        <BulkPaymentModal
          isOpen={true}
          onClose={() => setIsBulkPaymentOpen(false)}
          transactions={selectedTransactions}
          onConfirm={confirmBulkPayment}
          completeIfReady={canComplete}
          isProcessing={isBulkProcessing}
        />
      )}
    </>
  );
};

export default TransactionPage;

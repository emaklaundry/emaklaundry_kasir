import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Transaction, OrderStatus, PaymentStatus, Customer } from '../../types';
import { PlusCircleIcon, SearchIcon, PrinterIcon, SendIcon, EyeIcon, DollarSignIcon, ShoppingCartIcon, ArrowUpIcon, ArrowDownIcon, ChevronDownIcon } from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import { useTransactions } from '../../contexts/TransactionContext';
import { useCustomers } from '../../contexts/CustomerContext';
import PaymentModal from '../../components/PaymentModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useToasts } from '../../contexts/ToastContext';
import { useSortableData } from '../../hooks/useSortableData';
import { useDebounce } from '../../hooks/useDebounce';
import { usePagination } from '../../hooks/usePagination';
import Pagination from '../../components/Pagination';

const TransactionPage: React.FC = () => {
    const { transactions, updateTransaction } = useTransactions();
    const { customers } = useCustomers();
    const { addAuditLog } = useAuditLogs();
    const { addToast } = useToasts();
    
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [selectedDate, setSelectedDate] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>(() => {
        const status = searchParams.get('status');
        return (status && Object.values(OrderStatus).includes(status as OrderStatus)) ? status as OrderStatus : 'all';
    });
    const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'all'>('all');
    const [customerFilter, setCustomerFilter] = useState<string | 'all'>('all');
    
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isSavingPayment, setIsSavingPayment] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [transactionForWhatsApp, setTransactionForWhatsApp] = useState<Transaction | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
    const [bulkActionStatus, setBulkActionStatus] = useState<OrderStatus | null>(null);

    useEffect(() => {
        const status = searchParams.get('status');
        const validStatus = status && Object.values(OrderStatus).includes(status as OrderStatus) ? status as OrderStatus : 'all';
        setStatusFilter(validStatus);
    }, [searchParams]);

    const transactionsWithCustomer = useMemo(() => {
        return transactions.map(t => {
            const customer = customers.find(c => c.id === t.customerId);
            return {
                ...t,
                customerName: customer ? customer.name : 'N/A',
                customerPhone: customer ? customer.phone : 'N/A',
            };
        });
    }, [transactions, customers]);
    
    type TransactionWithCustomer = (typeof transactionsWithCustomer)[0];

    const filteredTransactions = useMemo(() => {
        return transactionsWithCustomer.filter(t => {
            const transactionDate = new Date(t.createdAt);

            if (statusFilter !== 'all' && t.orderStatus !== statusFilter) return false;
            if (paymentFilter !== 'all' && t.paymentStatus !== paymentFilter) return false;
            if (customerFilter !== 'all' && t.customerId !== customerFilter) return false;
            
            if (selectedDate) {
                const parts = selectedDate.split('-').map(p => parseInt(p, 10));
                const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(startOfDay);
                endOfDay.setHours(23, 59, 59, 999);
                if (transactionDate < startOfDay || transactionDate > endOfDay) return false;
            }

            if (!debouncedSearchTerm) return true;
            const term = debouncedSearchTerm.toLowerCase();
            return t.id.toLowerCase().includes(term) ||
                   t.customerName.toLowerCase().includes(term) ||
                   t.customerPhone.includes(term);
        });
    }, [transactionsWithCustomer, debouncedSearchTerm, selectedDate, statusFilter, paymentFilter, customerFilter]);
    
    const { items: sortedTransactions, requestSort, sortConfig } = useSortableData<TransactionWithCustomer>(filteredTransactions, { key: 'createdAt', direction: 'descending' });
    const { currentData: paginatedTransactions, currentPage, totalPages, onPageChange } = usePagination(sortedTransactions);


    const getSortIcon = (key: keyof TransactionWithCustomer) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
        return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
    };

    const getStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.Processing: return 'bg-blue-600 text-white';
            case OrderStatus.Ready: return 'bg-yellow-500 text-white';
            case OrderStatus.Completed: return 'bg-green-600 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };
    
    const getPaymentStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Paid: return 'bg-green-600 text-white';
            case PaymentStatus.Unpaid: return 'bg-red-600 text-white';
            case PaymentStatus.PartiallyPaid: return 'bg-orange-500 text-white';
            default: return 'bg-slate-500 text-white';
        }
    };
    
    const handleOrderStatusChange = async (id: string, newStatus: OrderStatus) => {
        const targetTransaction = transactions.find(t => t.id === id);
        if (!targetTransaction) return;

        const updatedTransaction = { ...targetTransaction, orderStatus: newStatus };
        const shouldShowWhatsAppModal = newStatus === OrderStatus.Ready && targetTransaction.orderStatus !== OrderStatus.Ready;

        try {
            await updateTransaction(id, { orderStatus: newStatus });
            addAuditLog(`Mengubah status transaksi ${id} menjadi "${newStatus}".`, targetTransaction.storeId);
            if (shouldShowWhatsAppModal) {
                setTransactionForWhatsApp(updatedTransaction);
                setIsWhatsAppModalOpen(true);
            }
        } catch (error: any) {
            addToast(`Gagal memperbarui status: ${error.message}`, 'error');
        }
    };

    const handleOpenPaymentModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = async (updatedTransaction: Transaction) => {
        const shouldShowModal = updatedTransaction.paymentStatus === PaymentStatus.Paid && updatedTransaction.orderStatus === OrderStatus.Completed;
        setIsSavingPayment(true);
        try {
            await updateTransaction(updatedTransaction.id, updatedTransaction);
            addAuditLog(`Menerima pembayaran untuk transaksi ${updatedTransaction.id}. Status bayar: ${updatedTransaction.paymentStatus}.`, updatedTransaction.storeId);
            setIsPaymentModalOpen(false);
            setSelectedTransaction(null);
            if (shouldShowModal) {
                setTransactionForWhatsApp(updatedTransaction);
                setIsWhatsAppModalOpen(true);
            }
        } catch (error: any) {
            addToast(`Gagal memperbarui pembayaran: ${error.message}`, 'error');
        } finally {
            setIsSavingPayment(false);
        }
    };

    const handleSendGenericWhatsApp = (transaction: typeof filteredTransactions[0]) => {
        if (!transaction.customerPhone) {
            addToast('Nomor telepon pelanggan tidak ditemukan.', 'error');
            return;
        }
        const message = `Halo ${transaction.customerName},\n\nIni adalah rincian untuk transaksi Anda di Laundry POS:\n\nID Transaksi: ${transaction.id}\nTotal: Rp ${transaction.total.toLocaleString('id-ID')}\nStatus Pesanan: ${transaction.orderStatus}\nStatus Bayar: ${transaction.paymentStatus}\n\nTerima kasih!`;
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const phone = transaction.customerPhone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        
        const whatsappUrl = isMobile 
            ? `https://wa.me/${phone}?text=${encodedMessage}`
            : `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;
            
        window.open(whatsappUrl, '_blank');
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
        handleStatusFilterChange('all');
        setPaymentFilter('all');
        setCustomerFilter('all');
    };

    const customerForWhatsApp = useMemo(() => {
        if (!transactionForWhatsApp) return null;
        return customers.find(c => c.id === transactionForWhatsApp.customerId);
    }, [transactionForWhatsApp, customers]);

    // Bulk Action Handlers
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(sortedTransactions.map(t => t.id)));
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

        const transactionsToUpdate = transactions.filter(t => selectedIds.has(t.id));
        const unpaidAndNotReady = transactionsToUpdate.filter(t => bulkActionStatus === OrderStatus.Completed && t.paymentStatus !== PaymentStatus.Paid);

        if (unpaidAndNotReady.length > 0) {
            addToast(`${unpaidAndNotReady.length} transaksi belum lunas dan tidak dapat diselesaikan.`, 'error');
            setIsBulkConfirmOpen(false);
            setBulkActionStatus(null);
            return;
        }

        try {
            const updatePromises = transactionsToUpdate.map(t => 
                updateTransaction(t.id, { orderStatus: bulkActionStatus })
            );
            await Promise.all(updatePromises);
            addAuditLog(`Mengubah status ${selectedIds.size} transaksi menjadi "${bulkActionStatus}" secara massal.`);
            setSelectedIds(new Set());
        } catch (error: any) {
            addToast(`Gagal memperbarui status massal: ${error.message}`, 'error');
        } finally {
            setIsBulkConfirmOpen(false);
            setBulkActionStatus(null);
        }
    };

    const statusOptions: (OrderStatus | 'all')[] = ['all', ...Object.values(OrderStatus)];
    
    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Daftar Transaksi</h1>
                    <Link to="/transactions/new" className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Transaksi Baru
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari ID, nama, atau no. HP..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                     <div>
                        <select value={customerFilter} onChange={e => setCustomerFilter(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <option value="all">Semua Pelanggan</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value as PaymentStatus | 'all')} className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                            <option value="all">Semua St. Bayar</option>
                            {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <input 
                            id="selectedDate"
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base text-slate-600 dark:text-slate-300">Status Pesanan:</span>
                        {statusOptions.map(status => (
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
                    <button onClick={resetFilters} className="text-base text-blue-600 dark:text-blue-400 hover:underline">
                        Reset Filter
                    </button>
                </div>

                {selectedIds.size > 0 && (
                    <div className="bg-blue-50 dark:bg-blue-900/50 p-3 rounded-lg flex items-center justify-between mb-4">
                        <span className="font-semibold text-blue-800 dark:text-blue-300">{selectedIds.size} transaksi dipilih</span>
                        <div className="relative">
                            <select
                                onChange={(e) => handleBulkStatusChange(e.target.value as OrderStatus)}
                                className="pl-3 pr-8 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none appearance-none"
                                value=""
                            >
                                <option value="" disabled>Ubah Status Menjadi...</option>
                                {Object.values(OrderStatus).map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                            <ChevronDownIcon className="w-5 h-5 text-white absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                )}
                
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                            <tr>
                                <th className="px-2 py-3 w-10 text-center"><input type="checkbox" onChange={handleSelectAll} checked={sortedTransactions.length > 0 && selectedIds.size === sortedTransactions.length} className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500" /></th>
                                <th className="px-4 py-3"><button onClick={() => requestSort('id')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">ID Transaksi {getSortIcon('id')}</button></th>
                                <th className="px-4 py-3"><button onClick={() => requestSort('customerName')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Pelanggan {getSortIcon('customerName')}</button></th>
                                <th className="px-4 py-3"><button onClick={() => requestSort('createdAt')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Tanggal {getSortIcon('createdAt')}</button></th>
                                <th className="px-4 py-3 text-right"><button onClick={() => requestSort('total')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 ml-auto">Total {getSortIcon('total')}</button></th>
                                <th className="px-4 py-3"><button onClick={() => requestSort('orderStatus')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Status Pesanan {getSortIcon('orderStatus')}</button></th>
                                <th className="px-4 py-3"><button onClick={() => requestSort('paymentStatus')} className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200">Status Bayar {getSortIcon('paymentStatus')}</button></th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map(t => (
                                <tr key={t.id} className={`border-b dark:border-slate-700 ${selectedIds.has(t.id) ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}>
                                    <td className="px-2 py-3 text-center"><input type="checkbox" onChange={() => handleSelectOne(t.id)} checked={selectedIds.has(t.id)} className="w-5 h-5 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"/></td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                                    <td className="px-4 py-3">{t.customerName}</td>
                                    <td className="px-4 py-3">{new Date(t.createdAt).toLocaleDateString('id-ID')}</td>
                                    <td className="px-4 py-3 text-right">Rp {t.total.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3">
                                        <select
                                            value={t.orderStatus}
                                            onChange={(e) => handleOrderStatusChange(t.id, e.target.value as OrderStatus)}
                                            className={`px-2 py-1 text-sm font-medium rounded-full border-0 focus:ring-0 focus:outline-none appearance-none cursor-pointer ${getStatusBadge(t.orderStatus)}`}
                                            title={t.paymentStatus !== PaymentStatus.Paid ? "Pelunasan diperlukan untuk menyelesaikan pesanan" : ""}
                                        >
                                            {Object.values(OrderStatus).map(status => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                    className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                                    disabled={status === OrderStatus.Completed && t.paymentStatus !== PaymentStatus.Paid}
                                                >
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className={`px-2 py-1 text-sm font-medium rounded-full text-center ${getPaymentStatusBadge(t.paymentStatus)}`}>
                                            {t.paymentStatus}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center flex items-center justify-center space-x-1">
                                        {t.paymentStatus !== PaymentStatus.Paid && (
                                            <button onClick={() => handleOpenPaymentModal(t)} title="Proses Pembayaran" className="p-2.5 rounded-md text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                                <DollarSignIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        <Link to={`/transactions/${t.id}/details`} title="Lihat Detail" className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 inline-block">
                                            <EyeIcon className="w-5 h-5" />
                                        </Link>
                                        <Link to={`/transactions/${t.id}/receipt`} title="Cetak Struk" className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 inline-block">
                                            <PrinterIcon className="w-5 h-5" />
                                        </Link>
                                        <button onClick={() => handleSendGenericWhatsApp(t)} title="Kirim Struk via WhatsApp" className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
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
                                            description={searchTerm || selectedDate || statusFilter !== 'all' || paymentFilter !== 'all' || customerFilter !== 'all' ? "Tidak ada transaksi yang cocok dengan kriteria filter Anda." : "Belum ada transaksi yang dibuat."}
                                        >
                                            <Link to="/transactions/new" className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto max-w-xs">
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

                <div className="md:hidden space-y-4">
                     {paginatedTransactions.length > 0 ? (
                        paginatedTransactions.map(t => (
                            <div key={t.id} className={`p-4 rounded-lg shadow-md text-slate-300 relative ${selectedIds.has(t.id) ? 'bg-blue-800/70 ring-2 ring-blue-500' : 'bg-slate-800'}`}>
                                <div className="absolute top-3 left-2"><input type="checkbox" onChange={() => handleSelectOne(t.id)} checked={selectedIds.has(t.id)} className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500"/></div>
                                <div className="ml-8">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-lg text-white">{t.customerName}</p>
                                        <p className="text-sm text-slate-400">{new Date(t.createdAt).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})}</p>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">{t.id}</p>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between items-center"><span className="text-slate-400 text-base">Total:</span><span className="font-bold text-lg text-white">Rp {t.total.toLocaleString('id-ID')}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-slate-400 text-base">Status Pesanan:</span><span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(t.orderStatus)}`}>{t.orderStatus}</span></div>
                                        <div className="flex justify-between items-center"><span className="text-slate-400 text-base">Status Bayar:</span><span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}>{t.paymentStatus}</span></div>
                                    </div>
                                    <div className="flex items-center justify-start space-x-4 text-green-400">
                                        {t.paymentStatus !== PaymentStatus.Paid && (<button onClick={() => handleOpenPaymentModal(t)} title="Proses Pembayaran" className="hover:text-green-300"><DollarSignIcon className="w-6 h-6" /></button>)}
                                        <Link to={`/transactions/${t.id}/details`} title="Lihat Detail" className="hover:text-green-300"><EyeIcon className="w-6 h-6" /></Link>
                                        <Link to={`/transactions/${t.id}/receipt`} title="Cetak Struk" className="hover:text-green-300"><PrinterIcon className="w-6 h-6" /></Link>
                                        <button onClick={() => handleSendGenericWhatsApp(t)} title="Kirim Struk via WhatsApp" className="hover:text-green-300"><SendIcon className="w-6 h-6" /></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <EmptyState
                            icon={<ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />}
                            title="Tidak Ada Transaksi"
                            description={searchTerm || selectedDate || statusFilter !== 'all' || paymentFilter !== 'all' || customerFilter !== 'all' ? "Tidak ada transaksi yang cocok dengan kriteria filter Anda." : "Belum ada transaksi yang dibuat."}
                        >
                            <Link to="/transactions/new" className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto max-w-xs">
                                <PlusCircleIcon className="h-5 w-5 mr-2" />
                                Buat Transaksi Baru
                            </Link>
                        </EmptyState>
                    )}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
            {isPaymentModalOpen && <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} transaction={selectedTransaction} onSave={handleSavePayment} disabled={isSavingPayment} />}
            {isWhatsAppModalOpen && <WhatsAppModal isOpen={isWhatsAppModalOpen} onClose={() => setIsWhatsAppModalOpen(false)} transaction={transactionForWhatsApp} customer={customerForWhatsApp} />}
            {isBulkConfirmOpen && <ConfirmationModal isOpen={true} onClose={() => setIsBulkConfirmOpen(false)} onConfirm={confirmBulkAction} title="Konfirmasi Aksi Massal" message={`Anda yakin ingin mengubah status ${selectedIds.size} transaksi menjadi "${bulkActionStatus}"?`} confirmText="Ya, Ubah" />}
        </>
    );
};

export default TransactionPage;
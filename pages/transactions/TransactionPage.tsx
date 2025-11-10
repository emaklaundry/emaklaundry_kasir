import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Transaction, OrderStatus, PaymentStatus } from '../../types';
import { PlusCircleIcon, SearchIcon, PrinterIcon, SendIcon, EyeIcon, DollarSignIcon, ShoppingCartIcon } from '../../components/icons';
import { useTransactions } from '../../contexts/TransactionContext';
import { useCustomers } from '../../contexts/CustomerContext';
import PaymentModal from '../../components/PaymentModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import Modal from '../../components/Modal';
import { useAuditLogs } from '../../contexts/AuditLogContext';

const TransactionPage: React.FC = () => {
    const { transactions, setTransactions } = useTransactions();
    const { customers } = useCustomers();
    const { addAuditLog } = useAuditLogs();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [transactionForWhatsApp, setTransactionForWhatsApp] = useState<Transaction | null>(null);

    const transactionsWithCustomer = useMemo(() => {
        return transactions.map(t => {
            const customer = customers.find(c => c.id === t.customerId);
            return {
                ...t,
                customerName: customer ? customer.name : 'N/A',
                customerPhone: customer ? customer.phone : 'N/A',
            };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [transactions, customers]);
    
    const filteredTransactions = useMemo(() => {
        return transactionsWithCustomer.filter(t => {
            const transactionDate = new Date(t.createdAt);
            if (selectedDate) {
                const parts = selectedDate.split('-').map(p => parseInt(p, 10));
                const startOfDay = new Date(parts[0], parts[1] - 1, parts[2]);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(startOfDay);
                endOfDay.setHours(23, 59, 59, 999);
                if (transactionDate < startOfDay || transactionDate > endOfDay) return false;
            }
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return t.id.toLowerCase().includes(term) ||
                   t.customerName.toLowerCase().includes(term) ||
                   t.customerPhone.includes(term);
        });
    }, [transactionsWithCustomer, searchTerm, selectedDate]);
    
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
    
    const handleOpenWhatsAppModal = (transaction: Transaction) => {
        setTransactionForWhatsApp(transaction);
        setIsWhatsAppModalOpen(true);
    };

    const handleOrderStatusChange = (id: string, newStatus: OrderStatus) => {
        const targetTransaction = transactions.find(t => t.id === id);
        if (!targetTransaction) return;

        const updatedTransaction = { ...targetTransaction, orderStatus: newStatus };
        const shouldShowWhatsAppModal = newStatus === OrderStatus.Ready && targetTransaction.orderStatus !== OrderStatus.Ready;
        
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        addAuditLog(`Mengubah status transaksi ${id} menjadi "${newStatus}".`, targetTransaction.storeId);
        
        if (shouldShowWhatsAppModal) {
            handleOpenWhatsAppModal(updatedTransaction);
        }
    };

    const handleOpenPaymentModal = (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setIsPaymentModalOpen(true);
    };

    const handleSavePayment = (updatedTransaction: Transaction) => {
        const shouldShowModal = updatedTransaction.paymentStatus === PaymentStatus.Paid && updatedTransaction.orderStatus === OrderStatus.Completed;

        setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
        addAuditLog(`Menerima pembayaran untuk transaksi ${updatedTransaction.id}. Status bayar: ${updatedTransaction.paymentStatus}.`, updatedTransaction.storeId);
        setIsPaymentModalOpen(false);
        setSelectedTransaction(null);
        
        if (shouldShowModal) {
            handleOpenWhatsAppModal(updatedTransaction);
        }
    };

    const handleSendGenericWhatsApp = (transaction: typeof filteredTransactions[0]) => {
        if (!transaction.customerPhone) {
            alert('Nomor telepon pelanggan tidak ditemukan.');
            return;
        }
        const message = `Halo ${transaction.customerName},\n\nIni adalah rincian untuk transaksi Anda di Laundry POS:\n\nID Transaksi: ${transaction.id}\nTotal: Rp ${transaction.total.toLocaleString('id-ID')}\nStatus Pesanan: ${transaction.orderStatus}\nStatus Bayar: ${transaction.paymentStatus}\n\nTerima kasih!`;
        const whatsappUrl = `https://wa.me/${transaction.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const customerForWhatsApp = useMemo(() => {
        if (!transactionForWhatsApp) return null;
        return customers.find(c => c.id === transactionForWhatsApp.customerId);
    }, [transactionForWhatsApp, customers]);
    
    const NoTransactionsFound = () => (
        <div className="text-center py-12">
            <ShoppingCartIcon className="mx-auto w-12 h-12 text-slate-400" />
            <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">Tidak Ada Transaksi</h3>
            <p className="mt-1 text-base text-slate-500">
                {searchTerm || selectedDate ? "Tidak ada transaksi yang cocok dengan kriteria filter Anda." : "Belum ada transaksi yang dibuat."}
            </p>
            <div className="mt-6">
                <Link to="/transactions/new" className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 mx-auto max-w-xs">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    Buat Transaksi Baru
                </Link>
            </div>
        </div>
    );

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

                <div className="flex flex-col md:flex-row items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 flex-wrap">
                    <div className="relative w-full md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari ID, nama, atau no. HP..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="selectedDate" className="text-base text-slate-600 dark:text-slate-300 flex-shrink-0">Tanggal:</label>
                        <input 
                            id="selectedDate"
                            type="date"
                            value={selectedDate}
                            onChange={e => setSelectedDate(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>
                    {selectedDate && (
                        <button 
                            onClick={() => setSelectedDate('')}
                            className="text-base text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Reset
                        </button>
                    )}
                </div>
                
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                    <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-3">ID Transaksi</th>
                                <th className="px-4 py-3">Pelanggan</th>
                                <th className="px-4 py-3">Tanggal</th>
                                <th className="px-4 py-3 text-right">Total</th>
                                <th className="px-4 py-3">Status Pesanan</th>
                                <th className="px-4 py-3">Status Bayar</th>
                                <th className="px-4 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map(t => (
                                <tr key={t.id} className="border-b dark:border-slate-700">
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
                                    <td colSpan={7}>
                                       <NoTransactionsFound />
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                     {filteredTransactions.length > 0 ? (
                        filteredTransactions.map(t => (
                            <div key={t.id} className="bg-slate-800 p-4 rounded-lg shadow-md text-slate-300">
                                <div className="flex justify-between items-center pb-3">
                                    <div>
                                        <p className="font-bold text-lg text-white">{t.customerName}</p>
                                        <p className="text-sm text-slate-400">{t.id}</p>
                                    </div>
                                    <p className="text-sm">{new Date(t.createdAt).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit', year: 'numeric'})}</p>
                                </div>
                                
                                <div className="mt-2 grid grid-cols-[max-content,1fr] gap-x-4 gap-y-2 text-base">
                                    <span className="text-slate-400">Total:</span>
                                    <span className="font-bold text-lg text-white text-right">Rp {t.total.toLocaleString('id-ID')}</span>
                                    
                                    <span className="text-slate-400">Status Pesanan:</span>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(t.orderStatus)}`}>{t.orderStatus}</span>
                                    </div>

                                    <span className="text-slate-400">Status Bayar:</span>
                                    <div className="text-right">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}>{t.paymentStatus}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-end space-x-2">
                                    {t.paymentStatus !== PaymentStatus.Paid && (
                                        <button onClick={() => handleOpenPaymentModal(t)} title="Proses Pembayaran" className="p-2 rounded-md text-green-400 hover:text-green-300 hover:bg-slate-700">
                                            <DollarSignIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                    <Link to={`/transactions/${t.id}/details`} title="Lihat Detail" className="p-2 rounded-md text-green-400 hover:text-green-300 hover:bg-slate-700">
                                        <EyeIcon className="w-5 h-5" />
                                    </Link>
                                    <Link to={`/transactions/${t.id}/receipt`} title="Cetak Struk" className="p-2 rounded-md text-green-400 hover:text-green-300 hover:bg-slate-700">
                                        <PrinterIcon className="w-5 h-5" />
                                    </Link>
                                    <button onClick={() => handleSendGenericWhatsApp(t)} title="Kirim Struk via WhatsApp" className="p-2 rounded-md text-green-400 hover:text-green-300 hover:bg-slate-700">
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <NoTransactionsFound />
                    )}
                </div>
            </div>
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                transaction={selectedTransaction}
                onSave={handleSavePayment}
            />
            <WhatsAppModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                transaction={transactionForWhatsApp}
                customer={customerForWhatsApp}
            />
        </>
    );
};

export default TransactionPage;
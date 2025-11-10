import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Transaction, OrderStatus, PaymentStatus } from '../../types';
import { PlusCircleIcon, SearchIcon, PrinterIcon, SendIcon, EyeIcon, DollarSignIcon, ShoppingCartIcon } from '../../components/icons';
import { useTransactions } from '../../contexts/TransactionContext';
import { useCustomers } from '../../contexts/CustomerContext';
import PaymentModal from '../../components/PaymentModal';
import WhatsAppModal from '../../components/WhatsAppModal';
import Modal from '../../components/Modal';

const TransactionPage: React.FC = () => {
    const { transactions, setTransactions } = useTransactions();
    const { customers } = useCustomers();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [transactionForWhatsApp, setTransactionForWhatsApp] = useState<Transaction | null>(null);
    const [warningModalMessage, setWarningModalMessage] = useState<string | null>(null);

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
            case OrderStatus.Processing: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case OrderStatus.Ready: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case OrderStatus.Completed: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        }
    };
    
    const getPaymentStatusBadge = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Paid: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case PaymentStatus.Unpaid: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            case PaymentStatus.PartiallyPaid: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        }
    };
    
    const handleOpenWhatsAppModal = (transaction: Transaction) => {
        setTransactionForWhatsApp(transaction);
        setIsWhatsAppModalOpen(true);
    };

    const handleOrderStatusChange = (id: string, newStatus: OrderStatus) => {
        const targetTransaction = transactions.find(t => t.id === id);
        if (!targetTransaction) return;

        if (newStatus === OrderStatus.Completed && targetTransaction.paymentStatus !== PaymentStatus.Paid) {
            setWarningModalMessage('Pesanan tidak dapat diselesaikan sebelum lunas. Silakan proses pembayaran terlebih dahulu.');
            return;
        }

        const updatedTransaction = { ...targetTransaction, orderStatus: newStatus };
        const shouldShowWhatsAppModal = newStatus === OrderStatus.Ready && targetTransaction.orderStatus !== OrderStatus.Ready;
        
        setTransactions(prev => prev.map(t => t.id === id ? updatedTransaction : t));
        
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
                
                <div className="overflow-x-auto">
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
                                        >
                                            {Object.values(OrderStatus).map(status => (
                                                <option key={status} value={status} className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">{status}</option>
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
                                    <td colSpan={7} className="text-center py-12">
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
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
             {warningModalMessage && (
                <Modal
                    isOpen={true}
                    onClose={() => setWarningModalMessage(null)}
                    title="Peringatan"
                    footer={
                        <button 
                            onClick={() => setWarningModalMessage(null)} 
                            className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3"
                        >
                            Mengerti
                        </button>
                    }
                >
                    <p className="text-lg leading-relaxed text-slate-500 dark:text-slate-300">
                        {warningModalMessage}
                    </p>
                </Modal>
            )}
        </>
    );
};

export default TransactionPage;
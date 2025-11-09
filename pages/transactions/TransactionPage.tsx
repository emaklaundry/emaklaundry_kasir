import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mockTransactions, mockCustomers, mockSettings } from '../../data/mockData';
import { Transaction, OrderStatus, PaymentStatus } from '../../types';
import { PlusCircleIcon, SearchIcon, PrinterIcon, Trash2Icon, SendIcon } from '../../components/icons';
import ConfirmationModal from '../../components/ConfirmationModal';

const TransactionPage: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const enrichedTransactions = useMemo(() => {
        return transactions.map(t => {
            const customer = mockCustomers.find(c => c.id === t.customerId);
            return {
                ...t,
                customerName: customer?.name || 'N/A',
                customerPhone: customer?.phone || 'N/A'
            };
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        let transactionsToFilter = enrichedTransactions;

        if (filterDate) {
            transactionsToFilter = transactionsToFilter.filter(t => 
                new Date(t.createdAt).toISOString().split('T')[0] === filterDate
            );
        }

        if (searchTerm) {
            transactionsToFilter = transactionsToFilter.filter(t => 
                t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.customerPhone.includes(searchTerm)
            );
        }
        
        return transactionsToFilter;
    }, [enrichedTransactions, searchTerm, filterDate]);

    const handleDelete = (transaction: Transaction) => {
        setTransactionToDelete(transaction);
    };

    const confirmDelete = () => {
        if (transactionToDelete) {
            setTransactions(transactions.filter(t => t.id !== transactionToDelete.id));
            setTransactionToDelete(null);
        }
    };
    
    const handleSendWhatsApp = (transaction: (typeof enrichedTransactions)[0]) => {
        if (!transaction.customerPhone) {
            alert('Nomor telepon pelanggan tidak ditemukan.');
            return;
        }

        let message = `*Struk Laundry POS*\n\n`;
        message += `No. Invoice: *${transaction.id}*\n`;
        message += `Pelanggan: ${transaction.customerName}\n`;
        message += `Tanggal: ${new Date(transaction.createdAt).toLocaleString('id-ID')}\n`;
        message += `Status: *${transaction.orderStatus} - ${transaction.paymentStatus}*\n`;
        message += `Estimasi Selesai: ${new Date(transaction.estimatedCompletionDate).toLocaleDateString('id-ID')}\n\n`;
        message += `*Detail Pesanan:*\n`;
        transaction.items.forEach(item => {
            message += `- ${item.serviceName} (${item.quantity} ${item.unit}): Rp ${item.subtotal.toLocaleString('id-ID')}\n`;
        });
        message += `\n*Total: Rp ${transaction.total.toLocaleString('id-ID')}*\n\n`;
        message += `${mockSettings.receiptMessage}\n`;
        message += `Hubungi kami: ${mockSettings.whatsappNumber}`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${transaction.customerPhone}?text=${encodedMessage}`, '_blank');
    };

    const getOrderStatusBadge = (status: OrderStatus) => {
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
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Daftar Transaksi</h1>
                <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-4">
                     <div className="flex items-center gap-4 w-full md:w-auto">
                        <input 
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                        <div className="relative w-full md:w-64">
                             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Cari transaksi..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                        </div>
                    </div>
                    <Link to="/transactions/new" className="flex-shrink-0 w-full md:w-auto flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        Transaksi Baru
                    </Link>
                </div>
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
                            <th className="px-4 py-3">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.map(t => (
                            <tr key={t.id} className="border-b dark:border-slate-700">
                                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{t.id}</td>
                                <td className="px-4 py-3">{t.customerName}</td>
                                <td className="px-4 py-3">{new Date(t.createdAt).toLocaleDateString('id-ID')}</td>
                                <td className="px-4 py-3 text-right">Rp {t.total.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-sm font-medium rounded-full ${getOrderStatusBadge(t.orderStatus)}`}>{t.orderStatus}</span>
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}>{t.paymentStatus}</span>
                                </td>
                                <td className="px-4 py-3 flex items-center space-x-2">
                                    <Link to={`/transactions/${t.id}/receipt`} title="Lihat Struk" className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <PrinterIcon className="w-5 h-5" />
                                    </Link>
                                    <button onClick={() => handleSendWhatsApp(t)} title="Kirim Struk via WhatsApp" className="p-2.5 rounded-md text-green-600 hover:text-green-900 dark:text-green-500 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(t)} title="Hapus Transaksi" className="p-2.5 rounded-md text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Trash2Icon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {transactionToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setTransactionToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Hapus Transaksi"
                    message={`Apakah Anda yakin ingin menghapus transaksi "${transactionToDelete.id}"? Tindakan ini tidak dapat diurungkan.`}
                />
            )}
        </div>
    );
};

export default TransactionPage;
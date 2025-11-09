

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { mockCustomers } from '../../data/mockData';
import { Transaction, OrderStatus, PaymentStatus } from '../../types';
import { PlusCircleIcon, SearchIcon, PrinterIcon, SendIcon } from '../../components/icons';
import { useTransactions } from '../../contexts/TransactionContext';

const TransactionPage: React.FC = () => {
    const { transactions, setTransactions } = useTransactions();
    const [searchTerm, setSearchTerm] = useState('');

    const transactionsWithCustomer = useMemo(() => {
        return transactions.map(t => {
            const customer = mockCustomers.find(c => c.id === t.customerId);
            return {
                ...t,
                customerName: customer ? customer.name : 'N/A',
                customerPhone: customer ? customer.phone : 'N/A',
            };
        }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }, [transactions]);
    
    const filteredTransactions = transactionsWithCustomer.filter(t => 
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customerPhone.includes(searchTerm)
    );
    
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
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
        }
    };

    const handleStatusChange = (
      id: string,
      field: 'orderStatus' | 'paymentStatus',
      value: OrderStatus | PaymentStatus
    ) => {
        setTransactions(prev =>
            prev.map(t =>
                t.id === id ? { ...t, [field]: value } : t
            )
        );
        // In a real app, you would also trigger an API call to save the change.
    };

    const handleSendWhatsApp = (transaction: typeof filteredTransactions[0]) => {
        if (!transaction.customerPhone) {
            alert('Nomor telepon pelanggan tidak ditemukan.');
            return;
        }
        const message = `Halo ${transaction.customerName},\n\nIni adalah rincian untuk transaksi Anda di Laundry POS:\n\nID Transaksi: ${transaction.id}\nTotal: Rp ${transaction.total.toLocaleString('id-ID')}\nStatus Pesanan: ${transaction.orderStatus}\nStatus Bayar: ${transaction.paymentStatus}\n\nTerima kasih!`;
        const whatsappUrl = `https://wa.me/${transaction.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };


    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Daftar Transaksi</h1>
                 <div className="w-full md:w-auto flex items-center gap-4">
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
                    <Link to="/transactions/new" className="flex-shrink-0 flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3.5">
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
                            <th className="px-4 py-3 text-center">Aksi</th>
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
                                    <select
                                        value={t.orderStatus}
                                        onChange={(e) => handleStatusChange(t.id, 'orderStatus', e.target.value as OrderStatus)}
                                        className={`px-2 py-1 text-sm font-medium rounded-full border-0 focus:ring-0 focus:outline-none appearance-none cursor-pointer ${getStatusBadge(t.orderStatus)}`}
                                    >
                                        {Object.values(OrderStatus).map(status => (
                                            <option key={status} value={status} className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                     <select
                                        value={t.paymentStatus}
                                        onChange={(e) => handleStatusChange(t.id, 'paymentStatus', e.target.value as PaymentStatus)}
                                        className={`px-2 py-1 text-sm font-medium rounded-full border-0 focus:ring-0 focus:outline-none appearance-none cursor-pointer ${getPaymentStatusBadge(t.paymentStatus)}`}
                                    >
                                        {Object.values(PaymentStatus).map(status => (
                                            <option key={status} value={status} className="bg-white dark:bg-slate-700 text-slate-900 dark:text-white">{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3 text-center flex items-center justify-center space-x-2">
                                    <Link to={`/transactions/${t.id}/receipt`} title="Cetak Struk" className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 inline-block">
                                        <PrinterIcon className="w-5 h-5" />
                                    </Link>
                                    <button onClick={() => handleSendWhatsApp(t)} title="Kirim Struk via WhatsApp" className="p-2.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <SendIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionPage;
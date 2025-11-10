import React, { useState, useMemo } from 'react';
import { BarChartIcon, DollarSignIcon, PackageIcon, UsersIcon } from '../components/icons';
import { mockUsers } from '../data/mockData';
import { Transaction, UserRole } from '../types';
import { useTransactions } from '../contexts/TransactionContext';
import { useCustomers } from '../contexts/CustomerContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAppContext } from '../contexts/AppContext';
import { useServices } from '../contexts/ServiceContext';

const StatCard: React.FC<{ icon: React.FC<{className?: string}>, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 ${color}`}>
        <Icon className="w-10 h-10 text-slate-500" />
        <div>
            <p className="text-base text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const ReportsPage: React.FC = () => {
    const { transactions: storeFilteredTransactions } = useTransactions();
    const { customers } = useCustomers();
    const { expenses: storeFilteredExpenses } = useExpenses();
    const { services } = useServices();
    const { currentUser, selectedStoreId, stores } = useAppContext();
    const [view, setView] = useState<'custom' | 'weekly' | 'monthly'>('custom');
    const today = new Date();
    const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [endDate, setEndDate] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0));

    const setDateRange = (viewType: 'custom' | 'weekly' | 'monthly') => {
        const now = new Date();
        if (viewType === 'weekly') {
            const firstDay = new Date(now.setDate(now.getDate() - now.getDay() + 1));
            const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 7));
            setStartDate(new Date(firstDay.setHours(0,0,0,0)));
            setEndDate(new Date(lastDay.setHours(23,59,59,999)));
        } else if (viewType === 'monthly') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(firstDay);
            setEndDate(lastDay);
        }
        setView(viewType);
    };

    const filteredData = useMemo(() => {
        const start = startDate.getTime();
        const end = endDate.getTime();
        const transactions = storeFilteredTransactions.filter(t => {
            const time = new Date(t.createdAt).getTime();
            return time >= start && time <= end;
        });
        const expenses = storeFilteredExpenses.filter(e => {
            const time = new Date(e.date).getTime();
            return time >= start && time <= end;
        });
        return { transactions, expenses };
    }, [startDate, endDate, storeFilteredTransactions, storeFilteredExpenses]);

    const totalRevenue = filteredData.transactions.reduce((acc, t) => acc + t.amountPaid, 0);
    const totalExpenses = filteredData.expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    
    const topServices = useMemo(() => {
         const serviceStats = services.map(service => {
            const revenue = filteredData.transactions.reduce((total, transaction) => {
                const serviceItem = transaction.items.find(item => item.serviceId === service.id);
                return total + (serviceItem ? serviceItem.subtotal : 0);
            }, 0);
            return { name: service.name, revenue };
        });
        return serviceStats.filter(s => s.revenue > 0).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
    }, [filteredData.transactions, services]);

    const topCustomers = useMemo(() => {
        const customerSpending: {[key: string]: number} = {};
        filteredData.transactions.forEach(t => {
            customerSpending[t.customerId] = (customerSpending[t.customerId] || 0) + t.total;
        });
        return Object.entries(customerSpending)
            .map(([customerId, total]) => ({
                name: customers.find(c => c.id === customerId)?.name || 'N/A',
                total
            }))
            .sort((a,b) => b.total - a.total)
            .slice(0, 5);
    }, [filteredData.transactions, customers]);

    const cashierPerformance = useMemo(() => {
        const stats: { [key: number]: { name: string, transactionCount: number, totalRevenue: number, totalDiscount: number } } = {};
        
        filteredData.transactions.forEach(t => {
            const userId = t.createdByUserId;
            if (!userId) return;
            const user = mockUsers.find(u => u.id === userId);
            if (!user) return;

            if (!stats[userId]) {
                stats[userId] = {
                    name: user.name,
                    transactionCount: 0,
                    totalRevenue: 0,
                    totalDiscount: 0,
                };
            }
            
            stats[userId].transactionCount += 1;
            stats[userId].totalRevenue += t.amountPaid;
            stats[userId].totalDiscount += t.discount;
        });

        return Object.values(stats).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [filteredData.transactions]);

    const getStoreName = () => {
        if (currentUser.role === UserRole.SuperAdmin) {
            if (selectedStoreId === 'all') return 'Laporan Gabungan - Semua Cabang';
            const store = stores.find(s => s.id === selectedStoreId);
            return `Laporan - ${store?.name || 'Cabang Tidak Dikenal'}`;
        }
        const store = stores.find(s => s.id === currentUser.storeId);
        return `Laporan - ${store?.name || 'Cabang Tidak Dikenal'}`;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-medium text-slate-600 dark:text-slate-400 -mb-2">{getStoreName()}</h2>
            <div className="flex justify-between items-center flex-wrap gap-4">
                 <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setDateRange('custom')} className={`px-4 py-2 text-base font-medium rounded-md ${view === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Kustom</button>
                    <button onClick={() => setDateRange('weekly')} className={`px-4 py-2 text-base font-medium rounded-md ${view === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Minggu Ini</button>
                    <button onClick={() => setDateRange('monthly')} className={`px-4 py-2 text-base font-medium rounded-md ${view === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Bulan Ini</button>
                </div>
                 {view === 'custom' && (
                    <div className="flex items-center gap-4">
                        <input type="date" value={startDate.toISOString().split('T')[0]} onChange={e => setStartDate(new Date(e.target.value))} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-base"/>
                        <span>-</span>
                        <input type="date" value={endDate.toISOString().split('T')[0]} onChange={e => setEndDate(new Date(e.target.value))} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-base"/>
                    </div>
                )}
                <button onClick={() => window.print()} className="print-hide flex items-center justify-center text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-6 py-3">Cetak Laporan</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={DollarSignIcon} title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} color="border-green-500" />
                <StatCard icon={DollarSignIcon} title="Total Pengeluaran" value={`Rp ${totalExpenses.toLocaleString('id-ID')}`} color="border-red-500" />
                <StatCard icon={BarChartIcon} title="Laba Bersih" value={`Rp ${netProfit.toLocaleString('id-ID')}`} color="border-blue-500" />
                <StatCard icon={PackageIcon} title="Total Transaksi" value={filteredData.transactions.length} color="border-yellow-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Layanan Terlaris</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                             <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr><th className="px-4 py-2">Nama Layanan</th><th className="px-4 py-2 text-right">Pendapatan</th></tr>
                            </thead>
                            <tbody>
                                {topServices.map(service => (
                                    <tr key={service.name} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{service.name}</td>
                                        <td className="px-4 py-2 text-right">Rp {service.revenue.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Pelanggan Teratas</h2>
                    <div className="overflow-x-auto">
                         <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr><th className="px-4 py-2">Nama Pelanggan</th><th className="px-4 py-2 text-right">Total Belanja</th></tr>
                            </thead>
                            <tbody>
                                {topCustomers.map(customer => (
                                    <tr key={customer.name} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{customer.name}</td>
                                        <td className="px-4 py-2 text-right">Rp {customer.total.toLocaleString('id-ID')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                    <UsersIcon className="w-6 h-6 mr-3 text-slate-500" />
                    Performa Kasir
                </h2>
                <div className="overflow-x-auto">
                     <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                        <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                            <tr>
                                <th className="px-4 py-2">Nama Kasir</th>
                                <th className="px-4 py-2 text-center">Total Transaksi</th>
                                <th className="px-4 py-2 text-right">Total Pendapatan</th>
                                <th className="px-4 py-2 text-right">Total Diskon Diberikan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashierPerformance.length > 0 ? cashierPerformance.map(cashier => (
                                <tr key={cashier.name} className="border-b dark:border-slate-700">
                                    <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{cashier.name}</td>
                                    <td className="px-4 py-2 text-center">{cashier.transactionCount}</td>
                                    <td className="px-4 py-2 text-right">Rp {cashier.totalRevenue.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-2 text-right">Rp {cashier.totalDiscount.toLocaleString('id-ID')}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-6 text-slate-500 dark:text-slate-400">
                                        Tidak ada data performa untuk rentang tanggal ini.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;

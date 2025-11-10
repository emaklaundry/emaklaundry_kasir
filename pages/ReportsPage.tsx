import React, { useState, useMemo } from 'react';
import { BarChartIcon, DollarSignIcon, PackageIcon, UsersIcon } from '../components/icons';
import { Transaction, UserRole, Service, User, ServiceCategory } from '../types';
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
    const { transactions: allStoreTransactions } = useTransactions();
    const { customers } = useCustomers();
    const { expenses: allStoreExpenses } = useExpenses();
    const { services } = useServices();
    const { currentUser, selectedStoreId, stores, allUsers } = useAppContext();
    
    const [reportType, setReportType] = useState<'range' | 'yearlySummary'>('range');
    const [rangeType, setRangeType] = useState<'monthly' | 'weekly' | 'custom'>('monthly');

    const today = new Date();
    const [customStartDate, setCustomStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [customEndDate, setCustomEndDate] = useState(new Date(today.getFullYear(), today.getMonth() + 1, 0));

    const { startDate, endDate } = useMemo(() => {
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        if (rangeType === 'weekly') {
            const firstDayOfWeek = new Date(now);
            firstDayOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
            firstDayOfWeek.setHours(0, 0, 0, 0);
            return { startDate: firstDayOfWeek, endDate: now };
        }
        if (rangeType === 'monthly') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: firstDay, endDate: now };
        }
        // custom view
        const endOfDay = new Date(customEndDate);
        endOfDay.setHours(23, 59, 59, 999);
        return { startDate: customStartDate, endDate: endOfDay };
    }, [rangeType, customStartDate, customEndDate]);

    const filteredData = useMemo(() => {
        const start = startDate.getTime();
        const end = endDate.getTime();
        const transactions = allStoreTransactions.filter(t => {
            const time = new Date(t.createdAt).getTime();
            return time >= start && time <= end;
        });
        const expenses = allStoreExpenses.filter(e => {
            const time = new Date(e.date).getTime();
            return time >= start && time <= end;
        });
        return { transactions, expenses };
    }, [startDate, endDate, allStoreTransactions, allStoreExpenses]);

    const totalRevenue = filteredData.transactions.reduce((acc, t) => acc + t.amountPaid, 0);
    const totalExpenses = filteredData.expenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const serviceMap = useMemo(() => services.reduce((map, service) => ({ ...map, [service.id]: service }), {} as Record<string, Service>), [services]);
    
    const topServices = useMemo(() => {
        const serviceRevenue: { [key: string]: number } = {};
        filteredData.transactions.forEach(t => t.items.forEach(item => {
            serviceRevenue[item.serviceId] = (serviceRevenue[item.serviceId] || 0) + item.subtotal;
        }));
        return Object.entries(serviceRevenue).map(([serviceId, revenue]) => ({ name: serviceMap[serviceId]?.name || 'Layanan Dihapus', revenue }))
            .filter(s => s.revenue > 0).sort((a,b) => b.revenue - a.revenue).slice(0, 5);
    }, [filteredData.transactions, serviceMap]);

    const topCustomers = useMemo(() => {
        const customerSpending: {[key: string]: number} = {};
        filteredData.transactions.forEach(t => {
            customerSpending[t.customerId] = (customerSpending[t.customerId] || 0) + t.total;
        });
        return Object.entries(customerSpending).map(([customerId, total]) => ({ name: customers.find(c => c.id === customerId)?.name || 'N/A', total }))
            .sort((a,b) => b.total - a.total).slice(0, 5);
    }, [filteredData.transactions, customers]);
    
    const userMap = useMemo(() => allUsers.reduce((map, user) => ({ ...map, [user.id]: user }), {} as Record<number, User>), [allUsers]);

    const cashierPerformance = useMemo(() => {
        const stats: { [key: number]: { name: string, transactionCount: number, totalRevenue: number, totalDiscount: number } } = {};
        filteredData.transactions.forEach(t => {
            if (!t.createdByUserId || !userMap[t.createdByUserId]) return;
            const user = userMap[t.createdByUserId];
            if (!stats[user.id]) stats[user.id] = { name: user.name, transactionCount: 0, totalRevenue: 0, totalDiscount: 0 };
            stats[user.id].transactionCount++;
            stats[user.id].totalRevenue += t.amountPaid;
            stats[user.id].totalDiscount += t.discount;
        });
        return Object.values(stats).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [filteredData.transactions, userMap]);

    const revenueByCategory = useMemo(() => {
        const categoryRevenue: { [key in ServiceCategory]?: number } = {};
        filteredData.transactions.forEach(t => t.items.forEach(item => {
            const service = serviceMap[item.serviceId];
            if (service) categoryRevenue[service.category] = (categoryRevenue[service.category] || 0) + item.subtotal;
        }));
        return Object.entries(categoryRevenue).map(([category, revenue]) => ({ category: category as ServiceCategory, revenue: revenue as number }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredData.transactions, serviceMap]);

    const monthlySummary = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const yearTransactions = allStoreTransactions.filter(t => new Date(t.createdAt).getFullYear() === currentYear);
        const yearExpenses = allStoreExpenses.filter(e => new Date(e.date).getFullYear() === currentYear);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const summary = monthNames.map(name => ({ month: name, revenue: 0, expenses: 0, profit: 0 }));
        yearTransactions.forEach(t => { summary[new Date(t.createdAt).getMonth()].revenue += t.amountPaid; });
        yearExpenses.forEach(e => { summary[new Date(e.date).getMonth()].expenses += e.amount; });
        summary.forEach(m => { m.profit = m.revenue - m.expenses; });
        return summary;
    }, [allStoreTransactions, allStoreExpenses]);

    const maxMonthlyValue = useMemo(() => reportType === 'yearlySummary' ? Math.max(...monthlySummary.flatMap(m => [m.revenue, m.expenses])) : 0, [reportType, monthlySummary]);

    const getStoreName = () => {
        if (currentUser.role === UserRole.SuperAdmin) {
            if (selectedStoreId === 'all') return 'Laporan Gabungan - Semua Cabang';
            return `Laporan - ${stores.find(s => s.id === selectedStoreId)?.name || 'Cabang Tidak Dikenal'}`;
        }
        return `Laporan - ${stores.find(s => s.id === currentUser.storeId)?.name || 'Cabang Tidak Dikenal'}`;
    };

    const isRangeReport = reportType === 'range';

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-medium text-slate-600 dark:text-slate-400 -mb-2">{getStoreName()}</h2>
            <div className="flex justify-between items-center flex-wrap gap-4">
                 <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <button onClick={() => setReportType('range')} className={`px-4 py-2 text-base font-medium rounded-md ${isRangeReport ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Rentang Waktu</button>
                    <button onClick={() => setReportType('yearlySummary')} className={`px-4 py-2 text-base font-medium rounded-md ${!isRangeReport ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Ringkasan Tahunan</button>
                </div>
                 {isRangeReport && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button onClick={() => setRangeType('weekly')} className={`px-3 py-1.5 text-base font-medium rounded-md ${rangeType === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Minggu Ini</button>
                            <button onClick={() => setRangeType('monthly')} className={`px-3 py-1.5 text-base font-medium rounded-md ${rangeType === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Bulan Ini</button>
                            <button onClick={() => setRangeType('custom')} className={`px-3 py-1.5 text-base font-medium rounded-md ${rangeType === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}>Kustom</button>
                        </div>
                        {rangeType === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input type="date" value={customStartDate.toISOString().split('T')[0]} onChange={e => setCustomStartDate(new Date(e.target.value))} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-base"/>
                                <span>-</span>
                                <input type="date" value={customEndDate.toISOString().split('T')[0]} onChange={e => setCustomEndDate(new Date(e.target.value))} className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-base"/>
                            </div>
                        )}
                    </div>
                )}
                <button onClick={() => window.print()} className="print-hide flex items-center justify-center text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-6 py-3">Cetak Laporan</button>
            </div>

            {isRangeReport ? (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={DollarSignIcon} title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString('id-ID')}`} color="border-green-500" />
                    <StatCard icon={DollarSignIcon} title="Total Pengeluaran" value={`Rp ${totalExpenses.toLocaleString('id-ID')}`} color="border-red-500" />
                    <StatCard icon={BarChartIcon} title="Laba Bersih" value={`Rp ${netProfit.toLocaleString('id-ID')}`} color="border-blue-500" />
                    <StatCard icon={PackageIcon} title="Total Transaksi" value={filteredData.transactions.length} color="border-yellow-500" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md"><h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Layanan Terlaris</h2><div className="overflow-x-auto"><table className="w-full text-base text-left text-slate-500 dark:text-slate-400"><thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400"><tr><th className="px-4 py-2">Nama Layanan</th><th className="px-4 py-2 text-right">Pendapatan</th></tr></thead><tbody>{topServices.map(s => (<tr key={s.name} className="border-b dark:border-slate-700"><td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{s.name}</td><td className="px-4 py-2 text-right">Rp {s.revenue.toLocaleString('id-ID')}</td></tr>))}</tbody></table></div></div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md"><h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Pelanggan Teratas</h2><div className="overflow-x-auto"><table className="w-full text-base text-left text-slate-500 dark:text-slate-400"><thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400"><tr><th className="px-4 py-2">Nama Pelanggan</th><th className="px-4 py-2 text-right">Total Belanja</th></tr></thead><tbody>{topCustomers.map(c => (<tr key={c.name} className="border-b dark:border-slate-700"><td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{c.name}</td><td className="px-4 py-2 text-right">Rp {c.total.toLocaleString('id-ID')}</td></tr>))}</tbody></table></div></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md"><h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center"><BarChartIcon className="w-6 h-6 mr-3 text-slate-500" />Pendapatan per Kategori Layanan</h2><div className="overflow-x-auto"><table className="w-full text-base text-left text-slate-500 dark:text-slate-400"><thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400"><tr><th className="px-4 py-2">Kategori Layanan</th><th className="px-4 py-2 text-right">Total Pendapatan</th></tr></thead><tbody>{revenueByCategory.length>0?revenueByCategory.map(c=>(<tr key={c.category} className="border-b dark:border-slate-700"><td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{c.category}</td><td className="px-4 py-2 text-right">Rp {c.revenue.toLocaleString('id-ID')}</td></tr>)):(<tr><td colSpan={2} className="text-center py-6 text-slate-500 dark:text-slate-400">Tidak ada data pendapatan.</td></tr>)}</tbody></table></div></div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md"><h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center"><UsersIcon className="w-6 h-6 mr-3 text-slate-500" />Performa Kasir</h2><div className="overflow-x-auto"><table className="w-full text-base text-left text-slate-500 dark:text-slate-400"><thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400"><tr><th className="px-4 py-2">Nama Kasir</th><th className="px-4 py-2 text-center">Total Transaksi</th><th className="px-4 py-2 text-right">Total Pendapatan</th><th className="px-4 py-2 text-right">Total Diskon</th></tr></thead><tbody>{cashierPerformance.length>0?cashierPerformance.map(c=>(<tr key={c.name} className="border-b dark:border-slate-700"><td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{c.name}</td><td className="px-4 py-2 text-center">{c.transactionCount}</td><td className="px-4 py-2 text-right">Rp {c.totalRevenue.toLocaleString('id-ID')}</td><td className="px-4 py-2 text-right">Rp {c.totalDiscount.toLocaleString('id-ID')}</td></tr>)):(<tr><td colSpan={4} className="text-center py-6 text-slate-500 dark:text-slate-400">Tidak ada data performa.</td></tr>)}</tbody></table></div></div>
                </>
            ) : (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Ringkasan Bulanan {new Date().getFullYear()}</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-2">Bulan</th>
                                    <th className="px-4 py-2 text-right">Pendapatan</th>
                                    <th className="px-4 py-2 text-right">Pengeluaran</th>
                                    <th className="px-4 py-2 text-right">Laba Bersih</th>
                                    <th className="px-4 py-2 w-1/4">Visualisasi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlySummary.map(monthData => (
                                    <tr key={monthData.month} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">{monthData.month}</td>
                                        <td className="px-4 py-2 text-right text-green-600 dark:text-green-400">Rp {monthData.revenue.toLocaleString('id-ID')}</td>
                                        <td className="px-4 py-2 text-right text-red-600 dark:text-red-400">Rp {monthData.expenses.toLocaleString('id-ID')}</td>
                                        <td className={`px-4 py-2 text-right font-semibold ${monthData.profit >= 0 ? 'text-slate-800 dark:text-slate-200' : 'text-red-600 dark:text-red-400'}`}>
                                            Rp {monthData.profit.toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 my-1" title={`Pendapatan: Rp ${monthData.revenue.toLocaleString('id-ID')}`}>
                                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${maxMonthlyValue > 0 ? (monthData.revenue / maxMonthlyValue) * 100 : 0}%` }}></div>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5 my-1" title={`Pengeluaran: Rp ${monthData.expenses.toLocaleString('id-ID')}`}>
                                                <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${maxMonthlyValue > 0 ? (monthData.expenses / maxMonthlyValue) * 100 : 0}%` }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                             <tfoot className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700">
                                <tr>
                                    <td className="px-4 py-2">Total</td>
                                    <td className="px-4 py-2 text-right">Rp {monthlySummary.reduce((a, b) => a + b.revenue, 0).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-2 text-right">Rp {monthlySummary.reduce((a, b) => a + b.expenses, 0).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-2 text-right">Rp {monthlySummary.reduce((a, b) => a + b.profit, 0).toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-2"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsPage;

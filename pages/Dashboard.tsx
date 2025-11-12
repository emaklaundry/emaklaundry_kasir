import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatus, PaymentStatus, Expense, UserRole, Customer, Transaction, ScheduledMaintenance } from '../types';
import { 
    ShoppingCartIcon, PackageIcon, WrenchIcon, PlusCircleIcon, DollarSignIcon, 
    CalendarIcon, ChevronRightIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon
} from '../components/icons';
import { useAppContext } from '../contexts/AppContext';
import { useInventory } from '../contexts/InventoryContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useCustomers } from '../contexts/CustomerContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useScheduledMaintenances } from '../contexts/ScheduledMaintenanceContext';
import { useAssets } from '../contexts/AssetContext';
import QuickStockUpdateModal from '../components/QuickStockUpdateModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import QuickMaintenanceModal from '../components/QuickMaintenanceModal';
import WhatsAppModal from '../components/WhatsAppModal';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { useToasts } from '../contexts/ToastContext';
import PaymentModal from '../components/PaymentModal';

type Trend = 'up' | 'down' | 'neutral';

interface TrendData {
    trend: Trend;
    percentage: string;
}

const WeeklyRevenueChart: React.FC<{ data: { day: string, revenue: number }[] }> = ({ data }) => {
    const [tooltip, setTooltip] = useState<{ visible: boolean, content: string, x: number, y: number }>({ visible: false, content: '', x: 0, y: 0 });

    const maxValue = useMemo(() => {
        const maxVal = Math.max(...data.map(d => d.revenue));
        return maxVal === 0 ? 100000 : Math.ceil(maxVal / 10000) * 10000;
    }, [data]);
    
    const chartHeight = 200;

    const showTooltip = (content: string, event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltip({ visible: true, content, x: rect.left + window.scrollX + rect.width / 2, y: rect.top + window.scrollY - 10 });
    };

    const hideTooltip = () => setTooltip({ ...tooltip, visible: false });

    return (
        <div className="relative">
             {tooltip.visible && (
                <div
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%) translateY(-100%)' }}
                    className="absolute z-10 p-2 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded-md shadow-lg"
                    dangerouslySetInnerHTML={{ __html: tooltip.content }}
                >
                </div>
            )}
            <div className="flex justify-between items-end h-full pt-4" style={{ height: `${chartHeight}px` }}>
                {data.map((d, i) => {
                    const barHeight = (d.revenue / maxValue) * (chartHeight - 30);
                    const tooltipContent = `<b>${d.day}</b><br/>Rp ${d.revenue.toLocaleString('id-ID')}`;
                    return (
                        <div key={i} className="flex flex-col items-center w-full">
                            <div
                                className="w-4/5 bg-brand-blue-500 rounded-t-md hover:bg-brand-blue-400"
                                style={{ height: `${barHeight}px`, minHeight: '2px' }}
                                onMouseMove={(e) => showTooltip(tooltipContent, e)}
                                onMouseLeave={hideTooltip}
                            ></div>
                            <span className="text-xs mt-2 text-slate-500 dark:text-slate-400">{d.day}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const StatCard: React.FC<{ 
    icon: React.FC<{className?: string}>, 
    title: string, 
    value: string | number, 
    color: string, 
    to?: string,
    trendData?: TrendData 
}> = ({ icon: Icon, title, value, color, to, trendData }) => {
    
    const TrendIndicator = () => {
        if (!trendData || trendData.trend === 'neutral') return null;

        const isUp = trendData.trend === 'up';
        const trendColor = isUp ? 'text-green-500' : 'text-red-500';
        const TrendIcon = isUp ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

        return (
             <div className={`flex items-center text-sm font-semibold mt-1 ${trendColor}`}>
                <TrendIcon className="w-4 h-4 mr-1" />
                <span>{trendData.percentage} vs 30 hari lalu</span>
            </div>
        );
    };
    
    const content = (
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border-l-4 ${color} ${to ? 'hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-base text-slate-500 dark:text-slate-400">{title}</p>
                    <p className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
                </div>
                 <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-100')} dark:${color.replace('border-', 'bg-').replace('-500', '-900/50')}`}>
                    <Icon className={`w-7 h-7 ${color.replace('border-', 'text-')}`} />
                </div>
            </div>
            <TrendIndicator />
        </div>
    );

    return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
};


import { calculateNextDueDate } from '../utils/formatting';

// Helper function to calculate stats for a given period
const calculateStats = (transactions: Transaction[], startDate: Date, endDate: Date) => {
    const filtered = transactions.filter(t => {
        const createdAt = new Date(t.createdAt);
        return createdAt >= startDate && createdAt <= endDate;
    });
    return {
        completed: filtered.filter(t => t.orderStatus === OrderStatus.Completed).length,
        processing: filtered.filter(t => t.orderStatus === OrderStatus.Processing).length,
    };
};

const Dashboard: React.FC = () => {
    const { currentUser, selectedStoreId, stores } = useAppContext();
    const { inventory } = useInventory();
    const { transactions, updateTransaction } = useTransactions();
    const { customers } = useCustomers();
    const { expenses, addExpense } = useExpenses();
    const { scheduledMaintenances, updateScheduledMaintenance } = useScheduledMaintenances();
    const { assets, updateAsset } = useAssets();
    const { addAuditLog } = useAuditLogs();
    const { addToast } = useToasts();
    
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [transactionForWhatsApp, setTransactionForWhatsApp] = useState<Transaction | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [transactionForPayment, setTransactionForPayment] = useState<Transaction | null>(null);

    const isCashier = currentUser.role === UserRole.Cashier;

    const weeklyRevenueData = useMemo(() => {
        const data = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
                revenue: 0,
                date,
            };
        });

        transactions.forEach(t => {
            const transactionDate = new Date(t.createdAt);
            const dayData = data.find(d => 
                d.date.getDate() === transactionDate.getDate() &&
                d.date.getFullYear() === transactionDate.getFullYear()
            );
            if (dayData) {
                dayData.revenue += t.amountPaid;
            }
        });
        return data;
    }, [transactions]);
    
    const trendStats = useMemo(() => {
        const now = new Date();
        const currentPeriodEnd = new Date(now);
        const currentPeriodStart = new Date(new Date(now).setDate(now.getDate() - 30));
        
        const prevPeriodEnd = new Date(currentPeriodStart);
        prevPeriodEnd.setDate(prevPeriodEnd.getDate() - 1);
        const prevPeriodStart = new Date(new Date(prevPeriodEnd).setDate(prevPeriodEnd.getDate() - 30));

        const currentStats = calculateStats(transactions, currentPeriodStart, currentPeriodEnd);
        const prevStats = calculateStats(transactions, prevPeriodStart, prevPeriodEnd);

        const getTrend = (current: number, previous: number): TrendData => {
            if (previous === 0) {
                return current > 0 ? { trend: 'up', percentage: '100%' } : { trend: 'neutral', percentage: '0%' };
            }
            const change = ((current - previous) / previous) * 100;
            return {
                trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
                percentage: `${Math.abs(change).toFixed(0)}%`
            };
        };

        return {
            completed: getTrend(currentStats.completed, prevStats.completed),
            processing: getTrend(currentStats.processing, prevStats.processing)
        }
    }, [transactions]);


    const lowStockItems = inventory.filter(i => i.stock <= i.lowStockThreshold).length;
    
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    
    const maintenanceDue = useMemo(() => {
        return scheduledMaintenances
            .filter(sm => new Date(sm.nextDueDate) <= now)
            .map(sm => {
                const asset = assets.find(a => a.id === sm.assetId);
                return { ...sm, assetName: asset?.name || 'N/A' };
            })
            .sort((a,b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
    }, [scheduledMaintenances, assets, now]);

    const maintenanceDueCount = maintenanceDue.length;


    const customerMap = useMemo(() => {
        return customers.reduce((map, customer) => {
            map[customer.id] = customer;
            return map;
        }, {} as Record<string, Customer>);
    }, [customers]);

    const activeOrders = transactions
        .filter(t => t.orderStatus !== OrderStatus.Completed)
        .map(t => {
            const customer = customerMap[t.customerId];
            return {
                ...t,
                customerName: customer ? customer.name : 'N/A',
            };
        })
        .sort((a, b) => new Date(a.estimatedCompletionDate).getTime() - new Date(b.estimatedCompletionDate).getTime());
        
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

    const handleSaveExpense = useCallback(async (expense: Omit<Expense, 'id' | 'storeId'>) => {
        const storeId = currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
        if (!storeId || storeId === 'all') { 
            addToast('Silakan pilih cabang spesifik untuk mencatat pengeluaran.', 'warning');
            return;
        }
        const newExpense = { ...expense, storeId };
        await addExpense(newExpense);
        addAuditLog(`Mencatat pengeluaran cepat: "${newExpense.description}".`, storeId);
        setIsExpenseModalOpen(false);
    }, [currentUser.role, currentUser.storeId, selectedStoreId, addExpense, addAuditLog, addToast]);

    const handleOpenPaymentModal = useCallback((transaction: Transaction) => {
        setTransactionForPayment(transaction);
        setIsPaymentModalOpen(true);
    }, []);

    const handleSavePayment = useCallback(async (updatedTransaction: Transaction) => {
        await updateTransaction(updatedTransaction.id, updatedTransaction);
        addAuditLog(`Menerima pembayaran untuk transaksi ${updatedTransaction.id} dari Dashboard. Status bayar: ${updatedTransaction.paymentStatus}.`, updatedTransaction.storeId);
        setIsPaymentModalOpen(false);
        setTransactionForPayment(null);
        addToast('Pembayaran berhasil disimpan.', 'success');
    }, [updateTransaction, addAuditLog, addToast]);
    
    const handleNextStatus = useCallback(async (transactionId: string) => {
        const transaction = transactions.find(t => t.id === transactionId);
        if (!transaction) return;

        let nextStatus: OrderStatus;
        if (transaction.orderStatus === OrderStatus.Processing) {
            nextStatus = OrderStatus.Ready;
        } else if (transaction.orderStatus === OrderStatus.Ready) {
            nextStatus = OrderStatus.Completed;
        } else {
            return; // No next status from 'Completed'
        }

        const updatedTransaction = { ...transaction, orderStatus: nextStatus };
        await updateTransaction(transaction.id, { orderStatus: nextStatus });
        addAuditLog(`Mengubah status transaksi ${transactionId} menjadi "${nextStatus}" dari Dashboard.`, transaction.storeId);

        if (nextStatus === OrderStatus.Ready) {
            setTransactionForWhatsApp({ ...transaction, orderStatus: nextStatus });
            setIsWhatsAppModalOpen(true);
        }
    }, [transactions, updateTransaction, addAuditLog]);
    
    const handleMarkMaintenanceAsComplete = useCallback(async (schedule: ScheduledMaintenance) => {
        const asset = assets.find(a => a.id === schedule.assetId);
        if (!asset) return;
        const newLog = {
            id: `LOG_${crypto.randomUUID()}`,
            date: new Date(),
            description: `[Jadwal] - ${schedule.description}`,
            cost: 0
        };
        await updateAsset(asset.id, { maintenanceHistory: [...asset.maintenanceHistory, newLog] });
        await updateScheduledMaintenance(schedule.id, {
            lastCompletedDate: new Date(),
            nextDueDate: calculateNextDueDate(schedule.nextDueDate, schedule.frequencyValue, schedule.frequencyUnit)
        });
        addAuditLog(`Menandai jadwal perawatan "${schedule.description}" sebagai selesai untuk aset "${asset.name}" dari Dashboard.`, asset.storeId);
        addToast(`Perawatan "${schedule.description}" ditandai selesai.`, 'success');
    }, [assets, updateAsset, updateScheduledMaintenance, addAuditLog, addToast]);

    const customerForWhatsApp = useMemo(() => {
        if (!transactionForWhatsApp) return null;
        return customerMap[transactionForWhatsApp.customerId];
    }, [transactionForWhatsApp, customerMap]);


    const getStoreName = () => {
        if (currentUser.role === UserRole.SuperAdmin) {
            if (selectedStoreId === 'all') return 'Semua Cabang';
            return stores.find(s => s.id === selectedStoreId)?.name || 'Cabang Tidak Dikenal';
        }
        return stores.find(s => s.id === currentUser.storeId)?.name || 'Cabang Tidak Dikenal';
    };

    const isActionDisabled = currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all';

    return (
        <>
            <div className="space-y-6">
                 <div className="mb-4">
                    <h2 className="text-xl font-medium text-slate-600 dark:text-slate-400">Tampilan Data: <span className="font-semibold text-slate-800 dark:text-slate-200">{getStoreName()}</span></h2>
                </div>
                
                {/* Trend Stats - Admin View */}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${isCashier ? 'hidden sm:grid' : 'grid'}`}>
                    <StatCard 
                        icon={PackageIcon} 
                        title="Pesanan Selesai (30 hari)" 
                        value={transactions.filter(t => t.orderStatus === OrderStatus.Completed).length}
                        color="border-green-500"
                        to={`/transactions?status=${OrderStatus.Completed}`}
                        trendData={trendStats.completed}
                    />
                    <StatCard 
                        icon={ShoppingCartIcon} 
                        title="Pesanan Diproses" 
                        value={transactions.filter(t => t.orderStatus === OrderStatus.Processing).length}
                        color="border-blue-500"
                        to={`/transactions?status=${OrderStatus.Processing}`}
                        trendData={trendStats.processing}
                    />
                    <StatCard 
                        icon={WrenchIcon} 
                        title="Stok Menipis" 
                        value={lowStockItems}
                        color="border-orange-500"
                        to="/management/inventory?filter=low_stock"
                    />
                     <StatCard 
                        icon={CalendarIcon} 
                        title="Perawatan Terjadwal" 
                        value={maintenanceDueCount}
                        color="border-red-500"
                        to="/management/assets?filter=maintenance_due"
                    />
                </div>

                {/* Weekly Chart - Admin View */}
                <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md ${isCashier ? 'hidden sm:block' : 'block'}`}>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Pendapatan 7 Hari Terakhir</h2>
                    <WeeklyRevenueChart data={weeklyRevenueData} />
                </div>


                <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md ${isCashier ? 'hidden sm:block' : 'block'}`}>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Aksi Cepat</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => setIsStockModalOpen(true)}
                            disabled={isActionDisabled}
                            className="p-4 rounded-lg border dark:border-slate-700 flex items-center gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
                        >
                            <div className="p-3 rounded-full bg-teal-100 dark:bg-teal-900/50">
                                <WrenchIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                            </div>
                            <span className="font-semibold text-lg text-slate-700 dark:text-slate-200">Update Stok</span>
                        </button>

                        <button
                            onClick={() => setIsExpenseModalOpen(true)}
                            disabled={isActionDisabled}
                            className="p-4 rounded-lg border dark:border-slate-700 flex items-center gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
                        >
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50">
                                <DollarSignIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-semibold text-lg text-slate-700 dark:text-slate-200">Catat Pengeluaran</span>
                        </button>

                        <button
                            onClick={() => setIsMaintenanceModalOpen(true)}
                            disabled={isActionDisabled}
                            className="p-4 rounded-lg border dark:border-slate-700 flex items-center gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
                        >
                            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/50">
                                <PlusCircleIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="font-semibold text-lg text-slate-700 dark:text-slate-200">Lapor Kerusakan</span>
                        </button>
                    </div>
                     {isActionDisabled && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-3">
                            Pilih cabang spesifik untuk melakukan aksi cepat.
                        </p>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Progres Pesanan Aktif</h2>
                    </div>
                     {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden sm:block">
                        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                <tr>
                                    <th className="px-4 py-3">ID Transaksi</th>
                                    <th className="px-4 py-3">Pelanggan</th>
                                    <th className="px-4 py-3">Estimasi Selesai</th>
                                    <th className="px-4 py-3">Status Pesanan</th>
                                    <th className="px-4 py-3">Status Bayar</th>
                                    <th className="px-4 py-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeOrders.length > 0 ? activeOrders.map(t => {
                                    const isSelesaikanDisabled = t.orderStatus === OrderStatus.Ready && t.paymentStatus !== PaymentStatus.Paid;
                                    const nextActionText = t.orderStatus === OrderStatus.Processing ? 'Siap Diambil' : 'Selesaikan';
                                    const nextActionColor = t.orderStatus === OrderStatus.Processing
                                        ? 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300'
                                        : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400';
                                    
                                    return (
                                    <tr key={t.id} className="border-b dark:border-slate-700">
                                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                                            <Link to={`/transactions/${t.id}/details`} className="hover:underline">{t.id}</Link>
                                        </td>
                                        <td className="px-4 py-3">{t.customerName}</td>
                                        <td className="px-4 py-3">{new Date(t.estimatedCompletionDate).toLocaleDateString('id-ID')}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(t.orderStatus)}`}>{t.orderStatus}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}>{t.paymentStatus}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {t.paymentStatus !== PaymentStatus.Paid && (
                                                    <button
                                                        onClick={() => handleOpenPaymentModal(t)}
                                                        className="inline-flex items-center justify-center gap-1 text-sm font-medium text-white rounded-lg px-3 py-1.5 bg-green-600 hover:bg-green-700"
                                                        title="Proses Pembayaran"
                                                    >
                                                        <DollarSignIcon className="w-4 h-4" />
                                                        <span>Bayar</span>
                                                    </button>
                                                )}
                                                {t.orderStatus !== OrderStatus.Completed && (
                                                    <button
                                                        onClick={() => handleNextStatus(t.id)}
                                                        disabled={isSelesaikanDisabled}
                                                        className={`inline-flex items-center justify-center gap-1 text-sm font-medium text-white rounded-lg px-3 py-1.5 disabled:cursor-not-allowed ${nextActionColor}`}
                                                        title={
                                                            isSelesaikanDisabled
                                                            ? 'Pelunasan diperlukan sebelum menyelesaikan pesanan.'
                                                            : `Ubah ke status ${t.orderStatus === OrderStatus.Processing ? OrderStatus.Ready : OrderStatus.Completed}`
                                                        }
                                                    >
                                                        {nextActionText}
                                                        <ChevronRightIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-4 text-slate-500 dark:text-slate-400">
                                            Tidak ada pesanan aktif.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Card View */}
                    <div className="sm:hidden space-y-3">
                        {activeOrders.length > 0 ? activeOrders.map(t => {
                             const isSelesaikanDisabled = t.orderStatus === OrderStatus.Ready && t.paymentStatus !== PaymentStatus.Paid;
                             const mobileNextActionText = t.orderStatus === OrderStatus.Processing ? 'Tandai Siap Diambil' : 'Selesaikan Pesanan';
                             const mobileNextActionColor = t.orderStatus === OrderStatus.Processing
                                ? 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300'
                                : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400';

                             return (
                                <div key={t.id} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{t.customerName}</p>
                                            <Link to={`/transactions/${t.id}/details`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">{t.id}</Link>
                                        </div>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}>{t.paymentStatus}</span>
                                    </div>
                                    <div className="mt-3 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">Status:</span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(t.orderStatus)}`}>{t.orderStatus}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500 dark:text-slate-400">Estimasi Selesai:</span>
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(t.estimatedCompletionDate).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                                        <div className="flex items-center justify-center gap-2">
                                            {t.paymentStatus !== PaymentStatus.Paid && (
                                                <button
                                                    onClick={() => handleOpenPaymentModal(t)}
                                                    className="flex-1 flex items-center justify-center gap-1 text-sm font-medium text-white rounded-md py-2 bg-green-600 hover:bg-green-700"
                                                    title="Proses Pembayaran"
                                                >
                                                    <DollarSignIcon className="w-4 h-4" />
                                                    <span>Bayar</span>
                                                </button>
                                            )}
                                            {t.orderStatus !== OrderStatus.Completed && (
                                                <button
                                                    onClick={() => handleNextStatus(t.id)}
                                                    disabled={isSelesaikanDisabled}
                                                    className={`flex-1 flex items-center justify-center gap-1 text-sm font-medium text-white rounded-md py-2 ${mobileNextActionColor}`}
                                                    title={isSelesaikanDisabled ? 'Pelunasan diperlukan sebelum menyelesaikan pesanan.' : `Ubah ke status ${t.orderStatus === OrderStatus.Processing ? OrderStatus.Ready : OrderStatus.Completed}`}
                                                >
                                                    {mobileNextActionText}
                                                    <ChevronRightIcon className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                             )
                        }) : (
                            <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                                Tidak ada pesanan aktif.
                            </div>
                        )}
                    </div>
                </div>

                 {!isCashier && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Jadwal Perawatan Jatuh Tempo</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                                <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Aset</th>
                                        <th className="px-4 py-3">Deskripsi Perawatan</th>
                                        <th className="px-4 py-3">Jatuh Tempo</th>
                                        <th className="px-4 py-3 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {maintenanceDue.length > 0 ? maintenanceDue.map(m => (
                                        <tr key={m.id} className="border-b dark:border-slate-700">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{m.assetName}</td>
                                            <td className="px-4 py-3">{m.description}</td>
                                            <td className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold">{new Date(m.nextDueDate).toLocaleDateString('id-ID')}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleMarkMaintenanceAsComplete(m)}
                                                    disabled={isActionDisabled}
                                                    className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-4 py-2 disabled:bg-green-400 disabled:cursor-not-allowed"
                                                    title={isActionDisabled ? 'Pilih cabang spesifik untuk melakukan aksi ini.' : 'Tandai perawatan sebagai selesai'}
                                                >
                                                    Tandai Selesai
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-slate-500 dark:text-slate-400">
                                                Tidak ada jadwal perawatan yang jatuh tempo.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                 )}
            </div>
            <QuickStockUpdateModal 
                isOpen={isStockModalOpen}
                onClose={() => setIsStockModalOpen(false)}
            />
            <ExpenseFormModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
                expense={null}
            />
            <QuickMaintenanceModal
                isOpen={isMaintenanceModalOpen}
                onClose={() => setIsMaintenanceModalOpen(false)}
            />
            <WhatsAppModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                transaction={transactionForWhatsApp}
                customer={customerForWhatsApp}
            />
            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                transaction={transactionForPayment}
                onSave={handleSavePayment}
            />
        </>
    );
};

export default Dashboard;
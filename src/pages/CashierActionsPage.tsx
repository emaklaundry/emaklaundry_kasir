import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { OrderStatus, Expense, UserRole, Transaction } from '../../types';
import { 
    ShoppingCartIcon, PackageIcon, WrenchIcon, PlusCircleIcon, DollarSignIcon, 
    CalendarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon
} from '../components/icons';
import { useAppContext } from '../contexts/AppContext';
import { useInventory } from '../contexts/InventoryContext';
import { useTransactions } from '../contexts/TransactionContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useScheduledMaintenances } from '../contexts/ScheduledMaintenanceContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { useToasts } from '../contexts/ToastContext';
import QuickStockUpdateModal from '../components/QuickStockUpdateModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import QuickMaintenanceModal from '../components/QuickMaintenanceModal';

// --- (Bagian ini disalin dari Dashboard.tsx) ---

type Trend = 'up' | 'down' | 'neutral';

interface TrendData {
    trend: Trend;
    percentage: string;
}

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

// --- (Akhir bagian yang disalin) ---


const CashierActionsPage: React.FC = () => {
    const { currentUser, selectedStoreId } = useAppContext();
    const { inventory } = useInventory();
    const { transactions } = useTransactions();
    const { addExpense } = useExpenses();
    const { scheduledMaintenances } = useScheduledMaintenances();
    const { addAuditLog } = useAuditLogs();
    const { addToast } = useToasts();
    
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

    // --- (Logika data untuk Stat Cards) ---
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
    
    const maintenanceDueCount = useMemo(() => {
        return scheduledMaintenances
            .filter(sm => new Date(sm.nextDueDate) <= now)
            .length;
    }, [scheduledMaintenances, now]);

    // --- (Handler untuk Aksi Cepat) ---
    const handleSaveExpense = useCallback(async (expense: Omit<Expense, 'id' | 'storeId'>) => {
        if (!currentUser) return;
        const storeId = currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
        if (!storeId || storeId === 'all') { 
            addToast('Silakan pilih cabang spesifik untuk mencatat pengeluaran.', 'warning');
            return;
        }
        const newExpense = { ...expense, storeId };
        await addExpense(newExpense);
        addAuditLog(`Mencatat pengeluaran cepat: "${newExpense.description}".`, storeId);
        setIsExpenseModalOpen(false);
    }, [currentUser, selectedStoreId, addExpense, addAuditLog, addToast]);

    const isActionDisabled = !currentUser || (currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all');

    return (
        <>
            <div className="p-4 space-y-6 pb-20"> {/* Tambah padding bottom untuk BottomNavBar */}
                
                {/* Kartu Statistik */}
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Statistik</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard 
                        icon={PackageIcon} 
                        title="Pesanan Selesai (30 hari)" 
                        value={transactions.filter((t: Transaction) => t.orderStatus === OrderStatus.Completed).length}
                        color="border-green-500"
                        to={`/transactions?status=${OrderStatus.Completed}`}
                        trendData={trendStats.completed}
                    />
                    <StatCard 
                        icon={ShoppingCartIcon} 
                        title="Pesanan Diproses" 
                        value={transactions.filter((t: Transaction) => t.orderStatus === OrderStatus.Processing).length}
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

                {/* Aksi Cepat */}
                <div className="pt-4">
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">Aksi Cepat</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button
                            onClick={() => setIsStockModalOpen(true)}
                            disabled={isActionDisabled}
                            className="p-4 rounded-lg border dark:border-slate-700 flex items-center gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="p-3 rounded-full bg-teal-100 dark:bg-teal-900/50">
                                <WrenchIcon className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                            </div>
                            <span className="font-semibold text-lg text-slate-700 dark:text-slate-200">Update Stok</span>
                        </button>

                        <button
                            onClick={() => setIsExpenseModalOpen(true)}
                            disabled={isActionDisabled}
                            className="p-4 rounded-lg border dark:border-slate-700 flex items-center gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50">
                                <DollarSignIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-semibold text-lg text-slate-700 dark:text-slate-200">Catat Pengeluaran</span>
                        </button>

                        <button
                            onClick={() => setIsMaintenanceModalOpen(true)}
                            disabled={isActionDisabled}
                            className="p-4 rounded-lg border dark:border-slate-700 flex items-center gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>

            {/* Modals */}
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
        </>
    );
};

export default CashierActionsPage;

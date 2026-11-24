import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQuery as useInventoryQuery } from '@tanstack/react-query';
import useAppContext from '../contexts/useAppContext';
import { fetchInventory } from '../contexts/InventoryContext';
import { useTransactions } from '../contexts/TransactionContext';
import { fetchCustomers } from '../contexts/CustomerContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useScheduledMaintenances } from '../contexts/ScheduledMaintenanceContext';
import { useAssets } from '../contexts/AssetContext';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useToasts from '../contexts/useToasts';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import WeatherWidget from '../components/widgets/WeatherWidget';
import QuickStockUpdateModal from '../components/QuickStockUpdateModal';
import ExpenseFormModal from '../components/ExpenseFormModal';
import QuickMaintenanceModal from '../components/QuickMaintenanceModal';
import WhatsAppModal from '../components/WhatsAppModal';
import PaymentModal from '../components/PaymentModal';
import WashSettingsModal from '../components/WashSettingsModal';
import {
  WrenchIcon,
  PlusCircleIcon,
  DollarSignIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BookOpenIcon,
} from '../components/icons';

import {
  Transaction,
  OrderStatus,
  PaymentStatus,
  Expense,
  UserRole,
  Customer,
  ScheduledMaintenance,
  Asset,
} from '@/types';
import { getStatusBadge, getPaymentStatusBadge, formatTransactionId } from '@/utils/uiHelpers';
import { calculateNextDueDate } from '../utils/formatting';

type Trend = 'up' | 'down' | 'neutral';

interface TrendData {
  trend: Trend;
  percentage: string;
}

// WeeklyRevenueChart component - currently unused but kept for future use
/* const WeeklyRevenueChart: React.FC<{ data: { day: string; revenue: number }[] }> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: string;
    x: number;
    y: number;
  }>({ visible: false, content: '', x: 0, y: 0 });

  const maxValue = useMemo(() => {
    const maxVal = Math.max(...data.map((d) => d.revenue), 0); // FIXED: Ensure minimum of 0
    return maxVal === 0 ? 100000 : Math.ceil(maxVal / 10000) * 10000;
  }, [data]);

  const chartHeight = 200;

  const showTooltip = (content: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      content,
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
  };

  const hideTooltip = () => setTooltip({ ...tooltip, visible: false });

  return (
    <div className="relative">
      {tooltip.visible && (
        <div
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
          className="absolute z-10 p-2 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded-md shadow-lg whitespace-nowrap"
        >
          {tooltip.content}
        </div>
      )}
      <div
        className="flex justify-between items-end h-full pt-4"
        style={{ height: `${chartHeight}px` }}
      >
        {data.map((d, i) => {
          const barHeight = Math.max((d.revenue / maxValue) * (chartHeight - 30), 0);
          const tooltipContent = `${d.day}: Rp ${d.revenue.toLocaleString('id-ID')}`;
          return (
            <div key={i} className="flex flex-col items-center w-full">
              <div
                className="w-4/5 bg-brand-blue-500 rounded-t-md hover:bg-brand-blue-400 transition-colors"
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
}; */

/* function TrendIndicator({ trendData }: { trendData?: TrendData }) {
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
} */

// StatCard component - currently unused but kept for future use
/* const StatCard: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  value: string | number;
  color: string;
  to?: string;
  trendData?: TrendData;
  subtitle?: string;
}> = ({ icon: Icon, title, value, color, to, trendData, subtitle }) => {
  const content = (
    <div
      className={`bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-xl shadow-md border-l-4 ${color} ${to ? 'hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 truncate mb-1">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl md:text-3xl font-bold text-slate-900 dark:text-white break-all">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`p-3 sm:p-3 rounded-full flex-shrink-0 ${color.replace('border-', 'bg-').replace('-500', '-100')} dark:${color.replace('border-', 'bg-').replace('-500', '-900/50')}`}
        >
          <Icon
            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${color.replace('border-', 'text-')}`}
          />
        </div>
      </div>
      <TrendIndicator trendData={trendData} />
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>;
}; */

// Tipe kustom untuk order aktif
type ActiveOrder = Transaction & { customerName: string };

// Helper function to calculate stats for a given period
const calculateStats = (transactions: Transaction[], startDate: Date, endDate: Date) => {
  const filtered = transactions.filter((t: Transaction) => {
    const createdAt = new Date(t.createdAt);
    return createdAt >= startDate && createdAt <= endDate;
  });
  return {
    completed: filtered.filter((t: Transaction) => t.orderStatus === OrderStatus.Completed).length,
    processing: filtered.filter((t: Transaction) => t.orderStatus === OrderStatus.Processing)
      .length,
  };
};

const Dashboard: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const inventoryQuery = useInventoryQuery({
    queryKey: ['inventory', { page: 1, pageSize: 1000, storeId: selectedStoreId }],
    queryFn: () => fetchInventory({ page: 1, pageSize: 1000, storeId: selectedStoreId }),
  });
  const inventory = useMemo(() => {
    return Array.isArray(inventoryQuery.data)
      ? inventoryQuery.data
      : (inventoryQuery.data?.data ?? []);
  }, [inventoryQuery.data]);
  const { transactions, updateTransaction } = useTransactions({ pageSize: 1000 });
  const customersQuery = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });

  const customers = useMemo(() => {
    const raw = customersQuery.data;
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.data)) return raw.data;
    if (raw && typeof raw === 'object' && raw !== null) {
      // FIXED: Add type-safe array extraction
      const arr = Object.values(raw).find((v): v is Customer[] => Array.isArray(v));
      if (arr) return arr;
      // Log unexpected structure for debugging
      console.warn('Unexpected customersQuery.data structure (no array found):', {
        type: typeof raw,
        keys: Object.keys(raw),
      });
    }
    if (raw !== undefined && raw !== null) {
      console.warn('Unexpected customersQuery.data type:', typeof raw);
    }
    return [];
  }, [customersQuery.data]);

  const { addExpense } = useExpenses();
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
  const [isWashSettingsModalOpen, setIsWashSettingsModalOpen] = useState(false);

  const isCashier = currentUser?.role === UserRole.Cashier;

  const weeklyRevenueData = useMemo(() => {
    const data = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return {
        day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        revenue: 0,
        date,
        transactionCount: 0,
      };
    });

    transactions.forEach((t: Transaction) => {
      const transactionDate = new Date(t.createdAt);
      const dayData = data.find(
        (d) =>
          d.date.getDate() === transactionDate.getDate() &&
          d.date.getMonth() === transactionDate.getMonth() &&
          d.date.getFullYear() === transactionDate.getFullYear(),
      );
      if (dayData) {
        dayData.revenue += t.amountPaid;
        dayData.transactionCount += 1;
      }
    });
    return data;
  }, [transactions]);

  // Statistik untuk revenue 7 hari terakhir
  const weeklyStats = useMemo(() => {
    const currentWeekTotal = weeklyRevenueData.reduce((sum, d) => sum + d.revenue, 0);
    const currentWeekTransactions = weeklyRevenueData.reduce(
      (sum, d) => sum + d.transactionCount,
      0,
    );
    const average = currentWeekTotal / 7;

    const sortedByRevenue = [...weeklyRevenueData].sort((a, b) => b.revenue - a.revenue);
    const highest = sortedByRevenue[0];
    const lowest = sortedByRevenue[sortedByRevenue.length - 1];

    // Hitung revenue minggu sebelumnya (hari ke 8-14)
    const previousWeekData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i + 7));
      return { date, revenue: 0 };
    });

    transactions.forEach((t: Transaction) => {
      const transactionDate = new Date(t.createdAt);
      const dayData = previousWeekData.find(
        (d) =>
          d.date.getDate() === transactionDate.getDate() &&
          d.date.getMonth() === transactionDate.getMonth() &&
          d.date.getFullYear() === transactionDate.getFullYear(),
      );
      if (dayData) {
        dayData.revenue += t.amountPaid;
      }
    });

    const previousWeekTotal = previousWeekData.reduce((sum, d) => sum + d.revenue, 0);
    const weekComparison =
      previousWeekTotal > 0
        ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100
        : currentWeekTotal > 0
          ? 100
          : 0;

    return {
      total: currentWeekTotal,
      average,
      highest,
      lowest,
      weekComparison,
      transactionCount: currentWeekTransactions,
    };
  }, [weeklyRevenueData, transactions]);

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
        return current > 0
          ? { trend: 'up', percentage: '100%' }
          : { trend: 'neutral', percentage: '0%' };
      }
      const change = ((current - previous) / previous) * 100;
      return {
        trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
        percentage: `${Math.abs(change).toFixed(0)}%`,
      };
    };

    return {
      completed: getTrend(currentStats.completed, prevStats.completed),
      processing: getTrend(currentStats.processing, prevStats.processing),
    };
  }, [transactions]);

  const lowStockStats = useMemo(() => {
    const lowItems = inventory.filter((i) => i.stock <= i.lowStockThreshold);
    const criticalItems = lowItems.filter((i) => i.stock === 0);
    const nearEmptyItems = lowItems.filter(
      (i) => i.stock > 0 && i.stock <= i.lowStockThreshold / 2,
    );

    return {
      total: lowItems.length,
      critical: criticalItems.length,
      nearEmpty: nearEmptyItems.length,
      items: lowItems,
    };
  }, [inventory]);

  const lowStockItems = lowStockStats.total;

  const maintenanceDue = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999); // End of today
    return scheduledMaintenances
      .filter((sm) => new Date(sm.nextDueDate) <= now)
      .map((sm) => {
        const asset = assets.find((a) => a.id === sm.assetId);
        return { ...sm, assetName: asset?.name || 'N/A' };
      })
      .sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());
  }, [scheduledMaintenances, assets]);

  const maintenanceStats = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const overdue = maintenanceDue.filter((m) => new Date(m.nextDueDate) < yesterday);
    const dueToday = maintenanceDue.filter((m) => {
      const dueDate = new Date(m.nextDueDate);
      return dueDate.toDateString() === now.toDateString();
    });

    const next7Days = new Date(now);
    next7Days.setDate(next7Days.getDate() + 7);
    const upcoming = scheduledMaintenances
      .filter((sm) => {
        const dueDate = new Date(sm.nextDueDate);
        return dueDate > now && dueDate <= next7Days;
      })
      .map((sm) => {
        const asset = assets.find((a) => a.id === sm.assetId);
        return { ...sm, assetName: asset?.name || 'N/A' };
      });

    return {
      total: maintenanceDue.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      upcoming: upcoming.length,
    };
  }, [maintenanceDue, scheduledMaintenances, assets]);

  const maintenanceDueCount = maintenanceStats.total;

  const customerMap = useMemo(() => {
    return customers.reduce(
      (map: Record<string, Customer>, customer: Customer) => {
        // FIXED: Warn about duplicate customer IDs
        if (map[customer.id]) {
          console.warn(`Duplicate customer ID detected: ${customer.id}`);
        }
        map[customer.id] = customer;
        return map;
      },
      {} as Record<string, Customer>,
    );
  }, [customers]);

  const activeOrders = useMemo(
    () =>
      transactions
        .filter((t: Transaction) => t.orderStatus !== OrderStatus.Completed)
        .map((t: Transaction): ActiveOrder => {
          const customer = customerMap[t.customerId];
          return {
            ...t,
            customerName: customer ? customer.name : 'N/A',
          };
        })
        .sort(
          (a: ActiveOrder, b: ActiveOrder) =>
            new Date(a.estimatedCompletionDate).getTime() -
            new Date(b.estimatedCompletionDate).getTime(),
        ),
    [transactions, customerMap],
  );

  // PAGINATION FOR ACTIVE ORDERS
  const {
    currentData: paginatedActiveOrders,
    currentPage: activeOrdersCurrentPage,
    totalPages: activeOrdersTotalPages,
    onPageChange: onActiveOrdersPageChange,
  } = usePagination<ActiveOrder>(activeOrders, 15);

  const handleSaveExpense = useCallback(
    async (expense: Omit<Expense, 'id' | 'storeId'>) => {
      if (!currentUser) {
        addToast('User tidak ditemukan. Silakan login ulang.', 'error');
        return;
      }
      const storeId =
        currentUser.role === UserRole.SuperAdmin ? selectedStoreId : currentUser.storeId;
      if (!storeId || storeId === 'all') {
        addToast('Silakan pilih cabang spesifik untuk mencatat pengeluaran.', 'warning');
        return;
      }
      const newExpense = { ...expense, storeId };
      await addExpense(newExpense);
      addAuditLog(`Mencatat pengeluaran cepat: "${newExpense.description}".`, storeId);
      setIsExpenseModalOpen(false);
    },
    [currentUser, selectedStoreId, addExpense, addAuditLog, addToast],
  );

  const handleOpenPaymentModal = useCallback((transaction: Transaction) => {
    setTransactionForPayment(transaction);
    setIsPaymentModalOpen(true);
  }, []);

  const handleSavePayment = useCallback(
    async (updatedTransaction: Transaction) => {
      // send only fields that exist in the DB to avoid PGRST204 errors
      const payload: Partial<Transaction> = {
        amountPaid: updatedTransaction.amountPaid,
        paymentStatus: updatedTransaction.paymentStatus,
        paymentMethod: updatedTransaction.paymentMethod,
        change: updatedTransaction.change,
      };

      await updateTransaction(updatedTransaction.id, payload);
      addAuditLog(
        `Menerima pembayaran untuk transaksi ${updatedTransaction.id} dari Dashboard. Status bayar: ${updatedTransaction.paymentStatus}.`,
        updatedTransaction.storeId,
      );
      setIsPaymentModalOpen(false);
      setTransactionForPayment(null);
      addToast('Pembayaran berhasil disimpan.', 'success');
    },
    [updateTransaction, addAuditLog, addToast],
  );

  const handleNextStatus = useCallback(
    async (transactionId: string) => {
      const transaction = transactions.find((t: Transaction) => t.id === transactionId);
      if (!transaction) return;

      let nextStatus: OrderStatus;
      if (transaction.orderStatus === OrderStatus.Processing) {
        nextStatus = OrderStatus.Ready;
      } else if (transaction.orderStatus === OrderStatus.Ready) {
        // --- TAMBAHAN GUARD CLAUSE ---
        if (transaction.paymentStatus !== PaymentStatus.Paid) {
          addToast('Pesanan tidak dapat diselesaikan karena belum lunas.', 'error');
          return;
        }
        // --- AKHIR TAMBAHAN ---
        nextStatus = OrderStatus.Completed;
      } else {
        return; // No next status from 'Completed'
      }

      await updateTransaction(transaction.id, { orderStatus: nextStatus });
      addAuditLog(
        `Mengubah status transaksi ${transactionId} menjadi "${nextStatus}" dari Dashboard.`,
        transaction.storeId,
      );

      if (nextStatus === OrderStatus.Ready) {
        setTransactionForWhatsApp({ ...transaction, orderStatus: nextStatus });
        setIsWhatsAppModalOpen(true);
      }
    },
    [transactions, updateTransaction, addAuditLog, addToast],
  );

  const handleMarkMaintenanceAsComplete = useCallback(
    async (schedule: ScheduledMaintenance) => {
      const asset = assets.find((a: Asset) => a.id === schedule.assetId);
      if (!asset) return;
      const newLog = {
        id: `LOG_${crypto.randomUUID()}`,
        date: new Date(),
        description: `[Jadwal] - ${schedule.description}`,
        cost: schedule.estimatedCost || 0,
      };
      await updateAsset(asset.id, { maintenanceHistory: [...asset.maintenanceHistory, newLog] });
      await updateScheduledMaintenance(schedule.id, {
        lastCompletedDate: new Date(),
        nextDueDate: calculateNextDueDate(
          schedule.nextDueDate,
          schedule.frequencyValue,
          schedule.frequencyUnit,
        ),
      });
      addAuditLog(
        `Menandai jadwal perawatan "${schedule.description}" sebagai selesai untuk aset "${asset.name}" dari Dashboard.`,
        asset.storeId,
      );
      addToast(`Perawatan "${schedule.description}" ditandai selesai.`, 'success');
    },
    [assets, updateAsset, updateScheduledMaintenance, addAuditLog, addToast],
  );

  const customerForWhatsApp = useMemo(() => {
    if (!transactionForWhatsApp) return null;
    return customerMap[transactionForWhatsApp.customerId];
  }, [transactionForWhatsApp, customerMap]);

  const getStoreName = () => {
    if (currentUser?.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') return 'Semua Cabang';
      return stores.find((s) => s.id === selectedStoreId)?.name || 'Cabang Tidak Dikenal';
    }
    if (currentUser?.storeId) {
      return stores.find((s) => s.id === currentUser.storeId)?.name || 'Cabang Tidak Dikenal';
    }
    return 'Cabang Tidak Dikenal';
  };

  const isActionDisabled = currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all';

  const selectedStoreData = useMemo(() => {
    if (selectedStoreId === 'all') return undefined; // Should we pick a default? Maybe the first one?
    return stores.find((s) => s.id === selectedStoreId);
  }, [selectedStoreId, stores]);

  return (
    <>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-0">
        <div className="mb-3 sm:mb-4 flex justify-between items-center">
          <h2 className="text-base sm:text-xl font-medium text-slate-600 dark:text-slate-400">
            Tampilan Data:{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {getStoreName()}
            </span>
          </h2>
        </div>

        {/* Weather Widget */}
        <div className="mb-6">
          <WeatherWidget
            latitude={selectedStoreData?.latitude}
            longitude={selectedStoreData?.longitude}
            locationName={selectedStoreData?.name}
          />
        </div>

        {/* Trend Stats - Admin View */}
        <div
          id="dashboard-stats"
          className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 ${isCashier ? 'hidden sm:grid' : 'grid'}`}
        >
          <Link to={`/transactions?status=${OrderStatus.Completed}`}>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 sm:p-5 rounded-lg border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                Pesanan Selesai (30 hari)
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900 dark:text-green-100">
                {
                  transactions.filter((t: Transaction) => t.orderStatus === OrderStatus.Completed)
                    .length
                }
              </p>
              {trendStats.completed.trend !== 'neutral' && (
                <div className="flex items-center gap-1 mt-1">
                  {trendStats.completed.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-semibold ${trendStats.completed.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {trendStats.completed.percentage} vs 30 hari lalu
                  </span>
                </div>
              )}
            </div>
          </Link>

          <Link to={`/transactions?status=${OrderStatus.Processing}`}>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-5 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                Pesanan Diproses
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100">
                {
                  transactions.filter((t: Transaction) => t.orderStatus === OrderStatus.Processing)
                    .length
                }
              </p>
              {trendStats.processing.trend !== 'neutral' && (
                <div className="flex items-center gap-1 mt-1">
                  {trendStats.processing.trend === 'up' ? (
                    <ArrowTrendingUpIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-semibold ${trendStats.processing.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {trendStats.processing.percentage} vs 30 hari lalu
                  </span>
                </div>
              )}
            </div>
          </Link>

          <Link to="/management/inventory?filter=low_stock">
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 sm:p-5 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
              <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
                Stok Menipis
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-900 dark:text-orange-100">
                {lowStockItems}
              </p>
              {(lowStockStats.critical > 0 ||
                lowStockStats.nearEmpty > 0 ||
                lowStockStats.total > 0) && (
                <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {lowStockStats.critical > 0
                    ? `${lowStockStats.critical} item habis, ${lowStockStats.nearEmpty} kritis`
                    : lowStockStats.nearEmpty > 0
                      ? `${lowStockStats.nearEmpty} item mendekati habis`
                      : `${lowStockStats.total} item perlu restock`}
                </p>
              )}
            </div>
          </Link>

          <Link to="/management/assets?filter=maintenance_due">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 sm:p-5 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium mb-1">
                Perawatan Terjadwal
              </p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-900 dark:text-red-100">
                {maintenanceDueCount}
              </p>
              {(maintenanceStats.overdue > 0 ||
                maintenanceStats.dueToday > 0 ||
                maintenanceStats.upcoming > 0) && (
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1">
                  {maintenanceStats.overdue > 0
                    ? `${maintenanceStats.overdue} terlambat, ${maintenanceStats.dueToday} hari ini`
                    : maintenanceStats.dueToday > 0
                      ? `${maintenanceStats.dueToday} jatuh tempo hari ini`
                      : `${maintenanceStats.upcoming} dalam 7 hari ke depan`}
                </p>
              )}
            </div>
          </Link>

          {/* Pendapatan 7 Hari Terakhir Stats - Hidden for Cashier */}
          {!isCashier && (
            <>
              <div id="dashboard-chart" className="bg-blue-50 dark:bg-blue-900/20 p-4 sm:p-5 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Total Pendapatan (7 hari)
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 dark:text-blue-100">
                  Rp {weeklyStats.total.toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {weeklyStats.transactionCount} transaksi
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 sm:p-5 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                  Rata-rata/Hari
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-900 dark:text-green-100">
                  Rp {Math.round(weeklyStats.average).toLocaleString('id-ID')}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {weeklyStats.weekComparison >= 0 ? (
                    <ArrowTrendingUpIcon className="w-3 h-3 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowTrendingDownIcon className="w-3 h-3 text-red-600 dark:text-red-400" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-semibold ${
                      weeklyStats.weekComparison >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {weeklyStats.weekComparison >= 0 ? '+' : ''}
                    {weeklyStats.weekComparison.toFixed(1)}% vs minggu lalu
                  </span>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 sm:p-5 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">
                  Hari Tertinggi
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900 dark:text-purple-100">
                  Rp {weeklyStats.highest.revenue.toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 mt-1">
                  {weeklyStats.highest.day} ({weeklyStats.highest.transactionCount} transaksi)
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 sm:p-5 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">
                  Hari Terendah
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-900 dark:text-orange-100">
                  Rp {weeklyStats.lowest.revenue.toLocaleString('id-ID')}
                </p>
                <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 mt-1">
                  {weeklyStats.lowest.day} ({weeklyStats.lowest.transactionCount} transaksi)
                </p>
              </div>
            </>
          )}
        </div>

        <div
          className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md ${isCashier ? 'hidden sm:block' : 'block'}`}
        >
          <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 dark:text-white mb-3 sm:mb-4">
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={() => setIsStockModalOpen(true)}
              disabled={isActionDisabled}
              className="p-3 sm:p-4 rounded-lg border dark:border-slate-700 flex items-center gap-3 sm:gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
            >
              <div className="p-2 sm:p-3 rounded-full bg-teal-100 dark:bg-teal-900/50 flex-shrink-0">
                <WrenchIcon className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <span className="font-semibold text-base sm:text-lg text-slate-700 dark:text-slate-200">
                Update Stok
              </span>
            </button>

            <button
              onClick={() => setIsExpenseModalOpen(true)}
              disabled={isActionDisabled}
              className="p-3 sm:p-4 rounded-lg border dark:border-slate-700 flex items-center gap-3 sm:gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
            >
              <div className="p-2 sm:p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 flex-shrink-0">
                <DollarSignIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-semibold text-base sm:text-lg text-slate-700 dark:text-slate-200">
                Catat Pengeluaran
              </span>
            </button>

            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              disabled={isActionDisabled}
              className="p-3 sm:p-4 rounded-lg border dark:border-slate-700 flex items-center gap-3 sm:gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
            >
              <div className="p-2 sm:p-3 rounded-full bg-orange-100 dark:bg-orange-900/50 flex-shrink-0">
                <PlusCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="font-semibold text-base sm:text-lg text-slate-700 dark:text-slate-200">
                Lapor Kerusakan
              </span>
            </button>

            <button
              onClick={() => setIsWashSettingsModalOpen(true)}
              className="p-3 sm:p-4 rounded-lg border dark:border-slate-700 flex items-center gap-3 sm:gap-4 transition-colors bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <div className="p-2 sm:p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex-shrink-0">
                <BookOpenIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-semibold text-base sm:text-lg text-slate-700 dark:text-slate-200">
                Panduan Mesin Cuci
              </span>
            </button>
          </div>
          {isActionDisabled && (
            <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 mt-3">
              Pilih cabang spesifik untuk melakukan aksi cepat.
            </p>
          )}
        </div>

        <div id="dashboard-recent" className="bg-white dark:bg-slate-800 p-3 sm:p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
              Progres Pesanan Aktif
            </h2>
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
                {paginatedActiveOrders.length > 0 ? (
                  paginatedActiveOrders.map((t) => {
                    const isSelesaikanDisabled =
                      t.orderStatus === OrderStatus.Ready && t.paymentStatus !== PaymentStatus.Paid;
                    const nextActionText =
                      t.orderStatus === OrderStatus.Processing ? 'Siap Diambil' : 'Selesaikan';
                    const nextActionColor =
                      t.orderStatus === OrderStatus.Processing
                        ? 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300'
                        : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400';

                    return (
                      <tr key={t.id} className="border-b dark:border-slate-700">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          <Link to={`/transactions/${t.id}/details`} className="hover:underline">
                            {formatTransactionId(t)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">{t.customerName}</td>
                        <td className="px-4 py-3">
                          {new Date(t.estimatedCompletionDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-sm font-medium rounded-full ${getStatusBadge(t.orderStatus)}`}
                          >
                            {t.orderStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-sm font-medium rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}
                          >
                            {t.paymentStatus}
                          </span>
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
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-slate-500 dark:text-slate-400">
                      Tidak ada pesanan aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              currentPage={activeOrdersCurrentPage}
              totalPages={activeOrdersTotalPages}
              onPageChange={onActiveOrdersPageChange}
            />
          </div>
          {/* Mobile Card View */}
          <div className="sm:hidden space-y-3">
            {paginatedActiveOrders.length > 0 ? (
              paginatedActiveOrders.map((t) => {
                const isSelesaikanDisabled =
                  t.orderStatus === OrderStatus.Ready && t.paymentStatus !== PaymentStatus.Paid;
                const mobileNextActionText =
                  t.orderStatus === OrderStatus.Processing
                    ? 'Tandai Siap Diambil'
                    : 'Selesaikan Pesanan';
                const mobileNextActionColor =
                  t.orderStatus === OrderStatus.Processing
                    ? 'bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300'
                    : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400';

                return (
                  <div
                    key={t.id}
                    className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{t.customerName}</p>
                        <Link
                          to={`/transactions/${t.id}/details`}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {formatTransactionId(t)}
                        </Link>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(t.paymentStatus)}`}
                      >
                        {t.paymentStatus}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Status:</span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(t.orderStatus)}`}
                        >
                          {t.orderStatus}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">
                          Estimasi Selesai:
                        </span>
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(t.estimatedCompletionDate).toLocaleDateString('id-ID')}
                        </span>
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
                            title={
                              isSelesaikanDisabled
                                ? 'Pelunasan diperlukan sebelum menyelesaikan pesanan.'
                                : `Ubah ke status ${t.orderStatus === OrderStatus.Processing ? OrderStatus.Ready : OrderStatus.Completed}`
                            }
                          >
                            {mobileNextActionText}
                            <ChevronRightIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                Tidak ada pesanan aktif.
              </div>
            )}
          </div>
          <div className="sm:hidden">
            <Pagination
              currentPage={activeOrdersCurrentPage}
              totalPages={activeOrdersTotalPages}
              onPageChange={onActiveOrdersPageChange}
            />
          </div>
        </div>

        {!isCashier && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
              Jadwal Perawatan Jatuh Tempo
            </h2>
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
                  {maintenanceDue.length > 0 ? (
                    maintenanceDue.map((m) => (
                      <tr key={m.id} className="border-b dark:border-slate-700">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {m.assetName}
                        </td>
                        <td className="px-4 py-3">{m.description}</td>
                        <td className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold">
                          {new Date(m.nextDueDate).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleMarkMaintenanceAsComplete(m)}
                            disabled={isActionDisabled}
                            className="text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-4 py-2 disabled:bg-green-400 disabled:cursor-not-allowed"
                            title={
                              isActionDisabled
                                ? 'Pilih cabang spesifik untuk melakukan aksi ini.'
                                : 'Tandai perawatan sebagai selesai'
                            }
                          >
                            Tandai Selesai
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-4 text-slate-500 dark:text-slate-400"
                      >
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
      <QuickStockUpdateModal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} />
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
      <WashSettingsModal
        isOpen={isWashSettingsModalOpen}
        onClose={() => setIsWashSettingsModalOpen(false)}
      />
    </>
  );
};

export default Dashboard;

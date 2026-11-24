// src/pages/ReportsPage.tsx

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChartIcon, DollarSignIcon, PackageIcon, UsersIcon } from '../components/icons';
import { fetchCustomers } from '../contexts/CustomerContext';
import useAppContext from '../contexts/useAppContext';
import { useUsers } from '../contexts/UserContext';
import { useServices } from '../contexts/ServiceContext';
import { supabase } from '../utils/supabaseClient';
import {
  UserRole,
  Service,
  User,
  ServiceCategory,
  MaintenanceLog,
  Transaction,
  PaymentStatus,
  OrderStatus,
  PaymentMethod,
  TransactionItem,
} from '@/types';
import { formatRupiah } from '../utils/formatting';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { mapDBtoTransaction, RawDBTransaction } from '../utils/mappers';

// Type guard for Transaction
function isTransaction(obj: unknown): obj is Transaction {
  if (!obj || typeof obj !== 'object') return false;
  const t = obj as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    (typeof t.createdAt === 'string' || t.createdAt instanceof Date) &&
    typeof t.amountPaid === 'number' &&
    typeof t.discount === 'number' &&
    typeof t.total === 'number' &&
    (typeof t.customerId === 'string' ||
      typeof t.customerId === 'undefined' ||
      t.customerId === null) &&
    (typeof t.createdByUserId === 'string' ||
      typeof t.createdByUserId === 'undefined' ||
      t.createdByUserId === null) &&
    Array.isArray(t.items)
  );
}

const StatCard: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  value: string | number;
  color: string;
}> = ({ icon: Icon, title, value, color }) => (
  <div
    className={`bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center space-x-4 border-l-4 ${color} print-stat-card`}
  >
    <Icon className="w-10 h-10 text-slate-500 print-hide" />
    <div>
      <p className="text-base text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  </div>
);

const YearlySummaryChart: React.FC<{
  data: { month: string; revenue: number; expenses: number; profit: number }[];
}> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    content: string;
    x: number;
    y: number;
  }>({ visible: false, content: '', x: 0, y: 0 });

  const maxValue = useMemo(() => {
    const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.expenses]));
    return Math.ceil(maxVal / 100000) * 100000; // Round up to nearest 100k
  }, [data]);

  const chartHeight = 300;
  const chartWidth = 800;
  const barWidth = 20;
  const barMargin = 15;
  const groupMargin = 40;
  const yAxisLabels = 6;
  const yAxisWidth = 80;

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
    <div className="relative overflow-x-auto">
      {tooltip.visible && (
        <div
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
          }}
          className="absolute z-10 p-2 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded-md shadow-lg whitespace-pre-line"
        >
          {tooltip.content}
        </div>
      )}
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[800px] print-chart-hide">
        {/* Y-Axis Grid Lines and Labels */}
        {Array.from({ length: yAxisLabels }).map((_, i) => {
          const y = chartHeight - 20 - (i * (chartHeight - 30)) / (yAxisLabels - 1);
          const value = (i * maxValue) / (yAxisLabels - 1);
          return (
            <g key={i}>
              <line
                x1={yAxisWidth}
                y1={y}
                x2={chartWidth}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-700"
              />
              <text
                x={yAxisWidth - 10}
                y={y + 5}
                textAnchor="end"
                className="text-xs fill-current text-slate-500 dark:text-slate-400"
              >
                {`${(value / 1000000).toFixed(1)}jt`}
              </text>
            </g>
          );
        })}

        {/* Bars and X-Axis Labels */}
        {data.map((d, i) => {
          const x = yAxisWidth + i * (barWidth * 2 + barMargin + groupMargin / 2) + groupMargin;
          const revenueHeight = Math.max((d.revenue / maxValue) * (chartHeight - 30), 0);
          const expensesHeight = Math.max((d.expenses / maxValue) * (chartHeight - 30), 0);
          const tooltipContent = `${d.month}\nPendapatan: Rp ${d.revenue.toLocaleString('id-ID')}\nPengeluaran: Rp ${d.expenses.toLocaleString('id-ID')}`;

          return (
            <g key={i}>
              <rect
                x={x - barMargin / 2}
                y={chartHeight - 20 - revenueHeight}
                width={barWidth}
                height={revenueHeight}
                className="fill-current text-green-500 hover:opacity-80"
                onMouseMove={(e) => showTooltip(tooltipContent, e)}
                onMouseLeave={hideTooltip}
              />
              <rect
                x={x + barWidth - barMargin / 2}
                y={chartHeight - 20 - expensesHeight}
                width={barWidth}
                height={expensesHeight}
                className="fill-current text-red-500 hover:opacity-80"
                onMouseMove={(e) => showTooltip(tooltipContent, e)}
                onMouseLeave={hideTooltip}
              />
              <text
                x={x}
                y={chartHeight - 5}
                textAnchor="middle"
                className="text-xs fill-current text-slate-500 dark:text-slate-400"
              >
                {d.month}
              </text>
            </g>
          );
        })}

        {/* Axis Lines */}
        <line
          x1={yAxisWidth}
          y1={10}
          x2={yAxisWidth}
          y2={chartHeight - 20}
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-600"
        />
        <line
          x1={yAxisWidth}
          y1={chartHeight - 20}
          x2={chartWidth}
          y2={chartHeight - 20}
          stroke="currentColor"
          className="text-slate-300 dark:text-slate-600"
        />
      </svg>

      {/* --- Tabel ini HANYA akan muncul saat dicetak --- */}
      <table className="print-only-table w-full text-base text-left text-slate-500 dark:text-slate-400 mt-4">
        <thead className="print-only-header text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
          <tr className="print-only-row">
            <th className="print-only-cell px-4 py-3">Bulan</th>
            <th className="print-only-cell px-4 py-3 text-right">Pendapatan</th>
            <th className="print-only-cell px-4 py-3 text-right">Pengeluaran</th>
            <th className="print-only-cell px-4 py-3 text-right">Laba</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month} className="print-only-row border-b dark:border-slate-700">
              <td className="print-only-cell px-4 py-3 font-medium text-slate-900 dark:text-white">
                {d.month}
              </td>
              <td className="print-only-cell px-4 py-3 text-right">Rp {formatRupiah(d.revenue)}</td>
              <td className="print-only-cell px-4 py-3 text-right">
                Rp {formatRupiah(d.expenses)}
              </td>
              <td className="print-only-cell px-4 py-3 text-right font-semibold">
                Rp {formatRupiah(d.profit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- Type Definitions ---
type Expense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  storeId: string | null;
};

// Tipe transaksi hasil normalisasi (createdAt: string)
type NormalizedTransaction = Omit<Transaction, 'createdAt'> & { createdAt: string };

// Raw DB types for snake_case mapping
interface RawTransaction {
  id: string;
  invoice_code?: string;
  invoiceCode?: string;
  customer_id?: string;
  customerId?: string;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  amount_paid?: number;
  amountPaid?: number;
  change?: number;
  payment_status?: PaymentStatus;
  paymentStatus?: PaymentStatus;
  order_status?: OrderStatus;
  orderStatus?: OrderStatus;
  payment_method?: PaymentMethod;
  paymentMethod?: PaymentMethod;
  created_at?: string;
  createdAt?: string | Date;
  estimated_completion_date?: string;
  estimatedCompletionDate?: string;
  created_by_user_id?: string;
  createdByUserId?: string;
  store_id?: string;
  storeId?: string;
  items?: TransactionItem[];
  notes?: string;
}

interface RawExpense {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  store_id?: string;
  storeId?: string;
}

const ReportsPage: React.FC = () => {
  const customersRaw = useQuery({
    queryKey: ['customers', { page: 1, pageSize: 1000 }],
    queryFn: () => fetchCustomers({ page: 1, pageSize: 1000 }),
  });
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { services } = useServices();
  const { users: allUsers } = useUsers();
  const { addAuditLog } = useAuditLogs();
  const [reportType] = useState<'range' | 'yearlySummary'>('range');
  const [rangeType, setRangeType] = useState<'monthly' | 'weekly' | 'custom' | 'all'>('monthly');
  const today = new Date();
  const [customStartDate, setCustomStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date(today.getFullYear(), today.getMonth() + 1, 0),
  );

  // Date range for reports
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    if (rangeType === 'all') {
      // Set start date to a very early date to include all records
      const firstDay = new Date(0);
      return { startDate: firstDay, endDate: endOfDay };
    }

    if (rangeType === 'weekly') {
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      firstDayOfWeek.setHours(0, 0, 0, 0);
      return { startDate: firstDayOfWeek, endDate: endOfDay };
    }
    if (rangeType === 'monthly') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: firstDay, endDate: endOfDay };
    }
    const customEnd = new Date(customEndDate);
    customEnd.setHours(23, 59, 59, 999);
    return { startDate: customStartDate, endDate: customEnd };
  }, [rangeType, customStartDate, customEndDate]);

  // --- Fetch All Transactions (With Pagination Loop) ---
  const { data: allStoreTransactions = [] } = useQuery<Transaction[]>({
    queryKey: ['report-transactions', selectedStoreId, startDate, endDate],
    queryFn: async () => {
      const startIso = new Date(startDate);
      startIso.setHours(0, 0, 0, 0);
      const endIso = new Date(endDate);
      endIso.setHours(23, 59, 59, 999);

      let allTx: Transaction[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('transactions')
          .select('*')
          // Filter menggunakan ISO string agar konsisten dengan format DB
          .gte('createdAt', startIso.toISOString())
          .lte('createdAt', endIso.toISOString());

        if (selectedStoreId && selectedStoreId !== 'all') {
          query = query.eq('storeId', selectedStoreId);
        }

        const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          // Normalize data types and map using centralized mapper
          const transactions = data.map((t) =>
            mapDBtoTransaction(t as unknown as RawDBTransaction),
          );

          allTx = [...allTx, ...transactions];
          if (data.length < pageSize) {
            hasMore = false;
          }
          page++;
        } else {
          hasMore = false;
        }
      }
      return allTx;
    },
  });

  // Customers
  const customers = useMemo(() => {
    const raw = customersRaw.data;
    if (Array.isArray(raw)) return raw as { id: string; name: string }[];
    if (
      raw &&
      typeof raw === 'object' &&
      raw !== null &&
      Array.isArray((raw as { data?: unknown }).data)
    ) {
      return (raw as { data: { id: string; name: string }[] }).data;
    }
    if (raw && typeof raw === 'object' && raw !== null) {
      const arr = Object.values(raw).find((v) => Array.isArray(v));
      if (arr) return arr as { id: string; name: string }[];
    }
    return [];
  }, [customersRaw.data]);

  // --- Fetch Combined Expenses (Operasional, Pembelian Aset, Pemeliharaan Aset) ---
  const { data: allStoreExpenses = [] } = useQuery<Expense[]>({
    queryKey: ['report-expenses-combined', selectedStoreId, startDate, endDate],
    queryFn: async () => {
      // Helper untuk format tanggal lokal (YYYY-MM-DD)
      const formatDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const startDateStr = formatDateStr(startDate);
      const endDateStr = formatDateStr(endDate);

      // 1. Fetch Expenses (Operasional & Aset yang sudah tercatat di expenses)
      let allOperationalExpenses: Expense[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from('expenses')
          .select('*')
          .gte('date', startDateStr)
          .lte('date', endDateStr);

        if (selectedStoreId && selectedStoreId !== 'all') {
          query = query.eq('storeId', selectedStoreId);
        }

        const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;

        if (data && data.length > 0) {
          const mappedExpenses = data.map((e) => {
            const raw = e as unknown as RawExpense;
            return {
              id: raw.id,
              date: raw.date,
              description: raw.description,
              category: raw.category,
              amount: raw.amount,
              storeId: raw.store_id ?? raw.storeId ?? undefined,
            };
          }) as Expense[];

          allOperationalExpenses = [...allOperationalExpenses, ...mappedExpenses];
          if (data.length < pageSize) {
            hasMore = false;
          }
          page++;
        } else {
          hasMore = false;
        }
      }

      // 2. Fetch Assets (Untuk Backfill Aset Lama yang belum tercatat di expenses)
      let assetQuery = supabase.from('assets').select('*');
      if (selectedStoreId && selectedStoreId !== 'all') {
        assetQuery = assetQuery.eq('storeId', selectedStoreId);
      }
      const { data: assetsData, error: assetsError } = await assetQuery;
      if (assetsError) throw assetsError;

      const assetExpenses: Expense[] = [];

      // Helper untuk mengecek duplikasi di tabel expenses
      const isExpenseExist = (desc: string, date: string, amount: number) => {
        return allOperationalExpenses.some(
          (e) =>
            e.description === desc &&
            e.date === date &&
            Math.abs(e.amount - amount) < Math.max(100, amount * 0.01), // Toleransi 100 rupiah atau 1%, mana yang lebih besar
        );
      };

      if (assetsData) {
        // Gunakan Type Assertion yang lebih longgar untuk data mentah DB
        (assetsData as Record<string, unknown>[]).forEach((asset) => {
          // Validasi minimal
          if (!asset.id || !asset.name) return;

          const purchaseDate = (asset.purchase_date ?? asset.purchaseDate) as
            | string
            | Date
            | undefined;
          const purchaseCost = Number(asset.purchase_cost ?? asset.purchaseCost) || 0;
          const maintenanceHistoryRaw = asset.maintenance_history ?? asset.maintenanceHistory;
          const storeId = (asset.store_id ?? asset.storeId) as string | undefined;

          // A. Pembelian Aset
          if (purchaseDate) {
            let purchaseDateStr = String(purchaseDate);
            if (purchaseDateStr.includes('T')) {
              purchaseDateStr = purchaseDateStr.split('T')[0];
            }

            // Filter tanggal sesuai range
            if (purchaseDateStr >= startDateStr && purchaseDateStr <= endDateStr) {
              const description = `Pembelian Aset: ${asset.name}`;

              // Cek apakah sudah ada di expenses (untuk mencegah duplikat data baru)
              if (!isExpenseExist(description, purchaseDateStr, purchaseCost)) {
                assetExpenses.push({
                  id: `asset-purchase-${asset.id}`,
                  date: purchaseDateStr,
                  description: description,
                  category: 'Pembelian Aset',
                  amount: purchaseCost,
                  storeId: typeof storeId === 'string' ? storeId : null,
                });
              }
            }
          }

          // B. Pemeliharaan Aset (History)
          let maintenanceHistory: MaintenanceLog[] = [];
          if (maintenanceHistoryRaw) {
            if (Array.isArray(maintenanceHistoryRaw)) {
              maintenanceHistory = maintenanceHistoryRaw as MaintenanceLog[];
            } else if (typeof maintenanceHistoryRaw === 'string') {
              try {
                maintenanceHistory = JSON.parse(maintenanceHistoryRaw);
              } catch (error) {
                console.error(`Failed to parse maintenanceHistory for asset ${asset.id}:`, error);
              }
            }
          }

          maintenanceHistory.forEach((log, index) => {
            const logDate = new Date(log.date);
            const logDateStr = formatDateStr(logDate);
            const cost = Number(log.cost) || 0;

            if (logDateStr >= startDateStr && logDateStr <= endDateStr) {
              // Format deskripsi HARUS SAMA dengan yang di-push untuk duplikasi detection
              const description = `Perawatan Aset: ${asset.name} (${log.description})`;

              if (!isExpenseExist(description, logDateStr, cost)) {
                assetExpenses.push({
                  id: `asset-maint-${asset.id}-${index}`,
                  date: logDateStr,
                  description: description, // FIXED: Gunakan format yang sama
                  category: 'Pemeliharaan Aset',
                  amount: cost,
                  storeId: typeof asset.storeId === 'string' ? asset.storeId : null,
                });
              }
            }
          });
        });
      }

      // Gabungkan: Expenses (Database) + AssetExpenses (Backfill Manual)
      return [...allOperationalExpenses, ...assetExpenses];
    },
  });

  // Filtered Data
  function normalizeTransaction(
    t: unknown,
  ): (Omit<Transaction, 'createdAt'> & { createdAt: string }) | null {
    if (!t || typeof t !== 'object') return null;
    const obj = t as Record<string, unknown>;
    let createdAt: string;

    try {
      if (typeof obj.createdAt === 'string') {
        // Safe check for invalid dates
        const parsed = new Date(obj.createdAt);
        if (isNaN(parsed.getTime())) {
          return null; // Invalid date string
        }
        createdAt = obj.createdAt;
      } else if (obj.createdAt instanceof Date) {
        if (isNaN(obj.createdAt.getTime())) {
          return null; // Invalid Date object
        }
        createdAt = obj.createdAt.toISOString();
      } else {
        return null;
      }
    } catch {
      return null;
    }

    const tx = { ...obj, createdAt } as unknown;
    return isTransaction(tx as unknown)
      ? (tx as Omit<Transaction, 'createdAt'> & { createdAt: string })
      : null;
  }

  const filteredData = useMemo(() => {
    const start = startDate.getTime();
    const end = endDate.getTime();

    const transactions = (allStoreTransactions as unknown[])
      .map(normalizeTransaction)
      .filter((t): t is Omit<Transaction, 'createdAt'> & { createdAt: string } => !!t)
      .filter((t) => {
        const time = new Date(t.createdAt).getTime();
        return time >= start && time <= end;
      });

    // FILTER GANDA DIHAPUS: Gunakan data langsung dari query yang sudah valid
    const expenses = (allStoreExpenses as Expense[]) || [];

    return { transactions, expenses };
  }, [startDate, endDate, allStoreTransactions, allStoreExpenses]);

  // Realized revenue (amount paid) vs total billed
  const totalRevenue = filteredData.transactions.reduce((acc: number, t) => acc + (t.amountPaid || 0), 0);
  const totalBilled = filteredData.transactions.reduce((acc: number, t) => acc + t.total, 0);
  const totalReceivables = Math.max(0, totalBilled - totalRevenue);
  const totalExpenses = filteredData.expenses.reduce((acc: number, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // ... (Kode selebihnya untuk chart, tabel, dll tetap sama) ...

  const serviceMap = useMemo(
    () =>
      services.reduce(
        (map: Record<string, Service>, service: Service) => ({ ...map, [service.id]: service }),
        {} as Record<string, Service>,
      ),
    [services],
  );

  const topServices = useMemo(() => {
    const serviceRevenue: { [key: string]: number } = {};
    (filteredData.transactions as NormalizedTransaction[]).forEach((t) =>
      t.items.forEach((item: { serviceId: string; serviceName?: string; subtotal: number }) => {
        serviceRevenue[item.serviceId] = (serviceRevenue[item.serviceId] || 0) + item.subtotal;

        // Simpan nama service dari item jika ada (fallback jika serviceMap kosong)
        if (item.serviceName && !serviceMap[item.serviceId]) {
          // Hacky way to inject name into serviceMap-like structure solely for this report?
          // Better to handle in the map below.
        }
      }),
    );
    return Object.entries(serviceRevenue)
      .map(([serviceId, revenue]) => {
        // Find service name from ANY item with this serviceId?
        // Helper: find first transaction item with this id
        let name = serviceMap[serviceId]?.name;
        if (!name) {
          const tx = (filteredData.transactions as NormalizedTransaction[]).find((t) =>
            t.items.some((i: TransactionItem) => i.serviceId === serviceId),
          );
          const item = tx?.items.find((i: TransactionItem) => i.serviceId === serviceId);
          name = item?.serviceName || 'Layanan Dihapus';
        }
        return {
          serviceId,
          name,
          revenue,
        };
      })
      .filter((s) => s.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredData.transactions, serviceMap]);

  const topCustomers = useMemo(() => {
    const customerSpending: { [key: string]: number } = {};
    (filteredData.transactions as NormalizedTransaction[]).forEach((t) => {
      // Allow undefined customerId (External Customer / Umum)
      const cid = t.customerId || 'unknown';
      customerSpending[cid] = (customerSpending[cid] || 0) + t.total;
    });
    return Object.entries(customerSpending)
      .map(([customerId, total]) => ({
        name:
          customers.find((c: { id: string }) => c.id === customerId)?.name ||
          (customerId === 'unknown' ? 'Umum' : 'N/A'),
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData.transactions, customers]);

  const userMap = useMemo(
    () =>
      allUsers.reduce(
        (map: Record<string, User>, user: User) => ({ ...map, [user.id]: user }),
        {} as Record<string, User>,
      ),
    [allUsers],
  );

  const cashierPerformance = useMemo(() => {
    const stats: {
      [key: string]: {
        name: string;
        transactionCount: number;
        totalRevenue: number;
        totalDiscount: number;
      };
    } = {};
    (filteredData.transactions as NormalizedTransaction[]).forEach((t) => {
      // Fallback for unknown user
      const userId = t.createdByUserId || 'unknown';
      const user = userMap[userId];
      const name = user?.name || (userId === 'unknown' ? 'Tanpa Kasir' : 'Unknown User');

      if (!stats[userId])
        stats[userId] = {
          name: name,
          transactionCount: 0,
          totalRevenue: 0,
          totalDiscount: 0,
        };
      stats[userId].transactionCount++;
      stats[userId].totalRevenue += t.total;
      stats[userId].totalDiscount += t.discount;
    });
    return Object.values(stats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredData.transactions, userMap]);

  const revenueByCategory = useMemo(() => {
    const categoryRevenue: Record<ServiceCategory, number> = {
      Kiloan: 0,
      Satuan: 0,
      Sepatu: 0,
      Karpet: 0,
    };
    (filteredData.transactions as NormalizedTransaction[]).forEach((t) =>
      t.items.forEach((item: { serviceId: string; subtotal: number; unit?: string }) => {
        const service = serviceMap[item.serviceId];
        // If service map fails, try to guess based on unit
        if (service) {
          const cat = service.category as ServiceCategory;
          categoryRevenue[cat] = (categoryRevenue[cat] || 0) + item.subtotal;
        } else if (item.unit === 'kg') {
          categoryRevenue['Kiloan'] = (categoryRevenue['Kiloan'] || 0) + item.subtotal;
        } else if (item.unit === 'm2') {
          categoryRevenue['Karpet'] = (categoryRevenue['Karpet'] || 0) + item.subtotal;
        }
      }),
    );
    return Object.entries(categoryRevenue)
      .map(([category, revenue]) => ({
        category: category as ServiceCategory,
        revenue: revenue as number,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData.transactions, serviceMap]);

  const maxRevenueByCategory = useMemo(
    () => Math.max(...revenueByCategory.map((item) => item.revenue), 0),
    [revenueByCategory],
  );

  const servicePerformance = useMemo(() => {
    const stats: Record<string, { revenue: number; quantity: number }> = {};
    (filteredData.transactions as NormalizedTransaction[]).forEach((t) =>
      t.items.forEach((item: { serviceId: string; subtotal: number; quantity: number }) => {
        if (!stats[item.serviceId]) {
          stats[item.serviceId] = { revenue: 0, quantity: 0 };
        }
        stats[item.serviceId].revenue += item.subtotal;
        stats[item.serviceId].quantity += item.quantity;
      }),
    );
    return Object.entries(stats)
      .map(([serviceId, stat]) => {
        // Fallback name logic
        let name = serviceMap[serviceId]?.name;
        if (!name) {
          const tx = (filteredData.transactions as NormalizedTransaction[]).find((t) =>
            t.items.some((i: TransactionItem) => i.serviceId === serviceId),
          );
          const item = tx?.items.find((i: TransactionItem) => i.serviceId === serviceId);
          name = item?.serviceName || 'Layanan Dihapus';
        }

        return {
          serviceId,
          name,
          category: serviceMap[serviceId]?.category || '-',
          unit: serviceMap[serviceId]?.unit || 'unit',
          revenue: stat.revenue,
          quantity: Number(stat.quantity.toFixed(2)), // Fix rounding
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredData.transactions, serviceMap]);

  const detailedExpenses = useMemo(() => {
    return filteredData.expenses
      .map((expense) => ({
        ...expense,
        storeName: stores.find((s: { id: string }) => s.id === expense.storeId)?.name || 'N/A',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData.expenses, stores]);

  const monthlySummary = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearTransactions = (allStoreTransactions as unknown[])
      .map(normalizeTransaction)
      .filter((t): t is NormalizedTransaction => !!t)
      .filter((t) => new Date(t.createdAt).getFullYear() === currentYear);
    const yearExpenses = (allStoreExpenses as Expense[]).filter(
      (e) => new Date(e.date).getFullYear() === currentYear,
    );
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const summary = monthNames.map((name) => ({
      month: name,
      revenue: 0,
      expenses: 0,
      profit: 0,
    }));
    yearTransactions.forEach((t) => {
      summary[new Date(t.createdAt).getMonth()].revenue += t.amountPaid;
    });
    yearExpenses.forEach((e) => {
      summary[new Date(e.date).getMonth()].expenses += e.amount;
    });
    summary.forEach((m) => {
      m.profit = m.revenue - m.expenses;
    });
    return summary;
  }, [allStoreTransactions, allStoreExpenses]);

  const printHeaderTitle = useMemo(() => {
    const startStr = startDate.toLocaleDateString('id-ID');
    const endStr = endDate.toLocaleDateString('id-ID');
    if (reportType === 'range') {
      if (rangeType === 'custom') {
        return `Laporan Kustom (${startStr} - ${endStr})`;
      }
      if (rangeType === 'weekly') {
        return `Laporan Mingguan (Hingga ${endStr})`;
      }
      if (rangeType === 'monthly') {
        return `Laporan Bulanan (Hingga ${endStr})`;
      }
      if (rangeType === 'all') {
        return `Laporan Keseluruhan (Hingga ${endStr})`;
      }
    }
    if (reportType === 'yearlySummary') {
      return `Ringkasan Tahunan ${new Date().getFullYear()}`;
    }
    return '';
  }, [reportType, rangeType, startDate, endDate]);

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500">
        User context not loaded.
      </div>
    );
  }

  const getStoreName = () => {
    if (!currentUser) return '';
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') return 'Laporan Gabungan - Semua Cabang';
      return `Laporan - ${stores.find((s: { id: string }) => s.id === selectedStoreId)?.name || 'Cabang Tidak Dikenal'}`;
    }
    return `Laporan - ${stores.find((s: { id: string }) => s.id === currentUser.storeId)?.name || 'Cabang Tidak Dikenal'}`;
  };

  const isRangeReport = reportType === 'range';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-slate-600 dark:text-slate-400 -mb-2 print-hide">
        {getStoreName()}
      </h2>
      <div className="print-only-block">
        <h1>{getStoreName()}</h1>
        <h3>{printHeaderTitle}</h3>
      </div>
      <div className="flex justify-between items-center flex-wrap gap-4 print-hide">
        {isRangeReport && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setRangeType('weekly')}
                className={`px-3 py-1.5 text-base font-medium rounded-md ${rangeType === 'weekly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Minggu Ini
              </button>
              <button
                onClick={() => setRangeType('monthly')}
                className={`px-3 py-1.5 text-base font-medium rounded-md ${rangeType === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Bulan Ini
              </button>
              <button
                onClick={() => setRangeType('all')}
                className={`px-3 py-1.5 text-base font-medium rounded-md ${rangeType === 'all' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Semua
              </button>
              <button
                onClick={() => setRangeType('custom')}
                className={`px-3 py-1.5 text-base font-medium rounded-md ${rangeType === 'custom' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300'}`}
              >
                Kustom
              </button>
            </div>
            {rangeType === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  id="report-custom-start-date"
                  name="report-custom-start-date"
                  value={customStartDate.toISOString().split('T')[0]}
                  onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-base"
                  autoComplete="off"
                />
                <span>-</span>
                <input
                  type="date"
                  id="report-custom-end-date"
                  name="report-custom-end-date"
                  value={customEndDate.toISOString().split('T')[0]}
                  onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-base"
                  autoComplete="off"
                />
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => {
            addAuditLog(
              `Mencetak laporan ${reportType === 'yearlySummary' ? 'Tahunan' : 'Rentang Tanggal'} untuk cabang: ${selectedStoreId === 'all' ? 'Semua Cabang' : selectedStoreId}.`,
              selectedStoreId !== 'all' ? selectedStoreId : undefined,
            );
            window.print();
          }}
          className="print-hide flex items-center justify-center text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-6 py-3"
        >
          Cetak Laporan
        </button>
      </div>
      {isRangeReport ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print-stat-card-container">
            <StatCard
              icon={DollarSignIcon}
              title="Total Pendapatan"
              value={`Rp ${formatRupiah(totalRevenue)}`}
              color="border-green-500"
            />
            <StatCard
              icon={DollarSignIcon}
              title="Total Pengeluaran"
              value={`Rp ${formatRupiah(totalExpenses)}`}
              color="border-red-500"
            />
            <StatCard
              icon={BarChartIcon}
              title="Laba Bersih"
              value={`Rp ${formatRupiah(netProfit)}`}
              color="border-blue-500"
            />
            <StatCard
              icon={PackageIcon}
              title="Total Transaksi"
              value={filteredData.transactions.length}
              color="border-yellow-500"
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Layanan Terlaris
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                  <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Nama Layanan</th>
                      <th className="px-4 py-2 text-right">Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topServices.map((s, i) => (
                      <tr
                        key={s.serviceId ? s.serviceId : `${s.name}-${i}`}
                        className="border-b dark:border-slate-700"
                      >
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                          {s.name}
                        </td>
                        <td className="px-4 py-2 text-right">Rp {formatRupiah(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
                Pelanggan Teratas
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                  <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Nama Pelanggan</th>
                      <th className="px-4 py-2 text-right">Total Belanja</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c) => (
                      <tr key={c.name} className="border-b dark:border-slate-700">
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="px-4 py-2 text-right">
                          Rp {c.total.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <BarChartIcon className="w-6 h-6 mr-3 text-slate-500 print-hide" />
              Pendapatan per Kategori Layanan
            </h2>
            <div className="space-y-3 print-chart-hide">
              {revenueByCategory.length > 0 ? (
                revenueByCategory.map((c) => (
                  <div key={c.category}>
                    <div className="flex justify-between mb-1">
                      <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                        {c.category}
                      </span>
                      <span className="text-base font-medium text-slate-700 dark:text-slate-300">
                        Rp {c.revenue.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-4 dark:bg-slate-700">
                      <div
                        className="bg-blue-600 h-4 rounded-full"
                        style={{
                          width: `${maxRevenueByCategory > 0 ? (c.revenue / maxRevenueByCategory) * 100 : 0}%`,
                        }}
                        title={`Rp ${c.revenue.toLocaleString('id-ID')}`}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-slate-500 dark:text-slate-400">
                  Tidak ada data pendapatan.
                </p>
              )}
            </div>
            <table className="print-only-table w-full text-base text-left text-slate-500 dark:text-slate-400 mt-4">
              <thead className="print-only-header text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                <tr className="print-only-row">
                  <th className="print-only-cell px-4 py-3">Kategori</th>
                  <th className="print-only-cell px-4 py-3 text-right">Pendapatan</th>
                </tr>
              </thead>
              <tbody>
                {revenueByCategory.map((c) => (
                  <tr key={c.category} className="print-only-row border-b dark:border-slate-700">
                    <td className="print-only-cell px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {c.category}
                    </td>
                    <td className="print-only-cell px-4 py-3 text-right">
                      Rp {c.revenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <PackageIcon className="w-6 h-6 mr-3 text-slate-500 print-hide" />
              Rincian Pendapatan per Layanan
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Nama Layanan</th>
                    <th className="px-4 py-2">Kategori</th>
                    <th className="px-4 py-2 text-center">Terjual</th>
                    <th className="px-4 py-2 text-right">Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {servicePerformance.length > 0 ? (
                    servicePerformance.map((s) => (
                      <tr key={s.serviceId} className="border-b dark:border-slate-700">
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                          {s.name}
                        </td>
                        <td className="px-4 py-2">{s.category}</td>
                        <td className="px-4 py-2 text-center">
                          {s.quantity} {s.unit}
                        </td>
                        <td className="px-4 py-2 text-right">
                          Rp {s.revenue.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-6 text-slate-500 dark:text-slate-400"
                      >
                        Tidak ada data pendapatan layanan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <UsersIcon className="w-6 h-6 mr-3 text-slate-500 print-hide" />
              Performa Kasir
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Nama Kasir</th>
                    <th className="px-4 py-2 text-center">Total Transaksi</th>
                    <th className="px-4 py-2 text-right">Total Pendapatan</th>
                    <th className="px-4 py-2 text-right">Total Diskon</th>
                  </tr>
                </thead>
                <tbody>
                  {cashierPerformance.length > 0 ? (
                    cashierPerformance.map((c) => (
                      <tr key={c.name} className="border-b dark:border-slate-700">
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="px-4 py-2 text-center">{c.transactionCount}</td>
                        <td className="px-4 py-2 text-right">
                          Rp {c.totalRevenue.toLocaleString('id-ID')}
                        </td>
                        <td className="px-4 py-2 text-right">
                          Rp {c.totalDiscount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-6 text-slate-500 dark:text-slate-400"
                      >
                        Tidak ada data performa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <DollarSignIcon className="w-6 h-6 mr-3 text-slate-500 print-hide" />
              Rincian Pengeluaran (Termasuk Aset & Pemeliharaan)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Tanggal</th>
                    <th className="px-4 py-2">Deskripsi</th>
                    <th className="px-4 py-2">Kategori</th>
                    {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                      <th className="px-4 py-2">Toko</th>
                    )}
                    <th className="px-4 py-2 text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedExpenses.length > 0 ? (
                    detailedExpenses.map((e) => (
                      <tr key={e.id} className="border-b dark:border-slate-700">
                        <td className="px-4 py-2">
                          {new Date(e.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                          {e.description}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              e.category === 'Pembelian Aset'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : e.category === 'Pemeliharaan Aset'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-slate-600 dark:text-slate-200'
                            }`}
                          >
                            {e.category}
                          </span>
                        </td>
                        {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                          <td className="px-4 py-2">{e.storeName}</td>
                        )}
                        <td className="px-4 py-2 text-right">
                          Rp {e.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all'
                            ? 5
                            : 4
                        }
                        className="text-center py-6 text-slate-500 dark:text-slate-400"
                      >
                        Tidak ada data pengeluaran.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <td
                      colSpan={
                        currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all'
                          ? 4
                          : 3
                      }
                      className="px-4 py-2 text-right"
                    >
                      Total Pengeluaran
                    </td>
                    <td className="px-4 py-2 text-right">
                      Rp {totalExpenses.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4">
            Ringkasan Bulanan {new Date().getFullYear()}
          </h2>
          <YearlySummaryChart data={monthlySummary} />
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

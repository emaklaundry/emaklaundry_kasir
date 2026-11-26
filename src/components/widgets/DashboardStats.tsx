import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTransactions } from '../../contexts/TransactionContext';
import { useExpenses } from '../../contexts/ExpenseContext';
import { Expense, OrderStatus, PaymentStatus, Transaction } from '@/types';
import { formatRupiah } from '../../utils/formatting';
import { getLocalDateString } from '../../utils/monthlyExpenses';
import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, AlertTriangleIcon } from '../icons';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Pesanan "Siap Diambil" yang lewat sekian hari dari estimasi dianggap menumpuk. */
const STALE_PICKUP_DAYS = 3;

type Tone = 'blue' | 'green' | 'amber' | 'red' | 'slate';

const TONES: Record<Tone, { box: string; label: string; value: string; sub: string }> = {
  blue: {
    box: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    label: 'text-blue-700 dark:text-blue-300',
    value: 'text-blue-950 dark:text-blue-50',
    sub: 'text-blue-800 dark:text-blue-200',
  },
  green: {
    box: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    label: 'text-green-700 dark:text-green-300',
    value: 'text-green-950 dark:text-green-50',
    sub: 'text-green-800 dark:text-green-200',
  },
  amber: {
    box: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    label: 'text-amber-700 dark:text-amber-300',
    value: 'text-amber-950 dark:text-amber-50',
    sub: 'text-amber-800 dark:text-amber-200',
  },
  red: {
    box: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    label: 'text-red-700 dark:text-red-300',
    value: 'text-red-950 dark:text-red-50',
    sub: 'text-red-800 dark:text-red-200',
  },
  slate: {
    box: 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700',
    label: 'text-slate-600 dark:text-slate-300',
    value: 'text-slate-900 dark:text-white',
    sub: 'text-slate-600 dark:text-slate-400',
  },
};

const StatCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tone: Tone;
  to?: string;
  hint?: string;
}> = ({ label, value, sub, tone, to, hint }) => {
  const t = TONES[tone];
  const body = (
    <div
      className={`h-full rounded-lg border p-4 sm:p-5 ${t.box} ${to ? 'transition-colors hover:brightness-95' : ''}`}
      title={hint}
    >
      <p className={`mb-1 text-xs font-medium sm:text-sm ${t.label}`}>{label}</p>
      <p className={`text-xl font-bold tabular-nums sm:text-2xl md:text-3xl ${t.value}`}>{value}</p>
      {sub && <div className={`mt-1 text-xs sm:text-sm ${t.sub}`}>{sub}</div>}
    </div>
  );
  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
};

/** "+12% vs 7 hari sebelumnya" — atau keterangan bila belum ada pembanding. */
const Change: React.FC<{ current: number; previous: number; suffix: string }> = ({
  current,
  previous,
  suffix,
}) => {
  if (previous <= 0) {
    return <span>{current > 0 ? `Belum ada data ${suffix}` : '—'}</span>;
  }
  const pct = ((current - previous) / previous) * 100;
  const up = pct >= 0;
  const Icon = up ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold ${
        up ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {up ? '+' : ''}
      {pct.toFixed(0)}% {suffix}
    </span>
  );
};

const rp = (n: number) => `Rp ${formatRupiah(Math.round(n))}`;

/** Bagian nota yang benar-benar sudah dibayar (tanpa kembalian). */
const collectedOf = (t: Transaction) =>
  t.paymentStatus === PaymentStatus.Paid ? t.total : Math.min(t.amountPaid || 0, t.total);

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));

interface DashboardStatsProps {
  storeId: string;
  /** Pesanan belum selesai (sudah dimuat Dashboard) — untuk hitung yang terlambat. */
  activeOrders: Transaction[];
  showFinance: boolean;
  showMoney: boolean;
  canManage: boolean;
  lowStock: { total: number; critical: number };
  maintenance: { total: number; overdue: number };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  storeId,
  activeOrders,
  showFinance,
  showMoney,
  canManage,
  lowStock,
  maintenance,
}) => {
  // Rentang tetap selama halaman terbuka agar queryKey stabil: hari ini + 13 hari ke belakang.
  const range = useMemo(() => {
    const today = new Date();
    const from = new Date(today.getTime() - 13 * DAY_MS);
    return { from: getLocalDateString(from), to: getLocalDateString(today) };
  }, []);

  const recentQuery = useTransactions({ pageSize: 1000, storeId, dateRange: range });
  // pageSize 1 cukup: yang dipakai hanya jumlah total dari server.
  const processingQuery = useTransactions({
    pageSize: 1,
    storeId,
    orderStatus: OrderStatus.Processing,
  });
  const readyQuery = useTransactions({ pageSize: 1, storeId, orderStatus: OrderStatus.Ready });
  const unpaidQuery = useTransactions({
    pageSize: 1000,
    storeId,
    paymentStatus: PaymentStatus.Unpaid,
  });
  const { expenses = [] } = useExpenses();

  const ops = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const startYesterday = new Date(startToday.getTime() - DAY_MS);

    let today = 0;
    let todayValue = 0;
    let yesterday = 0;
    for (const t of recentQuery.transactions) {
      const created = toDate(t.createdAt);
      if (created >= startToday) {
        today += 1;
        todayValue += t.total;
      } else if (created >= startYesterday) {
        yesterday += 1;
      }
    }

    const overdue = activeOrders.filter(
      (t) =>
        t.orderStatus === OrderStatus.Processing &&
        t.estimatedCompletionDate &&
        new Date(t.estimatedCompletionDate) < now,
    ).length;
    const staleCutoff = new Date(now.getTime() - STALE_PICKUP_DAYS * DAY_MS);
    const stalePickup = activeOrders.filter(
      (t) =>
        t.orderStatus === OrderStatus.Ready &&
        t.estimatedCompletionDate &&
        new Date(t.estimatedCompletionDate) < staleCutoff,
    ).length;

    const outstanding = unpaidQuery.transactions.reduce(
      (sum, t) => sum + Math.max(t.total - collectedOf(t), 0),
      0,
    );

    return { today, todayValue, yesterday, overdue, stalePickup, outstanding };
  }, [recentQuery.transactions, activeOrders, unpaidQuery.transactions]);

  const finance = useMemo(() => {
    const now = new Date().getTime();
    const startThisWeek = new Date(now - 6 * DAY_MS);
    startThisWeek.setHours(0, 0, 0, 0);

    const cur = { revenue: 0, collected: 0, count: 0, customers: new Set<string>() };
    const prev = { revenue: 0, count: 0 };
    for (const t of recentQuery.transactions) {
      if (toDate(t.createdAt) >= startThisWeek) {
        cur.revenue += t.total;
        cur.collected += collectedOf(t);
        cur.count += 1;
        if (t.customerId) cur.customers.add(t.customerId);
      } else {
        prev.revenue += t.total;
        prev.count += 1;
      }
    }

    const weekExpenses = (expenses as Expense[])
      .filter((e) => storeId === 'all' || e.storeId === storeId)
      .filter((e) => toDate(e.date) >= startThisWeek)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      revenue: cur.revenue,
      collected: cur.collected,
      count: cur.count,
      customers: cur.customers.size,
      avgTicket: cur.count ? cur.revenue / cur.count : 0,
      prevRevenue: prev.revenue,
      prevAvgTicket: prev.count ? prev.revenue / prev.count : 0,
      expenses: weekExpenses,
      profit: cur.revenue - weekExpenses,
    };
  }, [recentQuery.transactions, expenses, storeId]);

  const loading = recentQuery.isLoading;
  const dash = (n: number | string) => (loading ? '…' : n);
  const unpaidCount = unpaidQuery.totalCount;
  const collectedPct = finance.revenue > 0 ? (finance.collected / finance.revenue) * 100 : 0;

  return (
    <div id="dashboard-stats" className="space-y-3 sm:space-y-4">
      <section aria-labelledby="stats-ops-title">
        <h2
          id="stats-ops-title"
          className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
        >
          Pekerjaan hari ini
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            tone="blue"
            label="Pesanan masuk hari ini"
            value={dash(ops.today)}
            sub={
              <>
                Kemarin {ops.yesterday}
                {showMoney && ops.todayValue > 0 && <> · {rp(ops.todayValue)}</>}
              </>
            }
            to="/transactions"
          />
          <StatCard
            tone={ops.overdue > 0 ? 'red' : 'amber'}
            label="Perlu dikerjakan"
            value={dash(processingQuery.totalCount)}
            sub={
              ops.overdue > 0 ? (
                <strong>{ops.overdue} lewat estimasi selesai</strong>
              ) : (
                'Semua masih sesuai estimasi'
              )
            }
            hint="Pesanan berstatus Diproses"
            to={`/transactions?status=${OrderStatus.Processing}`}
          />
          <StatCard
            tone="green"
            label="Siap diambil"
            value={dash(readyQuery.totalCount)}
            sub={
              ops.stalePickup > 0
                ? `${ops.stalePickup} menunggu > ${STALE_PICKUP_DAYS} hari — hubungi pelanggan`
                : 'Tidak ada yang menumpuk'
            }
            to={`/transactions?status=${encodeURIComponent(OrderStatus.Ready)}`}
          />
          <StatCard
            tone={unpaidCount > 0 ? 'amber' : 'slate'}
            label="Nota belum lunas"
            value={dash(unpaidCount)}
            sub={
              showMoney
                ? unpaidCount > 0
                  ? `${rp(ops.outstanding)} belum dibayar`
                  : 'Semua nota lunas'
                : 'Tagih saat pelanggan mengambil'
            }
            hint="Pesanan baru bisa ditandai Selesai setelah lunas"
            to={`/transactions?payment=${encodeURIComponent(PaymentStatus.Unpaid)}`}
          />
        </div>
      </section>

      {showFinance && (
        <section aria-labelledby="stats-finance-title" id="dashboard-chart">
          <h2
            id="stats-finance-title"
            className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
          >
            Keuangan 7 hari terakhir
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              tone="slate"
              label="Omzet (nilai nota)"
              value={dash(rp(finance.revenue))}
              sub={
                <Change
                  current={finance.revenue}
                  previous={finance.prevRevenue}
                  suffix="vs 7 hari sebelumnya"
                />
              }
              to="/reports"
            />
            <StatCard
              tone="slate"
              label="Uang sudah diterima"
              value={dash(rp(finance.collected))}
              sub={
                finance.revenue > 0
                  ? `${collectedPct.toFixed(0)}% dari omzet sudah dibayar`
                  : 'Belum ada nota'
              }
            />
            <StatCard
              tone="slate"
              label="Rata-rata per nota"
              value={dash(rp(finance.avgTicket))}
              sub={
                <>
                  {finance.count} nota · {finance.customers} pelanggan
                  <br />
                  <Change
                    current={finance.avgTicket}
                    previous={finance.prevAvgTicket}
                    suffix="vs sebelumnya"
                  />
                </>
              }
            />
            <StatCard
              tone={finance.profit >= 0 ? 'green' : 'red'}
              label="Perkiraan laba"
              value={dash(rp(finance.profit))}
              sub={`Omzet − pengeluaran ${rp(finance.expenses)}`}
              hint="Omzet 7 hari dikurangi pengeluaran yang tercatat 7 hari ini. Biaya bulanan yang belum dicatat belum terhitung."
              to="/management/expenses"
            />
          </div>
        </section>
      )}

      {(lowStock.total > 0 || maintenance.total > 0) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {lowStock.total > 0 && (
            <AlertLink
              to={canManage ? '/management/inventory?filter=low_stock' : undefined}
              text={
                lowStock.critical > 0
                  ? `${lowStock.critical} bahan habis, ${lowStock.total - lowStock.critical} menipis — segera belanja`
                  : `${lowStock.total} bahan menipis — siapkan belanja`
              }
            />
          )}
          {maintenance.total > 0 && (
            <AlertLink
              to={canManage ? '/management/assets?filter=maintenance_due' : undefined}
              text={
                maintenance.overdue > 0
                  ? `${maintenance.overdue} perawatan mesin terlambat`
                  : `${maintenance.total} perawatan mesin jatuh tempo hari ini`
              }
            />
          )}
        </div>
      )}
    </div>
  );
};

const AlertLink: React.FC<{ text: string; to?: string }> = ({ text, to }) => {
  const content = (
    <span className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-900 dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-100">
      <AlertTriangleIcon className="h-4 w-4 shrink-0" />
      {text}
    </span>
  );
  return to ? (
    <Link to={to} className="flex-1 hover:brightness-95">
      {content}
    </Link>
  ) : (
    <div className="flex-1">{content}</div>
  );
};

export default DashboardStats;

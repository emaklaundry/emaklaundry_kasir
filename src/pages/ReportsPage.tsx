import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChartIcon, DollarSignIcon, PackageIcon, UsersIcon } from '../components/icons';
import { Transaction, UserRole, Service, User, ServiceCategory } from '@/types';
import { useTransactions } from '../contexts/TransactionContext';
import { useCustomers } from '../contexts/CustomerContext';
import { useExpenses } from '../contexts/ExpenseContext';
import { useAppContext } from '../contexts/AppContext';
import { useUsers } from '../contexts/UserContext';
import { useToasts } from '../contexts/ToastContext';
import { useServices } from '../contexts/ServiceContext';

const StatCard: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  value: string | number;
  color: string;
}> = ({ icon: Icon, title, value, color }) => (
  // TAMBAHKAN: kelas 'print-stat-card' dan 'print-hide' pada ikon
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
          className="absolute z-10 p-2 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded-md shadow-lg"
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        ></div>
      )}
      {/* TAMBAHKAN: 'print-chart-hide' untuk menyembunyikan SVG saat cetak */}
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
          const revenueHeight = (d.revenue / maxValue) * (chartHeight - 30);
          const expensesHeight = (d.expenses / maxValue) * (chartHeight - 30);
          const tooltipContent = `<b>${d.month}</b><br/>Pendapatan: Rp ${d.revenue.toLocaleString('id-ID')}<br/>Pengeluaran: Rp ${d.expenses.toLocaleString('id-ID')}`;

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

      {/* --- TAMBAHKAN: Tabel ini HANYA akan muncul saat dicetak --- */}
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
              <td className="print-only-cell px-4 py-3 text-right">
                Rp {d.revenue.toLocaleString('id-ID')}
              </td>
              <td className="print-only-cell px-4 py-3 text-right">
                Rp {d.expenses.toLocaleString('id-ID')}
              </td>
              <td className="print-only-cell px-4 py-3 text-right font-semibold">
                Rp {d.profit.toLocaleString('id-ID')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* --- AKHIR BLOK CETAK --- */}
    </div>
  );
};

const ReportsPage: React.FC = () => {
  const { transactions: allStoreTransactions } = useTransactions();
  const { customers } = useCustomers();
  const { expenses: allStoreExpenses } = useExpenses();
  const { services } = useServices();
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addToast } = useToasts();
  const { users: allUsers } = useUsers();

  const [reportType, setReportType] = useState<'range' | 'yearlySummary'>('range');
  const [rangeType, setRangeType] = useState<'monthly' | 'weekly' | 'custom'>('monthly');

  const today = new Date();
  const [customStartDate, setCustomStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [customEndDate, setCustomEndDate] = useState(
    new Date(today.getFullYear(), today.getMonth() + 1, 0),
  );

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
    const transactions = allStoreTransactions.filter((t) => {
      const time = new Date(t.createdAt).getTime();
      return time >= start && time <= end;
    });
    const expenses = allStoreExpenses.filter((e) => {
      const time = new Date(e.date).getTime();
      return time >= start && time <= end;
    });
    return { transactions, expenses };
  }, [startDate, endDate, allStoreTransactions, allStoreExpenses]);

  const totalRevenue = filteredData.transactions.reduce((acc, t) => acc + t.amountPaid, 0);
  const totalExpenses = filteredData.expenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const serviceMap = useMemo(
    () =>
      services.reduce(
        (map, service) => ({ ...map, [service.id]: service }),
        {} as Record<string, Service>,
      ),
    [services],
  );

  const topServices = useMemo(() => {
    const serviceRevenue: { [key: string]: number } = {};
    filteredData.transactions.forEach((t) =>
      t.items.forEach((item) => {
        serviceRevenue[item.serviceId] = (serviceRevenue[item.serviceId] || 0) + item.subtotal;
      }),
    );
    return Object.entries(serviceRevenue)
      .map(([serviceId, revenue]) => ({
        name: serviceMap[serviceId]?.name || 'Layanan Dihapus',
        revenue,
      }))
      .filter((s) => s.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredData.transactions, serviceMap]);

  const topCustomers = useMemo(() => {
    const customerSpending: { [key: string]: number } = {};
    filteredData.transactions.forEach((t) => {
      customerSpending[t.customerId] = (customerSpending[t.customerId] || 0) + t.total;
    });
    return Object.entries(customerSpending)
      .map(([customerId, total]) => ({
        name: customers.find((c) => c.id === customerId)?.name || 'N/A',
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredData.transactions, customers]);

  const userMap = useMemo(
    () => allUsers.reduce((map, user) => ({ ...map, [user.id]: user }), {} as Record<string, User>),
    [allUsers],
  );

  const cashierPerformance = useMemo(() => {
    const stats: {
      [key: number]: {
        name: string;
        transactionCount: number;
        totalRevenue: number;
        totalDiscount: number;
      };
    } = {};
    filteredData.transactions.forEach((t) => {
      if (!t.createdByUserId || !userMap[t.createdByUserId]) return;
      const user = userMap[t.createdByUserId];
      if (!stats[user.id])
        stats[user.id] = {
          name: user.name,
          transactionCount: 0,
          totalRevenue: 0,
          totalDiscount: 0,
        };
      stats[user.id].transactionCount++;
      stats[user.id].totalRevenue += t.amountPaid;
      stats[user.id].totalDiscount += t.discount;
    });
    return Object.values(stats).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredData.transactions, userMap]);

  const revenueByCategory = useMemo(() => {
    const categoryRevenue: { [key in ServiceCategory]?: number } = {};
    filteredData.transactions.forEach((t) =>
      t.items.forEach((item) => {
        const service = serviceMap[item.serviceId];
        if (service)
          categoryRevenue[service.category] =
            (categoryRevenue[service.category] || 0) + item.subtotal;
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

  const detailedExpenses = useMemo(() => {
    return filteredData.expenses
      .map((expense) => ({
        ...expense,
        storeName: stores.find((s) => s.id === expense.storeId)?.name || 'N/A',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredData.expenses, stores]);

  const monthlySummary = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearTransactions = allStoreTransactions.filter(
      (t) => new Date(t.createdAt).getFullYear() === currentYear,
    );
    const yearExpenses = allStoreExpenses.filter(
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
    const summary = monthNames.map((name) => ({ month: name, revenue: 0, expenses: 0, profit: 0 }));
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

  const getStoreName = () => {
    if (currentUser.role === UserRole.SuperAdmin) {
      if (selectedStoreId === 'all') return 'Laporan Gabungan - Semua Cabang';
      return `Laporan - ${stores.find((s) => s.id === selectedStoreId)?.name || 'Cabang Tidak Dikenal'}`;
    }
    return `Laporan - ${stores.find((s) => s.id === currentUser.storeId)?.name || 'Cabang Tidak Dikenal'}`;
  };

  const isRangeReport = reportType === 'range';

  // --- TAMBAHAN: Teks header untuk laporan cetak ---
  const printHeaderTitle = useMemo(() => {
    // Untuk 'range'
    const startStr = startDate.toLocaleDateString('id-ID');
    const endStr = endDate.toLocaleDateString('id-ID');
    if (rangeType === 'custom') {
      return `Laporan Kustom (${startStr} - ${endStr})`;
    }
    return `Laporan ${rangeType === 'weekly' ? 'Mingguan' : 'Bulanan'} (Hingga ${endStr})`;
  }, [rangeType, startDate, endDate]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-slate-600 dark:text-slate-400 -mb-2 print-hide">
        {getStoreName()}
      </h2>

      {/* --- TAMBAHAN: Header yang HANYA muncul saat dicetak --- */}
      <div className="print-only-block">
        <h1>{getStoreName()}</h1>
        <h3>{printHeaderTitle}</h3>
      </div>
      {/* --- AKHIR BLOK CETAK --- */}

      {/* TAMBAHKAN: 'print-hide' untuk menyembunyikan seluruh baris filter ini saat cetak */}
      <div className="flex justify-between items-center flex-wrap gap-4 print-hide">
        {/* Tombol Rentang Waktu dihapus */}
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
                  value={customStartDate.toISOString().split('T')[0]}
                  onChange={(e) => setCustomStartDate(new Date(e.target.value))}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-base"
                />
                <span>-</span>
                <input
                  type="date"
                  value={customEndDate.toISOString().split('T')[0]}
                  onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                  className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-base"
                />
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => window.print()}
          className="print-hide flex items-center justify-center text-white bg-green-600 hover:bg-green-700 font-medium rounded-lg text-lg px-6 py-3"
        >
          Cetak Laporan
        </button>
      </div>

      {isRangeReport ? (
        <>
          {/* TAMBAHKAN: 'print-stat-card-container' untuk styling pembungkus saat cetak */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print-stat-card-container">
            <StatCard
              icon={DollarSignIcon}
              title="Total Pendapatan"
              value={`Rp ${totalRevenue.toLocaleString('id-ID')}`}
              color="border-green-500"
            />
            <StatCard
              icon={DollarSignIcon}
              title="Total Pengeluaran"
              value={`Rp ${totalExpenses.toLocaleString('id-ID')}`}
              color="border-red-500"
            />
            <StatCard
              icon={BarChartIcon}
              title="Laba Bersih"
              value={`Rp ${netProfit.toLocaleString('id-ID')}`}
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
            {/* TAMBAHKAN: 'report-section' untuk menghindari page-break */}
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
                    {topServices.map((s) => (
                      <tr key={s.name} className="border-b dark:border-slate-700">
                        <td className="px-4 py-2 font-medium text-slate-900 dark:text-white">
                          {s.name}
                        </td>
                        <td className="px-4 py-2 text-right">
                          Rp {s.revenue.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* TAMBAHKAN: 'report-section' untuk menghindari page-break */}
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
          {/* TAMBAHKAN: 'report-section' untuk menghindari page-break */}
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <BarChartIcon className="w-6 h-6 mr-3 text-slate-500 print-hide" />
              Pendapatan per Kategori Layanan
            </h2>
            {/* TAMBAHKAN: 'print-chart-hide' untuk menyembunyikan bagan visual saat cetak */}
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

            {/* --- TAMBAHKAN: Tabel ini HANYA akan muncul saat dicetak --- */}
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
            {/* --- AKHIR BLOK CETAK --- */}
          </div>
          {/* TAMBAHKAN: 'report-section' untuk menghindari page-break */}
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
          {/* TAMBAHKAN: 'report-section' untuk menghindari page-break */}
          <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-lg shadow-md report-section">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
              <DollarSignIcon className="w-6 h-6 mr-3 text-slate-500 print-hide" />
              Rincian Pengeluaran
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
                <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2">Tanggal</th>
                    <th className="px-4 py-2">Deskripsi</th>
                    <th className="px-4 py-2">Kategori</th>
                    {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
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
                        <td className="px-4 py-2">{e.category}</td>
                        {currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
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
                          currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all'
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
                        currentUser.role === UserRole.SuperAdmin && selectedStoreId === 'all'
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
        // TAMBAHKAN: 'report-section' untuk menghindari page-break
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

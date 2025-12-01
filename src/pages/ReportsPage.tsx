import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import useAppContext from '../contexts/useAppContext';
import { formatRupiah } from '../utils/formatting';
import { SpinnerIcon, ReceiptIcon } from '../components/icons';

interface DailyStat {
  date: string;     // Tanggal (1, 2, 3...)
  fullDate: string; // Tanggal lengkap untuk display
  revenue: number;
  expense: number;
  profit: number;
  txCount: number;  // Jumlah transaksi
}

const ReportsPage: React.FC = () => {
  const { selectedStoreId } = useAppContext();
  
  // State filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- 1. Filter Tanggal Akurat (00:00 s/d 23:59) ---
  const dateRange = useMemo(() => {
    const startDate = new Date(selectedYear, selectedMonth, 1, 0, 0, 0);
    const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
  }, [selectedMonth, selectedYear]);

  // --- 2. Query SEMUA Data (Tanpa Batas 50 Baris) ---
  const { data: transactions = [], isLoading: isLoadingTx } = useQuery({
    queryKey: ['report-transactions', selectedStoreId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('createdAt, total, paymentStatus, orderStatus')
        .gte('createdAt', dateRange.start)
        .lte('createdAt', dateRange.end)
        .neq('orderStatus', 'Batal'); // Abaikan transaksi batal
      
      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      // Limit 10.000 untuk memastikan semua data bulan ini terambil
      const { data, error } = await query.limit(10000); 
      if (error) throw error;
      return data || [];
    },
  });

  const { data: expenses = [], isLoading: isLoadingExp } = useQuery({
    queryKey: ['report-expenses', selectedStoreId, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('expenses')
        .select('*')
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      if (selectedStoreId && selectedStoreId !== 'all') {
        query = query.eq('storeId', selectedStoreId);
      }

      const { data, error } = await query.limit(10000);
      if (error) throw error;
      return data || [];
    },
  });

  // --- 3. Pengolahan Data (Tanpa Grafik) ---
  const reportData = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const stats: DailyStat[] = [];
    
    // Inisialisasi data harian kosong
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(selectedYear, selectedMonth, i);
      stats.push({
        date: String(i),
        fullDate: dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }),
        revenue: 0,
        expense: 0,
        profit: 0,
        txCount: 0
      });
    }

    // Hitung Pendapatan
    transactions.forEach((tx) => {
      const day = new Date(tx.createdAt).getDate();
      const idx = day - 1;
      if (stats[idx]) {
        stats[idx].revenue += Number(tx.total) || 0;
        stats[idx].txCount += 1;
      }
    });

    // Hitung Pengeluaran
    expenses.forEach((exp) => {
      const day = new Date(exp.date).getDate();
      const idx = day - 1;
      if (stats[idx]) {
        stats[idx].expense += Number(exp.amount) || 0;
      }
    });

    // Hitung Profit & Total Summary
    let totalRevenue = 0;
    let totalExpense = 0;
    let totalTx = 0;

    stats.forEach(stat => {
      stat.profit = stat.revenue - stat.expense;
      totalRevenue += stat.revenue;
      totalExpense += stat.expense;
      totalTx += stat.txCount;
    });

    // Urutkan tabel dari tanggal terbaru (opsional, bisa diubah)
    // stats.reverse(); 

    return {
      dailyStats: stats,
      summary: {
        totalRevenue,
        totalExpense,
        netProfit: totalRevenue - totalExpense,
        totalTx,
        totalExp: expenses.length
      }
    };
  }, [transactions, expenses, selectedMonth, selectedYear]);

  if (isLoadingTx || isLoadingExp) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <SpinnerIcon className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-500">Memuat laporan keuangan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <ReceiptIcon className="w-8 h-8 mr-3 text-blue-600" />
            Laporan Keuangan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Periode: {new Date(selectedYear, selectedMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kartu Ringkasan (Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pendapatan */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border-l-4 border-green-500">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Pendapatan</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Rp {formatRupiah(reportData.summary.totalRevenue)}
          </p>
          <p className="text-xs text-green-600 mt-2 font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded inline-block">
            {reportData.summary.totalTx} Transaksi Berhasil
          </p>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            Rp {formatRupiah(reportData.summary.totalExpense)}
          </p>
          <p className="text-xs text-red-600 mt-2 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded inline-block">
            {reportData.summary.totalExp} Item Tercatat
          </p>
        </div>

        {/* Laba Bersih */}
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border-l-4 ${reportData.summary.netProfit >= 0 ? 'border-blue-500' : 'border-orange-500'}`}>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Laba Bersih</p>
          <p className={`text-2xl font-bold mt-2 ${reportData.summary.netProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
            Rp {formatRupiah(reportData.summary.netProfit)}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            (Pendapatan - Pengeluaran)
          </p>
        </div>
      </div>

      {/* Tabel Rincian Harian (Pengganti Grafik) */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rincian Harian</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-3">Tanggal</th>
                <th scope="col" className="px-6 py-3 text-right text-green-600">Pendapatan</th>
                <th scope="col" className="px-6 py-3 text-right text-red-600">Pengeluaran</th>
                <th scope="col" className="px-6 py-3 text-right">Laba / Rugi</th>
                <th scope="col" className="px-6 py-3 text-center">Jml Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {reportData.dailyStats.map((stat) => (
                <tr key={stat.date} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">
                    {stat.fullDate}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                    {stat.revenue > 0 ? `Rp ${formatRupiah(stat.revenue)}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-300">
                    {stat.expense > 0 ? `Rp ${formatRupiah(stat.expense)}` : '-'}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${stat.profit >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
                    Rp {formatRupiah(stat.profit)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {stat.txCount > 0 ? stat.txCount : '-'}
                  </td>
                </tr>
              ))}
              {/* Baris Total di Bawah Tabel */}
              <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-600">
                <td className="px-6 py-4 text-slate-900 dark:text-white">TOTAL BULAN INI</td>
                <td className="px-6 py-4 text-right text-green-700 dark:text-green-400">Rp {formatRupiah(reportData.summary.totalRevenue)}</td>
                <td className="px-6 py-4 text-right text-red-700 dark:text-red-400">Rp {formatRupiah(reportData.summary.totalExpense)}</td>
                <td className="px-6 py-4 text-right text-blue-700 dark:text-blue-400">Rp {formatRupiah(reportData.summary.netProfit)}</td>
                <td className="px-6 py-4 text-center text-slate-900 dark:text-white">{reportData.summary.totalTx}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportsPage;

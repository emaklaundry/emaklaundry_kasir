// src/pages/ReportsPage.tsx

import React, { useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  BarChartIcon,
  CalendarIcon,
  ClockIcon,
  DollarSignIcon,
  DownloadIcon,
  HomeIcon,
  PackageIcon,
  PrinterIcon,
  SpinnerIcon,
  TagIcon,
  UsersIcon,
} from '../components/icons';
import useAppContext from '../contexts/useAppContext';
import useToasts from '../contexts/useToasts';
import { useAuditLogs } from '../contexts/AuditLogContext';
import { UserRole } from '@/types';
import { formatRupiah } from '../utils/formatting';
import {
  buildSeries,
  computeReportRange,
  parseYmd,
  RangeType,
  SeriesRow,
} from '../utils/reportDates';
import { fetchFinancialReport, ReportData, ReportSummary } from '../utils/financialReport';
import useToday from '../hooks/useToday';

// ============================================================================
// Format
// ============================================================================

const rp = (n: number) => `Rp ${formatRupiah(Math.round(n))}`;

const pct = (part: number, whole: number) =>
  whole > 0 ? `${((part / whole) * 100).toFixed(1).replace('.', ',')}%` : '–';

const formatLongDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const formatShortDate = (d: Date) =>
  d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const formatRange = (startYmd: string, endYmd: string) => {
  const s = parseYmd(startYmd);
  const e = parseYmd(endYmd);
  if (!s || !e) return '';
  return startYmd === endYmd ? formatShortDate(s) : `${formatShortDate(s)} – ${formatShortDate(e)}`;
};

const RANGE_OPTIONS: { value: RangeType; label: string }[] = [
  { value: 'weekly', label: 'Minggu Ini' },
  { value: 'monthly', label: 'Bulan Ini' },
  { value: 'lastMonth', label: 'Bulan Lalu' },
  { value: 'yearly', label: 'Tahun Ini' },
  { value: 'all', label: 'Semua' },
  { value: 'custom', label: 'Kustom' },
];

const RANGE_TITLE: Record<RangeType, string> = {
  weekly: 'Laporan Mingguan',
  monthly: 'Laporan Bulanan',
  lastMonth: 'Laporan Bulanan',
  yearly: 'Laporan Tahunan',
  all: 'Laporan Keseluruhan',
  custom: 'Laporan Periode',
};

// ============================================================================
// Komponen kecil
// ============================================================================

const TONE = {
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  neutral: 'text-slate-500 dark:text-slate-400',
} as const;

const TONE_BG = {
  positive: 'bg-green-50 dark:bg-green-500/10',
  negative: 'bg-red-50 dark:bg-red-500/10',
  warning: 'bg-amber-50 dark:bg-amber-500/10',
  neutral: 'bg-slate-100 dark:bg-slate-700/50',
} as const;

type Tone = keyof typeof TONE;

/** Perubahan dibanding periode lalu. `higherIsBetter=false` untuk pengeluaran/piutang. */
const Delta: React.FC<{ current: number; previous?: number; higherIsBetter?: boolean }> = ({
  current,
  previous,
  higherIsBetter = true,
}) => {
  if (previous === undefined) return null;
  if (Math.abs(previous) < 0.5) {
    return current > 0.5 ? (
      <span className="text-xs text-slate-500 dark:text-slate-400">Baru (periode lalu 0)</span>
    ) : null;
  }
  const change = (current - previous) / Math.abs(previous);
  if (Math.abs(change) < 0.0005) {
    return (
      <span className="text-xs text-slate-500 dark:text-slate-400">Sama dgn periode lalu</span>
    );
  }
  const up = change > 0;
  const good = up === higherIsBetter;
  const Icon = up ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${good ? TONE.positive : TONE.negative}`}
      title={`Periode lalu: ${rp(previous)}`}
    >
      <Icon className="h-3 w-3" />
      {Math.abs(change * 100)
        .toFixed(1)
        .replace('.', ',')}
      % <span className="font-normal text-slate-500 dark:text-slate-400">vs periode lalu</span>
    </span>
  );
};

const StatCard: React.FC<{
  icon: React.FC<{ className?: string }>;
  title: string;
  value: string;
  hint?: string;
  tone?: Tone;
  valueTone?: Tone;
  delta?: React.ReactNode;
}> = ({ icon: Icon, title, value, hint, tone = 'neutral', valueTone, delta }) => (
  <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 print-stat-card">
    <span className={`rounded-lg p-2 print-hide ${TONE_BG[tone]}`}>
      <Icon className={`h-6 w-6 ${TONE[tone]}`} />
    </span>
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <p
        className={`mt-0.5 truncate text-xl font-semibold tabular-nums xl:text-2xl ${
          valueTone ? TONE[valueTone] : 'text-slate-900 dark:text-white'
        }`}
        title={value}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {delta && <div className="mt-0.5">{delta}</div>}
    </div>
  </div>
);

const ReportSection: React.FC<{
  title: string;
  icon?: React.FC<{ className?: string }>;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, icon: Icon, subtitle, children }) => (
  <section className="card p-4 report-section">
    <div className="mb-4">
      <h2 className="flex items-center text-lg font-semibold text-slate-900 dark:text-white">
        {Icon && <Icon className="mr-2 h-5 w-5 text-slate-500 print-hide" />}
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const TABLE = 'w-full text-sm text-left text-slate-600 dark:text-slate-300';
const THEAD =
  'text-xs uppercase tracking-wide text-slate-600 bg-slate-50 dark:bg-slate-700/60 dark:text-slate-300';
const TH = 'px-4 py-2 font-semibold';
const TD = 'px-4 py-2';
const TR = 'border-b border-slate-100 last:border-0 dark:border-slate-700';
const TFOOT = 'font-semibold text-slate-900 bg-slate-50 dark:bg-slate-700/60 dark:text-white';
const NAME = `${TD} font-medium text-slate-900 dark:text-white`;
const NUM = `${TD} text-right tabular-nums`;

const EmptyRow: React.FC<{ colSpan: number; children: React.ReactNode }> = ({
  colSpan,
  children,
}) => (
  <tr>
    <td colSpan={colSpan} className="py-6 text-center text-slate-500 dark:text-slate-400">
      {children}
    </td>
  </tr>
);

const ShareBar: React.FC<{ value: number; max: number; className?: string }> = ({
  value,
  max,
  className = 'bg-blue-600',
}) => (
  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 print-chart-hide">
    <div
      className={`h-1.5 rounded-full ${className}`}
      style={{ width: `${max > 0 ? Math.max((value / max) * 100, 0) : 0}%` }}
    />
  </div>
);

// ============================================================================
// Grafik tren (harian / bulanan)
// ============================================================================

const niceStep = (raw: number) => {
  if (raw <= 0) return 20000;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10;
  return nice * mag;
};

const compactRupiah = (v: number) => {
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, '').replace('.', ',');
  if (Math.abs(v) >= 1e9) return `${trim(v / 1e9)}M`;
  if (Math.abs(v) >= 1e6) return `${trim(v / 1e6)}jt`;
  if (Math.abs(v) >= 1e3) return `${trim(v / 1e3)}rb`;
  return String(Math.round(v));
};

const TrendChart: React.FC<{ data: SeriesRow[]; daily: boolean }> = ({ data, daily }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ content: string; x: number } | null>(null);

  const ticks = 5;
  const rawMax = Math.max(0, ...data.flatMap((d) => [d.revenue, d.expenses]));
  const step = niceStep(rawMax / ticks);
  const maxValue = step * ticks;

  const height = 260;
  const padTop = 12;
  const padBottom = 26;
  const yAxisWidth = 56;
  const groupWidth = daily ? 26 : 56;
  const barWidth = daily ? 9 : 18;
  const plotH = height - padTop - padBottom;
  const width = yAxisWidth + data.length * groupWidth + 8;
  const yOf = (v: number) => padTop + plotH - (Math.max(v, 0) / maxValue) * plotH;
  // Label sumbu-X harian dijarangkan agar tidak bertumpuk.
  const labelEvery = daily && data.length > 16 ? 2 : 1;

  const show = (content: string, e: React.MouseEvent<SVGRectElement>) => {
    const c = containerRef.current;
    if (!c) return;
    const r = e.currentTarget.getBoundingClientRect();
    const cr = c.getBoundingClientRect();
    setTip({ content, x: r.left - cr.left + c.scrollLeft + r.width / 2 });
  };

  return (
    <div className="print-chart-hide">
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Pendapatan diterima
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Pengeluaran
        </span>
      </div>
      <div ref={containerRef} className="relative overflow-x-auto">
        {tip && (
          <div
            style={{ left: tip.x, top: 0, transform: 'translateX(-50%)' }}
            className="pointer-events-none absolute z-10 whitespace-pre-line rounded-md bg-slate-900 p-2 text-xs text-white shadow-lg dark:bg-slate-700"
          >
            {tip.content}
          </div>
        )}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-label={`Grafik pendapatan dan pengeluaran per ${daily ? 'hari' : 'bulan'}`}
          className="max-w-none"
        >
          {Array.from({ length: ticks + 1 }).map((_, i) => {
            const v = i * step;
            const y = yOf(v);
            return (
              <g key={i}>
                <line
                  x1={yAxisWidth}
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                />
                <text
                  x={yAxisWidth - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-current text-[11px] text-slate-500 dark:text-slate-400"
                >
                  {compactRupiah(v)}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const gx = yAxisWidth + i * groupWidth;
            const cx = gx + groupWidth / 2;
            const content = `${d.fullLabel}\nPendapatan: ${rp(d.revenue)}\nPengeluaran: ${rp(d.expenses)}\nLaba: ${rp(d.profit)}`;
            return (
              <g key={d.key}>
                <rect
                  x={cx - barWidth - 1}
                  y={yOf(d.revenue)}
                  width={barWidth}
                  height={padTop + plotH - yOf(d.revenue)}
                  rx={2}
                  className="fill-current text-green-500"
                />
                <rect
                  x={cx + 1}
                  y={yOf(d.expenses)}
                  width={barWidth}
                  height={padTop + plotH - yOf(d.expenses)}
                  rx={2}
                  className="fill-current text-red-500"
                />
                {i % labelEvery === 0 && (
                  <text
                    x={cx}
                    y={height - 8}
                    textAnchor="middle"
                    className="fill-current text-[11px] text-slate-500 dark:text-slate-400"
                  >
                    {d.label}
                  </text>
                )}
                <rect
                  x={gx}
                  y={padTop}
                  width={groupWidth}
                  height={plotH}
                  fill="transparent"
                  className="hover:fill-slate-500/10"
                  onMouseEnter={(e) => show(content, e)}
                  onMouseLeave={() => setTip(null)}
                />
              </g>
            );
          })}
          <line
            x1={yAxisWidth}
            y1={padTop + plotH}
            x2={width}
            y2={padTop + plotH}
            stroke="currentColor"
            className="text-slate-300 dark:text-slate-600"
          />
        </svg>
      </div>
    </div>
  );
};

// ============================================================================
// Halaman
// ============================================================================

const ReportsPage: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addAuditLog } = useAuditLogs();
  const { addToast } = useToasts();
  const today = useToday();
  const [rangeType, setRangeType] = useState<RangeType>('monthly');
  const [customStart, setCustomStart] = useState(() => `${today.slice(0, 8)}01`);
  const [customEnd, setCustomEnd] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [showAllReceivables, setShowAllReceivables] = useState(false);
  const [seriesTableOpen, setSeriesTableOpen] = useState(false);

  // Non-Super Admin selalu melihat cabangnya sendiri.
  const effectiveStoreId =
    currentUser?.role === UserRole.SuperAdmin
      ? selectedStoreId
      : (currentUser?.storeId ?? selectedStoreId);
  const isAllStores = !effectiveStoreId || effectiveStoreId === 'all';

  const range = useMemo(
    () => computeReportRange(rangeType, parseYmd(today) ?? new Date(), customStart, customEnd),
    [rangeType, today, customStart, customEnd],
  );
  const { startYmd, endYmd, prevStartYmd, prevEndYmd } = range;

  const storeNames = useMemo(() => {
    const m: Record<string, string> = {};
    stores.forEach((s: { id: string; name: string }) => (m[s.id] = s.name));
    return m;
  }, [stores]);

  const reportQuery = useQuery<ReportData>({
    queryKey: [
      'financial-report',
      isAllStores ? 'all' : effectiveStoreId,
      startYmd,
      endYmd,
      prevStartYmd,
      prevEndYmd,
    ],
    queryFn: () =>
      fetchFinancialReport(
        {
          storeId: isAllStores ? null : effectiveStoreId,
          startYmd,
          endYmd,
          prevStartYmd,
          prevEndYmd,
        },
        storeNames,
      ),
    enabled: !!currentUser,
  });
  const report = reportQuery.data;

  const series = useMemo(
    () =>
      report
        ? buildSeries(report.daily, range.start, range.end, rangeType === 'all')
        : { granularity: 'day' as const, rows: [] },
    [report, range.start, range.end, rangeType],
  );

  if (!currentUser) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        Data pengguna belum dimuat.
      </div>
    );
  }

  const branchLabel = isAllStores
    ? 'Semua Cabang'
    : storeNames[effectiveStoreId] || 'Cabang Tidak Dikenal';
  const reportTitle = RANGE_TITLE[rangeType];
  const periodLabel =
    rangeType === 'all'
      ? `Semua data s.d. ${formatLongDate(range.end)}`
      : startYmd === endYmd
        ? formatLongDate(range.start)
        : `${formatLongDate(range.start)} – ${formatLongDate(range.end)}`;
  const prevLabel = prevStartYmd && prevEndYmd ? formatRange(prevStartYmd, prevEndYmd) : null;
  const showStoreColumn = currentUser.role === UserRole.SuperAdmin && isAllStores;
  const isLoading = reportQuery.isLoading;

  const s: ReportSummary | undefined = report?.summary;
  const p: ReportSummary | null = report?.previous ?? null;
  const net = s ? s.collected - s.expenses : 0;
  const prevNet = p ? p.collected - p.expenses : undefined;
  const itemsRevenue = report?.services.reduce((a, x) => a + x.revenue, 0) ?? 0;
  const hasData = !!s && (s.count > 0 || s.expenseCount > 0 || s.collected !== 0);
  const showSeries = series.rows.length >= 2;
  const showStores = !!report?.stores && report.stores.length >= 2;
  const receivablesShown = showAllReceivables
    ? (report?.receivables ?? [])
    : (report?.receivables ?? []).slice(0, 10);
  const expenseByCategory = (() => {
    const m = new Map<string, number>();
    report?.expenses.forEach((e) => m.set(e.category, (m.get(e.category) ?? 0) + e.amount));
    return [...m.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  })();

  const handlePrint = () => {
    addAuditLog(
      `Mencetak ${reportTitle.toLowerCase()} (${periodLabel}) untuk ${branchLabel}.`,
      !isAllStores ? effectiveStoreId : undefined,
    );
    window.print();
  };

  const handleExport = async () => {
    if (!report || !s) return;
    setExporting(true);
    try {
      const { exportReportToExcel } = await import('../utils/reportExport');
      const slug = branchLabel.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
      await exportReportToExcel(
        {
          title: reportTitle,
          storeLabel: branchLabel,
          periodLabel,
          generatedBy: currentUser.name,
          summary: [
            { label: 'Nilai Transaksi (Omzet)', value: s.gross },
            { label: 'Pendapatan Diterima', value: s.collected },
            { label: 'Piutang (Belum Dibayar)', value: s.receivable },
            { label: 'Total Diskon', value: s.discount },
            { label: 'Total Pengeluaran', value: s.expenses },
            { label: 'Laba Bersih', value: net },
            { label: 'Jumlah Transaksi', value: s.count, isCurrency: false },
            {
              label: 'Rata-rata per Transaksi',
              value: s.count ? Math.round(s.gross / s.count) : 0,
            },
            ...(p
              ? [
                  { label: `Pendapatan periode lalu (${prevLabel})`, value: p.collected },
                  { label: 'Pengeluaran periode lalu', value: p.expenses },
                  { label: 'Laba bersih periode lalu', value: p.collected - p.expenses },
                ]
              : []),
          ],
          seriesLabel: series.granularity === 'day' ? 'Harian' : 'Bulanan',
          series: series.rows.map((r) => ({
            month: r.fullLabel,
            revenue: r.revenue,
            expenses: r.expenses,
            profit: r.profit,
          })),
          stores: report.stores ?? [],
          receivables: report.receivables.map((r) => ({
            invoiceCode: r.invoiceCode ?? r.id.slice(0, 8),
            date: r.createdAt.slice(0, 10),
            customerName: r.customerName,
            total: r.total,
            paid: r.paid,
            outstanding: r.outstanding,
            ageDays: r.ageDays,
          })),
          categories: report.categories,
          services: report.services,
          paymentMethods: report.paymentMethods,
          cashiers: report.cashiers,
          customers: report.customers,
          expenses: report.expenses.map((e) => ({
            date: e.date,
            description: e.description,
            category: e.category,
            storeName: (e.storeId && storeNames[e.storeId]) || '-',
            amount: e.amount,
          })),
        },
        `Laporan_${slug || 'Cabang'}_${startYmd}_${endYmd}.xlsx`,
      );
      addAuditLog(
        `Mengekspor ${reportTitle.toLowerCase()} (${periodLabel}) untuk ${branchLabel} ke Excel.`,
        !isAllStores ? effectiveStoreId : undefined,
      );
      addToast('Laporan berhasil diekspor.', 'success');
    } catch (error) {
      console.error('Gagal mengekspor laporan:', error);
      addToast('Gagal mengekspor laporan. Coba lagi.', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ---------- Kop laporan (cetak) ---------- */}
      <div className="print-only-block">
        <h1 style={{ fontSize: '18pt', fontWeight: 700, margin: 0 }}>{reportTitle}</h1>
        <p style={{ margin: '4px 0 0' }}>{branchLabel}</p>
        <p style={{ margin: '2px 0 0' }}>Periode: {periodLabel}</p>
        <p style={{ margin: '2px 0 12px', fontSize: '9pt', color: '#555' }}>
          Dicetak {new Date().toLocaleString('id-ID')} oleh {currentUser.name}
        </p>
      </div>

      {/* ---------- Header layar ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-4 print-hide">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Laporan Keuangan
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">{branchLabel}</span>
            <span aria-hidden>•</span>
            <CalendarIcon className="h-4 w-4" />
            <span>{periodLabel}</span>
            {prevLabel && <span className="text-xs">(dibanding {prevLabel})</span>}
            {reportQuery.isFetching && !isLoading && (
              <span className="flex items-center gap-1 text-xs">
                <SpinnerIcon className="h-3 w-3 animate-spin" /> Memperbarui…
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={!report || exporting}
            className="btn btn-secondary"
          >
            {exporting ? (
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <DownloadIcon className="mr-2 h-4 w-4" />
            )}
            Ekspor Excel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!report}
            className="btn btn-primary"
          >
            <PrinterIcon className="mr-2 h-4 w-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* ---------- Filter periode ---------- */}
      <div className="flex flex-wrap items-center gap-3 print-hide">
        <div
          role="group"
          aria-label="Pilih periode laporan"
          className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
        >
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              aria-pressed={rangeType === opt.value}
              onClick={() => setRangeType(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                rangeType === opt.value
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {rangeType === 'custom' && (
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="report-custom-start-date" className="sr-only">
              Tanggal mulai
            </label>
            <input
              type="date"
              id="report-custom-start-date"
              name="report-custom-start-date"
              value={customStart}
              max={customEnd || undefined}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-600 dark:bg-slate-700"
              autoComplete="off"
            />
            <span className="text-slate-500">s.d.</span>
            <label htmlFor="report-custom-end-date" className="sr-only">
              Tanggal akhir
            </label>
            <input
              type="date"
              id="report-custom-end-date"
              name="report-custom-end-date"
              value={customEnd}
              min={customStart || undefined}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-600 dark:bg-slate-700"
              autoComplete="off"
            />
            {range.swapped && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                Tanggal mulai setelah tanggal akhir — urutan ditukar otomatis.
              </span>
            )}
          </div>
        )}
      </div>

      {reportQuery.error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
        >
          <span className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5" />
            Gagal memuat data laporan. Periksa koneksi lalu coba lagi.
          </span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => reportQuery.refetch()}
          >
            Coba Lagi
          </button>
        </div>
      ) : isLoading || !report || !s ? (
        <div className="flex h-64 items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
          <SpinnerIcon className="h-5 w-5 animate-spin" /> Memuat data laporan…
        </div>
      ) : (
        <>
          {report.source === 'client' && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 print-hide">
              <AlertTriangleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Mode terbatas: database belum diperbarui, jadi pendapatan dihitung menurut tanggal
                nota dibuat (pelunasan belakangan ikut tanggal nota) dan data diolah di perangkat
                ini. Jalankan migrasi laporan keuangan di database agar angka sesuai tanggal bayar.
              </span>
            </div>
          )}

          {/* ---------- Ringkasan ---------- */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5 print-stat-card-container">
            <StatCard
              icon={DollarSignIcon}
              title="Pendapatan Diterima"
              value={rp(s.collected)}
              hint={`Omzet ${rp(s.gross)}`}
              tone="positive"
              delta={<Delta current={s.collected} previous={p?.collected} />}
            />
            <StatCard
              icon={ClockIcon}
              title="Piutang"
              value={rp(s.receivable)}
              hint={`${s.unpaidCount} nota belum lunas`}
              tone="warning"
              delta={
                <Delta current={s.receivable} previous={p?.receivable} higherIsBetter={false} />
              }
            />
            <StatCard
              icon={TagIcon}
              title="Total Pengeluaran"
              value={rp(s.expenses)}
              hint={`${s.expenseCount} catatan`}
              tone="negative"
              delta={<Delta current={s.expenses} previous={p?.expenses} higherIsBetter={false} />}
            />
            <StatCard
              icon={BarChartIcon}
              title="Laba Bersih"
              value={rp(net)}
              hint={s.collected > 0 ? `Margin ${pct(net, s.collected)}` : 'Margin –'}
              tone={net >= 0 ? 'positive' : 'negative'}
              valueTone={net >= 0 ? undefined : 'negative'}
              delta={<Delta current={net} previous={prevNet} />}
            />
            <StatCard
              icon={PackageIcon}
              title="Jumlah Transaksi"
              value={s.count.toLocaleString('id-ID')}
              hint={`Rata-rata ${rp(s.count ? s.gross / s.count : 0)} / nota`}
              delta={<Delta current={s.count} previous={p?.count} />}
            />
          </div>
          <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
            {report.source === 'server'
              ? 'Pendapatan diterima = uang yang masuk pada periode ini menurut tanggal bayar (termasuk pelunasan nota lama, tanpa kembalian). '
              : 'Pendapatan diterima = pembayaran dari nota yang dibuat pada periode ini (tanpa kembalian). '}
            Omzet, piutang & jumlah transaksi dihitung dari nota yang dibuat pada periode ini. Laba
            bersih = pendapatan diterima − pengeluaran.
          </p>

          {!hasData && (
            <div className="card p-8 text-center text-slate-500 dark:text-slate-400">
              Belum ada transaksi atau pengeluaran pada periode ini.
            </div>
          )}

          {/* ---------- Tren ---------- */}
          {showSeries && hasData && (
            <ReportSection
              title={series.granularity === 'day' ? 'Tren Harian' : 'Tren Bulanan'}
              icon={BarChartIcon}
              subtitle={`Pendapatan diterima dibanding pengeluaran per ${
                series.granularity === 'day' ? 'hari' : 'bulan'
              }`}
            >
              <TrendChart data={series.rows} daily={series.granularity === 'day'} />
              <button
                type="button"
                className="btn btn-ghost btn-sm mt-3 print-hide"
                aria-expanded={seriesTableOpen}
                onClick={() => setSeriesTableOpen((v) => !v)}
              >
                {seriesTableOpen ? 'Sembunyikan' : 'Tampilkan'} tabel{' '}
                {series.granularity === 'day' ? 'harian' : 'bulanan'}
              </button>
              {/* Selalu ikut tercetak walau disembunyikan di layar. */}
              <div className={seriesTableOpen ? '' : 'print-only-block'}>
                <div className="mt-2 overflow-x-auto">
                  <table className={TABLE}>
                    <thead className={THEAD}>
                      <tr>
                        <th className={TH}>{series.granularity === 'day' ? 'Tanggal' : 'Bulan'}</th>
                        <th className={`${TH} text-right`}>Pendapatan</th>
                        <th className={`${TH} text-right`}>Pengeluaran</th>
                        <th className={`${TH} text-right`}>Laba</th>
                      </tr>
                    </thead>
                    <tbody>
                      {series.rows.map((m) => (
                        <tr key={m.key} className={TR}>
                          <td className={NAME}>{m.fullLabel}</td>
                          <td className={NUM}>{rp(m.revenue)}</td>
                          <td className={NUM}>{rp(m.expenses)}</td>
                          <td
                            className={`${NUM} font-semibold ${
                              m.profit < 0 ? 'text-red-600 dark:text-red-400' : ''
                            }`}
                          >
                            {rp(m.profit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className={TFOOT}>
                      <tr>
                        <td className={TD}>Total</td>
                        <td className={NUM}>{rp(s.collected)}</td>
                        <td className={NUM}>{rp(s.expenses)}</td>
                        <td className={NUM}>{rp(net)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </ReportSection>
          )}

          {/* ---------- Per cabang ---------- */}
          {showStores && report.stores && (
            <ReportSection
              title="Perbandingan Cabang"
              icon={HomeIcon}
              subtitle="Kinerja setiap cabang pada periode ini"
            >
              <div className="overflow-x-auto">
                <table className={TABLE}>
                  <thead className={THEAD}>
                    <tr>
                      <th className={TH}>Cabang</th>
                      <th className={`${TH} text-center`}>Transaksi</th>
                      <th className={`${TH} text-right`}>Omzet</th>
                      <th className={`${TH} text-right`}>Pendapatan</th>
                      <th className={`${TH} text-right`}>Pengeluaran</th>
                      <th className={`${TH} text-right`}>Laba Bersih</th>
                      <th className={`${TH} w-20 text-right`}>Porsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.stores.map((st) => (
                      <tr key={st.storeId ?? 'none'} className={TR}>
                        <td className={NAME}>
                          {(st.storeId && storeNames[st.storeId]) || st.name}
                          <ShareBar
                            value={st.collected}
                            max={report.stores?.[0]?.collected ?? 0}
                            className="bg-green-600"
                          />
                        </td>
                        <td className={`${TD} text-center tabular-nums`}>{st.count}</td>
                        <td className={NUM}>{rp(st.gross)}</td>
                        <td className={NUM}>{rp(st.collected)}</td>
                        <td className={NUM}>{rp(st.expenses)}</td>
                        <td
                          className={`${NUM} font-semibold ${
                            st.net < 0 ? 'text-red-600 dark:text-red-400' : ''
                          }`}
                        >
                          {rp(st.net)}
                        </td>
                        <td className={NUM}>{pct(st.collected, s.collected)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ReportSection>
          )}

          {/* ---------- Kategori & metode bayar ---------- */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReportSection
              title="Pendapatan per Kategori"
              icon={BarChartIcon}
              subtitle="Berdasarkan nilai item nota"
            >
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th className={TH}>Kategori</th>
                    <th className={`${TH} text-right`}>Pendapatan</th>
                    <th className={`${TH} w-20 text-right`}>Porsi</th>
                  </tr>
                </thead>
                <tbody>
                  {report.categories.length > 0 ? (
                    report.categories.map((c) => (
                      <tr key={c.category} className={TR}>
                        <td className={NAME}>
                          {c.category}
                          <ShareBar value={c.revenue} max={report.categories[0]?.revenue ?? 0} />
                        </td>
                        <td className={NUM}>{rp(c.revenue)}</td>
                        <td className={NUM}>{pct(c.revenue, itemsRevenue)}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow colSpan={3}>Tidak ada data pendapatan.</EmptyRow>
                  )}
                </tbody>
              </table>
            </ReportSection>

            <ReportSection
              title="Metode Pembayaran"
              icon={DollarSignIcon}
              subtitle="Uang diterima menurut metode bayar"
            >
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th className={TH}>Metode</th>
                    <th className={`${TH} text-center`}>Nota</th>
                    <th className={`${TH} text-right`}>Diterima</th>
                  </tr>
                </thead>
                <tbody>
                  {report.paymentMethods.length > 0 ? (
                    report.paymentMethods.map((m) => (
                      <tr key={m.method} className={TR}>
                        <td className={NAME}>
                          {m.method}
                          <ShareBar
                            value={m.amount}
                            max={report.paymentMethods[0]?.amount ?? 0}
                            className="bg-green-600"
                          />
                        </td>
                        <td className={`${TD} text-center tabular-nums`}>{m.count}</td>
                        <td className={NUM}>{rp(m.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow colSpan={3}>Belum ada pembayaran diterima.</EmptyRow>
                  )}
                </tbody>
              </table>
            </ReportSection>
          </div>

          {/* ---------- Piutang ---------- */}
          <ReportSection
            title="Daftar Piutang"
            icon={ClockIcon}
            subtitle="Nota periode ini yang belum lunas, dari yang paling lama"
          >
            <div className="overflow-x-auto">
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th className={TH}>Nota</th>
                    <th className={TH}>Tanggal</th>
                    <th className={TH}>Pelanggan</th>
                    <th className={`${TH} text-right`}>Total</th>
                    <th className={`${TH} text-right`}>Sisa</th>
                    <th className={`${TH} text-right`}>Umur</th>
                  </tr>
                </thead>
                <tbody>
                  {receivablesShown.length > 0 ? (
                    receivablesShown.map((r) => {
                      const created = new Date(r.createdAt);
                      return (
                        <tr key={r.id} className={TR}>
                          <td className={NAME}>
                            <Link
                              to={`/transactions/${r.id}/details`}
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            >
                              {r.invoiceCode || r.id.slice(0, 8)}
                            </Link>
                          </td>
                          <td className={`${TD} whitespace-nowrap tabular-nums`}>
                            {isNaN(created.getTime()) ? '-' : formatShortDate(created)}
                          </td>
                          <td className={TD}>{r.customerName}</td>
                          <td className={NUM}>{rp(r.total)}</td>
                          <td className={`${NUM} font-semibold`}>{rp(r.outstanding)}</td>
                          <td className={NUM}>
                            <span
                              className={`badge ${
                                r.ageDays > 30
                                  ? 'badge-danger'
                                  : r.ageDays > 7
                                    ? 'badge-warning'
                                    : 'badge-neutral'
                              }`}
                            >
                              {r.ageDays} hari
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <EmptyRow colSpan={6}>Semua nota periode ini sudah lunas.</EmptyRow>
                  )}
                </tbody>
                {report.receivables.length > 0 && (
                  <tfoot className={TFOOT}>
                    <tr>
                      <td colSpan={4} className={`${TD} text-right`}>
                        Total Piutang ({s.unpaidCount} nota)
                      </td>
                      <td className={NUM}>{rp(s.receivable)}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {report.receivables.length > 10 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm mt-2 print-hide"
                onClick={() => setShowAllReceivables((v) => !v)}
              >
                {showAllReceivables
                  ? 'Tampilkan lebih sedikit'
                  : `Tampilkan semua (${report.receivables.length}${
                      s.unpaidCount > report.receivables.length ? ` dari ${s.unpaidCount}` : ''
                    })`}
              </button>
            )}
          </ReportSection>

          {/* ---------- Layanan & pelanggan teratas ---------- */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ReportSection title="5 Layanan Terlaris" icon={PackageIcon}>
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th className={`${TH} w-10`}>#</th>
                    <th className={TH}>Layanan</th>
                    <th className={`${TH} text-right`}>Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {report.services.filter((x) => x.revenue > 0).length > 0 ? (
                    report.services
                      .filter((x) => x.revenue > 0)
                      .slice(0, 5)
                      .map((x, i) => (
                        <tr key={x.serviceId} className={TR}>
                          <td className={`${TD} tabular-nums text-slate-400`}>{i + 1}</td>
                          <td className={NAME}>{x.name}</td>
                          <td className={NUM}>{rp(x.revenue)}</td>
                        </tr>
                      ))
                  ) : (
                    <EmptyRow colSpan={3}>Tidak ada data layanan.</EmptyRow>
                  )}
                </tbody>
              </table>
            </ReportSection>

            <ReportSection title="5 Pelanggan Teratas" icon={UsersIcon}>
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th className={`${TH} w-10`}>#</th>
                    <th className={TH}>Pelanggan</th>
                    <th className={`${TH} text-center`}>Nota</th>
                    <th className={`${TH} text-right`}>Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {report.customers.length > 0 ? (
                    report.customers.map((c, i) => (
                      <tr key={c.customerId} className={TR}>
                        <td className={`${TD} tabular-nums text-slate-400`}>{i + 1}</td>
                        <td className={NAME}>{c.name}</td>
                        <td className={`${TD} text-center tabular-nums`}>{c.count}</td>
                        <td className={NUM}>{rp(c.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow colSpan={4}>Tidak ada data pelanggan.</EmptyRow>
                  )}
                </tbody>
              </table>
            </ReportSection>
          </div>

          {/* ---------- Rincian per layanan ---------- */}
          <ReportSection title="Rincian Pendapatan per Layanan" icon={PackageIcon}>
            <div className="overflow-x-auto">
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th className={TH}>Layanan</th>
                    <th className={TH}>Kategori</th>
                    <th className={`${TH} text-right`}>Terjual</th>
                    <th className={`${TH} text-right`}>Pendapatan</th>
                    <th className={`${TH} w-20 text-right`}>Porsi</th>
                  </tr>
                </thead>
                <tbody>
                  {report.services.length > 0 ? (
                    report.services.map((x) => (
                      <tr key={x.serviceId} className={TR}>
                        <td className={NAME}>{x.name}</td>
                        <td className={TD}>{x.category}</td>
                        <td className={NUM}>
                          {x.quantity.toLocaleString('id-ID')} {x.unit}
                        </td>
                        <td className={NUM}>{rp(x.revenue)}</td>
                        <td className={NUM}>{pct(x.revenue, itemsRevenue)}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow colSpan={5}>Tidak ada data pendapatan layanan.</EmptyRow>
                  )}
                </tbody>
                {report.services.length > 0 && (
                  <tfoot className={TFOOT}>
                    <tr>
                      <td colSpan={3} className={`${TD} text-right`}>
                        Total
                      </td>
                      <td className={NUM}>{rp(itemsRevenue)}</td>
                      <td className={`${TD} text-right`}>100%</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
            {s.discount > 0 && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Nilai item sebelum diskon nota. Total diskon periode ini: {rp(s.discount)}.
              </p>
            )}
          </ReportSection>

          {/* ---------- Kasir ---------- */}
          <ReportSection title="Performa Kasir" icon={UsersIcon}>
            <div className="overflow-x-auto">
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th className={TH}>Kasir</th>
                    <th className={`${TH} text-center`}>Transaksi</th>
                    <th className={`${TH} text-right`}>Nilai Transaksi</th>
                    <th className={`${TH} w-20 text-right`}>Porsi</th>
                  </tr>
                </thead>
                <tbody>
                  {report.cashiers.length > 0 ? (
                    report.cashiers.map((c) => (
                      <tr key={c.userId} className={TR}>
                        <td className={NAME}>{c.name}</td>
                        <td className={`${TD} text-center tabular-nums`}>{c.transactionCount}</td>
                        <td className={NUM}>{rp(c.totalRevenue)}</td>
                        <td className={NUM}>{pct(c.totalRevenue, s.gross)}</td>
                      </tr>
                    ))
                  ) : (
                    <EmptyRow colSpan={4}>Tidak ada data performa.</EmptyRow>
                  )}
                </tbody>
              </table>
            </div>
          </ReportSection>

          {/* ---------- Pengeluaran ---------- */}
          <ReportSection
            title="Rincian Pengeluaran"
            icon={TagIcon}
            subtitle="Termasuk gaji, pembelian dan pemeliharaan aset"
          >
            {expenseByCategory.length > 0 && (
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 print-chart-hide">
                {expenseByCategory.map((c) => (
                  <div
                    key={c.category}
                    className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
                  >
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-slate-700 dark:text-slate-200">
                        {c.category}
                      </span>
                      <span className="text-xs text-slate-500">{pct(c.amount, s.expenses)}</span>
                    </div>
                    <p className="font-semibold tabular-nums text-slate-900 dark:text-white">
                      {rp(c.amount)}
                    </p>
                    <ShareBar
                      value={c.amount}
                      max={expenseByCategory[0]?.amount ?? 0}
                      className="bg-red-500"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className={TABLE}>
                <thead className={THEAD}>
                  <tr>
                    <th className={TH}>Tanggal</th>
                    <th className={TH}>Deskripsi</th>
                    <th className={TH}>Kategori</th>
                    {showStoreColumn && <th className={TH}>Cabang</th>}
                    <th className={`${TH} text-right`}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.length > 0 ? (
                    report.expenses.map((e) => {
                      const d = parseYmd(e.date);
                      return (
                        <tr key={e.id} className={TR}>
                          <td className={`${TD} whitespace-nowrap tabular-nums`}>
                            {d ? formatShortDate(d) : e.date}
                          </td>
                          <td className={NAME}>{e.description}</td>
                          <td className={TD}>
                            <span
                              className={`badge ${
                                e.category === 'Pembelian Aset'
                                  ? 'badge-info'
                                  : e.category === 'Pemeliharaan Aset'
                                    ? 'badge-warning'
                                    : 'badge-neutral'
                              }`}
                            >
                              {e.category}
                            </span>
                          </td>
                          {showStoreColumn && (
                            <td className={TD}>{(e.storeId && storeNames[e.storeId]) || '-'}</td>
                          )}
                          <td className={NUM}>{rp(e.amount)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <EmptyRow colSpan={showStoreColumn ? 5 : 4}>
                      Tidak ada data pengeluaran.
                    </EmptyRow>
                  )}
                </tbody>
                <tfoot className={TFOOT}>
                  <tr>
                    <td colSpan={showStoreColumn ? 4 : 3} className={`${TD} text-right`}>
                      Total Pengeluaran
                    </td>
                    <td className={NUM}>{rp(s.expenses)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </ReportSection>

          {/* ---------- Tanda tangan (cetak) ---------- */}
          <div className="print-only-block" style={{ marginTop: '32px', pageBreakInside: 'avoid' }}>
            <table style={{ width: '100%', textAlign: 'center', fontSize: '10pt' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%' }}>Dibuat oleh,</td>
                  <td style={{ width: '50%' }}>Disetujui oleh,</td>
                </tr>
                <tr>
                  <td style={{ height: '64px' }} />
                  <td />
                </tr>
                <tr>
                  <td>( {currentUser.name} )</td>
                  <td>( ______________________ )</td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;

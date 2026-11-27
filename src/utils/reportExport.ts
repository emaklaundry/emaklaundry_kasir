// src/utils/reportExport.ts
// Ekspor Laporan Keuangan ke Excel (multi-sheet). ExcelJS dimuat dinamis agar tidak
// membebani bundle awal.

import type ExcelJS from 'exceljs';

export interface ReportExportData {
  title: string;
  storeLabel: string;
  periodLabel: string;
  generatedBy: string;
  summary: { label: string; value: number; isCurrency?: boolean }[];
  /** Deret harian/bulanan; seriesLabel = judul kolom & nama sheet ('Harian' / 'Bulanan'). */
  seriesLabel: string;
  series: { month: string; revenue: number; expenses: number; profit: number }[];
  stores: {
    name: string;
    count: number;
    gross: number;
    collected: number;
    expenses: number;
    net: number;
  }[];
  receivables: {
    invoiceCode: string;
    date: string;
    customerName: string;
    total: number;
    paid: number;
    outstanding: number;
    ageDays: number;
  }[];
  categories: { category: string; revenue: number }[];
  services: { name: string; category: string; quantity: number; unit: string; revenue: number }[];
  paymentMethods: { method: string; count: number; amount: number }[];
  cashiers: { name: string; transactionCount: number; totalRevenue: number }[];
  customers: { name: string; total: number }[];
  expenses: {
    date: string;
    description: string;
    category: string;
    storeName: string;
    amount: number;
  }[];
}

const HEADER_FILL = 'FF2563EB';
const HEADER_FONT = 'FFFFFFFF';
const RUPIAH_FORMAT = '"Rp" #,##0;[Red]-"Rp" #,##0';

type Column = { header: string; key: string; width: number; currency?: boolean };

function addTableSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Column[],
  rows: Record<string, string | number>[],
  totals?: Record<string, string | number>,
) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = columns.map(({ header, key, width }) => ({ header, key, width }));

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: HEADER_FONT } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  header.alignment = { vertical: 'middle', horizontal: 'center' };
  header.height = 22;

  rows.forEach((r) => sheet.addRow(r));
  if (totals) {
    const totalRow = sheet.addRow(totals);
    totalRow.font = { bold: true };
    totalRow.border = { top: { style: 'thin' } };
  }

  columns.forEach((c, i) => {
    if (c.currency) sheet.getColumn(i + 1).numFmt = RUPIAH_FORMAT;
  });
  return sheet;
}

export async function exportReportToExcel(data: ReportExportData, fileName: string) {
  const mod = await import('exceljs');
  const ExcelJSModule = (mod.default || mod) as typeof ExcelJS;
  const workbook = new ExcelJSModule.Workbook();
  workbook.created = new Date();

  // --- Ringkasan ---
  const summary = workbook.addWorksheet('Ringkasan');
  summary.columns = [{ width: 32 }, { width: 24 }];
  summary.addRow([data.title]).font = { bold: true, size: 14 };
  summary.addRow([data.storeLabel]);
  summary.addRow(['Periode', data.periodLabel]);
  summary.addRow([
    'Dibuat',
    `${new Date().toLocaleString('id-ID')}${data.generatedBy ? ` oleh ${data.generatedBy}` : ''}`,
  ]);
  summary.addRow([]);
  data.summary.forEach((s) => {
    const row = summary.addRow([s.label, s.value]);
    if (s.isCurrency !== false) row.getCell(2).numFmt = RUPIAH_FORMAT;
  });

  if (data.series.length > 0) {
    addTableSheet(
      workbook,
      data.seriesLabel,
      [
        { header: data.seriesLabel === 'Harian' ? 'Tanggal' : 'Bulan', key: 'month', width: 18 },
        { header: 'Pendapatan', key: 'revenue', width: 18, currency: true },
        { header: 'Pengeluaran', key: 'expenses', width: 18, currency: true },
        { header: 'Laba', key: 'profit', width: 18, currency: true },
      ],
      data.series,
      {
        month: 'TOTAL',
        revenue: data.series.reduce((a, m) => a + m.revenue, 0),
        expenses: data.series.reduce((a, m) => a + m.expenses, 0),
        profit: data.series.reduce((a, m) => a + m.profit, 0),
      },
    );
  }

  if (data.stores.length > 0) {
    addTableSheet(
      workbook,
      'Per Cabang',
      [
        { header: 'Cabang', key: 'name', width: 26 },
        { header: 'Transaksi', key: 'count', width: 12 },
        { header: 'Omzet', key: 'gross', width: 18, currency: true },
        { header: 'Pendapatan Diterima', key: 'collected', width: 20, currency: true },
        { header: 'Pengeluaran', key: 'expenses', width: 18, currency: true },
        { header: 'Laba Bersih', key: 'net', width: 18, currency: true },
      ],
      data.stores,
    );
  }

  if (data.receivables.length > 0) {
    addTableSheet(
      workbook,
      'Piutang',
      [
        { header: 'No. Nota', key: 'invoiceCode', width: 18 },
        { header: 'Tanggal', key: 'date', width: 14 },
        { header: 'Pelanggan', key: 'customerName', width: 26 },
        { header: 'Total', key: 'total', width: 16, currency: true },
        { header: 'Dibayar', key: 'paid', width: 16, currency: true },
        { header: 'Sisa', key: 'outstanding', width: 16, currency: true },
        { header: 'Umur (hari)', key: 'ageDays', width: 12 },
      ],
      data.receivables,
      {
        invoiceCode: 'TOTAL',
        date: '',
        customerName: '',
        total: data.receivables.reduce((a, r) => a + r.total, 0),
        paid: data.receivables.reduce((a, r) => a + r.paid, 0),
        outstanding: data.receivables.reduce((a, r) => a + r.outstanding, 0),
        ageDays: '',
      },
    );
  }

  addTableSheet(
    workbook,
    'Kategori',
    [
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Pendapatan', key: 'revenue', width: 18, currency: true },
    ],
    data.categories,
  );

  addTableSheet(
    workbook,
    'Layanan',
    [
      { header: 'Layanan', key: 'name', width: 32 },
      { header: 'Kategori', key: 'category', width: 14 },
      { header: 'Terjual', key: 'quantity', width: 10 },
      { header: 'Satuan', key: 'unit', width: 10 },
      { header: 'Pendapatan', key: 'revenue', width: 18, currency: true },
    ],
    data.services,
  );

  addTableSheet(
    workbook,
    'Metode Bayar',
    [
      { header: 'Metode', key: 'method', width: 18 },
      { header: 'Jumlah Nota', key: 'count', width: 14 },
      { header: 'Diterima', key: 'amount', width: 18, currency: true },
    ],
    data.paymentMethods,
  );

  addTableSheet(
    workbook,
    'Kasir',
    [
      { header: 'Kasir', key: 'name', width: 26 },
      { header: 'Transaksi', key: 'transactionCount', width: 12 },
      { header: 'Nilai Transaksi', key: 'totalRevenue', width: 18, currency: true },
    ],
    data.cashiers,
  );

  addTableSheet(
    workbook,
    'Pelanggan Teratas',
    [
      { header: 'Pelanggan', key: 'name', width: 28 },
      { header: 'Total Belanja', key: 'total', width: 18, currency: true },
    ],
    data.customers,
  );

  addTableSheet(
    workbook,
    'Pengeluaran',
    [
      { header: 'Tanggal', key: 'date', width: 14 },
      { header: 'Deskripsi', key: 'description', width: 42 },
      { header: 'Kategori', key: 'category', width: 20 },
      { header: 'Cabang', key: 'storeName', width: 20 },
      { header: 'Jumlah', key: 'amount', width: 18, currency: true },
    ],
    data.expenses,
    {
      date: 'TOTAL',
      description: '',
      category: '',
      storeName: '',
      amount: data.expenses.reduce((a, e) => a + e.amount, 0),
    },
  );

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

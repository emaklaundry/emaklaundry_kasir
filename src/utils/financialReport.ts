// src/utils/financialReport.ts
// Data halaman Laporan. Sumber utama: RPC `get_financial_report` (dihitung di
// database, pendapatan menurut TANGGAL BAYAR dari tabel transaction_payments).
// Bila migrasi database belum dijalankan, laporan dihitung di browser dari tabel
// mentah (mode cadangan; pendapatan menurut tanggal nota dibuat).

import { supabase } from './supabaseClient';
import { looseToYmd, parseYmd } from './reportDates';

export interface ReportSummary {
  gross: number;
  discount: number;
  count: number;
  receivable: number;
  unpaidCount: number;
  collected: number;
  expenses: number;
  expenseCount: number;
}

export interface ReportDaily {
  date: string;
  revenue: number;
  expenses: number;
  gross: number;
  count: number;
}

export interface ReportService {
  serviceId: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  revenue: number;
}

export interface ReportStoreRow {
  storeId: string | null;
  name: string;
  count: number;
  gross: number;
  collected: number;
  expenses: number;
  net: number;
}

export interface ReportReceivable {
  id: string;
  invoiceCode: string | null;
  customerName: string;
  total: number;
  paid: number;
  outstanding: number;
  createdAt: string;
  ageDays: number;
  orderStatus: string;
}

export interface ReportExpenseLine {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  storeId: string | null;
}

export interface ReportData {
  source: 'server' | 'client';
  summary: ReportSummary;
  previous: ReportSummary | null;
  daily: ReportDaily[];
  services: ReportService[];
  categories: { category: string; revenue: number }[];
  paymentMethods: { method: string; count: number; amount: number }[];
  cashiers: { userId: string; name: string; transactionCount: number; totalRevenue: number }[];
  customers: { customerId: string; name: string; count: number; total: number }[];
  stores: ReportStoreRow[] | null;
  receivables: ReportReceivable[];
  expenses: ReportExpenseLine[];
}

export interface ReportParams {
  /** null = semua cabang */
  storeId: string | null;
  startYmd: string;
  endYmd: string;
  prevStartYmd: string | null;
  prevEndYmd: string | null;
}

// ---------------------------------------------------------------------------
// Normalisasi (numeric Postgres bisa datang sebagai string)
// ---------------------------------------------------------------------------

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const str = (v: unknown, fallback = '') => (v === null || v === undefined ? fallback : String(v));
const arr = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? (v as Record<string, unknown>[]) : [];

const normalizeSummary = (s: unknown): ReportSummary => {
  const o = (s ?? {}) as Record<string, unknown>;
  return {
    gross: num(o.gross),
    discount: num(o.discount),
    count: num(o.count),
    receivable: num(o.receivable),
    unpaidCount: num(o.unpaidCount),
    collected: num(o.collected),
    expenses: num(o.expenses),
    expenseCount: num(o.expenseCount),
  };
};

export function normalizeReport(raw: unknown, source: ReportData['source']): ReportData {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    source,
    summary: normalizeSummary(r.summary),
    previous: r.previous ? normalizeSummary(r.previous) : null,
    daily: arr(r.daily).map((d) => ({
      date: str(d.date).slice(0, 10),
      revenue: num(d.revenue),
      expenses: num(d.expenses),
      gross: num(d.gross),
      count: num(d.count),
    })),
    services: arr(r.services).map((s) => ({
      serviceId: str(s.serviceId),
      name: str(s.name, 'Layanan Dihapus'),
      category: str(s.category, '-'),
      unit: str(s.unit, 'unit'),
      quantity: num(s.quantity),
      revenue: num(s.revenue),
    })),
    categories: arr(r.categories).map((c) => ({
      category: str(c.category, 'Lainnya'),
      revenue: num(c.revenue),
    })),
    paymentMethods: arr(r.paymentMethods).map((m) => ({
      method: str(m.method, 'Tidak Tercatat'),
      count: num(m.count),
      amount: num(m.amount),
    })),
    cashiers: arr(r.cashiers).map((c) => ({
      userId: str(c.userId),
      name: str(c.name, 'Pengguna Tidak Dikenal'),
      transactionCount: num(c.transactionCount),
      totalRevenue: num(c.totalRevenue),
    })),
    customers: arr(r.customers).map((c) => ({
      customerId: str(c.customerId),
      name: str(c.name, 'Umum'),
      count: num(c.count),
      total: num(c.total),
    })),
    stores: Array.isArray(r.stores)
      ? arr(r.stores).map((s) => ({
          storeId: s.storeId ? str(s.storeId) : null,
          name: str(s.name, 'Tanpa Cabang'),
          count: num(s.count),
          gross: num(s.gross),
          collected: num(s.collected),
          expenses: num(s.expenses),
          net: num(s.net),
        }))
      : null,
    receivables: arr(r.receivables).map((x) => ({
      id: str(x.id),
      invoiceCode: x.invoiceCode ? str(x.invoiceCode) : null,
      customerName: str(x.customerName, 'Umum'),
      total: num(x.total),
      paid: num(x.paid),
      outstanding: num(x.outstanding),
      createdAt: str(x.createdAt),
      ageDays: num(x.ageDays),
      orderStatus: str(x.orderStatus),
    })),
    expenses: arr(r.expenses).map((e) => ({
      id: str(e.id),
      date: str(e.date).slice(0, 10),
      description: str(e.description),
      category: str(e.category, 'Lainnya'),
      amount: num(e.amount),
      storeId: e.storeId ? str(e.storeId) : null,
    })),
  };
}

// ---------------------------------------------------------------------------
// Sumber utama: RPC
// ---------------------------------------------------------------------------

/** Kode error yang berarti migrasi laporan belum dijalankan di database. */
const MISSING_CODES = new Set(['PGRST202', '42883', '42P01']);

type RpcResult = { data: unknown; error: { code?: string; message: string } | null };
type UntypedRpc = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<RpcResult> };

export async function fetchFinancialReport(
  params: ReportParams,
  storeNames: Record<string, string> = {},
): Promise<ReportData> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  // Fungsi belum ada di tipe hasil generate (src/types/supabase.ts).
  const { data, error } = await (supabase as unknown as UntypedRpc).rpc('get_financial_report', {
    p_store_id: params.storeId,
    p_start: params.startYmd,
    p_end: params.endYmd,
    p_prev_start: params.prevStartYmd,
    p_prev_end: params.prevEndYmd,
    p_tz: tz,
  });
  if (error) {
    if (error.code && MISSING_CODES.has(error.code)) {
      return buildReportClientSide(params, storeNames);
    }
    throw error;
  }
  return normalizeReport(data, 'server');
}

// ---------------------------------------------------------------------------
// Mode cadangan: hitung di browser
// ---------------------------------------------------------------------------

const PAGE_SIZE = 1000;

type Row = Record<string, unknown>;

// Builder query longgar: tabel-tabel ini dibaca generik, tipe hasil generate tidak dipakai.
interface LooseQuery extends PromiseLike<{ data: unknown; error: unknown }> {
  gte(column: string, value: string): LooseQuery;
  lte(column: string, value: string): LooseQuery;
  eq(column: string, value: string): LooseQuery;
  order(column: string, opts: { ascending: boolean }): LooseQuery;
  range(from: number, to: number): LooseQuery;
}
const from = (table: string) =>
  (supabase as unknown as { from: (t: string) => { select: (c: string) => LooseQuery } }).from(
    table,
  );

async function fetchPaged(
  table: string,
  columns: string,
  apply: (q: LooseQuery) => LooseQuery,
  orderBy: string,
): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await apply(from(table).select(columns))
      .order(orderBy, { ascending: true })
      .order('id', { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    const rows = (data ?? []) as Row[];
    out.push(...rows);
    if (rows.length < PAGE_SIZE) break;
  }
  return out;
}

const collectedOf = (t: Row) =>
  t.paymentStatus === 'Lunas'
    ? Math.max(num(t.total), 0)
    : Math.max(0, Math.min(num(t.amountPaid), num(t.total)));

const localDayStart = (ymd: string) => parseYmd(ymd) ?? new Date(1970, 0, 1);
const localDayEnd = (ymd: string) => {
  const d = parseYmd(ymd) ?? new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

async function fetchTransactions(storeId: string | null, startYmd: string, endYmd: string) {
  return fetchPaged(
    'transactions',
    'id,"invoiceCode","customerId",items,discount,total,"amountPaid","paymentStatus","orderStatus","paymentMethod","createdAt","createdByUserId","storeId"',
    (q) => {
      let x = q
        .gte('createdAt', localDayStart(startYmd).toISOString())
        .lte('createdAt', localDayEnd(endYmd).toISOString());
      if (storeId) x = x.eq('storeId', storeId);
      return x;
    },
    'createdAt',
  );
}

async function fetchExpenseLines(
  storeId: string | null,
  startYmd: string,
  endYmd: string,
): Promise<ReportExpenseLine[]> {
  const raw = await fetchPaged(
    'expenses',
    'id,date,description,category,amount,"storeId"',
    (q) => {
      let x = q.gte('date', startYmd).lte('date', endYmd);
      if (storeId) x = x.eq('storeId', storeId);
      return x;
    },
    'date',
  );
  const lines: ReportExpenseLine[] = raw.map((e) => ({
    id: str(e.id),
    date: looseToYmd(e.date) ?? str(e.date).slice(0, 10),
    description: str(e.description),
    category: str(e.category, 'Lainnya'),
    amount: num(e.amount),
    storeId: e.storeId ? str(e.storeId) : null,
  }));

  let assetQuery = from('assets').select(
    'id,name,"purchaseDate","purchaseCost","maintenanceHistory","storeId"',
  );
  if (storeId) assetQuery = assetQuery.eq('storeId', storeId);
  const { data: assets, error } = await assetQuery;
  if (error) throw error;

  const recorded = (date: string, ...descs: string[]) =>
    lines.some((e) => e.date === date && descs.includes(e.description));

  const extra: ReportExpenseLine[] = [];
  ((assets ?? []) as unknown as Row[]).forEach((a) => {
    const name = str(a.name);
    const sid = a.storeId ? str(a.storeId) : null;
    const pDate = looseToYmd(a.purchaseDate);
    const pCost = num(a.purchaseCost);
    const pDesc = `Pembelian Aset: ${name}`;
    if (pDate && pDate >= startYmd && pDate <= endYmd && pCost > 0 && !recorded(pDate, pDesc)) {
      extra.push({
        id: `asset-purchase-${a.id}`,
        date: pDate,
        description: pDesc,
        category: 'Pembelian Aset',
        amount: pCost,
        storeId: sid,
      });
    }
    let history: Row[] = [];
    if (Array.isArray(a.maintenanceHistory)) history = a.maintenanceHistory as Row[];
    else if (typeof a.maintenanceHistory === 'string') {
      try {
        history = JSON.parse(a.maintenanceHistory);
      } catch {
        history = [];
      }
    }
    history.forEach((log, i) => {
      const d = looseToYmd(log.date);
      const cost = num(log.cost);
      if (!d || d < startYmd || d > endYmd || cost <= 0) return;
      const desc = `Perawatan Aset: ${name} (${str(log.description)})`;
      const quickDesc = `Quick Maintenance: ${name} (${str(log.description)})`;
      if (recorded(d, desc, quickDesc)) return;
      extra.push({
        id: `asset-maint-${a.id}-${i + 1}`,
        date: d,
        description: desc,
        category: 'Pemeliharaan Aset',
        amount: cost,
        storeId: sid,
      });
    });
  });
  return [...lines, ...extra];
}

function summarize(txs: Row[], expenses: ReportExpenseLine[]): ReportSummary {
  let gross = 0;
  let discount = 0;
  let collected = 0;
  let unpaidCount = 0;
  txs.forEach((t) => {
    const paid = collectedOf(t);
    gross += num(t.total);
    discount += num(t.discount);
    collected += paid;
    if (num(t.total) - paid > 0.5) unpaidCount++;
  });
  return {
    gross,
    discount,
    count: txs.length,
    receivable: Math.max(gross - collected, 0),
    unpaidCount,
    collected,
    expenses: expenses.reduce((a, e) => a + e.amount, 0),
    expenseCount: expenses.length,
  };
}

export async function buildReportClientSide(
  params: ReportParams,
  storeNames: Record<string, string> = {},
): Promise<ReportData> {
  const { storeId, startYmd, endYmd, prevStartYmd, prevEndYmd } = params;
  const [txs, expenses, services, profiles, customers, prev] = await Promise.all([
    fetchTransactions(storeId, startYmd, endYmd),
    fetchExpenseLines(storeId, startYmd, endYmd),
    from('services').select('id,name,category,unit'),
    from('profiles').select('id,name'),
    from('customers').select('id,name'),
    prevStartYmd && prevEndYmd
      ? Promise.all([
          fetchTransactions(storeId, prevStartYmd, prevEndYmd),
          fetchExpenseLines(storeId, prevStartYmd, prevEndYmd),
        ])
      : Promise.resolve(null),
  ]);

  const mapOf = (res: { data: unknown }) => {
    const m = new Map<string, Row>();
    ((res.data ?? []) as Row[]).forEach((r) => m.set(str(r.id), r));
    return m;
  };
  const svcMap = mapOf(services);
  const userMap = mapOf(profiles);
  const custMap = mapOf(customers);
  const dayOf = (t: Row) => looseToYmd(t.createdAt) ?? '';
  const todayMs = new Date().setHours(0, 0, 0, 0);

  // Harian
  const daily = new Map<string, ReportDaily>();
  const dayRow = (d: string) => {
    let r = daily.get(d);
    if (!r) {
      r = { date: d, revenue: 0, expenses: 0, gross: 0, count: 0 };
      daily.set(d, r);
    }
    return r;
  };
  txs.forEach((t) => {
    const r = dayRow(dayOf(t));
    r.revenue += collectedOf(t);
    r.gross += num(t.total);
    r.count++;
  });
  expenses.forEach((e) => (dayRow(e.date).expenses += e.amount));

  // Layanan & kategori
  const svc = new Map<string, ReportService & { group: string }>();
  txs.forEach((t) =>
    arr(t.items).forEach((it) => {
      const id = str(it.serviceId);
      const s = svcMap.get(id);
      let row = svc.get(id);
      if (!row) {
        const unit = str(s?.unit ?? it.unit, 'unit');
        row = {
          serviceId: id,
          name: str(s?.name ?? it.serviceName, 'Layanan Dihapus'),
          category: str(s?.category, '-'),
          unit,
          quantity: 0,
          revenue: 0,
          group: s?.category
            ? str(s.category)
            : it.unit === 'kg'
              ? 'Kiloan'
              : it.unit === 'm2'
                ? 'Karpet'
                : 'Lainnya',
        };
        svc.set(id, row);
      }
      row.quantity += num(it.quantity);
      row.revenue += num(it.subtotal);
    }),
  );
  const catMap = new Map<string, number>();
  svc.forEach((s) => catMap.set(s.group, (catMap.get(s.group) ?? 0) + s.revenue));

  // Metode bayar
  const pm = new Map<string, { count: number; amount: number }>();
  txs.forEach((t) => {
    const paid = collectedOf(t);
    if (paid <= 0) return;
    const k = t.paymentMethod ? str(t.paymentMethod) : 'Tidak Tercatat';
    const v = pm.get(k) ?? { count: 0, amount: 0 };
    v.count++;
    v.amount += paid;
    pm.set(k, v);
  });

  // Kasir & pelanggan
  const cash = new Map<string, ReportData['cashiers'][number]>();
  const cust = new Map<string, ReportData['customers'][number]>();
  txs.forEach((t) => {
    const uid = t.createdByUserId ? str(t.createdByUserId) : '__none__';
    const c =
      cash.get(uid) ??
      ({
        userId: uid,
        name:
          str(userMap.get(uid)?.name) ||
          (uid === '__none__' ? 'Tanpa Kasir' : 'Pengguna Tidak Dikenal'),
        transactionCount: 0,
        totalRevenue: 0,
      } as ReportData['cashiers'][number]);
    c.transactionCount++;
    c.totalRevenue += num(t.total);
    cash.set(uid, c);

    const cid = t.customerId ? str(t.customerId) : '__umum__';
    const cu =
      cust.get(cid) ??
      ({
        customerId: cid,
        name: str(custMap.get(cid)?.name) || (cid === '__umum__' ? 'Umum' : 'Pelanggan Terhapus'),
        count: 0,
        total: 0,
      } as ReportData['customers'][number]);
    cu.count++;
    cu.total += num(t.total);
    cust.set(cid, cu);
  });

  // Per cabang
  let stores: ReportStoreRow[] | null = null;
  if (!storeId) {
    const sm = new Map<string, ReportStoreRow>();
    const sr = (id: string | null) => {
      const k = id ?? '';
      let r = sm.get(k);
      if (!r) {
        r = {
          storeId: id,
          name: (id && storeNames[id]) || (id ? 'Cabang' : 'Tanpa Cabang'),
          count: 0,
          gross: 0,
          collected: 0,
          expenses: 0,
          net: 0,
        };
        sm.set(k, r);
      }
      return r;
    };
    txs.forEach((t) => {
      const r = sr(t.storeId ? str(t.storeId) : null);
      r.count++;
      r.gross += num(t.total);
      r.collected += collectedOf(t);
    });
    expenses.forEach((e) => (sr(e.storeId).expenses += e.amount));
    stores = [...sm.values()]
      .map((r) => ({ ...r, net: r.collected - r.expenses }))
      .sort((a, b) => b.collected - a.collected);
  }

  const receivables: ReportReceivable[] = txs
    .filter((t) => num(t.total) - collectedOf(t) > 0.5)
    .sort((a, b) => str(a.createdAt).localeCompare(str(b.createdAt)))
    .slice(0, 200)
    .map((t) => {
      const created = parseYmd(dayOf(t));
      const cid = t.customerId ? str(t.customerId) : '';
      return {
        id: str(t.id),
        invoiceCode: t.invoiceCode ? str(t.invoiceCode) : null,
        customerName: str(custMap.get(cid)?.name) || (cid ? 'Pelanggan Terhapus' : 'Umum'),
        total: num(t.total),
        paid: collectedOf(t),
        outstanding: num(t.total) - collectedOf(t),
        createdAt: str(t.createdAt),
        ageDays: created ? Math.round((todayMs - created.getTime()) / 86400000) : 0,
        orderStatus: str(t.orderStatus),
      };
    });

  return {
    source: 'client',
    summary: summarize(txs, expenses),
    previous: prev ? summarize(prev[0], prev[1]) : null,
    daily: [...daily.values()].filter((d) => d.date).sort((a, b) => a.date.localeCompare(b.date)),
    services: [...svc.values()]
      .map((s) => ({
        serviceId: s.serviceId,
        name: s.name,
        category: s.category,
        unit: s.unit,
        quantity: Number(s.quantity.toFixed(2)),
        revenue: s.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    categories: [...catMap.entries()]
      .map(([category, revenue]) => ({ category, revenue }))
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue),
    paymentMethods: [...pm.entries()]
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.amount - a.amount),
    cashiers: [...cash.values()].sort((a, b) => b.totalRevenue - a.totalRevenue),
    customers: [...cust.values()].sort((a, b) => b.total - a.total).slice(0, 5),
    stores,
    receivables,
    expenses: expenses.sort((a, b) =>
      a.date === b.date ? a.description.localeCompare(b.description) : a.date < b.date ? 1 : -1,
    ),
  };
}

// src/utils/businessPlan.ts
// Rumus rencana usaha (kalkulator) dan perbandingan rencana vs realisasi.
// Murni TypeScript tanpa efek samping.

import { COST_LINE_LABELS } from '@/config/expenseCategories';
import type { ActualMonth } from './businessTargets';

export interface PlanValues {
  investment: number;
  startDate: string | null;
  kiloan: { kgPerDay: number; price: number };
  satuan: { pcsPerDay: number; price: number };
  shoes: { pairsPerDay: number; price: number };
  carpet: { m2PerMonth: number; price: number };
  costs: { salary: number; rent: number; utilities: number; marketing: number; other: number };
  hpp: {
    kiloanPercent: number;
    satuanPercent: number;
    shoesPercent: number;
    carpetPercent: number;
  };
}

export const DEFAULT_PLAN_VALUES: PlanValues = {
  investment: 160000000,
  startDate: null,
  kiloan: { kgPerDay: 80, price: 9000 },
  satuan: { pcsPerDay: 5, price: 20000 },
  shoes: { pairsPerDay: 3, price: 50000 },
  carpet: { m2PerMonth: 20, price: 20000 },
  costs: { salary: 6000000, rent: 3500000, utilities: 1500000, marketing: 1500000, other: 0 },
  hpp: { kiloanPercent: 25, satuanPercent: 10, shoesPercent: 15, carpetPercent: 10 },
};

export const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

export interface PlanResult {
  revenue: { kiloan: number; satuan: number; shoes: number; carpet: number; total: number };
  hpp: { kiloan: number; satuan: number; shoes: number; carpet: number; total: number };
  costs: {
    hpp: number;
    salary: number;
    rent: number;
    utilities: number;
    marketing: number;
    other: number;
    total: number;
  };
  profit: number;
  margin: number;
  paybackMonths: number | null;
}

export function computePlan(v: PlanValues, daysInMonthCount = 30): PlanResult {
  const kiloan = v.kiloan.kgPerDay * daysInMonthCount * v.kiloan.price;
  const satuan = v.satuan.pcsPerDay * daysInMonthCount * v.satuan.price;
  const shoes = v.shoes.pairsPerDay * daysInMonthCount * v.shoes.price;
  const carpet = v.carpet.m2PerMonth * v.carpet.price;
  const total = kiloan + satuan + shoes + carpet;

  const hKiloan = kiloan * (v.hpp.kiloanPercent / 100);
  const hSatuan = satuan * (v.hpp.satuanPercent / 100);
  const hShoes = shoes * (v.hpp.shoesPercent / 100);
  const hCarpet = carpet * (v.hpp.carpetPercent / 100);
  const hTotal = hKiloan + hSatuan + hShoes + hCarpet;

  const c = v.costs;
  const costTotal = hTotal + c.salary + c.rent + c.utilities + c.marketing + c.other;
  const profit = total - costTotal;
  return {
    revenue: { kiloan, satuan, shoes, carpet, total },
    hpp: { kiloan: hKiloan, satuan: hSatuan, shoes: hShoes, carpet: hCarpet, total: hTotal },
    costs: {
      hpp: hTotal,
      salary: c.salary,
      rent: c.rent,
      utilities: c.utilities,
      marketing: c.marketing,
      other: c.other,
      total: costTotal,
    },
    profit,
    margin: total > 0 ? (profit / total) * 100 : 0,
    paybackMonths: profit > 0 ? v.investment / profit : null,
  };
}

/**
 * Jumlah beberapa rencana cabang. Volume, biaya, investasi dijumlah; harga
 * dirata-rata tertimbang volume. Persen HPP dirata-rata tertimbang omzet
 * (volume x harga) agar HPP total = jumlah HPP per cabang.
 */
export function sumPlanValues(list: PlanValues[]): PlanValues {
  const sum = (f: (p: PlanValues) => number) => list.reduce((a, p) => a + f(p), 0);
  const wavg = (w: (p: PlanValues) => number, x: (p: PlanValues) => number) => {
    const tw = sum(w);
    if (tw > 0) return sum((p) => w(p) * x(p)) / tw;
    return list.length ? sum(x) / list.length : 0;
  };
  const revK = (p: PlanValues) => p.kiloan.kgPerDay * p.kiloan.price;
  const revS = (p: PlanValues) => p.satuan.pcsPerDay * p.satuan.price;
  const revH = (p: PlanValues) => p.shoes.pairsPerDay * p.shoes.price;
  const revC = (p: PlanValues) => p.carpet.m2PerMonth * p.carpet.price;
  return {
    investment: sum((p) => p.investment),
    startDate: null,
    kiloan: {
      kgPerDay: sum((p) => p.kiloan.kgPerDay),
      price: wavg(
        (p) => p.kiloan.kgPerDay,
        (p) => p.kiloan.price,
      ),
    },
    satuan: {
      pcsPerDay: sum((p) => p.satuan.pcsPerDay),
      price: wavg(
        (p) => p.satuan.pcsPerDay,
        (p) => p.satuan.price,
      ),
    },
    shoes: {
      pairsPerDay: sum((p) => p.shoes.pairsPerDay),
      price: wavg(
        (p) => p.shoes.pairsPerDay,
        (p) => p.shoes.price,
      ),
    },
    carpet: {
      m2PerMonth: sum((p) => p.carpet.m2PerMonth),
      price: wavg(
        (p) => p.carpet.m2PerMonth,
        (p) => p.carpet.price,
      ),
    },
    costs: {
      salary: sum((p) => p.costs.salary),
      rent: sum((p) => p.costs.rent),
      utilities: sum((p) => p.costs.utilities),
      marketing: sum((p) => p.costs.marketing),
      other: sum((p) => p.costs.other),
    },
    hpp: {
      kiloanPercent: wavg(revK, (p) => p.hpp.kiloanPercent),
      satuanPercent: wavg(revS, (p) => p.hpp.satuanPercent),
      shoesPercent: wavg(revH, (p) => p.hpp.shoesPercent),
      carpetPercent: wavg(revC, (p) => p.hpp.carpetPercent),
    },
  };
}

// ---------------------------------------------------------------------------
// Tanggal
// ---------------------------------------------------------------------------

const ymParts = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return { y, m, d: d || 1 };
};

export function daysInMonth(monthYmd: string): number {
  const { y, m } = ymParts(monthYmd);
  return new Date(y, m, 0).getDate();
}

export function daysElapsed(monthYmd: string, todayYmd: string): number {
  const a = ymParts(monthYmd);
  const t = ymParts(todayYmd);
  const monthIdx = a.y * 12 + a.m;
  const todayIdx = t.y * 12 + t.m;
  if (todayIdx < monthIdx) return 0;
  if (todayIdx > monthIdx) return daysInMonth(monthYmd);
  return Math.min(t.d, daysInMonth(monthYmd));
}

// ---------------------------------------------------------------------------
// Perbandingan
// ---------------------------------------------------------------------------

export type RowStatus = 'ok' | 'warn' | 'running' | 'none';

export interface ComparisonRow {
  key: string;
  label: string;
  kind: 'currency' | 'perDay' | 'perMonth' | 'percent' | 'months';
  target: number | null;
  targetToDate: number | null;
  actual: number | null;
  diff: number | null;
  status: RowStatus;
  higherIsBetter: boolean;
  note?: string;
}

const TOLERANCE = 0.05;

function judge(actual: number | null, cmp: number | null, higherIsBetter: boolean): RowStatus {
  if (cmp === null) return 'none';
  if (cmp === 0) return !higherIsBetter && actual !== null && actual > 0 ? 'warn' : 'none';
  if (actual === null) return 'warn';
  const slack = TOLERANCE * Math.abs(cmp);
  const ok = higherIsBetter ? actual >= cmp - slack : actual <= cmp + slack;
  return ok ? 'ok' : 'warn';
}

export const CAPEX_NOTE = 'Laba bersih di Laporan = laba operasional − belanja modal';

export function buildComparison(
  plan: PlanValues,
  actual: ActualMonth,
  opts: { monthYmd: string; todayYmd: string },
): ComparisonRow[] {
  const dim = daysInMonth(opts.monthYmd);
  const el = daysElapsed(opts.monthYmd, opts.todayYmd);
  const future = el === 0;
  const complete = el >= dim;
  const running = !future && !complete;
  const planResult = computePlan(plan, dim);

  const make = (
    key: string,
    label: string,
    kind: ComparisonRow['kind'],
    target: number | null,
    actualValue: number | null,
    o: { higherIsBetter: boolean; prorate?: boolean; runningWhileOpen?: boolean; note?: string },
  ): ComparisonRow => {
    const targetToDate = o.prorate && running && target !== null ? (target * el) / dim : null;
    const act = future ? null : actualValue;
    const cmp = targetToDate ?? target;
    let status: RowStatus;
    if (future) status = 'none';
    else if (o.runningWhileOpen && running) status = 'running';
    else status = judge(act, cmp, o.higherIsBetter);
    const diff = act !== null && cmp !== null ? act - cmp : null;
    const row: ComparisonRow = {
      key,
      label,
      kind,
      target,
      targetToDate,
      actual: act,
      diff,
      status,
      higherIsBetter: o.higherIsBetter,
    };
    if (o.note) row.note = o.note;
    return row;
  };

  const perDay = (n: number) => (el > 0 ? n / el : null);
  const operatingProfit = actual.collected - actual.costs.total;
  const actualMargin = actual.collected > 0 ? (operatingProfit / actual.collected) * 100 : 0;
  const actualPayback = operatingProfit > 0 ? plan.investment / operatingProfit : null;
  const fixed = { higherIsBetter: false, runningWhileOpen: true };

  return [
    make(
      'kiloanPerDay',
      'Kiloan (kg/hari)',
      'perDay',
      plan.kiloan.kgPerDay,
      perDay(actual.volume.kiloanKg),
      { higherIsBetter: true },
    ),
    make(
      'satuanPerDay',
      'Satuan (pcs/hari)',
      'perDay',
      plan.satuan.pcsPerDay,
      perDay(actual.volume.satuanPcs),
      { higherIsBetter: true },
    ),
    make(
      'shoesPerDay',
      'Sepatu (pasang/hari)',
      'perDay',
      plan.shoes.pairsPerDay,
      perDay(actual.volume.shoesPairs),
      { higherIsBetter: true },
    ),
    make(
      'carpetM2',
      'Karpet (m2/bulan)',
      'perMonth',
      plan.carpet.m2PerMonth,
      actual.volume.carpetM2,
      { higherIsBetter: true, prorate: true },
    ),
    make(
      'revenueGross',
      'Omzet (nilai nota)',
      'currency',
      planResult.revenue.total,
      actual.revenue.total,
      { higherIsBetter: true, prorate: true },
    ),
    make(
      'revenueKiloan',
      'Omzet Kiloan',
      'currency',
      planResult.revenue.kiloan,
      actual.revenue.kiloan,
      { higherIsBetter: true, prorate: true },
    ),
    make(
      'revenueSatuan',
      'Omzet Satuan',
      'currency',
      planResult.revenue.satuan,
      actual.revenue.satuan,
      { higherIsBetter: true, prorate: true },
    ),
    make(
      'revenueShoes',
      'Omzet Sepatu',
      'currency',
      planResult.revenue.shoes,
      actual.revenue.shoes,
      { higherIsBetter: true, prorate: true },
    ),
    make(
      'revenueCarpet',
      'Omzet Karpet',
      'currency',
      planResult.revenue.carpet,
      actual.revenue.carpet,
      { higherIsBetter: true, prorate: true },
    ),
    ...(actual.revenue.other > 0
      ? [
          {
            key: 'revenueOther',
            label: 'Omzet lain (tanpa target)',
            kind: 'currency' as const,
            target: null,
            targetToDate: null,
            actual: future ? null : actual.revenue.other,
            diff: null,
            status: 'none' as RowStatus,
            higherIsBetter: true,
          },
        ]
      : []),
    make(
      'collected',
      'Pendapatan diterima',
      'currency',
      planResult.revenue.total,
      actual.collected,
      { higherIsBetter: true, prorate: true },
    ),
    make('hpp', COST_LINE_LABELS.hpp, 'currency', planResult.hpp.total, actual.costs.hpp, {
      higherIsBetter: false,
      prorate: true,
    }),
    make(
      'salary',
      COST_LINE_LABELS.salary,
      'currency',
      plan.costs.salary,
      actual.costs.salary,
      fixed,
    ),
    make('rent', COST_LINE_LABELS.rent, 'currency', plan.costs.rent, actual.costs.rent, fixed),
    make(
      'utilities',
      COST_LINE_LABELS.utilities,
      'currency',
      plan.costs.utilities,
      actual.costs.utilities,
      fixed,
    ),
    make(
      'marketing',
      COST_LINE_LABELS.marketing,
      'currency',
      plan.costs.marketing,
      actual.costs.marketing,
      fixed,
    ),
    make('other', COST_LINE_LABELS.other, 'currency', plan.costs.other, actual.costs.other, fixed),
    make('operatingProfit', 'Laba operasional', 'currency', planResult.profit, operatingProfit, {
      higherIsBetter: true,
      runningWhileOpen: true,
    }),
    make('margin', 'Margin', 'percent', planResult.margin, actualMargin, {
      higherIsBetter: true,
      runningWhileOpen: true,
    }),
    {
      key: 'capex',
      label: COST_LINE_LABELS.capex,
      kind: 'currency',
      target: null,
      targetToDate: null,
      actual: future ? null : actual.capex,
      diff: null,
      status: 'none',
      higherIsBetter: false,
      note: CAPEX_NOTE,
    },
    make('payback', 'Balik modal (bulan)', 'months', planResult.paybackMonths, actualPayback, {
      higherIsBetter: false,
      runningWhileOpen: true,
    }),
  ];
}

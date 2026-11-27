// src/utils/businessTargets.ts
// Klien data Rencana vs Realisasi: RPC get_target_vs_actual / upsert_business_target
// dan tabel business_targets.

import { supabase } from './supabaseClient';
import type { CostLine } from '@/config/expenseCategories';
import type { PlanValues } from './businessPlan';

export interface ActualMonth {
  volume: { kiloanKg: number; satuanPcs: number; shoesPairs: number; carpetM2: number };
  revenue: {
    kiloan: number;
    satuan: number;
    shoes: number;
    carpet: number;
    other: number;
    total: number;
  };
  collected: number;
  costs: Record<Exclude<CostLine, 'capex'>, number> & { total: number };
  capex: number;
}

export interface StoreTarget {
  storeId: string;
  isDefault: boolean;
  values: PlanValues;
}

export interface TargetVsActual {
  month: string;
  asOf: string;
  targets: StoreTarget[];
  actual: ActualMonth;
  daily: { date: string; gross: number; collected: number }[];
  sinceStart: { startDate: string; operatingProfit: number; capex: number } | null;
}

type Obj = Record<string, unknown>;

const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const obj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});
const arr = (v: unknown): Obj[] => (Array.isArray(v) ? (v as Obj[]) : []);
const ymdOrNull = (v: unknown): string | null =>
  v === null || v === undefined || v === '' ? null : String(v).slice(0, 10);

export function rowToPlanValues(row: Record<string, unknown>): PlanValues {
  return {
    investment: num(row.investment),
    startDate: ymdOrNull(row.start_date),
    kiloan: { kgPerDay: num(row.kiloan_kg_per_day), price: num(row.kiloan_price) },
    satuan: { pcsPerDay: num(row.satuan_pcs_per_day), price: num(row.satuan_price) },
    shoes: { pairsPerDay: num(row.sepatu_pairs_per_day), price: num(row.sepatu_price) },
    carpet: { m2PerMonth: num(row.karpet_m2_per_month), price: num(row.karpet_price) },
    costs: {
      salary: num(row.cost_salary),
      rent: num(row.cost_rent),
      utilities: num(row.cost_utilities),
      marketing: num(row.cost_marketing),
      other: num(row.cost_other),
    },
    hpp: {
      kiloanPercent: num(row.hpp_kiloan_pct),
      satuanPercent: num(row.hpp_satuan_pct),
      shoesPercent: num(row.hpp_sepatu_pct),
      carpetPercent: num(row.hpp_karpet_pct),
    },
  };
}

export function planValuesToRow(v: PlanValues): Record<string, number | string | null> {
  return {
    start_date: v.startDate,
    investment: v.investment,
    kiloan_kg_per_day: v.kiloan.kgPerDay,
    kiloan_price: v.kiloan.price,
    satuan_pcs_per_day: v.satuan.pcsPerDay,
    satuan_price: v.satuan.price,
    sepatu_pairs_per_day: v.shoes.pairsPerDay,
    sepatu_price: v.shoes.price,
    karpet_m2_per_month: v.carpet.m2PerMonth,
    karpet_price: v.carpet.price,
    cost_salary: v.costs.salary,
    cost_rent: v.costs.rent,
    cost_utilities: v.costs.utilities,
    cost_marketing: v.costs.marketing,
    cost_other: v.costs.other,
    hpp_kiloan_pct: v.hpp.kiloanPercent,
    hpp_satuan_pct: v.hpp.satuanPercent,
    hpp_sepatu_pct: v.hpp.shoesPercent,
    hpp_karpet_pct: v.hpp.carpetPercent,
  };
}

export function normalizeTargetVsActual(raw: unknown): TargetVsActual {
  const r = obj(raw);
  const a = obj(r.actual);
  const vol = obj(a.volume);
  const rev = obj(a.revenue);
  const cost = obj(a.costs);
  const since = r.sinceStart ? obj(r.sinceStart) : null;
  return {
    month: String(r.month ?? '').slice(0, 10),
    asOf: String(r.asOf ?? '').slice(0, 10),
    targets: arr(r.targets).map((t) => ({
      storeId: String(t.storeId ?? ''),
      isDefault: Boolean(t.isDefault),
      values: rowToPlanValues(obj(t.row)),
    })),
    actual: {
      volume: {
        kiloanKg: num(vol.kiloanKg),
        satuanPcs: num(vol.satuanPcs),
        shoesPairs: num(vol.shoesPairs),
        carpetM2: num(vol.carpetM2),
      },
      revenue: {
        kiloan: num(rev.kiloan),
        satuan: num(rev.satuan),
        shoes: num(rev.shoes),
        carpet: num(rev.carpet),
        other: num(rev.other),
        total: num(rev.total),
      },
      collected: num(a.collected),
      costs: {
        hpp: num(cost.hpp),
        salary: num(cost.salary),
        rent: num(cost.rent),
        utilities: num(cost.utilities),
        marketing: num(cost.marketing),
        other: num(cost.other),
        total: num(cost.total),
      },
      capex: num(a.capex),
    },
    daily: arr(r.daily).map((d) => ({
      date: String(d.date ?? '').slice(0, 10),
      gross: num(d.gross),
      collected: num(d.collected),
    })),
    sinceStart: since
      ? {
          startDate: String(since.startDate ?? '').slice(0, 10),
          operatingProfit: num(since.operatingProfit),
          capex: num(since.capex),
        }
      : null,
  };
}

const MISSING_CODES = new Set(['PGRST202', '42883', '42P01', 'PGRST205']);

type RpcResult = { data: unknown; error: { code?: string; message: string } | null };
type UntypedRpc = { rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<RpcResult> };

export async function fetchTargetVsActual(p: {
  storeId: string | null;
  monthYmd: string;
  asOfYmd: string;
}): Promise<TargetVsActual> {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  const { data, error } = await (supabase as unknown as UntypedRpc).rpc('get_target_vs_actual', {
    p_store_id: p.storeId,
    p_month: p.monthYmd,
    p_as_of: p.asOfYmd,
    p_tz: tz,
  });
  if (error) {
    if (error.code && MISSING_CODES.has(error.code)) throw new Error('MIGRATION_MISSING');
    throw error;
  }
  return normalizeTargetVsActual(data);
}

type TableQuery = {
  select: (c: string) => {
    eq: (col: string, v: string) => PromiseLike<{ data: unknown; error: unknown }>;
  };
};

export async function fetchStoreTargets(
  storeId: string,
): Promise<{ period: string | null; values: PlanValues; updatedAt: string }[]> {
  const { data, error } = await (supabase as unknown as { from: (t: string) => TableQuery })
    .from('business_targets')
    .select('*')
    .eq('store_id', storeId);
  if (error) {
    const code = (error as { code?: string }).code;
    if (code && MISSING_CODES.has(code)) throw new Error('MIGRATION_MISSING');
    throw error;
  }
  return arr(data).map((row) => ({
    period: ymdOrNull(row.period),
    values: rowToPlanValues(row),
    updatedAt: String(row.updated_at ?? ''),
  }));
}

export async function saveStoreTarget(
  storeId: string,
  periodYmd: string | null,
  v: PlanValues,
): Promise<void> {
  const { error } = await (supabase as unknown as UntypedRpc).rpc('upsert_business_target', {
    p_store_id: storeId,
    p_period: periodYmd,
    p_data: planValuesToRow(v),
  });
  if (error) {
    if (error.code && MISSING_CODES.has(error.code)) throw new Error('MIGRATION_MISSING');
    throw error;
  }
}

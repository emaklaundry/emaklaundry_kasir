import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLAN_VALUES,
  buildComparison,
  computePlan,
  daysElapsed,
  daysInMonth,
  sumPlanValues,
  type PlanValues,
} from '@/utils/businessPlan';
import type { ActualMonth } from '@/utils/businessTargets';

const zeroPlan = (): PlanValues => ({
  investment: 0,
  startDate: null,
  kiloan: { kgPerDay: 0, price: 0 },
  satuan: { pcsPerDay: 0, price: 0 },
  shoes: { pairsPerDay: 0, price: 0 },
  carpet: { m2PerMonth: 0, price: 0 },
  costs: { salary: 0, rent: 0, utilities: 0, marketing: 0, other: 0 },
  hpp: { kiloanPercent: 0, satuanPercent: 0, shoesPercent: 0, carpetPercent: 0 },
});

const emptyActual = (): ActualMonth => ({
  volume: { kiloanKg: 0, satuanPcs: 0, shoesPairs: 0, carpetM2: 0 },
  revenue: { kiloan: 0, satuan: 0, shoes: 0, carpet: 0, other: 0, total: 0 },
  collected: 0,
  costs: { hpp: 0, salary: 0, rent: 0, utilities: 0, marketing: 0, other: 0, total: 0 },
  capex: 0,
});

describe('computePlan', () => {
  it('matches the old calculator (utilities 0)', () => {
    const r = computePlan(
      { ...DEFAULT_PLAN_VALUES, costs: { ...DEFAULT_PLAN_VALUES.costs, utilities: 0 } },
      30,
    );
    expect(r.revenue.kiloan).toBe(21_600_000);
    expect(r.revenue.satuan).toBe(3_000_000);
    expect(r.revenue.shoes).toBe(4_500_000);
    expect(r.revenue.carpet).toBe(400_000);
    expect(r.revenue.total).toBe(29_500_000);
    const hpp = 21_600_000 * 0.25 + 3_000_000 * 0.1 + 4_500_000 * 0.15 + 400_000 * 0.1;
    expect(r.hpp.total).toBeCloseTo(hpp);
    expect(r.costs.total).toBeCloseTo(hpp + 6_000_000 + 3_500_000 + 1_500_000);
    expect(r.profit).toBeCloseTo(29_500_000 - r.costs.total);
    expect(r.paybackMonths).toBeCloseTo(160_000_000 / r.profit);
  });

  it('handles all zeros without NaN', () => {
    const r = computePlan(zeroPlan(), 30);
    expect(r.margin).toBe(0);
    expect(r.paybackMonths).toBeNull();
    const nums = [
      ...Object.values(r.revenue),
      ...Object.values(r.hpp),
      ...Object.values(r.costs),
      r.profit,
      r.margin,
    ];
    nums.forEach((n) => expect(Number.isFinite(n)).toBe(true));
  });
});

describe('days helpers', () => {
  it('computes days', () => {
    expect(daysInMonth('2026-02-01')).toBe(28);
    expect(daysElapsed('2026-11-01', '2026-11-15')).toBe(15);
    expect(daysElapsed('2026-12-01', '2026-11-27')).toBe(0);
    expect(daysElapsed('2026-10-01', '2026-11-27')).toBe(31);
  });
});

describe('sumPlanValues', () => {
  it('keeps computePlan additive', () => {
    const a = DEFAULT_PLAN_VALUES;
    const b: PlanValues = {
      ...DEFAULT_PLAN_VALUES,
      investment: 50_000_000,
      kiloan: { kgPerDay: 40, price: 7000 },
      satuan: { pcsPerDay: 10, price: 15000 },
      hpp: { kiloanPercent: 30, satuanPercent: 20, shoesPercent: 5, carpetPercent: 12 },
    };
    const s = computePlan(sumPlanValues([a, b]), 30);
    const ra = computePlan(a, 30);
    const rb = computePlan(b, 30);
    expect(s.revenue.total).toBeCloseTo(ra.revenue.total + rb.revenue.total);
    expect(s.profit).toBeCloseTo(ra.profit + rb.profit);
    expect(sumPlanValues([a, b]).startDate).toBeNull();
  });
});

describe('buildComparison', () => {
  const plan: PlanValues = {
    ...zeroPlan(),
    kiloan: { kgPerDay: 100, price: 10_000 }, // 30jt
    costs: { salary: 6_000_000, rent: 0, utilities: 0, marketing: 0, other: 0 },
    hpp: { kiloanPercent: 19.6666666667, satuanPercent: 0, shoesPercent: 0, carpetPercent: 0 },
  };
  const find = (rows: ReturnType<typeof buildComparison>, key: string) =>
    rows.find((r) => r.key === key)!;

  it('mid month', () => {
    const a = emptyActual();
    a.revenue.total = 14_500_000;
    const rows = buildComparison(plan, a, { monthYmd: '2026-11-01', todayYmd: '2026-11-15' });
    const g = find(rows, 'revenueGross');
    expect(g.targetToDate).toBeCloseTo(15_000_000);
    expect(g.status).toBe('ok');
    expect(find(rows, 'salary').status).toBe('running');
    expect(rows.map((r) => r.key)).toEqual([
      'kiloanPerDay',
      'satuanPerDay',
      'shoesPerDay',
      'carpetM2',
      'revenueGross',
      'revenueKiloan',
      'revenueSatuan',
      'revenueShoes',
      'revenueCarpet',
      'collected',
      'hpp',
      'salary',
      'rent',
      'utilities',
      'marketing',
      'other',
      'operatingProfit',
      'margin',
      'capex',
      'payback',
    ]);
  });

  it('per-day actual divides by elapsed days', () => {
    const a = emptyActual();
    a.volume.kiloanKg = 1500;
    const mid = find(
      buildComparison(plan, a, { monthYmd: '2026-11-01', todayYmd: '2026-11-15' }),
      'kiloanPerDay',
    );
    expect(mid.actual).toBe(100);
    expect(mid.status).toBe('ok');
    a.volume.kiloanKg = 3100;
    const past = find(
      buildComparison(plan, a, { monthYmd: '2026-10-01', todayYmd: '2026-11-27' }),
      'kiloanPerDay',
    );
    expect(past.actual).toBe(100);
  });

  it('finished month judges profit, margin and payback', () => {
    const a = emptyActual();
    a.collected = 31_000_000;
    a.costs.total = 10_000_000;
    const rows = buildComparison({ ...plan, investment: 100_000_000 }, a, {
      monthYmd: '2026-10-01',
      todayYmd: '2026-11-27',
    });
    ['operatingProfit', 'margin', 'payback'].forEach((k) =>
      expect(['ok', 'warn']).toContain(find(rows, k).status),
    );
    expect(find(rows, 'payback').actual).toBeCloseTo(100_000_000 / 21_000_000);
  });

  it('payback is warn with null actual when operating profit <= 0', () => {
    const a = emptyActual();
    a.collected = 1_000_000;
    a.costs.total = 2_000_000;
    const rows = buildComparison({ ...plan, investment: 100_000_000 }, a, {
      monthYmd: '2026-10-01',
      todayYmd: '2026-11-27',
    });
    const pb = find(rows, 'payback');
    expect(pb.actual).toBeNull();
    expect(pb.status).toBe('warn');
  });

  it('finished month', () => {
    const a = emptyActual();
    a.costs.salary = 6_400_000;
    a.costs.hpp = 5_200_000;
    const rows = buildComparison(plan, a, { monthYmd: '2026-10-01', todayYmd: '2026-11-27' });
    expect(find(rows, 'salary').status).toBe('warn');
    expect(find(rows, 'hpp').target).toBeCloseTo(6_096_667, -3);
    expect(find(rows, 'hpp').status).toBe('ok');
    expect(find(rows, 'hpp').targetToDate).toBeNull();
  });

  it('future month has null actuals and no NaN', () => {
    const rows = buildComparison(plan, emptyActual(), {
      monthYmd: '2026-12-01',
      todayYmd: '2026-11-27',
    });
    rows.forEach((r) => expect(r.actual).toBeNull());
    expect(JSON.stringify(rows)).not.toMatch(/NaN/);
    rows.forEach((r) =>
      [r.target, r.targetToDate, r.actual, r.diff].forEach((v) => {
        if (v !== null) expect(Number.isFinite(v)).toBe(true);
      }),
    );
    rows.forEach((r) => expect(r.status).toBe('none'));
  });

  it('omzet per layanan: label, target dari computePlan, prorata, nyata', () => {
    const p: PlanValues = {
      ...plan,
      satuan: { pcsPerDay: 10, price: 1_000 }, // 300rb
    };
    const a = emptyActual();
    a.revenue.kiloan = 13_000_000;
    a.revenue.satuan = 100_000;
    a.revenue.total = 13_100_000;
    const rows = buildComparison(p, a, { monthYmd: '2026-11-01', todayYmd: '2026-11-15' });
    const k = find(rows, 'revenueKiloan');
    expect(k.label).toBe('Omzet Kiloan');
    expect(k.kind).toBe('currency');
    expect(k.target).toBe(30_000_000);
    expect(k.targetToDate).toBeCloseTo(15_000_000);
    expect(k.actual).toBe(13_000_000);
    expect(k.status).toBe('warn');
    expect(find(rows, 'revenueSatuan').label).toBe('Omzet Satuan');
    expect(find(rows, 'revenueSatuan').target).toBe(300_000);
    expect(find(rows, 'revenueShoes').label).toBe('Omzet Sepatu');
    expect(find(rows, 'revenueCarpet').label).toBe('Omzet Karpet');
  });

  it('omzet lain (tanpa target) hanya muncul bila ada, info saja', () => {
    const a = emptyActual();
    expect(
      buildComparison(plan, a, { monthYmd: '2026-10-01', todayYmd: '2026-11-27' }).some(
        (r) => r.key === 'revenueOther',
      ),
    ).toBe(false);
    a.revenue.other = 250_000;
    a.revenue.total = 250_000;
    const rows = buildComparison(plan, a, { monthYmd: '2026-10-01', todayYmd: '2026-11-27' });
    const o = find(rows, 'revenueOther');
    expect(o.label).toBe('Omzet lain (tanpa target)');
    expect(o.target).toBeNull();
    expect(o.status).toBe('none');
    expect(o.actual).toBe(250_000);
    const keys = rows.map((r) => r.key);
    expect(keys.indexOf('revenueOther')).toBe(keys.indexOf('revenueCarpet') + 1);
  });

  it('biaya dengan target 0 tetapi nyata > 0: warn (bulan selesai) / running (biaya tetap berjalan)', () => {
    const a = emptyActual();
    a.costs.rent = 500_000; // target rent 0
    a.costs.hpp = 0;
    const done = buildComparison(plan, a, { monthYmd: '2026-10-01', todayYmd: '2026-11-27' });
    expect(find(done, 'rent').status).toBe('warn');
    expect(find(done, 'utilities').status).toBe('none'); // target 0, nyata 0
    const mid = buildComparison(plan, a, { monthYmd: '2026-11-01', todayYmd: '2026-11-15' });
    expect(find(mid, 'rent').status).toBe('running');
  });

  it('capex is info only', () => {
    const a = emptyActual();
    a.capex = 1_000_000;
    const c = find(
      buildComparison(plan, a, { monthYmd: '2026-10-01', todayYmd: '2026-11-27' }),
      'capex',
    );
    expect(c.status).toBe('none');
    expect(c.note).toBe('Laba bersih di Laporan = laba operasional − belanja modal');
  });
});

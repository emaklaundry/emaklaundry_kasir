import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('@/utils/supabaseClient', () => ({
  supabase: { rpc: mocks.rpc, from: mocks.from },
}));

import { DEFAULT_PLAN_VALUES } from '@/utils/businessPlan';
import {
  fetchStoreTargets,
  fetchTargetVsActual,
  normalizeTargetVsActual,
  planValuesToRow,
  rowToPlanValues,
  saveStoreTarget,
} from '@/utils/businessTargets';

describe('businessTargets', () => {
  beforeEach(() => mocks.rpc.mockReset());

  it('normalizes strings and fills defaults', () => {
    const r = normalizeTargetVsActual({
      month: '2026-11-01',
      asOf: '2026-11-15',
      targets: [
        { storeId: 's1', isDefault: true, row: { kiloan_kg_per_day: '80', kiloan_price: '9000' } },
      ],
      actual: { volume: { kiloanKg: '12.5' }, collected: '1000', costs: { hpp: '5' } },
      daily: [{ date: '2026-11-01', gross: '10', collected: 5 }],
      sinceStart: null,
    });
    expect(r.targets[0].values.kiloan).toEqual({ kgPerDay: 80, price: 9000 });
    expect(r.targets[0].isDefault).toBe(true);
    expect(r.actual.volume.kiloanKg).toBe(12.5);
    expect(r.actual.volume.carpetM2).toBe(0);
    expect(r.actual.collected).toBe(1000);
    expect(r.actual.costs.hpp).toBe(5);
    expect(r.actual.costs.total).toBe(0);
    expect(r.daily[0].gross).toBe(10);
    expect(r.sinceStart).toBeNull();
  });

  it('round-trips plan values', () => {
    const v = { ...DEFAULT_PLAN_VALUES, startDate: '2026-01-05' };
    expect(rowToPlanValues(planValuesToRow(v))).toEqual(v);
  });

  it('calls get_target_vs_actual', async () => {
    mocks.rpc.mockResolvedValue({ data: { month: '2026-11-01' }, error: null });
    await fetchTargetVsActual({ storeId: 's1', monthYmd: '2026-11-01', asOfYmd: '2026-11-15' });
    const [fn, args] = mocks.rpc.mock.calls[0];
    expect(fn).toBe('get_target_vs_actual');
    expect(args).toMatchObject({ p_store_id: 's1', p_month: '2026-11-01', p_as_of: '2026-11-15' });
  });

  it('maps missing migration', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'x' } });
    await expect(
      fetchTargetVsActual({ storeId: null, monthYmd: '2026-11-01', asOfYmd: '2026-11-15' }),
    ).rejects.toThrow('MIGRATION_MISSING');
  });

  it('fetchStoreTargets maps missing table to MIGRATION_MISSING', async () => {
    mocks.from.mockReturnValue({
      select: () => ({
        eq: () => Promise.resolve({ data: null, error: { code: 'PGRST205', message: 'x' } }),
      }),
    });
    await expect(fetchStoreTargets('s1')).rejects.toThrow('MIGRATION_MISSING');
  });

  it('saves default target with null period', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });
    await saveStoreTarget('s1', null, DEFAULT_PLAN_VALUES);
    const [fn, args] = mocks.rpc.mock.calls[0];
    expect(fn).toBe('upsert_business_target');
    expect(args.p_period).toBeNull();
    expect(args.p_store_id).toBe('s1');
    expect(args.p_data.kiloan_kg_per_day).toBe(80);
  });
});

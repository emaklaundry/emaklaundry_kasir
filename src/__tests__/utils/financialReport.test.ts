import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const tables: Record<string, unknown[]> = {};
  const builder = (table: string) => {
    const b: Record<string, unknown> = {};
    ['select', 'gte', 'lte', 'eq', 'order', 'range'].forEach((m) => (b[m] = () => b));
    b.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) =>
      Promise.resolve({ data: tables[table] ?? [], error: null }).then(res, rej);
    return b;
  };
  return { tables, builder, rpc: vi.fn() };
});

vi.mock('@/utils/supabaseClient', () => ({
  supabase: { rpc: mocks.rpc, from: (t: string) => mocks.builder(t) },
}));

import { fetchFinancialReport, normalizeReport } from '@/utils/financialReport';

const params = {
  storeId: null,
  startYmd: '2026-11-01',
  endYmd: '2026-11-27',
  prevStartYmd: null,
  prevEndYmd: null,
};

describe('financialReport', () => {
  beforeEach(() => {
    Object.keys(mocks.tables).forEach((k) => delete mocks.tables[k]);
    mocks.rpc.mockReset();
  });

  it('normalizes server numbers that arrive as strings', () => {
    const r = normalizeReport(
      {
        summary: { gross: '80000', collected: 60000, count: 2 },
        previous: null,
        daily: [{ date: '2026-11-03', revenue: '1000', expenses: 0, gross: 0, count: 0 }],
        stores: null,
      },
      'server',
    );
    expect(r.summary.gross).toBe(80000);
    expect(r.summary.receivable).toBe(0);
    expect(r.daily[0].revenue).toBe(1000);
    expect(r.stores).toBeNull();
    expect(r.services).toEqual([]);
  });

  it('uses the server report when the RPC exists', async () => {
    mocks.rpc.mockResolvedValue({ data: { summary: { collected: 5 } }, error: null });
    const r = await fetchFinancialReport(params);
    expect(r.source).toBe('server');
    expect(r.summary.collected).toBe(5);
    expect(mocks.rpc).toHaveBeenCalledWith(
      'get_financial_report',
      expect.objectContaining({ p_store_id: null, p_start: '2026-11-01', p_end: '2026-11-27' }),
    );
  });

  it('falls back to client-side computation when the migration is missing', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'not found' } });
    mocks.tables.transactions = [
      {
        id: 't1',
        total: 50000,
        amountPaid: 50000,
        discount: 0,
        paymentStatus: 'Lunas',
        paymentMethod: 'Tunai',
        createdAt: '2026-11-03T03:00:00.000Z',
        items: [
          { serviceId: 's1', serviceName: 'Cuci Kiloan', unit: 'kg', quantity: 5, subtotal: 50000 },
        ],
        storeId: 'st1',
      },
      {
        id: 't2',
        total: 30000,
        amountPaid: 10000,
        discount: 0,
        paymentStatus: 'Belum Lunas',
        createdAt: '2026-11-04T03:00:00.000Z',
        items: [],
        storeId: 'st1',
      },
    ];
    mocks.tables.expenses = [
      {
        id: 'e1',
        date: '2026-11-05',
        description: 'Listrik',
        category: 'Operasional',
        amount: 20000,
      },
    ];
    mocks.tables.assets = [
      {
        id: 'a1',
        name: 'Mesin Cuci',
        purchaseDate: '2026-11-10',
        purchaseCost: 1000000,
        maintenanceHistory: [{ date: '2026-11-12', description: 'Servis', cost: 50000 }],
      },
    ];

    const r = await fetchFinancialReport(params, { st1: 'Cabang A' });
    expect(r.source).toBe('client');
    expect(r.summary.collected).toBe(60000);
    expect(r.summary.gross).toBe(80000);
    expect(r.summary.receivable).toBe(20000);
    expect(r.summary.unpaidCount).toBe(1);
    expect(r.summary.expenses).toBe(20000 + 1000000 + 50000);
    expect(r.categories).toEqual([{ category: 'Kiloan', revenue: 50000 }]);
    expect(r.paymentMethods.map((m) => m.method)).toEqual(['Tunai', 'Tidak Tercatat']);
    expect(r.receivables).toHaveLength(1);
    expect(r.receivables[0].outstanding).toBe(20000);
    expect(r.stores?.[0]).toMatchObject({ name: 'Cabang A', collected: 60000 });
  });

  it('does not double count asset costs already recorded as expenses', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '42883', message: 'missing' } });
    mocks.tables.expenses = [
      {
        id: 'e1',
        date: '2026-11-12',
        description: 'Quick Maintenance: Mesin Cuci (Servis)',
        category: 'Perawatan Aset',
        amount: 50000,
      },
    ];
    mocks.tables.assets = [
      {
        id: 'a1',
        name: 'Mesin Cuci',
        maintenanceHistory: [{ date: '2026-11-12', description: 'Servis', cost: 50000 }],
      },
    ];
    const r = await fetchFinancialReport(params);
    expect(r.summary.expenses).toBe(50000);
    expect(r.expenses).toHaveLength(1);
  });

  it('rethrows other errors', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });
    await expect(fetchFinancialReport(params)).rejects.toMatchObject({ code: '42501' });
  });
});

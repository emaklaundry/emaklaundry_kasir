import { beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;

// In-memory fake of the small part of the Supabase query builder that backupUtils uses.
const db: Record<string, Row[]> = {};
const calls: { table: string; op: string; payload?: unknown; options?: unknown }[] = [];

function makeQuery(table: string) {
  const filters: ((r: Row) => boolean)[] = [];
  let from = 0;
  let to = Infinity;
  let op: 'select' | 'upsert' | 'insert' | 'update' = 'select';
  let payload: unknown;
  let options: { onConflict?: string; ignoreDuplicates?: boolean } | undefined;

  const run = () => {
    const rows = (db[table] ??= []);
    if (op === 'select') {
      const data = rows.filter((r) => filters.every((f) => f(r))).slice(from, to + 1);
      return { data, error: null };
    }
    calls.push({ table, op, payload, options });
    if (op === 'update') {
      rows.filter((r) => filters.every((f) => f(r))).forEach((r) => Object.assign(r, payload));
      return { data: null, error: null };
    }
    const list = (Array.isArray(payload) ? payload : [payload]) as Row[];
    for (const row of list) {
      const existing = rows.find((r) => row.id !== undefined && r.id === row.id);
      if (existing && op === 'upsert') {
        if (!options?.ignoreDuplicates) Object.assign(existing, row);
      } else {
        rows.push({ ...row });
      }
    }
    return { data: null, error: null };
  };

  const query = {
    select: () => query,
    eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), query),
    is: (c: string, v: unknown) => (filters.push((r) => (r[c] ?? null) === v), query),
    in: (c: string, v: unknown[]) => (filters.push((r) => v.includes(r[c])), query),
    order: () => query,
    limit: (n: number) => ((to = n - 1), query),
    range: (a: number, b: number) => ((from = a), (to = b), query),
    upsert: (p: unknown, o: typeof options) => (
      (op = 'upsert'),
      (payload = p),
      (options = o),
      query
    ),
    insert: (p: unknown) => ((op = 'insert'), (payload = p), query),
    update: (p: unknown) => ((op = 'update'), (payload = p), query),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(run()).then(resolve, reject),
  };
  return query;
}

vi.mock('@/utils/supabaseClient', () => ({
  supabase: { from: (table: string) => makeQuery(table) },
}));

const { validateBackup, selectRowsForRestore, importBackup, exportBackup, fetchAllRows } =
  await import('@/utils/backupUtils');

const STORE_A = 'store-a';
const STORE_B = 'store-b';

const baseBackup = () => ({
  version: '2.0',
  exportedAt: '2026-11-26T00:00:00.000Z',
  storeId: null,
  data: {
    stores: [{ id: STORE_A }, { id: STORE_B }],
    settings: [{ id: 1, storeId: STORE_A, receiptMessage: 'Terima kasih' }],
    customers: [
      { id: 'c1', name: 'A', storeId: STORE_A },
      { id: 'c2', name: 'B', storeId: STORE_B },
    ],
    services: [],
    inventory_items: [],
    assets: [{ id: 'as1', storeId: STORE_A }],
    scheduled_maintenances: [
      { id: 'sm1', assetId: 'as1' },
      { id: 'sm2', assetId: 'as-other' },
    ],
    expenses: [],
    transactions: [
      {
        id: 't1',
        invoiceCode: 'EMA-123',
        supervisorApprovalId: 'x',
        createdByUserId: 'u-known',
        updatedByUserId: 'u-gone',
        storeId: STORE_A,
      },
    ],
    profiles: [{ id: 'u-known', store_id: STORE_A }],
    audit_logs: [{ id: 1, storeId: STORE_A }],
  },
});

beforeEach(() => {
  for (const key of Object.keys(db)) delete db[key];
  calls.length = 0;
});

describe('validateBackup', () => {
  it('accepts v1 and v2 files and rejects malformed ones', () => {
    expect(validateBackup(baseBackup())).toBe(true);
    const v1 = baseBackup();
    delete (v1.data as Record<string, unknown>).scheduled_maintenances;
    expect(validateBackup({ ...v1, version: '1.0' })).toBe(true);

    expect(validateBackup(null)).toBe(false);
    expect(validateBackup({ ...baseBackup(), exportedAt: 'bukan tanggal' })).toBe(false);
    const missingRequired = baseBackup();
    delete (missingRequired.data as Record<string, unknown>).transactions;
    expect(validateBackup(missingRequired)).toBe(false);
    const badRows = baseBackup();
    (badRows.data as Record<string, unknown>).customers = ['x'];
    expect(validateBackup(badRows)).toBe(false);
  });
});

describe('selectRowsForRestore', () => {
  it('keeps only rows of the restricted store, including child rows via their parent', () => {
    const rows = selectRowsForRestore(baseBackup(), STORE_A);
    expect(rows.stores.map((r) => r.id)).toEqual([STORE_A]);
    expect(rows.customers.map((r) => r.id)).toEqual(['c1']);
    expect(rows.scheduled_maintenances.map((r) => r.id)).toEqual(['sm1']);
  });

  it('keeps everything when not restricted', () => {
    const rows = selectRowsForRestore(baseBackup(), null);
    expect(rows.customers).toHaveLength(2);
    expect(rows.scheduled_maintenances).toHaveLength(2);
  });
});

describe('fetchAllRows', () => {
  it('pages past the 1000-row limit', async () => {
    db.transactions = Array.from({ length: 2500 }, (_, i) => ({ id: `t${i}` }));
    const rows = await fetchAllRows('transactions');
    expect(rows).toHaveLength(2500);
  });
});

describe('exportBackup', () => {
  it('exports only the selected store and produces a valid file', async () => {
    db.stores = [{ id: STORE_A }, { id: STORE_B }];
    db.customers = [
      { id: 'c1', storeId: STORE_A },
      { id: 'c2', storeId: STORE_B },
    ];
    const backup = await exportBackup({ storeId: STORE_A });
    expect(backup.storeId).toBe(STORE_A);
    expect(backup.data.stores).toEqual([{ id: STORE_A }]);
    expect(backup.data.customers).toEqual([{ id: 'c1', storeId: STORE_A }]);
    expect(validateBackup(backup)).toBe(true);
  });
});

describe('importBackup', () => {
  it('restores settings without the identity id and updates the existing store row', async () => {
    db.settings = [{ id: 99, storeId: STORE_A, receiptMessage: 'lama' }];
    db.profiles = [{ id: 'u-known' }];

    const result = await importBackup(baseBackup(), {
      canRestoreStores: true,
      canOverwriteTransactions: true,
    });

    expect(result.errors).toEqual([]);
    expect(db.settings).toEqual([{ id: 99, storeId: STORE_A, receiptMessage: 'Terima kasih' }]);
    expect(calls.some((c) => c.table === 'settings' && c.op === 'upsert')).toBe(false);
  });

  it('never sends invoiceCode/supervisorApprovalId and clears unknown user references', async () => {
    db.profiles = [{ id: 'u-known' }];
    await importBackup(baseBackup(), { canRestoreStores: true, canOverwriteTransactions: true });

    const txCall = calls.find((c) => c.table === 'transactions');
    const [tx] = txCall?.payload as Row[];
    expect(tx).not.toHaveProperty('invoiceCode');
    expect(tx).not.toHaveProperty('supervisorApprovalId');
    expect(tx.createdByUserId).toBe('u-known');
    expect(tx.updatedByUserId).toBeNull();
    expect(txCall?.options).toMatchObject({ ignoreDuplicates: false });
  });

  it('for non Super Admin: skips stores, archive tables and does not overwrite transactions', async () => {
    db.profiles = [{ id: 'u-known' }];
    const result = await importBackup(baseBackup(), { restrictToStoreId: STORE_A });

    expect(calls.some((c) => c.table === 'stores')).toBe(false);
    expect(calls.some((c) => c.table === 'profiles' || c.table === 'audit_logs')).toBe(false);
    expect(calls.find((c) => c.table === 'transactions')?.options).toMatchObject({
      ignoreDuplicates: true,
    });
    expect(db.customers.map((r) => r.id)).toEqual(['c1']);
    expect(result.skipped.join(' ')).toMatch(/Cabang/);
  });

  it('maps backup monthly templates onto the auto-seeded template with the same name', async () => {
    db.profiles = [];
    db.monthly_expense_templates = [{ id: 'seeded', store_id: STORE_A, name: 'Listrik' }];
    const backup = baseBackup();
    Object.assign(backup.data, {
      monthly_expense_templates: [{ id: 'old', store_id: STORE_A, name: 'listrik' }],
      expenses: [{ id: 'e1', storeId: STORE_A, recurringTemplateId: 'old' }],
    });

    await importBackup(backup, { canRestoreStores: true });

    expect(db.monthly_expense_templates.map((t) => t.id)).toEqual(['seeded']);
    expect(db.expenses[0].recurringTemplateId).toBe('seeded');
  });
});

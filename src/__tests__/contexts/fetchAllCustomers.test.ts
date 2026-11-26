import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1.027 pelanggan: lebih dari batas 1.000 baris per respons Supabase.
const TOTAL = 1027;
const rows = Array.from({ length: TOTAL }, (_, i) => ({
  id: `c-${String(i).padStart(4, '0')}`,
  name: `Pelanggan ${i}`,
  phone: null,
  address: null,
  notes: null,
  storeId: 'store-1',
}));

const ranges: Array<[number, number]> = [];

vi.mock('@/utils/supabaseClient', () => {
  const makeQuery = () => {
    const query = {
      eq: () => query,
      ilike: () => query,
      order: () => query,
      range: (from: number, to: number) => {
        ranges.push([from, to]);
        // Supabase tidak pernah mengirim lebih dari 1.000 baris.
        const end = Math.min(to, from + 999);
        return Promise.resolve({ data: rows.slice(from, end + 1), error: null, count: TOTAL });
      },
    };
    return query;
  };
  return { supabase: { from: () => ({ select: () => makeQuery() }) } };
});

import { fetchAllCustomers } from '@/contexts/CustomerContext';

describe('fetchAllCustomers', () => {
  beforeEach(() => {
    ranges.length = 0;
  });

  it('memuat semua pelanggan walau lebih dari 1.000 (tidak ada yang jadi N/A)', async () => {
    const { data, count } = await fetchAllCustomers();
    expect(count).toBe(TOTAL);
    expect(data).toHaveLength(TOTAL);
    expect(new Set(data.map((c) => c.id)).size).toBe(TOTAL);
    expect(data.at(-1)?.id).toBe('c-1026');
    expect(ranges).toEqual([
      [0, 999],
      [1000, 1999],
    ]);
  });
});

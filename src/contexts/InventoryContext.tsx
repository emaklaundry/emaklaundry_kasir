import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryItem } from '../types';
import { supabase } from '../utils/supabaseClient';

export interface InventoryFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  storeId?: string;
  /** Kolom urutan (berlaku untuk seluruh data sebelum paginasi). Default: name. */
  sortBy?: InventorySortKey;
  /** Default: true. */
  sortAscending?: boolean;
  /** Hanya item yang stoknya di bawah/sama dengan ambang batas (difilter di server). */
  lowStockOnly?: boolean;
  /** Hanya item yang stoknya habis (≤ 0). */
  outOfStockOnly?: boolean;
}

export type InventorySortKey = 'name' | 'stock' | 'storeName';

export async function fetchInventory(
  filter: InventoryFilter = {},
): Promise<{ data: InventoryItem[]; count: number }> {
  const {
    page = 1,
    pageSize = 50,
    searchTerm,
    storeId,
    sortBy = 'name',
    sortAscending = true,
    lowStockOnly = false,
    outOfStockOnly = false,
  } = filter;
  // Urut berdasarkan nama cabang butuh relasi stores di-embed.
  const sortByStore = sortBy === 'storeName';
  const columns: string = sortByStore ? '*, stores(name)' : '*';
  let query = supabase.from('inventory_items').select(columns, { count: 'exact' });
  if (storeId && storeId !== 'all') {
    query = query.eq('storeId', storeId);
  }
  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }
  if (lowStockOnly) {
    query = query.eq('is_low_stock', true);
  }
  if (outOfStockOnly) {
    query = query.lte('stock', 0);
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  // Urutan dikerjakan di server agar berlaku untuk semua halaman; id sebagai kunci stabil.
  query = query
    .order(sortByStore ? 'stores(name)' : sortBy, { ascending: sortAscending, nullsFirst: false })
    .order('name')
    .order('id')
    .range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;
  const rows = (data || []) as unknown as Record<string, unknown>[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const items = rows.map(({ stores: _stores, ...i }) => ({
    ...i,
    // kolom numeric bisa datang sebagai string dari PostgREST
    stock: Number(i.stock) || 0,
    lowStockThreshold: Number(i.lowStockThreshold) || 0,
    storeId: (i.storeId as string | null) ?? undefined,
  })) as unknown as InventoryItem[];
  return { data: items, count: count || 0 };
}

export interface InventorySummary {
  total: number;
  lowStock: number;
  outOfStock: number;
}

/** Ringkasan seluruh item cabang (bukan hanya halaman yang tampil). */
export async function fetchInventorySummary(storeId?: string): Promise<InventorySummary> {
  const base = () => {
    let q = supabase.from('inventory_items').select('id', { count: 'exact', head: true });
    if (storeId && storeId !== 'all') q = q.eq('storeId', storeId);
    return q;
  };
  const [total, low, out] = await Promise.all([
    base(),
    base().eq('is_low_stock', true),
    base().lte('stock', 0),
  ]);
  const error = total.error || low.error || out.error;
  if (error) throw error;
  return { total: total.count || 0, lowStock: low.count || 0, outOfStock: out.count || 0 };
}

/** Kolom yang boleh dikirim saat menulis item (kolom turunan ditolak database). */
function toWritable(item: Partial<InventoryItem>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { is_low_stock: _low, id: _id, ...rest } = item;
  return rest;
}

export function useInventoryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory_summary'] });
    queryClient.invalidateQueries({ queryKey: ['inventory_movements'] });
  };

  const addInventoryItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id'>) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([toWritable(item) as Omit<InventoryItem, 'id'>])
        .select();
      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: invalidate,
  });

  const updateInventoryItem = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<InventoryItem> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase
        .from('inventory_items')
        .update(toWritable(data))
        .eq('id', id)
        .select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: invalidate,
  });

  const deleteInventoryItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: invalidate,
  });

  return {
    addInventoryItem: addInventoryItem.mutateAsync,
    updateInventoryItem: (id: string, data: Partial<InventoryItem>) =>
      updateInventoryItem.mutateAsync({ id, data }),
    deleteInventoryItem: deleteInventoryItem.mutateAsync,
  };
}

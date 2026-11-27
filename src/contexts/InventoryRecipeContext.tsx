import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  InventoryMovement,
  InventoryMovementKind,
  InventoryRecipe,
  InventoryRecipeBasis,
  StockAdjustMode,
  StockOpname,
} from '../types';
import { supabase } from '../utils/supabaseClient';

/*
 * Potong stok otomatis berjalan di database (trigger zz_transaction_inventory_* pada
 * tabel transactions), sehingga berlaku untuk semua peran & semua jalur pembuatan nota
 * tanpa perlu hak UPDATE inventaris di sisi klien. Modul ini hanya mengelola aturannya,
 * penyesuaian stok manual, stock opname, dan riwayat mutasi.
 * Lihat supabase/migrations/20261204000000_inventaris_potong_stok_otomatis.sql
 */

/** Invalidasi semua cache yang ikut berubah ketika stok berubah. */
function invalidateStock(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
  queryClient.invalidateQueries({ queryKey: ['inventory_summary'] });
  queryClient.invalidateQueries({ queryKey: ['inventory_movements'] });
}

// ============================================
// ATURAN POTONG STOK
// ============================================

type RecipeRow = {
  id: string;
  inventory_item_id: string;
  service_id: string | null;
  basis: string;
  amount: number | string;
  is_active: boolean;
  store_id: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export function mapRecipe(r: RecipeRow): InventoryRecipe {
  return {
    id: String(r.id),
    inventoryItemId: r.inventory_item_id,
    serviceId: r.service_id ?? null,
    basis: (r.basis === 'per_transaksi' ? 'per_transaksi' : 'per_unit') as InventoryRecipeBasis,
    amount: Number(r.amount) || 0,
    isActive: r.is_active !== false,
    storeId: r.store_id,
    createdAt: r.created_at ? new Date(r.created_at) : undefined,
    updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
  };
}

export async function fetchRecipes(storeId?: string): Promise<InventoryRecipe[]> {
  let query = supabase.from('inventory_recipes').select('*').order('created_at');
  if (storeId && storeId !== 'all') {
    query = query.eq('store_id', storeId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((r) => mapRecipe(r as RecipeRow));
}

export function useRecipes(storeId?: string) {
  return useQuery({
    queryKey: ['inventory_recipes', storeId],
    queryFn: () => fetchRecipes(storeId),
    staleTime: 5 * 60 * 1000,
  });
}

export type RecipeInput = Pick<
  InventoryRecipe,
  'inventoryItemId' | 'serviceId' | 'basis' | 'amount' | 'isActive'
> & { id?: string };

export function useRecipeMutations() {
  const queryClient = useQueryClient();
  const onSuccess = () => queryClient.invalidateQueries({ queryKey: ['inventory_recipes'] });

  const saveRecipe = useMutation({
    mutationFn: async (recipe: RecipeInput) => {
      // store_id diisi trigger dari cabang item, jadi tidak dikirim dari klien.
      const payload = {
        inventory_item_id: recipe.inventoryItemId,
        service_id: recipe.serviceId,
        basis: recipe.basis,
        amount: recipe.amount,
        is_active: recipe.isActive,
      };
      const request = recipe.id
        ? supabase.from('inventory_recipes').update(payload).eq('id', recipe.id)
        : supabase
            .from('inventory_recipes')
            .insert(payload as typeof payload & { store_id: string });
      const { data, error } = await request.select().single();
      if (error) {
        if (error.code === '23505') {
          throw new Error('Aturan untuk item, layanan, dan dasar hitung yang sama sudah ada.', {
            cause: error,
          });
        }
        throw error;
      }
      return mapRecipe(data as RecipeRow);
    },
    onSuccess,
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess,
  });

  return {
    saveRecipe: saveRecipe.mutateAsync,
    deleteRecipe: deleteRecipe.mutateAsync,
    isLoading: saveRecipe.isPending || deleteRecipe.isPending,
  };
}

/** Garis nota minimal yang dibutuhkan untuk memperkirakan pemakaian bahan. */
export interface UsageLine {
  serviceId: string;
  quantity: number;
}

/**
 * Perkiraan pemakaian per item untuk sebuah nota — logika yang sama dengan fungsi
 * database deduct_inventory_for_transaction (dipakai untuk pratinjau di UI & tes).
 */
export function estimateInventoryUsage(
  recipes: InventoryRecipe[],
  lines: UsageLine[],
): Map<string, number> {
  const usage = new Map<string, number>();
  for (const recipe of recipes) {
    if (!recipe.isActive) continue;
    const matching = lines.filter((l) => !recipe.serviceId || l.serviceId === recipe.serviceId);
    if (matching.length === 0) continue;
    const amount =
      recipe.basis === 'per_unit'
        ? recipe.amount * matching.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0)
        : recipe.amount;
    if (amount > 0) {
      usage.set(recipe.inventoryItemId, (usage.get(recipe.inventoryItemId) ?? 0) + amount);
    }
  }
  return usage;
}

// ============================================
// PENYESUAIAN STOK MANUAL
// ============================================

export interface StockAdjustInput {
  itemId: string;
  mode: StockAdjustMode;
  value: number;
  note?: string;
}

/** Ubah stok lewat RPC agar tercatat di buku besar & bisa dipakai Kasir/Operator. */
export async function adjustInventoryStock(input: StockAdjustInput): Promise<number> {
  const { data, error } = await supabase.rpc('adjust_inventory_stock', {
    p_item_id: input.itemId,
    p_mode: input.mode,
    p_value: input.value,
    p_note: input.note ?? undefined,
  });
  if (error) throw error;
  return Number(data);
}

export function useStockAdjust() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: adjustInventoryStock,
    onSuccess: () => invalidateStock(queryClient),
  });
  return { adjustStock: mutation.mutateAsync, isLoading: mutation.isPending };
}

// ============================================
// STOCK OPNAME
// ============================================

export async function fetchStockOpname(
  storeId?: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<StockOpname[]> {
  let query = supabase
    .from('stock_opname')
    .select('*, inventory_items(name)')
    .order('recorded_at', { ascending: false })
    .limit(200);

  if (storeId && storeId !== 'all') query = query.eq('store_id', storeId);
  if (dateFrom) query = query.gte('recorded_at', dateFrom);
  if (dateTo) query = query.lte('recorded_at', dateTo);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((o) => ({
    id: String(o.id),
    inventoryItemId: o.inventory_item_id || '',
    inventoryItemName: (o.inventory_items as { name?: string } | null)?.name,
    virtualStock: Number(o.virtual_stock),
    physicalStock: Number(o.physical_stock),
    discrepancy: Number(o.discrepancy) || 0,
    notes: o.notes || undefined,
    recordedBy: o.recorded_by || undefined,
    recordedAt: new Date(o.recorded_at || ''),
    storeId: o.store_id || '',
  }));
}

export function useStockOpname(storeId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['stock_opname', storeId, dateFrom, dateTo],
    queryFn: () => fetchStockOpname(storeId, dateFrom, dateTo),
    staleTime: 60 * 1000,
  });
}

export function useStockOpnameMutations() {
  const queryClient = useQueryClient();

  const recordOpname = useMutation({
    mutationFn: async (opname: {
      inventoryItemId: string;
      physicalStock: number;
      notes?: string;
    }) => {
      // Atomik di database: catat opname + set stok = stok fisik + tulis buku besar.
      const { data, error } = await supabase.rpc('record_stock_opname', {
        p_item_id: opname.inventoryItemId,
        p_physical_stock: opname.physicalStock,
        p_notes: opname.notes ?? undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_opname'] });
      invalidateStock(queryClient);
    },
  });

  return {
    recordOpname: recordOpname.mutateAsync,
    isLoading: recordOpname.isPending,
  };
}

// ============================================
// RIWAYAT MUTASI STOK
// ============================================

export interface MovementFilter {
  storeId?: string;
  itemId?: string;
  kind?: InventoryMovementKind;
  limit?: number;
}

export async function fetchInventoryMovements(
  filter: MovementFilter = {},
): Promise<InventoryMovement[]> {
  const { storeId, itemId, kind, limit = 100 } = filter;
  let query = supabase
    .from('inventory_movements')
    .select('*, inventory_items(name), transactions("invoiceCode"), profiles(name)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (storeId && storeId !== 'all') query = query.eq('store_id', storeId);
  if (itemId) query = query.eq('inventory_item_id', itemId);
  if (kind) query = query.eq('kind', kind);

  const { data, error } = await query;
  if (error) throw error;

  return ((data || []) as unknown as Record<string, unknown>[]).map((m) => ({
    id: String(m.id),
    inventoryItemId: String(m.inventory_item_id),
    inventoryItemName: (m.inventory_items as { name?: string } | null)?.name,
    transactionId: (m.transaction_id as string | null) || undefined,
    invoiceCode: (m.transactions as { invoiceCode?: string } | null)?.invoiceCode || undefined,
    kind: m.kind as InventoryMovementKind,
    quantity: Number(m.quantity),
    stockBefore: Number(m.stock_before),
    stockAfter: Number(m.stock_after),
    note: (m.note as string | null) || undefined,
    createdByName: (m.profiles as { name?: string } | null)?.name,
    createdAt: new Date(String(m.created_at)),
    storeId: (m.store_id as string | null) || '',
  }));
}

export function useInventoryMovements(filter: MovementFilter, enabled = true) {
  return useQuery({
    queryKey: ['inventory_movements', filter],
    queryFn: () => fetchInventoryMovements(filter),
    enabled,
    staleTime: 30 * 1000,
  });
}

export const MOVEMENT_KIND_LABELS: Record<InventoryMovementKind, string> = {
  awal: 'Stok awal',
  restok: 'Restok',
  penyesuaian: 'Penyesuaian',
  opname: 'Stock opname',
  transaksi: 'Potong otomatis',
  koreksi_transaksi: 'Koreksi nota',
};

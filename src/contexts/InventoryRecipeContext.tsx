import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { InventoryRecipe, StockOpname, InventoryUsageLog } from '../types';
import { supabase } from '../utils/supabaseClient';

// ============================================
// RECIPE OPERATIONS
// ============================================

export async function fetchRecipes(storeId?: string): Promise<InventoryRecipe[]> {
  let query = supabase.from('inventory_recipes').select('*');
  if (storeId && storeId !== 'all') {
    query = query.eq('store_id', storeId);
  }
  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map((r) => ({
    id: String(r.id),
    inventoryItemId: r.inventory_item_id || '',
    usagePerKg: r.usage_per_kg,
    storeId: r.store_id || '',
    createdAt: r.created_at ? new Date(r.created_at) : undefined,
    updatedAt: r.updated_at ? new Date(r.updated_at) : undefined,
  }));
}

export function useRecipes(storeId?: string) {
  return useQuery({
    queryKey: ['inventory_recipes', storeId],
    queryFn: () => fetchRecipes(storeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecipeMutations() {
  const queryClient = useQueryClient();

  const upsertRecipe = useMutation({
    mutationFn: async (recipe: Omit<InventoryRecipe, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      const payload = {
        inventory_item_id: recipe.inventoryItemId,
        usage_per_kg: recipe.usagePerKg,
        store_id: recipe.storeId,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase.from('inventory_recipes')
        .upsert(payload, { onConflict: 'inventory_item_id,store_id' })
        .select();
      
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory_recipes'] }),
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_recipes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory_recipes'] }),
  });

  return {
    upsertRecipe: upsertRecipe.mutateAsync,
    deleteRecipe: deleteRecipe.mutateAsync,
    isLoading: upsertRecipe.isPending || deleteRecipe.isPending,
  };
}

// ============================================
// AUTO-DEDUCT INVENTORY (Called after transaction)
// ============================================

/**
 * Automatically deduct 1 sachet sabun liquid from inventory when a transaction is created
 * Simple logic: 1 transaksi = 1 sachet sabun liquid
 * @param transactionId - The transaction ID for audit trail
 * @param storeId - Store ID
 */
export async function autoDeductInventory(
  transactionId: string,
  storeId: string
): Promise<{ success: boolean; deduction?: { itemName: string; quantity: number } }> {
  try {
    // Find "sabun liquid" inventory item (case insensitive)
    const { data: sabunItems, error: fetchError } = await supabase
      .from('inventory_items')
      .select('id, name, stock')
      .eq('storeId', storeId)
      .or('name.ilike.%sabun%,name.ilike.%liquid%,name.ilike.%deterjen%,name.ilike.%sachet%')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching sabun inventory:', fetchError);
      return { success: false };
    }

    if (!sabunItems || sabunItems.length === 0) {
      // No sabun/liquid/deterjen item found in inventory for store
      return { success: true }; // No item to deduct, but not an error
    }

    const sabunItem = sabunItems[0];
    const currentStock = sabunItem.stock ?? 0;
    const newStock = currentStock - 1; // Deduct 1 sachet per transaction

    // Update stock
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ stock: newStock })
      .eq('id', sabunItem.id);

    if (updateError) {
      console.error('Error updating sabun stock:', updateError);
      return { success: false };
    }

    // Log usage for audit trail (optional - table may not exist yet)
    try {
      await supabase.from('inventory_usage_log').insert({
        inventory_item_id: sabunItem.id,
        transaction_id: transactionId,
        quantity_used: 1,
        total_kg: 0,
        usage_per_kg: 0,
        store_id: storeId,
      });
    } catch {
      // Usage log insert skipped (table may not exist)
    }

    return { 
      success: true, 
      deduction: { itemName: sabunItem.name, quantity: 1 } 
    };
  } catch (error) {
    console.error('Auto-deduct error:', error);
    return { success: false };
  }
}

// ============================================
// STOCK OPNAME OPERATIONS
// ============================================

export async function fetchStockOpname(
  storeId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<StockOpname[]> {
  let query = supabase.from('stock_opname')
    .select('*, inventory_items(name)')
    .order('recorded_at', { ascending: false });

  if (storeId && storeId !== 'all') {
    query = query.eq('store_id', storeId);
  }
  if (dateFrom) {
    query = query.gte('recorded_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('recorded_at', dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((o) => ({
    id: String(o.id),
    inventoryItemId: o.inventory_item_id || '',
    inventoryItemName: o.inventory_items?.name,
    virtualStock: o.virtual_stock,
    physicalStock: o.physical_stock,
    discrepancy: o.discrepancy || 0,
    notes: o.notes || undefined,
    recordedBy: o.recorded_by || '',
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
    mutationFn: async (opname: Omit<StockOpname, 'id' | 'discrepancy' | 'recordedAt'>) => {
      const { data, error } = await supabase.from('stock_opname')
        .insert({
          inventory_item_id: opname.inventoryItemId,
          virtual_stock: opname.virtualStock,
          physical_stock: opname.physicalStock,
          notes: opname.notes,
          recorded_by: opname.recordedBy,
          store_id: opname.storeId,
        })
        .select();

      if (error) throw error;

      // Reset stock to match physical after opname
      await supabase
        .from('inventory_items')
        .update({ stock: opname.physicalStock })
        .eq('id', opname.inventoryItemId);

      return data?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_opname'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  return {
    recordOpname: recordOpname.mutateAsync,
    isLoading: recordOpname.isPending,
  };
}

// ============================================
// USAGE LOG (for reports)
// ============================================

export async function fetchUsageLog(
  storeId?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<InventoryUsageLog[]> {
  let query = supabase.from('inventory_usage_log')
    .select('*, inventory_items(name)')
    .order('created_at', { ascending: false });

  if (storeId && storeId !== 'all') {
    query = query.eq('store_id', storeId);
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((log) => ({
    id: String(log.id),
    inventoryItemId: log.inventory_item_id || '',
    inventoryItemName: log.inventory_items?.name,
    transactionId: log.transaction_id || undefined,
    quantityUsed: log.quantity_used,
    totalKg: log.total_kg,
    usagePerKg: log.usage_per_kg,
    createdAt: new Date(log.created_at || ''),
    storeId: log.store_id || '',
  }));
}

export function useUsageLog(storeId?: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['inventory_usage_log', storeId, dateFrom, dateTo],
    queryFn: () => fetchUsageLog(storeId, dateFrom, dateTo),
    staleTime: 60 * 1000,
  });
}

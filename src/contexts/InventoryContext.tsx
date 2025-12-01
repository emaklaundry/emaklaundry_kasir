import { useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryItem } from '../../types';
import { supabase } from '../utils/supabaseClient';

export interface InventoryFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  storeId?: string;
}

export async function fetchInventory(
  filter: InventoryFilter = {},
): Promise<{ data: InventoryItem[]; count: number }> {
  const { page = 1, pageSize = 50, searchTerm, storeId } = filter;
  let query = supabase.from('inventory_items').select('*', { count: 'exact' });
  if (storeId && storeId !== 'all') {
    query = query.eq('storeId', storeId);
  }
  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
}

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const addInventoryItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id'>) => {
      const { data, error } = await supabase.from('inventory_items').insert([item]).select();
      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const updateInventoryItem = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<InventoryItem> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase
        .from('inventory_items')
        .update(data)
        .eq('id', id)
        .select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const deleteInventoryItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  return {
    addInventoryItem: addInventoryItem.mutateAsync,
    updateInventoryItem: (id: string, data: Partial<InventoryItem>) =>
      updateInventoryItem.mutateAsync({ id, data }),
    deleteInventoryItem: deleteInventoryItem.mutateAsync,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryItem } from '../types';
import { supabase } from '../utils/supabaseClient';

const fetchInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase.from('inventory_items').select('*');
  if (error) throw error;
  return data || [];
};

export function useInventory() {
  const queryClient = useQueryClient();
  const { data: inventory = [], ...query } = useQuery({ queryKey: ['inventory'], queryFn: fetchInventory });

  const addInventoryItem = useMutation({
    mutationFn: async (item: Omit<InventoryItem, 'id'>) => {
      const { data, error } = await supabase.from('inventory_items').insert([item]).select();
      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });

  const updateInventoryItem = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<InventoryItem> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase.from('inventory_items').update(data).eq('id', id).select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });

  const deleteInventoryItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] })
  });

  return {
    inventory,
    addInventoryItem: addInventoryItem.mutateAsync,
    updateInventoryItem: (id: string, data: Partial<InventoryItem>) => updateInventoryItem.mutateAsync({ id, data }),
    deleteInventoryItem: deleteInventoryItem.mutateAsync,
    ...query
  };
}

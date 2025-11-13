import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Asset } from '@/types';
import { supabase } from '../../utils/supabaseClient';

const fetchAssets = async (): Promise<Asset[]> => {
  const { data, error } = await supabase.from('assets').select('*');
  if (error) throw error;
  return data || [];
};

export function useAssets() {
  const queryClient = useQueryClient();
  const { data: assets = [], ...query } = useQuery({ queryKey: ['assets'], queryFn: fetchAssets });

  const addAsset = useMutation({
    mutationFn: async (asset: Omit<Asset, 'id'>) => {
      const { error } = await supabase.from('assets').insert([asset]);
      if (error) throw error;
      // We invalidate and refetch the assets list, caller doesn't rely on returned row
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] })
  });

  const updateAsset = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Asset> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase.from('assets').update(data).eq('id', id).select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] })
  });

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assets'] })
  });

  return {
    assets,
    addAsset: addAsset.mutateAsync,
    updateAsset: (id: string, data: Partial<Asset>) => updateAsset.mutateAsync({ id, data }),
    deleteAsset: deleteAsset.mutateAsync,
    ...query
  };
}

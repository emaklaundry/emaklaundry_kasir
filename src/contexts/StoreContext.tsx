import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store } from '../types';
import { supabase } from '../utils/supabaseClient';
import { useSessionUserId } from '../hooks/useSessionUserId';

const fetchStores = async (): Promise<Store[]> => {
  const { data, error } = await supabase.from('stores').select('*');
  if (error) throw error;
  return (data || []).map((s) => ({
    ...s,
    address: s.address ?? undefined,
    isActive: s.isActive ?? true,
  })) as Store[];
};

export function useStores() {
  const queryClient = useQueryClient();
  const userId = useSessionUserId();
  const { data: stores = [], ...query } = useQuery({
    queryKey: ['stores', userId],
    queryFn: fetchStores,
    enabled: !!userId,
    // Data stores jarang berubah, cache 10 menit
    staleTime: 10 * 60 * 1000,
    // Jangan auto-refetch saat window focus (mencegah gangguan saat input)
    refetchOnWindowFocus: false,
  });

  const addStore = useMutation({
    mutationFn: async (store: Omit<Store, 'id'>) => {
      const { error } = await supabase.from('stores').insert([store]);
      if (error) throw error;
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
  });

  const updateStore = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Store> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase
        .from('stores')
        .update(data)
        .eq('id', id)
        .select();
      if (error) throw error;
      // RLS menolak tanpa error (0 baris berubah) bila user tidak berhak mengubah cabang.
      if (!updated?.length) {
        throw new Error('Data cabang tidak tersimpan: hanya Super Admin yang dapat mengubahnya.');
      }
      return updated[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
  });

  const deleteStore = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stores').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stores'] }),
  });

  return {
    stores,
    addStore: addStore.mutateAsync,
    updateStore: (id: string, data: Partial<Store>) => updateStore.mutateAsync({ id, data }),
    deleteStore: deleteStore.mutateAsync,
    ...query,
  };
}

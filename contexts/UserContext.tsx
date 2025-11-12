import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { User } from '../types';

const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return (data || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    storeId: p.store_id,
    isActive: p.isActive,
    canGiveDiscount: p.canGiveDiscount,
    createdAt: p.created_at ? new Date(p.created_at) : undefined,
  }));
};

export function useUsers() {
  const queryClient = useQueryClient();
  const { data: users = [], ...query } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const payload: any = {};
      if ('name' in data) payload.name = (data as any).name;
      if ('role' in data) payload.role = (data as any).role;
      if ('storeId' in data) payload.store_id = (data as any).storeId;
      if ('isActive' in data) payload.isActive = (data as any).isActive;
      if ('canGiveDiscount' in data) payload.canGiveDiscount = (data as any).canGiveDiscount;
      const { error } = await supabase.from('profiles').update(payload).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const createUser = useMutation({
    mutationFn: async (user: Omit<User, 'id' | 'createdAt'>) => {
      const payload: any = {
        name: user.name,
        role: user.role,
        store_id: user.storeId || null,
        isActive: user.isActive ?? true,
        canGiveDiscount: user.canGiveDiscount ?? false,
      };
      const { data, error } = await supabase.from('profiles').insert([payload]).select();
      if (error) throw error;
      const p = data?.[0];
      return p ? {
        id: p.id,
        name: p.name,
        role: p.role,
        storeId: p.store_id,
        isActive: p.isActive,
        canGiveDiscount: p.canGiveDiscount,
        createdAt: p.created_at ? new Date(p.created_at) : undefined,
      } as User : null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  return {
    users,
    updateUser: updateUser.mutateAsync,
    createUser: createUser.mutateAsync,
    deleteUser: deleteUser.mutateAsync,
    ...query
  };
}

export default useUsers;

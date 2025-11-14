import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/utils/supabaseClient';
import { User } from '@/types';

const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return (data || []).map((p: Record<string, unknown>) => ({
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
      const payload: Partial<User> = {};
      if ('name' in data) payload.name = (data as { name?: string }).name;
      if ('role' in data) payload.role = (data as { role?: string }).role;
      if ('storeId' in data) payload.store_id = (data as { storeId?: string }).storeId;
      if ('isActive' in data) payload.isActive = (data as { isActive?: boolean }).isActive;
      if ('canGiveDiscount' in data)
        payload.canGiveDiscount = (data as { canGiveDiscount?: boolean }).canGiveDiscount;
      const { error } = await supabase.from('profiles').update(payload).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const createUser = useMutation({
    mutationFn: async (user: Omit<User, 'id' | 'createdAt'>) => {
      const payload = {
        name: user.name,
        role: user.role,
        store_id: user.storeId || null,
        isActive: user.isActive ?? true,
        canGiveDiscount: user.canGiveDiscount ?? false,
      };
      const { data, error } = await supabase.from('profiles').insert([payload]).select();
      if (error) throw error;
      const p = data?.[0];
      return p
        ? ({
            id: p.id,
            name: p.name,
            role: p.role,
            storeId: p.store_id,
            isActive: p.isActive,
            canGiveDiscount: p.canGiveDiscount,
            createdAt: p.created_at ? new Date(p.created_at) : undefined,
          } as User)
        : null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  return {
    users,
    updateUser: (id: string, data: Partial<User>) => updateUser.mutateAsync({ id, data }),
    createUser: createUser.mutateAsync,
    deleteUser: deleteUser.mutateAsync,
    ...query,
  };
}

export default useUsers;

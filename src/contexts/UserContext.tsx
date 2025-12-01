import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

import { User } from '@/types';

type UserCreateInput = {
  email: string;
  password: string;
  name: string;
  role?: string;
  storeId?: string;
};
import type { Database } from '../types/supabase';
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  return ((data as ProfileRow[]) || []).map((p) => ({
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
      const payload: Record<string, unknown> = {};
      if ('name' in data && typeof data.name === 'string') payload.name = data.name;
      if ('role' in data && typeof data.role === 'string') payload.role = data.role;
      if ('storeId' in data && (typeof data.storeId === 'string' || data.storeId === null))
        payload.store_id = data.storeId;
      if ('isActive' in data && typeof data.isActive === 'boolean')
        payload.isActive = data.isActive;
      if ('canGiveDiscount' in data && typeof data.canGiveDiscount === 'boolean')
        payload.canGiveDiscount = data.canGiveDiscount;
      const { error } = await supabase.from('profiles').update(payload).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });

  // Admin create user: gunakan Supabase Auth Admin API
  // Anda butuh service_role key, sebaiknya lakukan di backend/Edge Function
  // createUser: pastikan metadata dikirim lengkap (full_name, role, store_id)
  const createUser = useMutation({
    mutationFn: async (newUser: UserCreateInput) => {
      // Kirim metadata sesuai kebutuhan backend
      const { email, password, name, role, storeId } = newUser;
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          name,
          role: role || 'Kasir',
          storeId,
        },
      });
      if (error) throw error;
      // Tangkap error dari Edge Function (misal: validasi SQL)
      if (data && data.error) {
        throw new Error(data.error);
      }
      return data;
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

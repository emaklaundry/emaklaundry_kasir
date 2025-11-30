import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { User } from '@/types';

// Sementara, sebaiknya generate dari Supabase type generator
interface ProfileRow {
  id: string;
  name: string;
  role: string;
  store_id: string | null;
  isActive: boolean;
  canGiveDiscount: boolean;
  created_at: string;
}

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
    const createUser = useMutation({
    mutationFn: async () => {
      // WARNING: Jangan expose service_role di frontend!
      // Ini hanya contoh, implementasi produksi harus di backend/Edge Function
      // const adminClient = createClient(supabaseUrl, serviceRoleKey);
      // const { data, error } = await adminClient.auth.admin.createUser({
      //   email: user.email,
      //   password: user.password,
      //   user_metadata: { name: user.name, role: user.role || 'Kasir', store_id: user.storeId || null },
      // });
      // if (error) throw error;
      // return data.user;
      throw new Error('Gunakan Edge Function atau backend untuk membuat user baru secara aman.');
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

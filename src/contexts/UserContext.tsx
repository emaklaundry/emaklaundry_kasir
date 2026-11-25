import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';

import { User } from '@/types';

export type UserCreateInput = {
  email: string;
  password: string;
  name: string;
  role?: string;
  storeId?: string;
  canGiveDiscount?: boolean;
};

/**
 * Ambil pesan galat dari Edge Function. Untuk respons non-2xx, supabase-js
 * hanya memberi pesan umum; pesan aslinya ada di body respons (`error.context`).
 */
export async function getFunctionErrorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: unknown } | null)?.context;
  if (context instanceof Response) {
    try {
      const body = await context.clone().json();
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      // body bukan JSON: pakai pesan umum di bawah
    }
  }
  return error instanceof Error ? error.message : String(error);
}
import type { Database } from '../types/supabase';
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const fetchUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('profiles').select('*').is('employee_id', null);
  if (error) throw error;
  return ((data as ProfileRow[]) || []).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    storeId: p.store_id ?? undefined,
    isActive: p.isActive ?? true,
    canGiveDiscount: p.canGiveDiscount ?? false,
    createdAt: p.created_at ? new Date(p.created_at) : undefined,
  })) as unknown as User[];
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

  // Membuat akun login baru lewat Edge Function create-user (memakai service role
  // di server; peran, cabang, dan izin pemanggil diperiksa di sana).
  const createUser = useMutation({
    mutationFn: async (newUser: UserCreateInput) => {
      const { email, password, name, role, storeId, canGiveDiscount } = newUser;
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email,
          password,
          name,
          role: role || 'Kasir',
          storeId,
          canGiveDiscount: canGiveDiscount === true,
        },
      });
      if (error) throw new Error(await getFunctionErrorMessage(error));
      if (data && data.error) throw new Error(data.error);
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

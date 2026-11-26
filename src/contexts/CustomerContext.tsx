import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer } from '../types';
import { supabase } from '../utils/supabaseClient';
import { escapeLikePattern } from '../utils/sanitize';
import { normalizePhone } from '../utils/phone';

export interface CustomerFilter {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  storeId?: string;
}

export async function fetchCustomers(
  filter: CustomerFilter = {},
): Promise<{ data: Customer[]; count: number }> {
  const { page = 1, pageSize = 50, searchTerm, storeId } = filter;
  let query = supabase.from('customers').select('*', { count: 'exact' });
  if (storeId && storeId !== 'all') {
    query = query.eq('storeId', storeId);
  }
  if (searchTerm && searchTerm.trim()) {
    const sanitized = escapeLikePattern(searchTerm.trim());
    query = query.ilike('name', `%${sanitized}%`);
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;
  // Convert null to undefined for optional fields
  const customers = (data || []).map((c) => ({
    ...c,
    address: c.address ?? undefined,
    notes: c.notes ?? undefined,
    phone: c.phone ?? undefined,
    storeId: c.storeId ?? undefined,
  })) as unknown as Customer[];
  return { data: customers, count: count || 0 };
}

// Kode Postgres untuk pelanggaran indeks unik (phone, storeId).
const UNIQUE_VIOLATION = '23505';

function toFriendlyCustomerError(error: { code?: string; message: string }, phone: string | null) {
  if (error.code === UNIQUE_VIOLATION) {
    const label = phone ? `Nomor telepon ${phone}` : 'Nomor telepon ini';
    return new Error(`${label} sudah terdaftar untuk pelanggan lain di cabang ini.`);
  }
  return error;
}

/**
 * Cari pelanggan di satu cabang berdasarkan nomor HP (format apa pun).
 * Indeks unik (phone, storeId) menjamin paling banyak satu hasil.
 */
export async function findCustomerByPhone(
  phone: string | null | undefined,
  storeId: string,
): Promise<Customer | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('storeId', storeId)
    .eq('phone', normalized)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
    notes: data.notes ?? undefined,
    storeId: data.storeId ?? undefined,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  } as unknown as Customer;
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const addCustomer = useMutation({
    mutationFn: async (customer: Omit<Customer, 'id'>) => {
      // Convert undefined to null for Supabase
      const phone = normalizePhone(customer.phone) || null;
      const dbCustomer = {
        ...customer,
        address: customer.address ?? null,
        notes: customer.notes ?? null,
        phone,
        storeId: customer.storeId ?? null,
      };
      const { data, error } = await supabase
        .from('customers')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([dbCustomer as any])
        .select();
      if (error) throw toFriendlyCustomerError(error, phone);
      return data?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const updateCustomer = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Customer> }) => {
      const { id, data } = variables;
      // Convert undefined to null for Supabase
      const dbData: Record<string, unknown> = {};
      for (const key in data) {
        dbData[key] = (data as Record<string, unknown>)[key] ?? null;
      }
      if ('phone' in dbData) {
        dbData.phone = normalizePhone(dbData.phone as string | null) || null;
      }
      const { data: updated, error } = await supabase
        .from('customers')
        .update(dbData)
        .eq('id', id)
        .select();
      if (error) throw toFriendlyCustomerError(error, (dbData.phone as string | null) ?? null);
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  return {
    addCustomer: addCustomer.mutateAsync,
    updateCustomer: (id: string, data: Partial<Customer>) =>
      updateCustomer.mutateAsync({ id, data }),
    deleteCustomer: deleteCustomer.mutateAsync,
  };
}

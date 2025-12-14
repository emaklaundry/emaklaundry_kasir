import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer } from '../types';
import { supabase } from '../utils/supabaseClient';

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
  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
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
    defaultDiscount: c.defaultDiscount ?? undefined,
    storeId: c.storeId ?? undefined,
  })) as unknown as Customer[];
  return { data: customers, count: count || 0 };
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const addCustomer = useMutation({
    mutationFn: async (customer: Omit<Customer, 'id'>) => {
      // Convert undefined to null for Supabase
      const dbCustomer = {
        ...customer,
        address: customer.address ?? null,
        notes: customer.notes ?? null,
        phone: customer.phone ?? null,
        defaultDiscount: customer.defaultDiscount ?? null,
        storeId: customer.storeId ?? null,
      };
      const { data, error } = await supabase
        .from('customers')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([dbCustomer as any])
        .select();
      if (error) throw error;
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
      const { data: updated, error } = await supabase
        .from('customers')
        .update(dbData)
        .eq('id', id)
        .select();
      if (error) throw error;
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

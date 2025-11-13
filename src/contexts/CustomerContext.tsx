import { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer } from '@/types';
import { supabase } from '@/utils/supabaseClient';

const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) throw error;
  return data || [];
};

export function useCustomers() {
  const queryClient = useQueryClient();
  const { data: customers = [], ...query } = useQuery({ queryKey: ['customers'], queryFn: fetchCustomers });

  const addCustomer = useMutation({
    mutationFn: async (customer: Omit<Customer, 'id'>) => {
      const { data, error } = await supabase.from('customers').insert([customer]).select();
      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });

  const updateCustomer = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Customer> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase.from('customers').update(data).eq('id', id).select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });

  const deleteCustomer = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] })
  });

  return {
    customers,
    addCustomer: addCustomer.mutateAsync,
    updateCustomer: (id: string, data: Partial<Customer>) => updateCustomer.mutateAsync({ id, data }),
    deleteCustomer: deleteCustomer.mutateAsync,
    ...query
  };
}
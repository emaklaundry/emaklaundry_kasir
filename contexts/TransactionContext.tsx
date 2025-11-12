import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '../types';
import { supabase } from '../utils/supabaseClient';

const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transactions').select('*');
  if (error) throw error;
  return data || [];
};

export function useTransactions() {
  const queryClient = useQueryClient();
  const { data: transactions = [], ...query } = useQuery({ queryKey: ['transactions'], queryFn: fetchTransactions });

  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id'>) => {
      const { data, error } = await supabase.from('transactions').insert([transaction]).select();
      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  const updateTransaction = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Transaction> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase.from('transactions').update(data).eq('id', id).select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  return {
    transactions,
    addTransaction: addTransaction.mutateAsync,
    updateTransaction: (id: string, data: Partial<Transaction>) => updateTransaction.mutateAsync({ id, data }),
    ...query
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expense } from '../../types';
import { supabase } from '../../utils/supabaseClient';

const fetchExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase.from('expenses').select('*');
  if (error) throw error;
  return data || [];
};

export function useExpenses() {
  const queryClient = useQueryClient();
  const { data: expenses = [], ...query } = useQuery({ queryKey: ['expenses'], queryFn: fetchExpenses });

  const addExpense = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id'>) => {
      const { error } = await supabase.from('expenses').insert([expense]);
      if (error) throw error;
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] })
  });

  const updateExpense = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Expense> }) => {
      const { id, data } = variables;
      const { data: updated, error } = await supabase.from('expenses').update(data).eq('id', id).select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] })
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] })
  });

  return {
    expenses,
    addExpense: addExpense.mutateAsync,
    updateExpense: (id: string, data: Partial<Expense>) => updateExpense.mutateAsync({ id, data }),
    deleteExpense: deleteExpense.mutateAsync,
    ...query
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Expense } from '../types';
import { supabase } from '../utils/supabaseClient';
import { can } from '../config/permissions';
import { useCurrentRole } from './TransactionContext';

const fetchExpenses = async (): Promise<Expense[]> => {
  const { data, error } = await supabase.from('expenses').select('*');
  if (error) throw error;
  return (data || []).map((e) => ({
    ...e,
    date: new Date(e.date),
    storeId: e.storeId ?? undefined,
    recurringTemplateId: e.recurringTemplateId ?? undefined,
    recurringPeriod: e.recurringPeriod ?? undefined,
    attendanceId: e.attendanceId ?? undefined,
  })) as Expense[];
};

export function useExpenses() {
  const queryClient = useQueryClient();
  // Daftar pengeluaran hanya bisa dibaca Admin & Super Admin (RLS). Kasir tetap
  // bisa mencatat pengeluaran (insert tanpa membaca balik).
  const canReadExpenses = can(useCurrentRole(), 'finance.view');
  const { data: expenses = [], ...query } = useQuery({
    queryKey: ['expenses'],
    queryFn: fetchExpenses,
    enabled: canReadExpenses,
  });

  const addExpense = useMutation({
    mutationFn: async (expense: Omit<Expense, 'id'>) => {
      // Convert Date to string and undefined to null for Supabase
      const dbExpense = {
        ...expense,
        date:
          expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : expense.date,
        storeId: expense.storeId ?? null,
      };
      const { error } = await supabase.from('expenses').insert([dbExpense]);
      if (error) throw error;
      return null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const updateExpense = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Expense> }) => {
      const { id, data } = variables;
      // Convert Date to string and undefined to null for Supabase
      const dbData: Record<string, unknown> = {};
      for (const key in data) {
        const value = (data as Record<string, unknown>)[key];
        if (key === 'date' && value instanceof Date) {
          dbData[key] = value.toISOString().split('T')[0];
        } else {
          dbData[key] = value ?? null;
        }
      }
      const { data: updated, error } = await supabase
        .from('expenses')
        .update(dbData)
        .eq('id', id)
        .select();
      if (error) throw error;
      return updated?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  });

  return {
    expenses,
    addExpense: addExpense.mutateAsync,
    updateExpense: (id: string, data: Partial<Expense>) => updateExpense.mutateAsync({ id, data }),
    deleteExpense: deleteExpense.mutateAsync,
    ...query,
  };
}

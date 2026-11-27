import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { MonthlyExpenseTemplate } from '../utils/monthlyExpenses';

export interface MonthlyExpenseRecord {
  id: string;
  storeId: string | null;
  templateId: string | null;
  period: string | null;
}

export interface MonthlyExpenseInput {
  storeId: string;
  templateId: string;
  period: string;
  date: string;
  description: string;
  category: string;
  amount: number;
}

const normalizeStoreIds = (storeIds: string[]) => [...new Set(storeIds)].sort();

export function useMonthlyExpenseTemplates(storeIds: string[]) {
  const queryClient = useQueryClient();
  const normalizedStoreIds = normalizeStoreIds(storeIds);
  const query = useQuery({
    queryKey: ['monthly-expense-templates', normalizedStoreIds],
    enabled: normalizedStoreIds.length > 0,
    queryFn: async (): Promise<MonthlyExpenseTemplate[]> => {
      const { data, error } = await supabase
        .from('monthly_expense_templates')
        .select('*')
        .in('store_id', normalizedStoreIds)
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return (data ?? []).map((template) => ({
        id: template.id,
        storeId: template.store_id,
        name: template.name,
        category: template.category,
        isActive: template.is_active,
        sortOrder: template.sort_order,
        defaultAmount: template.default_amount == null ? null : Number(template.default_amount),
      }));
    },
  });

  const addTemplateMutation = useMutation({
    mutationFn: async (
      template: Omit<MonthlyExpenseTemplate, 'id' | 'isActive'> & { storeId: string },
    ) => {
      const { error } = await supabase.from('monthly_expense_templates').insert({
        store_id: template.storeId,
        name: template.name.trim(),
        category: template.category,
        sort_order: template.sortOrder,
        default_amount: template.defaultAmount,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monthly-expense-templates'] }),
  });

  const setTemplateActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('monthly_expense_templates')
        .update({ is_active: isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monthly-expense-templates'] }),
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({
      id,
      name,
      category,
      defaultAmount,
    }: Pick<MonthlyExpenseTemplate, 'id' | 'name' | 'category' | 'defaultAmount'>) => {
      const { error } = await supabase
        .from('monthly_expense_templates')
        .update({ name: name.trim(), category, default_amount: defaultAmount })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monthly-expense-templates'] }),
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('monthly_expense_templates').delete().eq('id', id);
      // 23503 = FK expenses: tagihan sudah punya riwayat, jadi tidak boleh dihapus.
      if (error) throw Object.assign(new Error(error.message), { code: error.code });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monthly-expense-templates'] }),
  });

  return {
    templates: query.data ?? [],
    ...query,
    addTemplate: addTemplateMutation.mutateAsync,
    isAddingTemplate: addTemplateMutation.isPending,
    setTemplateActive: setTemplateActiveMutation.mutateAsync,
    updateTemplate: updateTemplateMutation.mutateAsync,
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    isUpdatingTemplate:
      setTemplateActiveMutation.isPending ||
      updateTemplateMutation.isPending ||
      deleteTemplateMutation.isPending,
  };
}

export function useMonthlyExpenseRecords(storeIds: string[], period: string) {
  const normalizedStoreIds = normalizeStoreIds(storeIds);
  return useQuery({
    queryKey: ['monthly-expense-records', period, normalizedStoreIds],
    enabled: normalizedStoreIds.length > 0,
    queryFn: async (): Promise<MonthlyExpenseRecord[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('id, storeId, recurringTemplateId, recurringPeriod')
        .eq('recurringPeriod', period)
        .in('storeId', normalizedStoreIds);
      if (error) throw error;
      return (data ?? []).map((record) => ({
        id: record.id,
        storeId: record.storeId,
        templateId: record.recurringTemplateId,
        period: record.recurringPeriod,
      }));
    },
  });
}

export function useSaveMonthlyExpenses() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (entries: MonthlyExpenseInput[]) => {
      const { error } = await supabase.from('expenses').insert(
        entries.map((entry) => ({
          storeId: entry.storeId,
          recurringTemplateId: entry.templateId,
          recurringPeriod: entry.period,
          date: entry.date,
          description: entry.description,
          category: entry.category,
          amount: entry.amount,
        })),
      );
      if (error) throw error;
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['expenses'] }),
        queryClient.invalidateQueries({ queryKey: ['monthly-expense-records'] }),
      ]),
    onError: () => queryClient.invalidateQueries({ queryKey: ['monthly-expense-records'] }),
  });

  return mutation;
}

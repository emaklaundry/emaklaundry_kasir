import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, updateTransactionProgress } from '../utils/supabaseClient';
import { Transaction } from '@/types';
// import { sanitizeTransactionUpdate } from '../../utils/sanitizeTransaction';

// Pagination-aware fetchTransactions

export interface TransactionFilter {
  page?: number;
  pageSize?: number;
  dateRange?: { from: string; to: string };
  storeId?: string;
  paymentStatus?: string;
  orderStatus?: string;
  enabled?: boolean; // Untuk optimasi query
}

const fetchTransactions = async (
  filter: TransactionFilter = {},
): Promise<{ data: Transaction[]; count: number }> => {
  const { page = 1, pageSize = 50, dateRange, storeId, paymentStatus, orderStatus } = filter;
  let query = supabase.from('transactions').select('*', { count: 'exact' });
  if (dateRange) {
    query = query.gte('createdAt', dateRange.from).lte('createdAt', dateRange.to);
  }
  if (storeId && storeId !== 'all') {
    query = query.eq('storeId', storeId);
  }
  if (paymentStatus) {
    query = query.eq('paymentStatus', paymentStatus);
  }
  if (orderStatus) {
    query = query.eq('orderStatus', orderStatus);
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], count: count || 0 };
};


export function useTransactions(filter: TransactionFilter = {}) {
  const queryClient = useQueryClient();
  // Ambil enabled dari filter, default true
  const { enabled = true, ...queryFilter } = filter;
  const { data: result, ...query } = useQuery({
    queryKey: ['transactions', queryFilter], // queryKey tidak mengandung enabled
    queryFn: () => fetchTransactions(queryFilter),
    keepPreviousData: true,
    enabled: enabled,
  });
  const transactions = result?.data || [];
  const totalCount = result?.count || 0;

  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id'>) => {
      const { data, error } = await supabase.from('transactions').insert([transaction]).select();
      if (error) throw error;
      return data?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });

  const updateTransaction = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Transaction> }) => {
      const { id, data } = variables;
      // Only allow status/progress fields to be updated via RPC
      const {
        amountPaid = undefined,
        change = undefined,
        paymentMethod = undefined,
        paymentStatus = undefined,
        orderStatus = undefined,
      } = data;

      // Call the secure RPC for progress/status changes
      const updated = await updateTransactionProgress(id, {
        amountPaid,
        change,
        paymentMethod,
        paymentStatus,
        orderStatus,
      });
      return updated || null;
    },
    // Perbaikan: invalidate detail transaksi juga
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (variables && variables.id) {
        queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
      }
    },
  });

  return {
    transactions,
    totalCount,
    addTransaction: addTransaction.mutateAsync,
    updateTransaction: (id: string, data: Partial<Transaction>) =>
      updateTransaction.mutateAsync({ id, data }),
    ...query,
  };
}

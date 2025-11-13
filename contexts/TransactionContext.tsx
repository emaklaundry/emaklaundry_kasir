import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Transaction } from '../types';
import { supabase } from '../utils/supabaseClient';
import { sanitizeTransactionUpdate } from '../utils/sanitizeTransaction';


// Pagination-aware fetchTransactions
export interface TransactionFilter {
  page?: number;
  pageSize?: number;
  dateRange?: { from: string; to: string };
  storeId?: string;
  paymentStatus?: string;
  orderStatus?: string;
}

const fetchTransactions = async (filter: TransactionFilter = {}): Promise<{ data: Transaction[]; count: number }> => {
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
  const {
    data: result,
    ...query
  } = useQuery({
    queryKey: ['transactions', filter],
    queryFn: () => fetchTransactions(filter),
    keepPreviousData: true
  });
  const transactions = result?.data || [];
  const totalCount = result?.count || 0;

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

      // Payload khusus untuk RPC
      const rpcPayload: {
        transaction_id_input: string;
        p_amount_paid?: number;
        p_change?: number;
        p_payment_method?: string;
        p_payment_status?: string;
        p_order_status?: string;
      } = {
        transaction_id_input: id,
        p_amount_paid: data.amountPaid,
        p_change: data.change,
        p_payment_method: data.paymentMethod,
        p_payment_status: data.paymentStatus,
        p_order_status: data.orderStatus,
      };

      // Panggil RPC, bukan update langsung
      const { data: updated, error } = await supabase.rpc(
        'update_transaction_progress',
        rpcPayload
      );

      if (error) throw error;
      // RPC mengembalikan array, ambil item pertama jika ada
      const resultData = Array.isArray(updated) ? updated[0] : updated;
      return resultData || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] })
  });

  return {
    transactions,
    totalCount,
    addTransaction: addTransaction.mutateAsync,
    updateTransaction: (id: string, data: Partial<Transaction>) => updateTransaction.mutateAsync({ id, data }),
    ...query
  };
}

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
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
    // Atur Start Date (Awal Hari Lokal)
    const fromDate = new Date(dateRange.from);
    fromDate.setHours(0, 0, 0, 0);
    // Atur End Date (Akhir Hari Lokal)
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    // Kirim sebagai ISO String (browser akan konversi ke UTC)
    query = query.gte('createdAt', fromDate.toISOString()).lte('createdAt', toDate.toISOString());
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
    queryKey: ['transactions', queryFilter],
    queryFn: () => fetchTransactions(queryFilter),
    placeholderData: keepPreviousData,
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
      // Pisahkan data untuk RPC dan update biasa
      const {
        amountPaid = undefined,
        change = undefined,
        paymentMethod = undefined,
        paymentStatus = undefined,
        orderStatus = undefined,
        ...otherFields
      } = data;

      let row = null;
      // 1. Jalankan RPC untuk update progress jika ada field terkait
      if (
        amountPaid !== undefined ||
        paymentStatus !== undefined ||
        orderStatus !== undefined
      ) {
        const updated = await updateTransactionProgress(id, {
          amountPaid,
          change,
          paymentMethod,
          paymentStatus,
          orderStatus,
        });
        if (Array.isArray(updated) && updated[0]) row = updated[0];
        else if (updated && typeof updated === 'object') row = updated;
      }
      // 2. Jalankan update standar untuk field lain (notes, estimatedCompletionDate, dll)
      if (Object.keys(otherFields).length > 0) {
        const { data: updatedRow, error } = await supabase
          .from('transactions')
          .update(otherFields)
          .eq('id', id)
          .select();
        if (error) throw error;
        if (updatedRow && updatedRow[0]) row = updatedRow[0];
      }
      if (!row) return null;
      // Explicitly map all required Transaction fields
      return {
        id: row.id ?? '',
        invoiceCode: row.invoiceCode ?? undefined,
        customerId: row.customerId ?? '',
        items: Array.isArray(row.items)
          ? (row.items as import('../types').TransactionItem[]).map((item) => ({
              ...item,
              itemDetails: item.itemDetails ?? [],
            }))
          : [],
        subtotal: row.subtotal ?? 0,
        discount: row.discount ?? 0,
        tax: row.tax ?? 0,
        total: row.total ?? 0,
        paymentStatus: row.paymentStatus as import('../types').PaymentStatus,
        orderStatus: row.orderStatus as import('../types').OrderStatus,
        createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
        estimatedCompletionDate: row.estimatedCompletionDate ?? '',
        amountPaid: row.amountPaid ?? 0,
        change: row.change ?? 0,
        paymentMethod: row.paymentMethod
          ? (row.paymentMethod as import('../types').PaymentMethod)
          : undefined,
        createdByUserId: row.createdByUserId ?? '',
        storeId: row.storeId ?? '',
        notes: row.notes ?? undefined,
        idempotencyKey: row.idempotencyKey ?? undefined,
      };
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

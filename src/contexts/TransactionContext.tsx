import { useContext } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { supabase, updateTransactionProgress } from '../utils/supabaseClient';
import { retrySupabaseOperation, verifyDataSaved } from '../utils/retryUtils';
import { Transaction, UserRole } from '@/types';
import AppContext from './AppContextContext';
import { mapDBtoTransaction, RawDBTransaction } from '../utils/mappers';
import { escapeLikePattern } from '../utils/sanitize';
// import { sanitizeTransactionUpdate } from '../../utils/sanitizeTransaction';

/**
 * Operator tidak punya akses baca ke tabel transactions & customers. Ia membaca
 * view transactions_operator: tanpa nominal, hanya pesanan aktif + yang Selesai
 * 7 hari terakhir, dengan kolom tambahan customerName.
 */
export const OPERATOR_TRANSACTIONS_VIEW = 'transactions_operator';

export const isOperatorRole = (role: UserRole | string | null | undefined): boolean =>
  role === UserRole.Operator;

/** Tabel/view tempat peran ini membaca transaksi. */
export const transactionSource = (role: UserRole | string | null | undefined) =>
  // Tipe Supabase hasil generate belum mengenal view ini; bentuk kolomnya sama.
  (isOperatorRole(role) ? OPERATOR_TRANSACTIONS_VIEW : 'transactions') as 'transactions';

/** Peran pengguna aktif tanpa melempar error bila dipakai di luar AppProvider (mis. tes). */
export const useCurrentRole = (): UserRole | undefined =>
  useContext(AppContext)?.currentUser?.role as UserRole | undefined;

/** Ambil satu transaksi dari sumber yang sesuai peran. */
export async function fetchTransactionRow(
  id: string,
  role: UserRole | string | null | undefined,
): Promise<RawDBTransaction | null> {
  const { data, error } = await supabase
    .from(transactionSource(role))
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as RawDBTransaction) ?? null;
}

/** Kolom yang boleh diubah Operator lewat RPC operator_update_transaction. */
const OPERATOR_EDITABLE_FIELDS = ['orderStatus', 'notes', 'estimatedCompletionDate'] as const;

async function operatorUpdateTransaction(
  id: string,
  data: Partial<Transaction>,
): Promise<RawDBTransaction | null> {
  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(data) as (keyof Transaction)[]) {
    const value = data[key];
    if (value === undefined) continue;
    if (!(OPERATOR_EDITABLE_FIELDS as readonly string[]).includes(key)) {
      throw new Error('Operator hanya dapat mengubah progres, catatan, dan estimasi selesai.');
    }
    patch[key] = value instanceof Date ? value.toISOString() : (value ?? null);
  }
  if (Object.keys(patch).length === 0) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rows, error } = await (supabase.rpc as any)('operator_update_transaction', {
    p_transaction_id: id,
    p_patch: patch,
  });
  if (error) throw error;
  const row = Array.isArray(rows) ? rows[0] : rows;
  return (row as RawDBTransaction) ?? null;
}

// Pagination-aware fetchTransactions

export interface TransactionFilter {
  page?: number;
  pageSize?: number;
  dateRange?: { from: string; to: string };
  storeId?: string;
  paymentStatus?: string;
  orderStatus?: string;
  /** Hanya transaksi milik pelanggan ini. */
  customerId?: string;
  /** Cari di kode invoice, nama pelanggan, atau nomor HP pelanggan (seluruh data). */
  searchTerm?: string;
  /** Kolom urutan (berlaku untuk seluruh data sebelum paginasi). Default: createdAt. */
  sortBy?: TransactionSortKey;
  /** Default: false (terbaru dulu). */
  sortAscending?: boolean;
  enabled?: boolean; // Untuk optimasi query
}

export type TransactionSortKey =
  | 'id'
  | 'customerName'
  | 'createdAt'
  | 'estimatedCompletionDate'
  | 'total'
  | 'paymentStatus'
  | 'orderStatus';

const fetchTransactions = async (
  filter: TransactionFilter = {},
  role?: UserRole,
): Promise<{ data: Transaction[]; count: number }> => {
  const isOperator = isOperatorRole(role);
  try {
    const {
      page = 1,
      pageSize = 50,
      dateRange,
      storeId,
      paymentStatus,
      orderStatus,
      customerId,
      searchTerm,
      sortBy = 'createdAt',
      sortAscending = false,
    } = filter;

    // Validasi input
    if (page < 1) {
      throw new Error('Page number must be greater than 0');
    }
    if (pageSize < 1 || pageSize > 1000) {
      throw new Error('Page size must be between 1 and 1000');
    }

    // Urut berdasarkan nama pelanggan butuh relasi customers di-embed
    // (view Operator sudah punya kolom customerName sendiri).
    const sortByCustomer = sortBy === 'customerName';
    let query = supabase
      .from(transactionSource(role))
      .select(sortByCustomer && !isOperator ? '*, customers(name)' : '*', { count: 'exact' });

    if (dateRange) {
      // Validasi date range
      if (!dateRange.from || !dateRange.to) {
        throw new Error('Invalid date range: both from and to are required');
      }

      // Atur Start Date (Awal Hari Lokal)
      const fromDate = new Date(dateRange.from);
      if (isNaN(fromDate.getTime())) {
        throw new Error('Invalid from date');
      }
      fromDate.setHours(0, 0, 0, 0);

      // Atur End Date (Akhir Hari Lokal)
      const toDate = new Date(dateRange.to);
      if (isNaN(toDate.getTime())) {
        throw new Error('Invalid to date');
      }
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

    if (customerId) {
      query = query.eq('customerId', customerId);
    }

    // Pencarian di server agar mencakup semua halaman, bukan hanya halaman aktif.
    // Karakter , ( ) " dibuang karena memecah sintaks filter or() PostgREST.
    const term = searchTerm
      ?.trim()
      .replace(/[,()"\\]/g, ' ')
      .trim();
    if (term && isOperator) {
      // Operator tidak membaca tabel customers: cari nama langsung di view-nya.
      const pattern = `%${escapeLikePattern(term)}%`;
      query = query.or(`invoiceCode.ilike.${pattern},customerName.ilike.${pattern}`);
    } else if (term) {
      const pattern = `%${escapeLikePattern(term)}%`;
      const { data: matchedCustomers, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .or(`name.ilike.${pattern},phone.ilike.${pattern}`)
        .limit(500);
      if (customerError) throw customerError;
      const ids = (matchedCustomers || []).map((c) => c.id);
      const conditions = [`invoiceCode.ilike.${pattern}`];
      if (ids.length > 0) conditions.push(`customerId.in.(${ids.join(',')})`);
      query = query.or(conditions.join(','));
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    // Urutan dikerjakan di server agar berlaku untuk semua halaman, bukan hanya halaman aktif.
    const ascending = sortAscending;
    if (sortByCustomer && isOperator) {
      query = query.order('customerName' as 'id', { ascending, nullsFirst: false });
    } else if (sortByCustomer) {
      query = query.order('customers(name)', { ascending, nullsFirst: false });
    } else if (sortBy === 'id') {
      query = query.order('invoiceCode', { ascending, nullsFirst: false });
    } else {
      query = query.order(sortBy, { ascending, nullsFirst: false });
    }
    // Kunci kedua yang stabil supaya baris tidak tumpang-tindih antar halaman.
    if (sortBy !== 'createdAt') query = query.order('createdAt', { ascending: false });
    query = query.order('id', { ascending: true }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    // Convert and normalize using centralized mapper
    const transactions = (data || []).map((t) =>
      mapDBtoTransaction(t as unknown as RawDBTransaction),
    );

    return { data: transactions, count: count || 0 };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export function useTransactions(filter: TransactionFilter = {}) {
  const queryClient = useQueryClient();
  const role = useCurrentRole();
  const isOperator = isOperatorRole(role);
  // Ambil enabled dari filter, default true
  const { enabled = true, ...queryFilter } = filter;
  const { data: result, ...query } = useQuery({
    // Peran ikut di kunci cache: Operator membaca sumber yang berbeda (tanpa nominal).
    queryKey: ['transactions', queryFilter, role ?? null],
    queryFn: () => fetchTransactions(queryFilter, role),
    placeholderData: keepPreviousData,
    enabled: enabled,
    // Disabled untuk POS: andalkan invalidateQueries setelah mutasi
    // Mencegah gangguan UX saat user pindah tab dan kembali ke form input
    refetchOnWindowFocus: false,
    staleTime: queryFilter.page !== undefined ? 30 * 1000 : 5 * 60 * 1000, // 30s untuk list, 5min untuk detail
  });
  const transactions = result?.data || [];
  const totalCount = result?.count || 0;

  const addTransaction = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id'>) => {
      try {
        // Convert undefined to null and Date to string for Supabase
        const dbTransaction = {
          ...transaction,
          customerId: transaction.customerId ?? null,
          createdByUserId: transaction.createdByUserId ?? null,
          estimatedCompletionDate: transaction.estimatedCompletionDate ?? null,
          paymentMethod: transaction.paymentMethod ?? null,
        };

        // Retry operation untuk memastikan sukses
        const savedTransaction = await retrySupabaseOperation(async () => {
          const { data, error } = await supabase
            .from('transactions')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .insert([dbTransaction as any])
            .select();
          if (error) throw error;
          if (!data || data.length === 0) {
            throw new Error('No data returned after insert');
          }
          return data[0];
        }, 'Insert Transaction');

        // Verify data benar-benar tersimpan
        const verified = await verifyDataSaved(
          async () => {
            const { data } = await supabase
              .from('transactions')
              .select('*')
              .eq('id', savedTransaction.id)
              .single();
            return data;
          },
          (data) => data !== null && data.id === savedTransaction.id,
          { maxAttempts: 3, pollInterval: 300 },
        );

        // Explicitly map keys to match Transaction interface using centralized mapper
        return mapDBtoTransaction(verified as unknown as RawDBTransaction);
      } catch (error) {
        console.error('Error adding transaction:', error);
        throw new Error(
          `Gagal menyimpan transaksi: ${error instanceof Error ? error.message : 'Unknown error'}. Data tidak tersimpan, silakan coba lagi.`,
          { cause: error },
        );
      }
    },
    onSuccess: () => {
      // Stok bahan sudah dipotong otomatis oleh trigger database saat nota disimpan
      // (aturan di Inventaris → Potong Otomatis). Cukup segarkan cache.
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory_movements'] });
    },
  });

  const updateTransaction = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Transaction> }) => {
      const { id, data } = variables;
      if (isOperator) {
        const row = await operatorUpdateTransaction(id, data);
        return row ? mapDBtoTransaction(row) : null;
      }
      // Pisahkan data untuk RPC dan update biasa
      const {
        amountPaid = undefined,
        change = undefined,
        paymentMethod = undefined,
        paymentStatus = undefined,
        orderStatus = undefined,
        supervisorApprovalId = undefined,
        ...otherFields
      } = data;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let row: any = null;
      // 1. Jalankan RPC untuk update progress jika ada field terkait.
      //    Izin PIN supervisor harus ikut di UPDATE yang sama dengan perubahan pembayaran.
      if (
        amountPaid !== undefined ||
        change !== undefined ||
        paymentMethod !== undefined ||
        paymentStatus !== undefined ||
        orderStatus !== undefined
      ) {
        const updated = await updateTransactionProgress(id, {
          amountPaid,
          change,
          paymentMethod,
          paymentStatus,
          orderStatus,
          supervisorApprovalId,
        });
        if (Array.isArray(updated) && updated[0]) row = updated[0];
        else if (updated && typeof updated === 'object') row = updated;
      }
      // 2. Jalankan update standar untuk field lain (notes, estimatedCompletionDate, dll)
      if (Object.keys(otherFields).length > 0) {
        // Convert undefined to null and Date to string for Supabase
        const dbOtherFields: Record<string, unknown> = {};
        for (const key in otherFields) {
          const value = (otherFields as Record<string, unknown>)[key];
          if (value instanceof Date) {
            dbOtherFields[key] = value.toISOString();
          } else {
            dbOtherFields[key] = value ?? null;
          }
        }
        const { data: updatedRow, error } = await supabase
          .from('transactions')
          .update(dbOtherFields)
          .eq('id', id)
          .select();
        if (error) throw error;
        if (updatedRow && updatedRow[0]) row = updatedRow[0];
      }
      if (!row) return null;
      return mapDBtoTransaction(row as unknown as RawDBTransaction);
    },
    // Conservative approach: TIDAK ada optimistic update
    // Tunggu hingga server confirm sebelum update UI
    onSuccess: async (result, variables) => {
      // Verify update berhasil
      if (result) {
        try {
          await verifyDataSaved(
            async () => fetchTransactionRow(variables.id, role),
            (data) => {
              if (!data) return false;
              // Verify semua field yang diupdate
              return Object.keys(variables.data).every((key) => {
                const expectedValue = variables.data[key as keyof typeof variables.data];
                const actualValue = (data as unknown as Record<string, unknown>)[key];
                return expectedValue === undefined || actualValue === expectedValue;
              });
            },
            { maxAttempts: 3, pollInterval: 300 },
          );
        } catch (verifyError) {
          console.error('Verification failed after update:', verifyError);
          throw new Error(
            'Update berhasil disimpan tetapi verifikasi gagal. Silakan refresh halaman.',
          );
        }
      }

      // Force refresh data dari server
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (variables && variables.id) {
        await queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] });
      }
    },
    onError: (error) => {
      console.error('Transaction update failed:', error);
      // Force refresh untuk memastikan UI sync dengan database
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

/**
 * Tandai transaksi sudah dikirimi struk/notifikasi WhatsApp (waktu sekarang).
 * Sengaja tidak lewat updateTransaction: verifikasinya membandingkan nilai persis,
 * sedangkan timestamptz yang dikembalikan Postgres berbeda format dari ISO yang dikirim.
 */
export async function markTransactionWhatsAppSent(id: string): Promise<string> {
  const sentAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('transactions')
    .update({ whatsappSentAt: sentAt })
    .eq('id', id)
    .select('id');
  if (error) throw error;
  // RLS menolak tanpa error: hasilnya 0 baris.
  if (!data || data.length === 0) {
    throw new Error('Tidak dapat menandai struk terkirim untuk transaksi ini.');
  }
  return sentAt;
}

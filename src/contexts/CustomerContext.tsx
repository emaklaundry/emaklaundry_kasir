import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Customer, DiscountLedgerEntry, DiscountLedgerKind } from '../types';
import { supabase } from '../utils/supabaseClient';
import { escapeLikePattern } from '../utils/sanitize';

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
  if (searchTerm && searchTerm.trim()) {
    const sanitized = escapeLikePattern(searchTerm.trim());
    query = query.ilike('name', `%${sanitized}%`);
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
    defaultDiscount: Number(c.defaultDiscount ?? 0),
    storeId: c.storeId ?? undefined,
  })) as unknown as Customer[];
  return { data: customers, count: count || 0 };
}

/** Query key saldo diskon satu pelanggan. Invalidate setelah transaksi/pembayaran. */
export const customerBalanceKey = (customerId: string | undefined) =>
  ['customer-balance', customerId] as const;

/** Ambil saldo diskon terbaru langsung dari database (tanpa cache daftar pelanggan). */
export async function fetchCustomerBalance(customerId: string): Promise<number> {
  const { data, error } = await supabase
    .from('customers')
    .select('defaultDiscount')
    .eq('id', customerId)
    .single();
  if (error) throw error;
  return Number(data?.defaultDiscount ?? 0);
}

/** Saldo diskon terbaru untuk pelanggan yang sedang dipilih. */
export function useCustomerBalance(customerId: string | undefined) {
  return useQuery({
    queryKey: customerBalanceKey(customerId),
    queryFn: () => fetchCustomerBalance(customerId as string),
    enabled: Boolean(customerId),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export async function fetchDiscountLedger(
  customerId: string,
  limit = 50,
): Promise<DiscountLedgerEntry[]> {
  const { data, error } = await supabase
    .from('customer_discount_ledger')
    .select('id, customer_id, transaction_id, kind, amount, balance_after, note, created_at')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    transactionId: row.transaction_id,
    kind: row.kind as DiscountLedgerKind,
    amount: Number(row.amount),
    balanceAfter: Number(row.balance_after),
    note: row.note,
    createdAt: new Date(row.created_at),
  }));
}

/** Riwayat perubahan saldo diskon satu pelanggan (terbaru dulu). */
export function useDiscountLedger(customerId: string | undefined) {
  return useQuery({
    queryKey: ['customer-discount-ledger', customerId],
    queryFn: () => fetchDiscountLedger(customerId as string),
    enabled: Boolean(customerId),
    staleTime: 30 * 1000,
  });
}

/** Invalidate semua data yang bergantung pada saldo diskon pelanggan. */
export function invalidateCustomerBalance(
  queryClient: ReturnType<typeof useQueryClient>,
  customerId?: string,
) {
  queryClient.invalidateQueries({ queryKey: ['customers'] });
  queryClient.invalidateQueries({ queryKey: ['customer-balance', customerId] });
  queryClient.invalidateQueries({ queryKey: ['customer-discount-ledger', customerId] });
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
        // Saldo awal selain 0 hanya diterima database dari Admin (dicatat di ledger).
        defaultDiscount: Math.max(0, Math.floor(Number(customer.defaultDiscount) || 0)),
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
      // Convert undefined to null for Supabase.
      // Saldo diskon sengaja TIDAK ikut di sini: nilai dari form bisa sudah usang
      // dan akan menimpa pemakaian saldo yang terjadi sementara. Gunakan
      // setDiscountBalance() yang memeriksa nilai lama di database.
      const dbData: Record<string, unknown> = {};
      for (const key in data) {
        if (key === 'defaultDiscount') continue;
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

  const setDiscountBalance = useMutation({
    mutationFn: async (variables: {
      customerId: string;
      expectedBalance: number;
      newBalance: number;
      note?: string;
    }) => {
      const { data, error } = await supabase.rpc('set_customer_discount_balance', {
        p_customer_id: variables.customerId,
        p_expected_balance: variables.expectedBalance,
        p_new_balance: variables.newBalance,
        p_note: variables.note,
      });
      if (error) throw error;
      return Number(data ?? variables.newBalance);
    },
    onSettled: (_data, _error, variables) =>
      invalidateCustomerBalance(queryClient, variables.customerId),
  });

  return {
    addCustomer: addCustomer.mutateAsync,
    updateCustomer: (id: string, data: Partial<Customer>) =>
      updateCustomer.mutateAsync({ id, data }),
    deleteCustomer: deleteCustomer.mutateAsync,
    setDiscountBalance: setDiscountBalance.mutateAsync,
  };
}

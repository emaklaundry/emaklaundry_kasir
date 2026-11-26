import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Customer } from '../types';
import { supabase } from '../utils/supabaseClient';
import { escapeLikePattern } from '../utils/sanitize';
import { normalizePhone } from '../utils/phone';

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
  // Urutan tetap wajib untuk paginasi: tanpa ORDER BY, halaman bisa tumpang-tindih.
  query = query.order('name').order('id').range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;
  // Convert null to undefined for optional fields
  const customers = (data || []).map((c) => ({
    ...c,
    address: c.address ?? undefined,
    notes: c.notes ?? undefined,
    phone: c.phone ?? undefined,
    storeId: c.storeId ?? undefined,
  })) as unknown as Customer[];
  return { data: customers, count: count || 0 };
}

export type CustomerSortKey =
  | 'name'
  | 'storeName'
  | 'createdAt'
  | 'transactionCount'
  | 'totalSpent';

export type CustomerActivity = 'all' | 'active' | 'inactive';

export interface CustomerWithStats extends Customer {
  transactionCount: number;
  totalSpent: number;
  storeName: string;
}

export interface CustomerStatsFilter extends CustomerFilter {
  /** Kolom urutan (berlaku untuk seluruh data sebelum paginasi). Default: name. */
  sortBy?: CustomerSortKey;
  /** Default: true. */
  sortAscending?: boolean;
  /** active = punya transaksi, inactive = belum pernah transaksi. */
  activity?: CustomerActivity;
}

/**
 * Pelanggan + statistik transaksi dari view `customers_with_stats`.
 * Urutan, filter aktivitas, dan paginasi dikerjakan server sehingga berlaku
 * untuk SEMUA pelanggan, bukan hanya halaman yang sedang tampil.
 */
export async function fetchCustomersWithStats(
  filter: CustomerStatsFilter = {},
): Promise<{ data: CustomerWithStats[]; count: number }> {
  const {
    page = 1,
    pageSize = 50,
    searchTerm,
    storeId,
    sortBy = 'name',
    sortAscending = true,
    activity = 'all',
  } = filter;
  // View belum ada di types/supabase.ts yang di-generate, jadi pakai nama tabel bertipe longgar.
  const view = 'customers_with_stats' as 'customers';
  let query = supabase.from(view).select('*', { count: 'exact' });
  if (storeId && storeId !== 'all') {
    query = query.eq('storeId', storeId);
  }
  if (searchTerm && searchTerm.trim()) {
    const sanitized = escapeLikePattern(searchTerm.trim());
    query = query.ilike('name', `%${sanitized}%`);
  }
  if (activity === 'active') {
    query = query.filter('transactionCount', 'gt', 0);
  } else if (activity === 'inactive') {
    query = query.filter('transactionCount', 'eq', 0);
  }
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.order(sortBy as 'name', { ascending: sortAscending, nullsFirst: false });
  if (sortBy !== 'name') query = query.order('name');
  query = query.order('id').range(from, to);
  const { data, error, count } = await query;
  if (error) throw error;
  const rows = (data || []) as unknown as Record<string, unknown>[];
  const customers = rows.map((c) => ({
    ...c,
    address: c.address ?? undefined,
    notes: c.notes ?? undefined,
    phone: c.phone ?? undefined,
    storeId: c.storeId ?? undefined,
    transactionCount: Number(c.transactionCount ?? 0),
    totalSpent: Number(c.totalSpent ?? 0),
    storeName: (c.storeName as string | null) ?? 'N/A',
  })) as unknown as CustomerWithStats[];
  return { data: customers, count: count || 0 };
}

/** Kunci cache bersama untuk daftar lengkap pelanggan. */
export const ALL_CUSTOMERS_QUERY_KEY = ['customers', 'all'] as const;

// Supabase membatasi satu respons ke 1.000 baris, jadi ambil per halaman.
const ALL_CUSTOMERS_CHUNK = 1000;

/**
 * Ambil SEMUA pelanggan yang boleh dilihat pengguna (per 1.000 baris).
 * Dipakai untuk mencocokkan nama pelanggan di transaksi; memakai satu
 * halaman 1.000 saja membuat pelanggan ke-1.001 dst tampil "N/A".
 */
export async function fetchAllCustomers(): Promise<{ data: Customer[]; count: number }> {
  const all: Customer[] = [];
  for (let page = 1; ; page++) {
    const { data, count } = await fetchCustomers({ page, pageSize: ALL_CUSTOMERS_CHUNK });
    all.push(...data);
    if (data.length < ALL_CUSTOMERS_CHUNK || all.length >= count) break;
  }
  return { data: all, count: all.length };
}

// Kode Postgres untuk pelanggaran indeks unik (phone, storeId).
const UNIQUE_VIOLATION = '23505';

function toFriendlyCustomerError(error: { code?: string; message: string }, phone: string | null) {
  if (error.code === UNIQUE_VIOLATION) {
    const label = phone ? `Nomor telepon ${phone}` : 'Nomor telepon ini';
    return new Error(`${label} sudah terdaftar untuk pelanggan lain di cabang ini.`);
  }
  return error;
}

/**
 * Cari pelanggan di satu cabang berdasarkan nomor HP (format apa pun).
 * Indeks unik (phone, storeId) menjamin paling banyak satu hasil.
 */
export async function findCustomerByPhone(
  phone: string | null | undefined,
  storeId: string,
): Promise<Customer | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('storeId', storeId)
    .eq('phone', normalized)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    phone: data.phone ?? undefined,
    address: data.address ?? undefined,
    notes: data.notes ?? undefined,
    storeId: data.storeId ?? undefined,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  } as unknown as Customer;
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const addCustomer = useMutation({
    mutationFn: async (customer: Omit<Customer, 'id'>) => {
      // Convert undefined to null for Supabase
      const phone = normalizePhone(customer.phone) || null;
      const dbCustomer = {
        ...customer,
        address: customer.address ?? null,
        notes: customer.notes ?? null,
        phone,
        storeId: customer.storeId ?? null,
      };
      const { data, error } = await supabase
        .from('customers')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert([dbCustomer as any])
        .select();
      if (error) throw toFriendlyCustomerError(error, phone);
      return data?.[0] || null;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });

  const updateCustomer = useMutation({
    mutationFn: async (variables: { id: string; data: Partial<Customer> }) => {
      const { id, data } = variables;
      // Convert undefined to null for Supabase
      const dbData: Record<string, unknown> = {};
      for (const key in data) {
        dbData[key] = (data as Record<string, unknown>)[key] ?? null;
      }
      if ('phone' in dbData) {
        dbData.phone = normalizePhone(dbData.phone as string | null) || null;
      }
      const { data: updated, error } = await supabase
        .from('customers')
        .update(dbData)
        .eq('id', id)
        .select();
      if (error) throw toFriendlyCustomerError(error, (dbData.phone as string | null) ?? null);
      // RLS menolak update tanpa error: hasilnya hanya 0 baris. Jangan laporkan sebagai berhasil.
      if (!updated || updated.length === 0) {
        throw new Error('Anda tidak memiliki izin untuk mengubah data pelanggan ini.');
      }
      return updated[0];
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

  return {
    addCustomer: addCustomer.mutateAsync,
    updateCustomer: (id: string, data: Partial<Customer>) =>
      updateCustomer.mutateAsync({ id, data }),
    deleteCustomer: deleteCustomer.mutateAsync,
  };
}

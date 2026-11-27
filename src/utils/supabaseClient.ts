import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined. Please check your .env file.');
}
if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined. Please check your .env file.');
}

// Pola Singleton agar tidak terjadi multiple GoTrueClient instance (HMR/dev)
const createSupabaseClient = () => createClient<Database>(supabaseUrl, supabaseAnonKey);

declare global {
  var supabase: ReturnType<typeof createSupabaseClient> | undefined;
}

export const supabase = globalThis.supabase ?? createSupabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.supabase = supabase;
}

/**
 * Helper RPC call to fetch a minimal, safe projection of a transaction for public/customer-facing views.
 * Calls `get_laundry_status(input_identifier text)` (SECURITY DEFINER, public). It matches the invoice
 * code exactly (or the transaction uuid) and returns a masked customer name.
 */
export async function getLaundryStatus(identifier: string) {
  const { data, error } = await supabase.rpc('get_laundry_status', {
    input_identifier: identifier,
  });
  if (error) throw error;
  // If data is empty or not found, throw error to match test expectation
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error('Kode invoice tidak ditemukan atau data tidak valid.');
  }
  // Return first element if array, else null
  return Array.isArray(data) ? data[0] : data;
}

/**
 * Helper RPC call to fetch public service list for a store.
 * Calls `get_public_services(store_id_input uuid)` defined in the DB.
 */
export async function getPublicServices(storeId: string) {
  const { data, error } = await supabase.rpc('get_public_services', { store_id_input: storeId });
  if (error) throw error;
  return data;
}

/**
 * Helper to call update_transaction_progress RPC which atomically updates allowed progress fields
 * and writes an audit log server-side.
 */
export async function updateTransactionProgress(
  transactionId: string,
  params: {
    amountPaid?: number | null;
    change?: number | null;
    paymentMethod?: string | null;
    paymentStatus?: string | null;
    orderStatus?: string | null;
    /** Izin PIN supervisor sekali pakai (wajib bagi Kasir yang mengubah pembayaran nota Lunas). */
    supervisorApprovalId?: string | null;
  },
) {
  const { amountPaid, change, paymentMethod, paymentStatus, orderStatus, supervisorApprovalId } =
    params;
  const { data, error } = await supabase.rpc('update_transaction_progress', {
    transaction_id_input: transactionId,
    p_amount_paid: amountPaid ?? undefined,
    p_change: change ?? undefined,
    p_payment_method: paymentMethod ?? undefined,
    p_payment_status: paymentStatus ?? undefined,
    p_order_status: orderStatus ?? undefined,
    p_supervisor_approval_id: supervisorApprovalId ?? undefined,
  });
  if (error) throw error;
  return data;
}


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

// Pass Database type for full type safety
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Helper RPC call to fetch a minimal, safe projection of a transaction for public/customer-facing views.
 * This calls the database function `get_laundry_status(transaction_id_input uuid)` which must be created
 * in the Supabase SQL editor and defined as SECURITY DEFINER (see database/get_laundry_status.sql).
 */
export async function getLaundryStatus(transactionId: string) {
  const { data, error } = await supabase.rpc('get_laundry_status', {
    transaction_id_input: transactionId,
  });
  if (error) throw error;
  return data;
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
    orderStatus?: string | null;
  },
) {
  const {
    amountPaid = null,
    change = null,
    paymentMethod = null,
    orderStatus = null,
  } = params;
  const { data, error } = await supabase.rpc('update_transaction_progress', {
    transaction_id_input: transactionId,
    p_amount_paid: amountPaid,
    p_change: change,
    p_payment_method: paymentMethod,
    p_order_status: orderStatus,
  });
  if (error) throw error;
  return data;
}

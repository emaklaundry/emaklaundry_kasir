/**
 * Helper untuk memanggil RPC complete_scheduled_maintenance
 */
export async function completeScheduledMaintenance(
  scheduleId: string,
  assetId: string,
  logDescription: string,
  frequencyValue: number,
  frequencyUnit: string,
) {
  const { error } = await supabase.rpc('complete_scheduled_maintenance', {
    p_schedule_id: scheduleId,
    p_asset_id: assetId,
    p_log_description: logDescription,
    p_frequency_value: frequencyValue,
    p_frequency_unit: frequencyUnit,
  });
  if (error) throw error;
}
/**
 * Helper untuk memanggil RPC bulk_update_order_status
 */
export async function bulkUpdateOrderStatus(
  transactionIds: string[],
  newStatus: string,
  userId: string,
) {
  const { data, error } = await supabase.rpc('bulk_update_order_status', {
    p_transaction_ids: transactionIds,
    p_new_status: newStatus,
    p_user_id: userId,
  });
  if (error) throw error;
  return data;
}
import { createClient } from '@supabase/supabase-js';
import type { LaundryStatus } from '@/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper RPC call to fetch a minimal, safe projection of a transaction for public/customer-facing views.
 * This calls the database function `get_laundry_status(transaction_id_input uuid)` which must be created
 * in the Supabase SQL editor and defined as SECURITY DEFINER (see database/get_laundry_status.sql).
 */
export async function getLaundryStatus(transactionId: string): Promise<LaundryStatus[]> {
  const { data, error } = await supabase.rpc('get_laundry_status', {
    transaction_id_input: transactionId,
  });
  if (error) throw error;
  return data as LaundryStatus[];
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
  },
) {
  const {
    amountPaid = null,
    change = null,
    paymentMethod = null,
    paymentStatus = null,
    orderStatus = null,
  } = params;
  const { data, error } = await supabase.rpc('update_transaction_progress', {
    transaction_id_input: transactionId,
    p_amount_paid: amountPaid,
    p_change: change,
    p_payment_method: paymentMethod,
    p_payment_status: paymentStatus,
    p_order_status: orderStatus,
  });
  if (error) throw error;
  return data;
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper RPC call to fetch a minimal, safe projection of a transaction for public/customer-facing views.
 * This calls the database function `get_laundry_status(transaction_id_input uuid)` which must be created
 * in the Supabase SQL editor and defined as SECURITY DEFINER (see database/get_laundry_status.sql).
 */
export async function getLaundryStatus(transactionId: string) {
	const { data, error } = await supabase.rpc('get_laundry_status', { transaction_id_input: transactionId });
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

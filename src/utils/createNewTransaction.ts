import { supabase } from '@/utils/supabaseClient';
import type { Transaction } from '@/types';

/**
 * Helper untuk membuat transaksi baru via RPC create_new_transaction
 */
export async function createNewTransaction({
  customerId,
  items,
  createdByUserId,
  storeId,
  notes,
  paymentMethod,
  isPayingNow,
  discountType = 'percent',
  discountValue = 0,
}: {
  customerId: string;
  items: any; // JSONB array
  createdByUserId: string;
  storeId: string;
  notes?: string;
  paymentMethod?: string;
  isPayingNow?: boolean;
  discountType?: 'percent' | 'fixed';
  discountValue?: number;
}): Promise<Transaction> {
  const { data, error } = await supabase.rpc('create_new_transaction', {
    p_customer_id: customerId,
    p_items: items,
    p_created_by_user_id: createdByUserId,
    p_store_id: storeId,
    p_notes: notes,
    p_payment_method: paymentMethod,
    p_is_paying_now: isPayingNow ?? false,
    p_discount_type: discountType,
    p_discount_value: discountValue,
  });
  if (error) throw error;
  if (!data || !data[0]) throw new Error('Transaksi gagal dibuat');
  return data[0] as Transaction;
}

import { supabase } from './supabaseClient';

/**
 * Riwayat cetak struk (tabel receipt_prints, migrasi 20261211000000).
 * Tipe Supabase hasil generate belum memuat tabel/RPC ini, jadi dipanggil tanpa tipe.
 * Semua fungsi di sini tidak pernah melempar error: kegagalan (offline, migrasi belum
 * dijalankan) hanya menghilangkan tanda CETAK ULANG, tidak boleh menghalangi cetak.
 */
type Untyped = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: unknown }>;
  from: (table: string) => {
    select: (
      cols: string,
      opts: { count: 'exact'; head: true },
    ) => {
      eq: (col: string, value: string) => PromiseLike<{ count: number | null; error: unknown }>;
    };
  };
};

const db = supabase as unknown as Untyped;

/** Berapa kali struk nota ini sudah dicetak; null bila tidak diketahui. */
export async function fetchReceiptPrintCount(transactionId: string): Promise<number | null> {
  try {
    const { count, error } = await db
      .from('receipt_prints')
      .select('id', { count: 'exact', head: true })
      .eq('transaction_id', transactionId);
    return error || count == null ? null : count;
  } catch {
    return null;
  }
}

/** Catat satu cetakan dan kembalikan nomornya (1 = asli); null bila gagal dicatat. */
export async function recordReceiptPrint(transactionId: string): Promise<number | null> {
  try {
    const { data, error } = await db.rpc('record_receipt_print', {
      p_transaction_id: transactionId,
    });
    return error || typeof data !== 'number' ? null : data;
  } catch {
    return null;
  }
}

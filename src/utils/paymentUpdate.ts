import { Transaction } from '../types';

type UpdateTransactionFn = (id: string, data: Partial<Transaction>) => Promise<unknown>;

export interface SavePaymentResult {
  /** Kelebihan pembulatan yang berhasil masuk saldo pelanggan (Rp). */
  creditSaved: number;
  /** Pesan galat kalau pembayaran tersimpan tetapi saldo pembulatan gagal dicatat. */
  creditError: string | null;
}

/**
 * Simpan pembayaran dari PaymentModal, lalu catat kelebihan pembulatan tunai.
 *
 * Dua langkah terpisah dengan sengaja: pembayaran (status Lunas) adalah yang
 * utama dan tidak boleh gagal karena saldo. Database baru menerima
 * roundingCredit setelah transaksi tercatat Lunas + Tunai, lalu menambah saldo
 * pelanggan secara atomik dan hanya sekali per transaksi.
 */
export async function savePaymentWithRoundingCredit(
  updateTransaction: UpdateTransactionFn,
  tx: Transaction,
): Promise<SavePaymentResult> {
  await updateTransaction(tx.id, {
    amountPaid: tx.amountPaid,
    change: tx.change,
    paymentMethod: tx.paymentMethod ?? undefined,
    paymentStatus: tx.paymentStatus,
  });

  const credit = tx.roundingCredit ?? 0;
  if (credit <= 0) return { creditSaved: 0, creditError: null };

  try {
    await updateTransaction(tx.id, { roundingCredit: credit });
    return { creditSaved: credit, creditError: null };
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Unknown error';
    console.error('Gagal mencatat saldo pembulatan:', error);
    return { creditSaved: 0, creditError: message };
  }
}

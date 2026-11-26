import { Transaction } from '../types';

type UpdateTransactionFn = (id: string, data: Partial<Transaction>) => Promise<unknown>;

/** Simpan hasil PaymentModal: hanya kolom pembayaran yang dikirim ke database. */
export async function savePayment(
  updateTransaction: UpdateTransactionFn,
  tx: Transaction,
): Promise<void> {
  await updateTransaction(tx.id, {
    amountPaid: tx.amountPaid,
    change: tx.change,
    paymentMethod: tx.paymentMethod ?? undefined,
    paymentStatus: tx.paymentStatus,
  });
}

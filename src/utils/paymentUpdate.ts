import { OrderStatus, PaymentStatus, Transaction } from '../types';

type UpdateTransactionFn = (id: string, data: Partial<Transaction>) => Promise<unknown>;

export interface SavePaymentOptions {
  /**
   * Pelunasan nota "Siap Diambil" berarti pelanggan sedang mengambil cucian,
   * jadi nota langsung ditutup jadi "Selesai". Hanya untuk peran yang boleh
   * menyelesaikan pesanan.
   */
  completeIfReady?: boolean;
}

/** Status pesanan setelah pembayaran disimpan. */
export function orderStatusAfterPayment(
  tx: Pick<Transaction, 'orderStatus' | 'paymentStatus'>,
  options: SavePaymentOptions = {},
): OrderStatus {
  if (
    options.completeIfReady &&
    tx.paymentStatus === PaymentStatus.Paid &&
    tx.orderStatus === OrderStatus.Ready
  ) {
    return OrderStatus.Completed;
  }
  return tx.orderStatus;
}

/**
 * Simpan hasil PaymentModal: hanya kolom pembayaran yang dikirim ke database,
 * ditambah status pesanan bila pelunasan menutup nota "Siap Diambil".
 * Mengembalikan status pesanan yang berlaku setelah disimpan.
 */
export async function savePayment(
  updateTransaction: UpdateTransactionFn,
  tx: Transaction,
  options: SavePaymentOptions = {},
): Promise<OrderStatus> {
  const nextOrderStatus = orderStatusAfterPayment(tx, options);
  await updateTransaction(tx.id, {
    amountPaid: tx.amountPaid,
    change: tx.change,
    paymentMethod: tx.paymentMethod ?? undefined,
    paymentStatus: tx.paymentStatus,
    ...(nextOrderStatus !== tx.orderStatus ? { orderStatus: nextOrderStatus } : {}),
  });
  return nextOrderStatus;
}

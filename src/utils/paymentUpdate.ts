import { OrderStatus, PaymentMethod, PaymentStatus, Transaction } from '../types';

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

/** Sisa tagihan sebuah nota (tidak pernah negatif). */
export function remainingBalance(tx: Pick<Transaction, 'total' | 'amountPaid'>): number {
  return Math.max(0, (tx.total || 0) - (tx.amountPaid || 0));
}

export interface BulkMarkPaidResult {
  /** Nota yang berhasil dilunasi beserta status pesanan setelahnya. */
  succeeded: { id: string; orderStatus: OrderStatus }[];
  /** Nota yang gagal disimpan. */
  failed: { id: string; error: string }[];
  /** Nota yang dilewati karena sudah lunas. */
  skipped: string[];
}

/**
 * Lunasi banyak nota sekaligus: setiap nota "Belum Lunas" dibayar penuh sebesar
 * sisa tagihannya dengan metode yang dipilih (tanpa kembalian). Nota yang sudah
 * lunas dilewati. Satu nota gagal tidak membatalkan nota lain.
 */
export async function bulkMarkPaid(
  updateTransaction: UpdateTransactionFn,
  transactions: Transaction[],
  method: PaymentMethod,
  options: SavePaymentOptions = {},
): Promise<BulkMarkPaidResult> {
  const result: BulkMarkPaidResult = { succeeded: [], failed: [], skipped: [] };
  const toPay = transactions.filter((tx) => {
    if (tx.paymentStatus === PaymentStatus.Paid) {
      result.skipped.push(tx.id);
      return false;
    }
    return true;
  });

  const settled = await Promise.allSettled(
    toPay.map((tx) =>
      savePayment(
        updateTransaction,
        {
          ...tx,
          amountPaid: tx.total,
          change: 0,
          paymentMethod: method,
          paymentStatus: PaymentStatus.Paid,
        },
        options,
      ),
    ),
  );

  settled.forEach((res, i) => {
    const id = toPay[i].id;
    if (res.status === 'fulfilled') {
      result.succeeded.push({ id, orderStatus: res.value });
    } else {
      const reason = res.reason;
      result.failed.push({ id, error: reason instanceof Error ? reason.message : String(reason) });
    }
  });

  return result;
}

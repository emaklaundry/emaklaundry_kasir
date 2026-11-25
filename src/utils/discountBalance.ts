/** Saldo diskon maksimal dipakai 10% dari subtotal per transaksi. */
export const MAX_BALANCE_DISCOUNT_RATE = 0.1;

/**
 * Hitung berapa saldo diskon pelanggan yang dipakai di transaksi ini.
 *
 * Nilainya adalah yang terkecil dari:
 *   - saldo pelanggan,
 *   - 10% subtotal (dibulatkan ke bawah, sama dengan pengecekan di database),
 *   - sisa tagihan setelah diskon lain (supaya total tidak minus).
 */
export function calculateBalanceUsage(
  balance: number | null | undefined,
  subtotal: number,
  otherDiscount = 0,
): number {
  const safeBalance = Math.max(0, Math.floor(Number(balance) || 0));
  const maxByRate = Math.max(0, Math.floor(subtotal * MAX_BALANCE_DISCOUNT_RATE));
  const remaining = Math.max(0, Math.floor(subtotal - otherDiscount));
  return Math.min(safeBalance, maxByRate, remaining);
}

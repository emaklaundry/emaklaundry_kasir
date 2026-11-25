import { PaymentMethod } from '../types';

/** Pembayaran tunai dibulatkan ke atas ke kelipatan nilai ini (Rupiah). */
export const CASH_ROUNDING_STEP = 500;

export interface CashRoundingResult {
  /** Jumlah yang harus diterima kasir (sudah dibulatkan untuk tunai). */
  amountDue: number;
  /** Kelebihan pembulatan yang masuk ke saldo diskon pelanggan. */
  roundingCredit: number;
  shouldRound: boolean;
}

/**
 * Pembulatan pembayaran tunai.
 *
 * Aturan Emak Laundry: tagihan TUNAI dibulatkan KE ATAS ke kelipatan Rp500.
 * Kelebihannya (maks Rp499) tidak hilang, tetapi masuk ke saldo diskon
 * pelanggan dan bisa dipakai di transaksi berikutnya. Total transaksi
 * (pendapatan toko) tetap nilai aslinya.
 *
 * Pembayaran non-tunai (QRIS, transfer) dibayar pas tanpa pembulatan.
 * Tanpa pelanggan terdaftar, kelebihan tidak bisa disimpan, jadi tidak
 * dibulatkan.
 */
export function calculateCashRounding(
  amount: number,
  paymentMethod: PaymentMethod | undefined,
  options: { hasCustomer?: boolean; step?: number } = {},
): CashRoundingResult {
  const { hasCustomer = true, step = CASH_ROUNDING_STEP } = options;
  const safeAmount = Math.max(0, Math.round(amount));
  const remainder = safeAmount % step;
  const shouldRound =
    paymentMethod === PaymentMethod.Cash && hasCustomer && safeAmount > 0 && remainder > 0;
  const roundingCredit = shouldRound ? step - remainder : 0;
  return {
    amountDue: safeAmount + roundingCredit,
    roundingCredit,
    shouldRound,
  };
}

import { PaymentMethod } from '../types';

export interface RoundingResult {
  roundedTotal: number;
  roundingDiscount: number;
  shouldRound: boolean;
}

/**
 * Calculate rounding for a transaction total.
 * Only rounds down for Cash payments when the total has a remainder < precision.
 * @param rawTotal - The raw total before rounding
 * @param paymentMethod - The payment method (only Cash triggers rounding)
 * @param precision - Rounding precision (default 500 for Rp 500)
 */
export function calculateRounding(
  rawTotal: number,
  paymentMethod: PaymentMethod | undefined,
  precision: number = 500,
): RoundingResult {
  const remainder = rawTotal % precision;
  const shouldRound =
    paymentMethod === PaymentMethod.Cash && remainder > 0 && remainder < precision;
  return {
    roundedTotal: shouldRound ? rawTotal - remainder : rawTotal,
    roundingDiscount: shouldRound ? remainder : 0,
    shouldRound,
  };
}

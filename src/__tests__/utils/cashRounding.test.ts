import { describe, it, expect } from 'vitest';
import { calculateCashRounding } from '../../utils/roundingUtils';
import { calculateBalanceUsage } from '../../utils/discountBalance';
import { PaymentMethod } from '../../types';

/**
 * Aturan bisnis:
 * - Hanya pembayaran tunai yang dibulatkan, KE ATAS ke kelipatan Rp500.
 * - Kelebihan pembulatan masuk ke saldo diskon pelanggan.
 * - Saldo dipakai maksimal 10% subtotal per transaksi.
 */
describe('calculateCashRounding', () => {
  it.each([
    [10350, 10500, 150],
    [10750, 11000, 250],
    [10100, 10500, 400],
    [10499, 10500, 1],
    [10001, 10500, 499],
    [127650, 128000, 350],
    [23300, 23500, 200],
  ])('tunai Rp%i dibulatkan ke Rp%i, kelebihan Rp%i masuk saldo', (amount, due, credit) => {
    const r = calculateCashRounding(amount, PaymentMethod.Cash);
    expect(r.amountDue).toBe(due);
    expect(r.roundingCredit).toBe(credit);
    expect(r.shouldRound).toBe(true);
    expect(r.amountDue % 500).toBe(0);
    expect(r.amountDue - amount).toBe(r.roundingCredit);
  });

  it.each([10000, 10500, 11000, 500])('kelipatan Rp500 (Rp%i) tidak dibulatkan', (amount) => {
    const r = calculateCashRounding(amount, PaymentMethod.Cash);
    expect(r).toEqual({ amountDue: amount, roundingCredit: 0, shouldRound: false });
  });

  it.each([PaymentMethod.QRIS, PaymentMethod.Transfer, undefined])(
    'non-tunai (%s) dibayar pas',
    (method) => {
      const r = calculateCashRounding(10350, method);
      expect(r).toEqual({ amountDue: 10350, roundingCredit: 0, shouldRound: false });
    },
  );

  it('tanpa pelanggan terdaftar tidak dibulatkan (kelebihan tidak bisa disimpan)', () => {
    const r = calculateCashRounding(10350, PaymentMethod.Cash, { hasCustomer: false });
    expect(r).toEqual({ amountDue: 10350, roundingCredit: 0, shouldRound: false });
  });

  it('nol dan nilai negatif aman', () => {
    expect(calculateCashRounding(0, PaymentMethod.Cash).amountDue).toBe(0);
    expect(calculateCashRounding(-100, PaymentMethod.Cash).amountDue).toBe(0);
  });

  it('kelebihan selalu di antara 0 dan 499', () => {
    for (let amount = 1; amount <= 3000; amount += 7) {
      const r = calculateCashRounding(amount, PaymentMethod.Cash);
      expect(r.roundingCredit).toBeGreaterThanOrEqual(0);
      expect(r.roundingCredit).toBeLessThan(500);
      expect(r.amountDue % 500).toBe(0);
      expect(r.amountDue).toBeGreaterThanOrEqual(amount);
    }
  });
});

describe('calculateBalanceUsage', () => {
  it('dibatasi 10% subtotal', () => {
    expect(calculateBalanceUsage(5000, 20000)).toBe(2000);
  });

  it('dibatasi saldo', () => {
    expect(calculateBalanceUsage(800, 20000)).toBe(800);
  });

  it('10% dibulatkan ke bawah, sama dengan pengecekan database', () => {
    expect(calculateBalanceUsage(5000, 12345)).toBe(1234);
  });

  it('tidak melebihi sisa tagihan setelah diskon lain', () => {
    expect(calculateBalanceUsage(5000, 20000, 19500)).toBe(500);
    expect(calculateBalanceUsage(5000, 20000, 25000)).toBe(0);
  });

  it('saldo kosong, null, atau negatif menghasilkan 0', () => {
    expect(calculateBalanceUsage(0, 20000)).toBe(0);
    expect(calculateBalanceUsage(null, 20000)).toBe(0);
    expect(calculateBalanceUsage(undefined, 20000)).toBe(0);
    expect(calculateBalanceUsage(-500, 20000)).toBe(0);
  });
});

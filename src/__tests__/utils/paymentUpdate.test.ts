import { describe, it, expect, vi } from 'vitest';
import { savePaymentWithRoundingCredit } from '../../utils/paymentUpdate';
import { OrderStatus, PaymentMethod, PaymentStatus, Transaction } from '../../types';

const baseTx: Transaction = {
  id: 'trx-1',
  customerId: 'cust-1',
  items: [],
  subtotal: 10300,
  discount: 0,
  tax: 0,
  total: 10300,
  amountPaid: 10300,
  change: 9500,
  paymentMethod: PaymentMethod.Cash,
  paymentStatus: PaymentStatus.Paid,
  orderStatus: OrderStatus.Processing,
  createdAt: new Date(),
  estimatedCompletionDate: '',
  createdByUserId: 'u1',
  storeId: 's1',
  roundingCredit: 200,
};

describe('savePaymentWithRoundingCredit', () => {
  it('simpan pembayaran dulu, baru roundingCredit', async () => {
    const update = vi.fn().mockResolvedValue(null);
    const result = await savePaymentWithRoundingCredit(update, baseTx);
    expect(update).toHaveBeenNthCalledWith(1, 'trx-1', {
      amountPaid: 10300,
      change: 9500,
      paymentMethod: PaymentMethod.Cash,
      paymentStatus: PaymentStatus.Paid,
    });
    expect(update).toHaveBeenNthCalledWith(2, 'trx-1', { roundingCredit: 200 });
    expect(result).toEqual({ creditSaved: 200, creditError: null });
  });

  it('tanpa roundingCredit hanya satu update', async () => {
    const update = vi.fn().mockResolvedValue(null);
    const result = await savePaymentWithRoundingCredit(update, { ...baseTx, roundingCredit: 0 });
    expect(update).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ creditSaved: 0, creditError: null });
  });

  it('kalau saldo gagal dicatat, pembayaran tetap dianggap tersimpan', async () => {
    const update = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error('Saldo pembulatan transaksi ini sudah tercatat'));
    const result = await savePaymentWithRoundingCredit(update, baseTx);
    expect(result.creditSaved).toBe(0);
    expect(result.creditError).toMatch(/sudah tercatat/);
  });

  it('kalau pembayaran gagal, galat diteruskan dan saldo tidak dicoba', async () => {
    const update = vi.fn().mockRejectedValueOnce(new Error('network'));
    await expect(savePaymentWithRoundingCredit(update, baseTx)).rejects.toThrow('network');
    expect(update).toHaveBeenCalledTimes(1);
  });
});

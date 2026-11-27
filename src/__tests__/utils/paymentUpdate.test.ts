import { describe, it, expect, vi } from 'vitest';
import { savePayment, orderStatusAfterPayment } from '@/utils/paymentUpdate';
import { OrderStatus, PaymentStatus, Transaction } from '@/types';

const baseTx = {
  id: 'trx-1',
  amountPaid: 20000,
  change: 0,
  paymentMethod: 'Tunai',
  paymentStatus: PaymentStatus.Paid,
  orderStatus: OrderStatus.Ready,
} as unknown as Transaction;

describe('orderStatusAfterPayment', () => {
  it('menutup nota Siap Diambil yang dilunasi', () => {
    expect(orderStatusAfterPayment(baseTx, { completeIfReady: true })).toBe(OrderStatus.Completed);
  });

  it('tidak mengubah status bila peran tidak boleh menyelesaikan', () => {
    expect(orderStatusAfterPayment(baseTx)).toBe(OrderStatus.Ready);
  });

  it('tidak mengubah nota yang masih Diproses', () => {
    expect(
      orderStatusAfterPayment(
        { ...baseTx, orderStatus: OrderStatus.Processing },
        { completeIfReady: true },
      ),
    ).toBe(OrderStatus.Processing);
  });

  it('tidak menutup nota yang belum lunas penuh', () => {
    expect(
      orderStatusAfterPayment(
        { ...baseTx, paymentStatus: PaymentStatus.Unpaid },
        { completeIfReady: true },
      ),
    ).toBe(OrderStatus.Ready);
  });
});

describe('savePayment', () => {
  it('mengirim pembayaran dan status Selesai dalam satu update', async () => {
    const update = vi.fn().mockResolvedValue(null);
    const result = await savePayment(update, baseTx, { completeIfReady: true });
    expect(result).toBe(OrderStatus.Completed);
    expect(update).toHaveBeenCalledWith('trx-1', {
      amountPaid: 20000,
      change: 0,
      paymentMethod: 'Tunai',
      paymentStatus: PaymentStatus.Paid,
      orderStatus: OrderStatus.Completed,
    });
  });

  it('tidak mengirim orderStatus bila status tidak berubah', async () => {
    const update = vi.fn().mockResolvedValue(null);
    await savePayment(update, baseTx);
    expect(update.mock.calls[0][1]).not.toHaveProperty('orderStatus');
  });
});

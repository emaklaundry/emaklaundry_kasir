import { describe, it, expect, vi } from 'vitest';
import {
  savePayment,
  orderStatusAfterPayment,
  bulkMarkPaid,
  remainingBalance,
} from '@/utils/paymentUpdate';
import { OrderStatus, PaymentMethod, PaymentStatus, Transaction } from '@/types';

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

describe('remainingBalance', () => {
  it('menghitung sisa tagihan dan tidak negatif', () => {
    expect(remainingBalance({ total: 30000, amountPaid: 10000 })).toBe(20000);
    expect(remainingBalance({ total: 10000, amountPaid: 15000 })).toBe(0);
  });
});

describe('bulkMarkPaid', () => {
  const unpaid = (id: string, orderStatus: OrderStatus, amountPaid = 0) =>
    ({
      id,
      total: 25000,
      amountPaid,
      change: 0,
      paymentStatus: PaymentStatus.Unpaid,
      orderStatus,
    }) as unknown as Transaction;

  it('melunasi nota belum lunas penuh sebesar total dengan metode terpilih', async () => {
    const update = vi.fn().mockResolvedValue(null);
    const res = await bulkMarkPaid(
      update,
      [unpaid('a', OrderStatus.Processing, 5000)],
      PaymentMethod.Transfer,
    );
    expect(update).toHaveBeenCalledWith('a', {
      amountPaid: 25000,
      change: 0,
      paymentMethod: PaymentMethod.Transfer,
      paymentStatus: PaymentStatus.Paid,
    });
    expect(res.succeeded).toEqual([{ id: 'a', orderStatus: OrderStatus.Processing }]);
  });

  it('melewati nota yang sudah lunas', async () => {
    const update = vi.fn().mockResolvedValue(null);
    const res = await bulkMarkPaid(update, [baseTx], PaymentMethod.Cash);
    expect(update).not.toHaveBeenCalled();
    expect(res.skipped).toEqual(['trx-1']);
  });

  it('menutup nota Siap Diambil bila peran boleh menyelesaikan', async () => {
    const update = vi.fn().mockResolvedValue(null);
    const res = await bulkMarkPaid(update, [unpaid('b', OrderStatus.Ready)], PaymentMethod.Cash, {
      completeIfReady: true,
    });
    expect(update.mock.calls[0][1]).toMatchObject({ orderStatus: OrderStatus.Completed });
    expect(res.succeeded[0].orderStatus).toBe(OrderStatus.Completed);
  });

  it('satu nota gagal tidak menghentikan nota lain', async () => {
    const update = vi.fn().mockRejectedValueOnce(new Error('RLS')).mockResolvedValueOnce(null);
    const res = await bulkMarkPaid(
      update,
      [unpaid('x', OrderStatus.Processing), unpaid('y', OrderStatus.Processing)],
      PaymentMethod.QRIS,
    );
    expect(res.failed).toEqual([{ id: 'x', error: 'RLS' }]);
    expect(res.succeeded.map((s) => s.id)).toEqual(['y']);
  });
});

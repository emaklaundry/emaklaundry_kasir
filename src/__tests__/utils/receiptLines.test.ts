import { describe, it, expect } from 'vitest';
import { buildTransactionReceiptLines, formatReceiptDate } from '@/utils/receiptLines';
import { renderReceiptText } from '@/utils/thermalPrinter';
import { PaymentStatus, type Transaction } from '@/types';

const baseTx = {
  id: 'abcdef12-0000-0000-0000-000000000000',
  invoiceCode: 'INV-001',
  createdAt: new Date(2026, 10, 27, 18, 38, 59),
  paymentStatus: PaymentStatus.Paid,
  items: [
    {
      serviceName: 'Cuci Kering',
      quantity: 3,
      unit: 'kg',
      price: 7000,
      subtotal: 21000,
    },
  ],
  subtotal: 21000,
  total: 21000,
  amountPaid: 50000,
  change: 29000,
  paymentMethod: 'Tunai',
  estimatedCompletionDate: null,
} as unknown as Transaction;

const header = { title: 'Emak Laundry', details: ['Jl. Mawar 1'] };
const text = (lines: ReturnType<typeof buildTransactionReceiptLines>) =>
  renderReceiptText(lines, 32).join('\n');

describe('buildTransactionReceiptLines', () => {
  it('memformat tanggal ringkas tanpa detik', () => {
    expect(formatReceiptDate(new Date(2026, 10, 27, 8, 5, 9))).toBe('27/11/26 08:05');
    expect(formatReceiptDate(null)).toBe('-');
  });

  it('struk lunas: bayar + kembali, tanpa sisa tagihan & tanpa baris "Struk Transaksi"', () => {
    const out = text(buildTransactionReceiptLines(baseTx, { name: 'Budi' }, header, null));
    expect(out).toContain('Bayar (Tunai)');
    expect(out).toContain('Kembali');
    expect(out).toContain('** LUNAS **');
    expect(out).not.toContain('SISA TAGIHAN');
    expect(out).not.toContain('Struk Transaksi');
    expect(out).not.toContain('CETAK ULANG');
  });

  it('struk belum bayar: tanpa baris bayar/kembali, tampil sisa tagihan', () => {
    const tx = { ...baseTx, amountPaid: 0, change: 0, paymentStatus: PaymentStatus.Unpaid };
    const out = text(buildTransactionReceiptLines(tx, { name: 'Budi' }, header, null));
    expect(out).not.toContain('Bayar');
    expect(out).not.toContain('Kembali');
    expect(out).toMatch(/SISA TAGIHAN\s+Rp 21\.000/);
  });

  it('cetakan ke-2 dst. diberi tanda CETAK ULANG', () => {
    const first = text(
      buildTransactionReceiptLines(baseTx, { name: 'B' }, header, null, { printNumber: 1 }),
    );
    const again = text(
      buildTransactionReceiptLines(baseTx, { name: 'B' }, header, null, { printNumber: 3 }),
    );
    expect(first).not.toContain('CETAK ULANG');
    expect(again).toContain('*** CETAK ULANG ke-3 ***');
  });
});

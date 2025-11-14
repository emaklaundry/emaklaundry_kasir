/// <reference types="vitest" />
import { describe, it, expect } from 'vitest';
import { sanitizeTransactionUpdate } from '../src/utils/sanitizeTransaction';

describe('sanitizeTransactionUpdate', () => {
  it('removes derived/unknown fields and keeps allowed columns', () => {
    const input = {
      customerId: 'cust_1',
      items: [{ serviceId: 's1', quantity: 1 }],
      subtotal: 100,
      discount: 0,
      tax: 10,
      total: 110,
      paymentStatus: 'Paid',
      customerName: 'Should be removed',
      foo: 'bar',
      amountPaid: 110,
      change: 0,
    } as any;

    const out = sanitizeTransactionUpdate(input);

    expect(out).toHaveProperty('customerId', 'cust_1');
    expect(out).toHaveProperty('items');
    expect(out).toHaveProperty('subtotal', 100);
    expect(out).toHaveProperty('total', 110);
    expect(out).toHaveProperty('amountPaid', 110);
    // Penambahan pengujian properti yang sebelumnya tidak diuji
    expect(out).toHaveProperty('discount', 0);
    expect(out).toHaveProperty('tax', 10);
    expect(out).toHaveProperty('paymentStatus', 'Paid');
    expect(out).toHaveProperty('change', 0);
    expect(out).not.toHaveProperty('customerName');
    expect(out).not.toHaveProperty('foo');
  });

  it('returns empty object when no allowed fields present', () => {
    const input = { customerName: 'Alice', foo: 'bar' } as any;
    const out = sanitizeTransactionUpdate(input);
    expect(Object.keys(out)).toHaveLength(0);
  });
});

import { describe, it, expect } from 'vitest';
import { buildReceiptHeader } from '@/utils/receiptHeader';
import { DEFAULT_BUSINESS_NAME } from '@/utils/whatsappReceipt';

describe('buildReceiptHeader', () => {
  it('memakai nama usaha + nama, alamat, dan HP cabang', () => {
    expect(
      buildReceiptHeader(
        { businessName: ' Emak Laundry ' },
        { name: 'Banjar - Cimenyan', address: 'Jl. Banjar 1', phone: '0812 3456 7890' },
      ),
    ).toEqual({
      title: 'Emak Laundry',
      details: ['Banjar - Cimenyan', 'Jl. Banjar 1', 'Telp/WA 0812 3456 7890'],
    });
  });

  it('nama usaha kosong memakai nama bawaan, isian cabang kosong dilewati', () => {
    expect(
      buildReceiptHeader({ businessName: '' }, { name: 'Cabang A', address: '', phone: null }),
    ).toEqual({ title: DEFAULT_BUSINESS_NAME, details: ['Cabang A'] });
  });

  it('tidak mengulang nama cabang yang sama dengan nama usaha', () => {
    expect(
      buildReceiptHeader({ businessName: 'Emak Laundry' }, { name: 'emak laundry', address: '' })
        .details,
    ).toEqual([]);
  });

  it('tanpa data cabang hanya berisi judul', () => {
    expect(buildReceiptHeader(null, null)).toEqual({ title: DEFAULT_BUSINESS_NAME, details: [] });
  });
});

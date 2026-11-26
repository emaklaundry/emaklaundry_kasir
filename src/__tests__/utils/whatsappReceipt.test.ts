import {
  buildTrackingUrl,
  buildWhatsAppReceiptMessage,
  DEFAULT_TRACKING_URL,
} from '@/utils/whatsappReceipt';
import { normalizeWhatsAppPhone } from '@/utils/whatsappPhone';
import {
  Customer,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Settings,
  Store,
  Transaction,
} from '@/types';

const customer: Customer = {
  id: 'c1',
  name: 'Bu Ani',
  phone: '628123456789',
  storeId: 's1',
  createdAt: new Date(),
};

const tx: Transaction = {
  id: 't1',
  invoiceCode: 'INV-001',
  customerId: 'c1',
  items: [
    {
      serviceId: 'svc',
      serviceName: 'Cuci Kering',
      price: 7000,
      unit: 'kg',
      quantity: 3,
      subtotal: 21000,
    },
  ],
  subtotal: 21000,
  discount: 0,
  tax: 0,
  total: 21000,
  amountPaid: 21000,
  change: 0,
  paymentMethod: PaymentMethod.Cash,
  paymentStatus: PaymentStatus.Paid,
  orderStatus: OrderStatus.Processing,
  createdAt: new Date('2026-11-25T10:00:00Z'),
  estimatedCompletionDate: '2026-11-27T10:00:00Z',
  createdByUserId: 'u1',
  storeId: 's1',
};

const store: Store = {
  id: 's1',
  name: 'Cimenyan',
  address: 'Jl. Contoh No. 1',
  isActive: true,
};

const build = (t: Partial<Transaction> = {}, extra: { settings?: Settings; store?: Store } = {}) =>
  buildWhatsAppReceiptMessage({ transaction: { ...tx, ...t }, customer, ...extra });

describe('buildWhatsAppReceiptMessage', () => {
  it('transaksi baru: total & dibayar, tanpa diskon/pajak/sisa', () => {
    const msg = build();
    expect(msg).toContain('Total: Rp21.000');
    expect(msg).toContain('Dibayar: Rp21.000');
    expect(msg).not.toMatch(/Diskon:|Pajak:|Sisa Tagihan/);
    expect(msg).toContain('Tim Emak Laundry');
  });

  it('selesai tapi belum lunas tidak menulis LUNAS', () => {
    const msg = build({
      orderStatus: OrderStatus.Completed,
      paymentStatus: PaymentStatus.Unpaid,
      amountPaid: 5000,
    });
    expect(msg).toContain('Status Bayar*: Belum Lunas');
    expect(msg).toContain('Sisa Tagihan: Rp16.000');
  });

  it('selesai lunas memakai footer', () => {
    const msg = build({ orderStatus: OrderStatus.Completed });
    expect(msg).toContain('Status Bayar*: Lunas');
    expect(msg).toContain('forms.gle');
  });

  it('menampilkan subtotal, diskon dan pajak bila ada', () => {
    const msg = build({ discount: 2000, tax: 1000, total: 20000, amountPaid: 20000 });
    expect(msg).toContain('Subtotal: Rp21.000');
    expect(msg).toContain('Diskon: -Rp2.000');
    expect(msg).toContain('Pajak: Rp1.000');
  });

  it('estimasi kosong tidak menghasilkan Invalid Date', () => {
    const msg = build({ estimatedCompletionDate: '' });
    expect(msg).not.toContain('Invalid Date');
    expect(msg).not.toContain('Estimasi Selesai');
  });

  it('mencantumkan metode bayar, kembalian dan catatan', () => {
    const msg = build({ amountPaid: 50000, change: 29000, notes: 'Jangan pakai pewangi' });
    expect(msg).toContain('Metode Bayar: Tunai');
    expect(msg).toContain('Kembalian: Rp29.000');
    expect(msg).toContain('Catatan*: Jangan pakai pewangi');
  });

  it('belum bayar: tanpa metode bayar & kembalian', () => {
    const msg = build({ amountPaid: 0, paymentStatus: PaymentStatus.Unpaid });
    expect(msg).not.toContain('Metode Bayar');
    expect(msg).not.toContain('Kembalian');
  });

  it('memakai nama usaha, link tracking & cabang dari data', () => {
    const settings = {
      id: 1,
      receiptMessage: '',
      businessName: 'Laundry Kita',
      trackingUrl: 'https://cek.example.com/status',
    } as Settings;
    const msg = build({}, { settings, store });
    expect(msg).toContain('Tim Laundry Kita');
    expect(msg).toContain('https://cek.example.com/status?invoice=');
    expect(msg).toContain('Laundry Kita – Cimenyan');
    expect(msg).toContain('Jl. Contoh No. 1');
    expect(msg).not.toContain('Emak Laundry');
  });
});

describe('buildTrackingUrl', () => {
  it('menambah ?invoice= atau &invoice= sesuai base', () => {
    expect(buildTrackingUrl(DEFAULT_TRACKING_URL, 'INV/1')).toBe(
      'https://emaklaundry.my.id/?invoice=INV%2F1',
    );
    expect(buildTrackingUrl('https://x.id/?a=1', 'INV')).toBe('https://x.id/?a=1&invoice=INV');
  });
});

describe('normalizeWhatsAppPhone', () => {
  it.each([
    ['08123456789', '628123456789'],
    ['+62 812-3456-789', '628123456789'],
    ['628123456789', '628123456789'],
    ['8123456789', '628123456789'],
  ])('%s → %s', (input, expected) => {
    expect(normalizeWhatsAppPhone(input)).toBe(expected);
  });

  it('kosong atau terlalu pendek → null', () => {
    expect(normalizeWhatsAppPhone('')).toBeNull();
    expect(normalizeWhatsAppPhone(undefined)).toBeNull();
    expect(normalizeWhatsAppPhone('0812')).toBeNull();
  });
});

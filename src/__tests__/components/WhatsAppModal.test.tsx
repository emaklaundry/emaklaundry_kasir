import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import WhatsAppModal from '@/components/WhatsAppModal';
import { normalizeWhatsAppPhone } from '@/utils/whatsappPhone';
import { Customer, OrderStatus, PaymentMethod, PaymentStatus, Transaction } from '@/types';

vi.mock('@/contexts/useToasts', () => ({ default: () => ({ addToast: vi.fn() }) }));
vi.mock('@/contexts/AuditLogContext', () => ({ useAuditLogs: () => ({ addAuditLog: vi.fn() }) }));
vi.mock('@/contexts/SettingsContext', () => ({ useSettings: () => ({ settings: null }) }));

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
  change: 1000,
  paymentMethod: PaymentMethod.Cash,
  paymentStatus: PaymentStatus.Paid,
  orderStatus: OrderStatus.Processing,
  createdAt: new Date('2026-11-25T10:00:00Z'),
  estimatedCompletionDate: '2026-11-27T10:00:00Z',
  createdByUserId: 'u1',
  storeId: 's1',
};

const renderModal = (t: Transaction, c: Customer = customer) =>
  render(<WhatsAppModal isOpen onClose={vi.fn()} transaction={t} customer={c} />);

describe('WhatsAppModal', () => {
  it('pesan transaksi baru: total, dibayar, tanpa saldo/diskon/pajak', () => {
    renderModal(tx);
    expect(screen.getByText(/Total: Rp21\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Dibayar: Rp21\.000/)).toBeInTheDocument();
    expect(screen.queryByText(/Saldo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Diskon:|Pajak:/)).not.toBeInTheDocument();
  });

  it('pesan siap diambil tanpa baris saldo', () => {
    renderModal({ ...tx, orderStatus: OrderStatus.Ready });
    expect(screen.getByText(/SIAP DIAMBIL/)).toBeInTheDocument();
    expect(screen.queryByText(/Saldo/i)).not.toBeInTheDocument();
  });

  it('pesan selesai tapi belum lunas tidak menulis LUNAS', () => {
    renderModal({
      ...tx,
      orderStatus: OrderStatus.Completed,
      paymentStatus: PaymentStatus.Unpaid,
      amountPaid: 5000,
    });
    expect(screen.getByText(/Status Bayar\*: Belum Lunas/)).toBeInTheDocument();
    expect(screen.getByText(/Sisa Tagihan: Rp16\.000/)).toBeInTheDocument();
  });

  it('pesan selesai lunas memakai footer', () => {
    renderModal({ ...tx, orderStatus: OrderStatus.Completed });
    expect(screen.getByText(/Status Bayar\*: Lunas/)).toBeInTheDocument();
    expect(screen.getByText(/forms\.gle/)).toBeInTheDocument();
  });

  it('menampilkan subtotal, diskon dan pajak bila ada', () => {
    renderModal({ ...tx, discount: 2000, tax: 1000, total: 20000, amountPaid: 20000 });
    expect(screen.getByText(/Subtotal: Rp21\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Diskon: -Rp2\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Pajak: Rp1\.000/)).toBeInTheDocument();
  });

  it('estimasi kosong tidak menghasilkan Invalid Date', () => {
    renderModal({ ...tx, estimatedCompletionDate: '' });
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Estimasi Selesai/)).not.toBeInTheDocument();
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

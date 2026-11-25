import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import WhatsAppModal from '@/components/WhatsAppModal';
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
  defaultDiscount: 1200,
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
  discount: 2000,
  tax: 0,
  total: 19000,
  amountPaid: 19000,
  change: 1000,
  paymentMethod: PaymentMethod.Cash,
  paymentStatus: PaymentStatus.Paid,
  orderStatus: OrderStatus.Processing,
  createdAt: new Date('2026-11-25T10:00:00Z'),
  estimatedCompletionDate: '2026-11-27T10:00:00Z',
  createdByUserId: 'u1',
  storeId: 's1',
  discountBalanceUsed: 2000,
  roundingCredit: 0,
};

const renderModal = (t: Transaction, c: Customer = customer) =>
  render(<WhatsAppModal isOpen onClose={vi.fn()} transaction={t} customer={c} />);

describe('WhatsAppModal', () => {
  it('pesan transaksi baru menyebut saldo yang dipakai dan sisa saldo', () => {
    renderModal(tx);
    expect(screen.getByText(/Saldo diskon dipakai: -Rp2\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Saldo Diskon Anda\*: Rp1\.200/)).toBeInTheDocument();
    expect(screen.queryByText(/Pembulatan tunai masuk saldo/)).not.toBeInTheDocument();
  });

  it('pesan transaksi baru menyebut pembulatan yang masuk saldo', () => {
    renderModal({ ...tx, discountBalanceUsed: 0, roundingCredit: 200 });
    expect(screen.getByText(/Pembulatan tunai masuk saldo: \+Rp200/)).toBeInTheDocument();
  });

  it('pelanggan tanpa saldo dan tanpa pemakaian: tidak ada baris saldo', () => {
    renderModal(
      { ...tx, discountBalanceUsed: 0, roundingCredit: 0 },
      { ...customer, defaultDiscount: 0 },
    );
    expect(screen.queryByText(/Saldo Diskon Anda/)).not.toBeInTheDocument();
  });

  it('pesan siap diambil menampilkan saldo pelanggan', () => {
    renderModal({ ...tx, orderStatus: OrderStatus.Ready });
    expect(screen.getByText(/SIAP DIAMBIL/)).toBeInTheDocument();
    expect(screen.getByText(/Saldo Diskon Anda\*: Rp1\.200/)).toBeInTheDocument();
  });
});

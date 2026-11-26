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
});

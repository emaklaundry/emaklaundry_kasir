import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import WhatsAppModal from '@/components/WhatsAppModal';
import { Customer, OrderStatus, PaymentMethod, PaymentStatus, Transaction } from '@/types';

const addToast = vi.fn();
const updateCustomer = vi.fn().mockResolvedValue({});
const markSent = vi.fn().mockResolvedValue('2026-11-28T00:00:00Z');

vi.mock('@/contexts/useToasts', () => ({ default: () => ({ addToast }) }));
vi.mock('@/contexts/AuditLogContext', () => ({ useAuditLogs: () => ({ addAuditLog: vi.fn() }) }));
vi.mock('@/contexts/SettingsContext', () => ({ useSettings: () => ({ settings: null }) }));
vi.mock('@/contexts/StoreContext', () => ({
  useStores: () => ({
    stores: [{ id: 's1', name: 'Cimenyan', address: 'Jl. Contoh No. 1', isActive: true }],
  }),
}));
vi.mock('@/contexts/CustomerContext', () => ({
  useCustomerMutations: () => ({ updateCustomer }),
}));
vi.mock('@/contexts/TransactionContext', () => ({
  markTransactionWhatsAppSent: (id: string) => markSent(id),
}));

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

const renderModal = (t: Transaction = tx, c: Customer = customer) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WhatsAppModal isOpen onClose={vi.fn()} transaction={t} customer={c} />
    </QueryClientProvider>,
  );

describe('WhatsAppModal', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.clearAllMocks();
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });
  afterEach(() => openSpy.mockRestore());

  it('pesan tidak bisa diedit dan yang terkirim adalah pesan otomatis', async () => {
    renderModal();
    expect(screen.queryByRole('textbox', { name: 'Isi Pesan' })).not.toBeInTheDocument();
    const shown = screen.getByText(/Halo Bu Ani/);
    expect(shown).toHaveTextContent('Cimenyan');
    fireEvent.click(screen.getByRole('button', { name: /Kirim/ }));
    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toMatch(/^https:\/\/wa\.me\/628123456789\?text=/);
    const sentText = decodeURIComponent(url.split('?text=')[1]);
    expect(sentText).toContain('Total: Rp21.000');
    expect(sentText).toContain('Halo Bu Ani');
    await waitFor(() => expect(markSent).toHaveBeenCalledWith('t1'));
    expect(updateCustomer).not.toHaveBeenCalled();
  });

  it('pelanggan tanpa nomor: tombol kirim nonaktif sampai nomor diisi, lalu nomor disimpan', async () => {
    renderModal(tx, { ...customer, phone: undefined });
    const sendBtn = screen.getByRole('button', { name: /Kirim/ });
    expect(sendBtn).toBeDisabled();
    expect(screen.getByText(/belum punya nomor HP/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Kirim ke Bu Ani/), {
      target: { value: '0812 3456 7890' },
    });
    expect(screen.getByText(/otomatis disimpan ke data pelanggan/)).toBeInTheDocument();
    expect(sendBtn).toBeEnabled();
    fireEvent.click(sendBtn);

    expect(openSpy.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/);
    await waitFor(() =>
      expect(updateCustomer).toHaveBeenCalledWith('c1', { phone: '0812 3456 7890' }),
    );
  });

  it('nomor pelanggan yang valid dikunci (tidak ada kolom isian)', () => {
    renderModal();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText('Bu Ani (+628123456789)')).toBeInTheDocument();
    expect(screen.getByText(/buka halaman Pelanggan/)).toBeInTheDocument();
  });

  it('nomor tidak valid di data pelanggan boleh diperbaiki dan disimpan', async () => {
    renderModal(tx, { ...customer, phone: '0812' });
    const input = screen.getByLabelText(/Kirim ke Bu Ani/) as HTMLInputElement;
    expect(input.value).toBe('0812');
    expect(screen.getByText(/tidak valid/)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '081298765432' } });
    fireEvent.click(screen.getByRole('button', { name: /Kirim/ }));
    expect(openSpy.mock.calls[0][0]).toMatch(/^https:\/\/wa\.me\/6281298765432\?text=/);
    await waitFor(() =>
      expect(updateCustomer).toHaveBeenCalledWith('c1', { phone: '081298765432' }),
    );
  });

  it('menampilkan status sudah dikirim dan tombol kirim ulang', () => {
    renderModal({ ...tx, whatsappSentAt: '2026-11-27T08:00:00Z' });
    expect(screen.getByRole('status')).toHaveTextContent(/Sudah pernah dikirim/);
    expect(screen.getByRole('button', { name: /Kirim Ulang/ })).toBeInTheDocument();
  });
});

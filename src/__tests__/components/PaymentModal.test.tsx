import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import PaymentModal from '@/components/PaymentModal';
import { PaymentStatus, OrderStatus, PaymentMethod } from '@/types';

// Mock props as needed for PaymentModal
const mockTransaction = {
  id: 'trx-1',
  customerId: 'cust-1',
  items: [],
  subtotal: 10000,
  discount: 0,
  tax: 0,
  total: 10000,
  amountPaid: 0,
  change: 0,
  paymentMethod: PaymentMethod.Cash,
  paymentStatus: PaymentStatus.Unpaid,
  orderStatus: OrderStatus.Processing,
  createdAt: new Date(),
  estimatedCompletionDate: new Date().toISOString(),
  createdByUserId: 'user-1',
  storeId: 'store-1',
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  transaction: mockTransaction,
  onSave: vi.fn(),
  disabled: false,
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('PaymentModal', () => {
  const renderWithProviders = (ui: React.ReactElement) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{ui}</ToastProvider>
      </QueryClientProvider>,
    );

  it('renders modal when open', () => {
    renderWithProviders(<PaymentModal {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // The modal title now uses '#' as a prefix if invoiceCode is missing, fallback to id
    expect(screen.getByText(/Pembayaran: #trx-1/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    renderWithProviders(<PaymentModal {...defaultProps} />);
    const closeButton = screen.getByRole('button', { name: 'Tutup dialog' });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('tunai: dibulatkan ke atas, total tetap, kelebihan jadi roundingCredit', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const tx = { ...mockTransaction, subtotal: 10300, total: 10300 };
    renderWithProviders(<PaymentModal {...defaultProps} transaction={tx} onSave={onSave} />);

    expect(screen.getByLabelText(/tagihan tunai/i)).toHaveValue('10.500');
    fireEvent.change(screen.getByLabelText(/uang diterima/i), { target: { value: '20000' } });
    fireEvent.click(screen.getByRole('button', { name: /simpan pembayaran/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0][0];
    expect(saved.total).toBe(10300);
    expect(saved.discount).toBe(0);
    expect(saved.amountPaid).toBe(10300);
    expect(saved.paymentStatus).toBe(PaymentStatus.Paid);
    expect(saved.roundingCredit).toBe(200);
    expect(saved.change).toBe(9500);
  });

  it('non-tunai: dibayar pas tanpa roundingCredit', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const tx = { ...mockTransaction, subtotal: 10300, total: 10300 };
    renderWithProviders(<PaymentModal {...defaultProps} transaction={tx} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: PaymentMethod.Transfer }));
    expect(screen.getByLabelText(/jumlah bayar/i)).toHaveValue('10.300');
    fireEvent.click(screen.getByRole('button', { name: /simpan pembayaran/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0][0];
    expect(saved.amountPaid).toBe(10300);
    expect(saved.roundingCredit).toBe(0);
  });

  it('tanpa pelanggan terdaftar: tunai tidak dibulatkan', () => {
    const tx = { ...mockTransaction, customerId: '', subtotal: 10300, total: 10300 };
    renderWithProviders(<PaymentModal {...defaultProps} transaction={tx} />);
    expect(screen.getByLabelText(/jumlah bayar/i)).toHaveValue('10.300');
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

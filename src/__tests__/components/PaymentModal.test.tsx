import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import PaymentModal from '@/components/PaymentModal';

// Mock props as needed for PaymentModal
const mockTransaction = {
  id: 'trx-1',
  total: 10000,
  amountPaid: 0,
  paymentMethod: 'Cash',
  paymentStatus: 'Unpaid',
};

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  transaction: mockTransaction,
  onSave: vi.fn(),
  disabled: false,
};

describe('PaymentModal', () => {
  const renderWithProviders = (ui: React.ReactElement) =>
    render(<ToastProvider>{ui}</ToastProvider>);

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

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import EditPaidPaymentModal from '@/components/EditPaidPaymentModal';
import { OrderStatus, PaymentMethod, PaymentStatus, Transaction } from '@/types';

const paidTx: Transaction = {
  id: 'trx-1',
  customerId: 'cust-1',
  items: [],
  subtotal: 25000,
  discount: 0,
  tax: 0,
  total: 25000,
  amountPaid: 25000,
  change: 5000,
  paymentMethod: PaymentMethod.Cash,
  paymentStatus: PaymentStatus.Paid,
  orderStatus: OrderStatus.Processing,
  createdAt: new Date(),
  estimatedCompletionDate: new Date().toISOString(),
  createdByUserId: 'user-1',
  storeId: 'store-1',
};

const renderModal = (onSave = vi.fn().mockResolvedValue(undefined), approverName?: string) =>
  render(
    <EditPaidPaymentModal
      isOpen
      onClose={vi.fn()}
      transaction={paidTx}
      onSave={onSave}
      approverName={approverName}
    />,
  );

describe('EditPaidPaymentModal', () => {
  it('prefills tendered cash from total + recorded change and disables save until changed', () => {
    renderModal();
    expect(screen.getByLabelText(/uang diterima/i)).toHaveValue('30.000');
    expect(screen.getByRole('button', { name: /simpan perubahan/i })).toBeDisabled();
  });

  it('saves a method correction with zero change for non-cash', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderModal(onSave);
    fireEvent.click(screen.getByRole('button', { name: 'QRIS' }));
    expect(screen.queryByLabelText(/uang diterima/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /simpan perubahan/i }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ paymentMethod: PaymentMethod.QRIS, change: 0 }),
    );
  });

  it('recomputes change when tendered cash is corrected', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderModal(onSave);
    fireEvent.change(screen.getByLabelText(/uang diterima/i), { target: { value: '50000' } });
    expect(screen.getByText(/kembalian:/i).nextSibling).toHaveTextContent('25.000');
    fireEvent.click(screen.getByRole('button', { name: /simpan perubahan/i }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({ paymentMethod: PaymentMethod.Cash, change: 25000 }),
    );
  });

  it('rejects tendered cash below the total', async () => {
    const onSave = vi.fn();
    renderModal(onSave);
    fireEvent.change(screen.getByLabelText(/uang diterima/i), { target: { value: '20000' } });
    fireEvent.click(screen.getByRole('button', { name: /simpan perubahan/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/tidak boleh kurang/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows the database error (e.g. expired approval) instead of closing', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValue(
        new Error('Persetujuan supervisor tidak berlaku atau sudah kedaluwarsa. Minta PIN lagi.'),
      );
    renderModal(onSave, 'Budi Admin');
    expect(screen.getByText(/disetujui oleh/i)).toHaveTextContent('Budi Admin');
    fireEvent.click(screen.getByRole('button', { name: 'Transfer Bank' }));
    fireEvent.click(screen.getByRole('button', { name: /simpan perubahan/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/kedaluwarsa/i);
  });
});

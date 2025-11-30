import { render, screen, fireEvent } from '@testing-library/react';
import ExpenseFormModal from './ExpenseFormModal';
import React from 'react';
import { vi } from 'vitest';

describe('ExpenseFormModal', () => {
  const baseProps = {
    expense: null,
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  };

  it('renders all form fields and buttons', () => {
    render(<ExpenseFormModal {...baseProps} />);
    expect(screen.getByLabelText(/deskripsi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kategori/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/jumlah/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tanggal/i)).toBeInTheDocument();
    expect(screen.getByText('Batal')).toBeInTheDocument();
    expect(screen.getByText('Simpan')).toBeInTheDocument();
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    render(<ExpenseFormModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with correct data when Simpan is clicked', () => {
    const onSave = vi.fn();
    render(<ExpenseFormModal {...baseProps} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/deskripsi/i), { target: { value: 'Beli sabun' } });
    fireEvent.change(screen.getByLabelText(/kategori/i), { target: { value: 'Operasional' } });
    fireEvent.change(screen.getByLabelText(/jumlah/i), { target: { value: '10.000' } });
    fireEvent.change(screen.getByLabelText(/tanggal/i), { target: { value: '2025-11-30' } });
    fireEvent.click(screen.getByText('Simpan'));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'Beli sabun',
        category: 'Operasional',
        amount: 10000,
        date: expect.any(String),
      })
    );
  });

  it('shows initial values when editing an expense', () => {
    const expense = {
      id: '1',
      storeId: '1',
      date: '2025-11-29T00:00:00.000Z',
      description: 'Beli deterjen',
      category: 'Operasional',
      amount: 20000,
    };
    render(<ExpenseFormModal {...baseProps} expense={expense} />);
    expect(screen.getByDisplayValue('Beli deterjen')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Operasional')).toBeInTheDocument();
    expect(screen.getByDisplayValue('20.000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-11-29')).toBeInTheDocument();
  });
});

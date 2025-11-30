import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerFormModal from './CustomerFormModal';
import React from 'react';
import { vi } from 'vitest';

describe('CustomerFormModal', () => {
  const baseProps = {
    customer: null,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    disabled: false,
  };

  it('renders form fields and buttons', () => {
    render(<CustomerFormModal {...baseProps} />);
    expect(screen.getByRole('textbox', { name: /nama pelanggan/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /nomor telepon/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /alamat/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /diskon standar/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /catatan/i })).toBeInTheDocument();
    expect(screen.getByText('Batal')).toBeInTheDocument();
    expect(screen.getByText('Simpan')).toBeInTheDocument();
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    render(<CustomerFormModal {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with form data when Simpan is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CustomerFormModal {...baseProps} onSave={onSave} />);
    fireEvent.change(screen.getByRole('textbox', { name: /nama pelanggan/i }), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByRole('textbox', { name: /nomor telepon/i }), { target: { value: '08123456789' } });
    fireEvent.change(screen.getByRole('textbox', { name: /alamat/i }), { target: { value: 'Jl. Mawar' } });
    fireEvent.change(screen.getByRole('spinbutton', { name: /diskon standar/i }), { target: { value: '10' } });
    fireEvent.change(screen.getByRole('textbox', { name: /catatan/i }), { target: { value: 'VIP' } });
    fireEvent.click(screen.getByText('Simpan'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          phone: '08123456789',
          address: 'Jl. Mawar',
          defaultDiscount: 10,
          notes: 'VIP',
        })
      );
    });
  });

  it('disables Simpan button when disabled is true', () => {
    render(<CustomerFormModal {...baseProps} disabled={true} />);
    expect(screen.getByText('Simpan')).toBeDisabled();
  });
});

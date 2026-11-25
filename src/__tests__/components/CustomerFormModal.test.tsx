import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CustomerFormModal from '@/components/CustomerFormModal';
import React from 'react';
import { vi } from 'vitest';
import { ToastProvider } from '@/contexts/ToastContext';
import { UserRole } from '@/types';

const mockUser = vi.hoisted(() => ({ role: 'Admin' as string }));
vi.mock('@/contexts/useAppContext', () => ({
  default: () => ({ currentUser: { id: 'u1', role: mockUser.role } }),
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('CustomerFormModal', () => {
  beforeEach(() => {
    mockUser.role = UserRole.Admin;
  });

  const baseProps = {
    customer: null,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    disabled: false,
  };

  it('renders form fields and buttons', () => {
    render(<CustomerFormModal {...baseProps} />, { wrapper: Wrapper });
    expect(screen.getByRole('textbox', { name: /nama pelanggan/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /nomor telepon/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /alamat/i })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /saldo diskon/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /catatan/i })).toBeInTheDocument();
    expect(screen.getByText('Batal')).toBeInTheDocument();
    expect(screen.getByText('Simpan')).toBeInTheDocument();
  });

  it('calls onClose when Batal is clicked', () => {
    const onClose = vi.fn();
    render(<CustomerFormModal {...baseProps} onClose={onClose} />, { wrapper: Wrapper });
    fireEvent.click(screen.getByText('Batal'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSave with form data when Simpan is clicked', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CustomerFormModal {...baseProps} onSave={onSave} />, { wrapper: Wrapper });
    fireEvent.change(screen.getByRole('textbox', { name: /nama pelanggan/i }), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /nomor telepon/i }), {
      target: { value: '08123456789' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /alamat/i }), {
      target: { value: 'Jl. Mawar' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: /saldo diskon/i }), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /catatan/i }), {
      target: { value: 'VIP' },
    });
    fireEvent.click(screen.getByText('Simpan'));
    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          phone: '08123456789',
          address: 'Jl. Mawar',
          defaultDiscount: 10,
          notes: 'VIP',
        }),
      );
    });
  });

  it('disables Simpan button when disabled is true', () => {
    render(<CustomerFormModal {...baseProps} disabled={true} />, { wrapper: Wrapper });
    expect(screen.getByText('Simpan')).toBeDisabled();
  });

  it('Kasir tidak bisa mengubah saldo, hanya melihat saldo pelanggan', () => {
    mockUser.role = UserRole.Cashier;
    const customer = {
      id: 'c1',
      name: 'Bu Ani',
      storeId: 's1',
      createdAt: new Date(),
      defaultDiscount: 1500,
    };
    render(<CustomerFormModal {...baseProps} customer={customer} />, { wrapper: Wrapper });
    expect(screen.queryByRole('spinbutton', { name: /saldo diskon/i })).not.toBeInTheDocument();
    expect(screen.getByText(/saldo diskon:/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.500/)).toBeInTheDocument();
  });

  it('Kasir menambah pelanggan baru tanpa kolom saldo', () => {
    mockUser.role = UserRole.Cashier;
    render(<CustomerFormModal {...baseProps} />, { wrapper: Wrapper });
    expect(screen.queryByRole('spinbutton', { name: /saldo diskon/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/saldo diskon/i)).not.toBeInTheDocument();
  });
});

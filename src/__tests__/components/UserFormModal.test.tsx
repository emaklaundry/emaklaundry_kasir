import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UserFormModal from '@/components/UserFormModal';
import { User, UserRole } from '@/types';

const addToast = vi.fn();
vi.mock('@/contexts/useToasts', () => ({ default: () => ({ addToast }) }));

const renderModal = (props: Partial<React.ComponentProps<typeof UserFormModal>> = {}) => {
  const onSave = vi.fn();
  render(<UserFormModal user={null} onClose={vi.fn()} onSave={onSave} {...props} />);
  return { onSave };
};

const fill = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('UserFormModal', () => {
  beforeEach(() => addToast.mockClear());

  it('akun baru selalu Super Admin tanpa cabang, mengirim kredensial', () => {
    const { onSave } = renderModal();
    expect(screen.queryByLabelText(/peran/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/cabang/i)).not.toBeInTheDocument();

    fill(/nama pengguna/i, '  Siti  ');
    fill(/email login/i, ' Siti@Contoh.COM ');
    fill(/password awal/i, 'rahasia123');
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));

    expect(onSave).toHaveBeenCalledWith(
      { name: 'Siti', role: UserRole.SuperAdmin, storeId: undefined, isActive: true },
      { email: 'siti@contoh.com', password: 'rahasia123' },
    );
  });

  it('menolak password kurang dari 8 karakter', () => {
    const { onSave } = renderModal();
    fill(/nama pengguna/i, 'Siti');
    fill(/email login/i, 'siti@contoh.com');
    fill(/password awal/i, 'pendek');
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith('Password minimal 8 karakter.', 'warning');
  });

  it('menolak email tidak valid', () => {
    const { onSave } = renderModal();
    fill(/nama pengguna/i, 'Siti');
    fill(/email login/i, 'bukan-email');
    fill(/password awal/i, 'rahasia123');
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith('Format email tidak valid.', 'warning');
  });

  it('edit akun lama non-Super Admin: bisa dinonaktifkan, peran tidak berubah', () => {
    const user: User = {
      id: 'u1',
      name: 'Ani',
      role: UserRole.Cashier,
      storeId: 'store-a',
      isActive: true,
    };
    const { onSave } = renderModal({ user });
    expect(screen.queryByLabelText(/email login/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password awal/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/aktif/i));
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(onSave).toHaveBeenCalledWith({
      name: 'Ani',
      role: UserRole.Cashier,
      storeId: 'store-a',
      isActive: false,
    });
    expect(onSave.mock.calls[0]).toHaveLength(1);
  });

  it('edit Super Admin: tidak ada pilihan nonaktif', () => {
    const user: User = { id: 'u2', name: 'Anop', role: UserRole.SuperAdmin, isActive: true };
    renderModal({ user });
    expect(screen.queryByLabelText(/aktif/i)).not.toBeInTheDocument();
  });

  it('tombol simpan nonaktif saat sedang menyimpan', () => {
    renderModal({ disabled: true });
    expect(screen.getByRole('button', { name: 'Buat Akun' })).toBeDisabled();
  });
});

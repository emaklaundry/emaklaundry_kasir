import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import UserFormModal from '@/components/UserFormModal';
import { Store, User, UserRole } from '@/types';

const addToast = vi.fn();
vi.mock('@/contexts/useToasts', () => ({ default: () => ({ addToast }) }));

const stores: Store[] = [
  { id: 'store-a', name: 'Banjar', address: 'Jl. A', isActive: true },
  { id: 'store-b', name: 'Ciamis', address: 'Jl. B', isActive: true },
] as Store[];

const renderModal = (props: Partial<React.ComponentProps<typeof UserFormModal>> = {}) => {
  const onSave = vi.fn();
  render(
    <UserFormModal
      user={null}
      onClose={vi.fn()}
      onSave={onSave}
      stores={stores}
      creatorRole={UserRole.SuperAdmin}
      {...props}
    />,
  );
  return { onSave };
};

const fill = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('UserFormModal', () => {
  beforeEach(() => addToast.mockClear());

  it('pengguna baru: menampilkan email & password, mengirim kredensial', () => {
    const { onSave } = renderModal();
    fill(/nama pengguna/i, '  Siti  ');
    fill(/email login/i, ' Siti@Contoh.COM ');
    fill(/password awal/i, 'rahasia123');
    fill(/peran/i, UserRole.Cashier);
    fill(/cabang/i, 'store-b');
    fireEvent.click(screen.getByLabelText(/bisa beri diskon/i));
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Siti',
        role: UserRole.Cashier,
        storeId: 'store-b',
        canGiveDiscount: true,
      }),
      { email: 'siti@contoh.com', password: 'rahasia123' },
    );
  });

  it('menolak password kurang dari 8 karakter', () => {
    const { onSave } = renderModal();
    fill(/nama pengguna/i, 'Siti');
    fill(/email login/i, 'siti@contoh.com');
    fill(/password awal/i, 'pendek');
    fill(/cabang/i, 'store-a');
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith('Password minimal 8 karakter.', 'warning');
  });

  it('menolak email tidak valid', () => {
    const { onSave } = renderModal();
    fill(/nama pengguna/i, 'Siti');
    fill(/email login/i, 'bukan-email');
    fill(/password awal/i, 'rahasia123');
    fill(/cabang/i, 'store-a');
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith('Format email tidak valid.', 'warning');
  });

  it('Admin: tidak bisa memilih Super Admin, cabang dikunci ke cabangnya', () => {
    const { onSave } = renderModal({ creatorRole: UserRole.Admin, creatorStoreId: 'store-a' });
    const roleOptions = Array.from(
      (screen.getByLabelText(/peran/i) as HTMLSelectElement).options,
    ).map((o) => o.value);
    expect(roleOptions).not.toContain(UserRole.SuperAdmin);
    const storeSelect = screen.getByLabelText(/cabang/i) as HTMLSelectElement;
    expect(storeSelect).toBeDisabled();
    expect(storeSelect.value).toBe('store-a');

    fill(/nama pengguna/i, 'Budi');
    fill(/email login/i, 'budi@contoh.com');
    fill(/password awal/i, 'rahasia123');
    fireEvent.click(screen.getByRole('button', { name: 'Buat Akun' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ storeId: 'store-a' }),
      expect.any(Object),
    );
  });

  it('edit pengguna: tanpa kolom email/password, tombol Simpan', () => {
    const user: User = {
      id: 'u1',
      name: 'Ani',
      role: UserRole.Cashier,
      storeId: 'store-a',
      isActive: true,
      canGiveDiscount: false,
    };
    const { onSave } = renderModal({ user });
    expect(screen.queryByLabelText(/email login/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/password awal/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Simpan' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ani' }));
    expect(onSave.mock.calls[0]).toHaveLength(1);
  });

  it('tombol simpan nonaktif saat sedang menyimpan', () => {
    renderModal({ disabled: true });
    expect(screen.getByRole('button', { name: 'Buat Akun' })).toBeDisabled();
  });
});

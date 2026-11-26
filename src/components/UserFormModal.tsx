import React, { useState } from 'react';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
import { User, UserRole } from '@/types';
import { ROLE_DESCRIPTIONS } from '../config/permissions';

export interface NewUserCredentials {
  email: string;
  password: string;
}

interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  /** `credentials` hanya ada saat menambah akun baru. */
  onSave: (user: Omit<User, 'id'>, credentials?: NewUserCredentials) => void;
  disabled?: boolean;
}

export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Form Akun Login (email & password). Login email hanya untuk Super Admin, jadi
 * akun baru selalu Super Admin tanpa cabang. Staf cabang (Admin/Kasir/Operator)
 * dibuat di menu Karyawan dan login dengan PIN.
 */
const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave, disabled }) => {
  const isNew = !user;
  const [name, setName] = useState(user?.name || '');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [credentials, setCredentials] = useState<NewUserCredentials>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { addToast } = useToasts();

  const role = user?.role ?? UserRole.SuperAdmin;
  const isSuperAdmin = role === UserRole.SuperAdmin;
  const roleInfo = ROLE_DESCRIPTIONS[role as UserRole];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      addToast('Nama pengguna wajib diisi.', 'warning');
      return;
    }
    if (isNew) {
      const email = credentials.email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(email)) {
        addToast('Format email tidak valid.', 'warning');
        return;
      }
      if (credentials.password.length < MIN_PASSWORD_LENGTH) {
        addToast(`Password minimal ${MIN_PASSWORD_LENGTH} karakter.`, 'warning');
        return;
      }
      onSave(
        { name: trimmedName, role: UserRole.SuperAdmin, storeId: undefined, isActive: true },
        { email, password: credentials.password },
      );
      return;
    }
    onSave({
      name: trimmedName,
      role,
      storeId: user?.storeId,
      isActive: isSuperAdmin ? true : isActive,
    });
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? 'Edit Akun Login' : 'Tambah Super Admin'}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={disabled} className="btn btn-primary">
            {isNew ? 'Buat Akun' : 'Simpan'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="user-name" className="form-label">
            Nama Pengguna
          </label>
          <input
            type="text"
            name="name"
            id="user-name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            required
          />
        </div>
        {isNew && (
          <>
            <div>
              <label htmlFor="user-email" className="form-label">
                Email Login
              </label>
              <input
                type="email"
                name="email"
                id="user-email"
                autoComplete="off"
                inputMode="email"
                value={credentials.email}
                onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
                className="form-input"
                required
              />
            </div>
            <div>
              <label htmlFor="user-password" className="form-label">
                Password Awal
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  id="user-password"
                  autoComplete="new-password"
                  minLength={MIN_PASSWORD_LENGTH}
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, password: e.target.value }))
                  }
                  aria-describedby="user-password-help"
                  className="form-input pr-28"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 px-3 text-sm font-medium text-blue-600 dark:text-blue-400"
                  aria-pressed={showPassword}
                >
                  {showPassword ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
              <p
                id="user-password-help"
                className="mt-1 text-sm text-slate-500 dark:text-slate-400"
              >
                Minimal {MIN_PASSWORD_LENGTH} karakter. Berikan ke pemilik akun dan minta ia
                menggantinya setelah login pertama.
              </p>
            </div>
          </>
        )}
        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-700/50 dark:text-slate-300">
          <p className="font-medium text-slate-800 dark:text-slate-100">
            Peran: {role}
            {roleInfo ? ` — ${roleInfo.summary}` : ''}
          </p>
          {isSuperAdmin ? (
            <p className="mt-1">
              Admin, Kasir, dan Operator cabang tidak memakai email. Tambahkan mereka di menu
              Karyawan dan beri PIN login.
            </p>
          ) : (
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              Akun lama ini tidak bisa login lagi karena login email hanya untuk Super Admin.
              Nonaktifkan, lalu buat data karyawan + PIN bila orangnya masih bekerja.
            </p>
          )}
        </div>
        {!isNew && !isSuperAdmin && (
          <div className="flex items-center">
            <input
              id="user-isActive"
              name="isActive"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
            />
            <label
              htmlFor="user-isActive"
              className="ml-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Aktif
            </label>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default UserFormModal;

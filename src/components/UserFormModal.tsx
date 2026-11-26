import React, { useState } from 'react';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
import { User, UserRole, Store } from '@/types';

export interface NewUserCredentials {
  email: string;
  password: string;
}

interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  /** `credentials` hanya ada saat menambah pengguna baru. */
  onSave: (user: Omit<User, 'id'>, credentials?: NewUserCredentials) => void;
  stores: Store[];
  /** Peran pengguna yang sedang login. Admin tidak bisa membuat Super Admin. */
  creatorRole?: UserRole;
  /** Cabang Admin yang sedang login; pengguna baru dikunci ke cabang ini. */
  creatorStoreId?: string;
  disabled?: boolean;
}

export const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  onClose,
  onSave,
  stores,
  creatorRole,
  creatorStoreId,
  disabled,
}) => {
  const isNew = !user;
  const isCreatorAdmin = creatorRole === UserRole.Admin;
  const lockStore = isNew && isCreatorAdmin && Boolean(creatorStoreId);
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: user?.name || '',
    role: user?.role || UserRole.Cashier,
    storeId: user?.storeId || (lockStore ? creatorStoreId : '') || '',
    isActive: user?.isActive ?? true,
  });
  const [credentials, setCredentials] = useState<NewUserCredentials>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const { addToast } = useToasts();
  const availableRoles = Object.values(UserRole).filter(
    (role) => !(isNew && isCreatorAdmin && role === UserRole.SuperAdmin),
  );

  const isEditingSuperAdmin = user?.role === UserRole.SuperAdmin;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (finalData.role === UserRole.SuperAdmin) {
      finalData.storeId = undefined;
      // Catatan: Properti isActive untuk Super Admin diatur di logic penyimpanan (UsersPage),
      // bukan di modal ini. Modal hanya menonaktifkan input.
    } else if (!finalData.storeId) {
      addToast('Silakan pilih cabang untuk peran ini.', 'warning');
      return;
    }
    const name = finalData.name.trim();
    if (!name) {
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
      onSave({ ...finalData, name }, { email, password: credentials.password });
      return;
    }
    onSave({ ...finalData, name });
  };

  const showStoreSelector = formData.role === UserRole.Admin || formData.role === UserRole.Cashier;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
      footer={
        <>
          <button
            onClick={onClose}
            className="text-slate-900 bg-white border border-slate-300 focus:outline-none hover:bg-slate-100 font-medium rounded-lg text-lg px-6 py-3 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-500 dark:hover:bg-slate-600 dark:hover:text-white"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {isNew ? 'Buat Akun' : 'Simpan'}
          </button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="user-name"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Nama Pengguna
          </label>
          <input
            type="text"
            name="name"
            id="user-name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            required
          />
        </div>
        {isNew && (
          <>
            <div>
              <label
                htmlFor="user-email"
                className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
              >
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
                className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label
                htmlFor="user-password"
                className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
              >
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
                  className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 pr-28 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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
                Minimal {MIN_PASSWORD_LENGTH} karakter. Berikan ke pengguna dan minta ia
                menggantinya setelah login pertama.
              </p>
            </div>
          </>
        )}
        <div>
          <label
            htmlFor="role"
            className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
          >
            Peran
          </label>
          <select
            name="role"
            id="role"
            value={formData.role}
            onChange={handleChange}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
            disabled={isEditingSuperAdmin}
          >
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
        {showStoreSelector && (
          <div>
            <label
              htmlFor="storeId"
              className="block mb-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Cabang
            </label>
            <select
              name="storeId"
              id="storeId"
              value={formData.storeId}
              onChange={handleChange}
              disabled={lockStore}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
              required
            >
              <option value="">Pilih Cabang</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {!isNew && (
            <div className="flex items-center">
              <input
                id="user-isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={handleChange}
                disabled={isEditingSuperAdmin}
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
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;

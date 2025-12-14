import React, { useState } from 'react';
import useToasts from '../contexts/useToasts';
import Modal from './Modal';
import { User, UserRole, Store } from '@/types';

interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (user: Omit<User, 'id'>) => void;
  stores: Store[];
}

const UserFormModal: React.FC<UserFormModalProps> = ({ user, onClose, onSave, stores }) => {
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    name: user?.name || '',
    role: user?.role || UserRole.Cashier,
    storeId: user?.storeId || '',
    isActive: user?.isActive ?? true,
    canGiveDiscount: user?.canGiveDiscount ?? false,
  });
  const { addToast } = useToasts();

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
      // Catatan: Properti isActive dan canGiveDiscount untuk Super Admin diatur di logic penyimpanan (UsersPage),
      // bukan di modal ini. Modal hanya menonaktifkan input.
    } else if (!finalData.storeId) {
      addToast('Silakan pilih cabang untuk peran ini.', 'warning');
      return;
    }
    onSave(finalData);
  };

  const showStoreSelector =
    formData.role === UserRole.Admin || formData.role === UserRole.Cashier;

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
            className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-lg px-6 py-3"
          >
            Simpan
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
            {Object.values(UserRole).map((role) => (
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
              className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
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
          <div className="flex items-center">
            <input
              id="user-canGiveDiscount"
              name="canGiveDiscount"
              type="checkbox"
              checked={formData.canGiveDiscount}
              onChange={handleChange}
              disabled={isEditingSuperAdmin}
              className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
            />
            <label
              htmlFor="user-canGiveDiscount"
              className="ml-2 text-base font-medium text-slate-900 dark:text-white"
            >
              Bisa Beri Diskon
            </label>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;

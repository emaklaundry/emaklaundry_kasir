import React, { useState, useMemo } from 'react';
import { useUsers } from '../../contexts/UserContext';
import {
  EditIcon,
  PowerIcon,
  UsersIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useStores } from '../../contexts/StoreContext';
import useAppContext from '../../contexts/useAppContext';
import useToasts from '../../contexts/useToasts';
import UserFormModal, { NewUserCredentials } from '../../components/UserFormModal';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { useSortableData } from '../../hooks/useSortableData';
import { User, UserRole } from '@/types';
import { Link } from 'react-router-dom';
import { ROLE_DESCRIPTIONS, ROLE_ORDER } from '../../config/permissions';

/** Penjelasan singkat Akun Login vs Karyawan + hak akses tiap peran. */
const AccessGuide: React.FC = () => (
  <details className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
    <summary className="cursor-pointer select-none font-semibold text-blue-900 dark:text-blue-200">
      Akun Login vs Karyawan, dan hak akses tiap peran
    </summary>
    <div className="mt-3 space-y-4 text-sm text-slate-700 dark:text-slate-300">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-white p-3 dark:bg-slate-800">
          <p className="font-semibold text-slate-900 dark:text-white">Akun Login (halaman ini)</p>
          <p className="mt-1">
            Akun email &amp; password, khusus Super Admin (pemilik usaha). Akun lama dengan peran
            lain tidak bisa login lagi; nonaktifkan dan pindahkan orangnya ke menu Karyawan.
          </p>
        </div>
        <div className="rounded-md bg-white p-3 dark:bg-slate-800">
          <p className="font-semibold text-slate-900 dark:text-white">Karyawan</p>
          <p className="mt-1">
            Data SDM: gaji, jadwal, absensi. Admin, Kasir, dan Operator cabang login dengan profil
            + PIN yang diberikan di{' '}
            <Link
              to="/management/employees"
              className="font-medium text-blue-700 underline dark:text-blue-300"
            >
              menu Karyawan
            </Link>
            ; peran akunnya mengikuti posisi karyawan (Operator/Kasir/Admin). Akun PIN tidak tampil
            di daftar ini.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ROLE_ORDER.map((role) => (
          <div key={role} className="rounded-md bg-white p-3 dark:bg-slate-800">
            <p className="font-semibold text-slate-900 dark:text-white">{role}</p>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {ROLE_DESCRIPTIONS[role].summary}
            </p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5">
              {ROLE_DESCRIPTIONS[role].can.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  </details>
);

const UsersPage: React.FC = () => {
  const { currentUser, selectedStoreId } = useAppContext();
  const { addToast, updateToast } = useToasts();
  // Ambil data users dari Supabase (props/context/hook) sesuai implementasi fetch profiles
  const { stores } = useStores();
  const { addAuditLog } = useAuditLogs();
  const { users, updateUser, createUser } = useUsers();
  const [isSaving, setIsSaving] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<
    'all' | 'superadmin' | 'admin' | 'kasir' | 'operator' | 'active' | 'inactive'
  >('all');

  const handleOpenFormModal = (user: User | null = null) => {
    setCurrentUserToEdit(user);
    setIsFormModalOpen(true);
  };

  const handleToggleStatus = (user: User) => {
    setUserToToggleStatus(user);
  };

  const handleAddUser = () => {
    handleOpenFormModal(null);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setCurrentUserToEdit(null);
  };

  const handleSaveUser = async (userData: Omit<User, 'id'>, credentials?: NewUserCredentials) => {
    if (isSaving) return;
    const finalData = { ...userData };

    const toastId = addToast(
      currentUserToEdit ? 'Menyimpan pengguna...' : 'Membuat akun pengguna...',
      'info',
    );
    setIsSaving(true);
    try {
      if (currentUserToEdit && currentUserToEdit.id) {
        // Hanya nama & status. Peran/cabang tidak diubah dari sini.
        await updateUser(currentUserToEdit.id, {
          name: finalData.name,
          isActive: finalData.isActive,
        });
        addAuditLog(`Memperbarui data pengguna: "${finalData.name}".`);
        updateToast(toastId, 'Pengguna berhasil diperbarui!', 'success');
        handleCloseFormModal();
      } else {
        if (!credentials) {
          updateToast(toastId, 'Email dan password wajib diisi.', 'warning');
          return;
        }
        await createUser({
          email: credentials.email,
          password: credentials.password,
          name: finalData.name,
          role: UserRole.SuperAdmin,
        });
        addAuditLog(
          `Menambahkan Super Admin baru "${finalData.name}" (${credentials.email}).`,
        );
        updateToast(
          toastId,
          `Akun ${finalData.name} berhasil dibuat. Ia bisa login dengan ${credentials.email}.`,
          'success',
        );
        handleCloseFormModal();
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      updateToast(toastId, `Gagal menyimpan: ${errMsg}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (userToToggleStatus) {
      const toastId = addToast(
        `${userToToggleStatus.isActive ? 'Menonaktifkan' : 'Mengaktifkan'} pengguna...`,
        'info',
      );
      try {
        const newStatus = !userToToggleStatus.isActive;
        await updateUser(userToToggleStatus.id, { isActive: newStatus });
        addAuditLog(
          `Mengubah status pengguna "${userToToggleStatus.name}" menjadi ${newStatus ? 'Aktif' : 'Tidak Aktif'}.`,
        );
        updateToast(
          toastId,
          `Status pengguna ${userToToggleStatus.name} diubah menjadi ${newStatus ? 'Aktif' : 'Tidak Aktif'}.`,
          'success',
        );
      } catch (error: unknown) {
        // Catatan: Penggunaan 'unknown' pada error object di catch block, bukan pada payload/data. Sudah aman.
        const errMsg = error instanceof Error ? error.message : String(error);
        updateToast(toastId, `Gagal mengubah status: ${errMsg}`, 'error');
      } finally {
        setUserToToggleStatus(null);
      }
    }
  };
  const usersWithStore = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        storeName: stores.find((s) => s.id === user.storeId)?.name || 'N/A',
      })),
    [users, stores],
  );

  type UserWithStore = (typeof usersWithStore)[0];

  const filteredUsers = useMemo(() => {
    let filtered = usersWithStore.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    if (roleFilter === 'superadmin') {
      filtered = filtered.filter((user) => user.role === UserRole.SuperAdmin);
    } else if (roleFilter === 'admin') {
      filtered = filtered.filter((user) => user.role === UserRole.Admin);
    } else if (roleFilter === 'kasir') {
      filtered = filtered.filter((user) => user.role === UserRole.Cashier);
    } else if (roleFilter === 'operator') {
      filtered = filtered.filter((user) => user.role === UserRole.Operator);
    } else if (roleFilter === 'active') {
      filtered = filtered.filter((user) => user.isActive === true);
    } else if (roleFilter === 'inactive') {
      filtered = filtered.filter((user) => user.isActive === false);
    }

    return filtered;
  }, [usersWithStore, searchTerm, roleFilter]);

  const {
    items: sortedUsers,
    requestSort,
    sortConfig,
  } = useSortableData<UserWithStore>(filteredUsers);

  const getSortIcon = (key: keyof UserWithStore) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <p className="text-slate-600 dark:text-slate-400">
          Akun email &amp; password, khusus Super Admin.
        </p>
        <button onClick={handleAddUser} className="btn btn-primary btn-sm self-start">
          Tambah Super Admin
        </button>
      </div>

      <AccessGuide />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <input
            type="text"
            id="user-search"
            name="user-search"
            placeholder="Cari akun..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            autoComplete="off"
          />
        </div>
        <select
          id="user-role-filter"
          name="user-role-filter"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          className="w-full sm:w-48 p-2 rounded-lg border dark:bg-slate-700 dark:border-slate-600 dark:text-white"
        >
          <option value="all">Semua Akun</option>
          <option value="superadmin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="kasir">Kasir</option>
          <option value="operator">Operator</option>
          <option value="active">Aktif</option>
          <option value="inactive">Tidak Aktif</option>
        </select>
      </div>

      <div className="card p-6">
        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
            <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">No</th>
                <th className="px-6 py-3">
                  <button
                    onClick={() => requestSort('name')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Nama {getSortIcon('name')}
                  </button>
                </th>
                <th className="px-6 py-3">
                  <button
                    onClick={() => requestSort('role')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Peran {getSortIcon('role')}
                  </button>
                </th>
                {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                  <th className="px-6 py-3">
                    <button
                      onClick={() => requestSort('storeName')}
                      className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      Cabang {getSortIcon('storeName')}
                    </button>
                  </th>
                )}
                <th className="px-6 py-3">
                  <button
                    onClick={() => requestSort('isActive')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Status {getSortIcon('isActive')}
                  </button>
                </th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.length > 0 ? (
                sortedUsers.map((user, index) => {
                  const isSuperAdmin = user.role === UserRole.SuperAdmin;
                  return (
                    <tr key={user.id} className="border-b dark:border-slate-700">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </td>
                      <td className="px-6 py-4">{user.role}</td>
                      {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                        <td className="px-6 py-4">
                          {user.role !== UserRole.SuperAdmin ? user.storeName : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span
                          className={`badge ${user.isActive ? 'badge-success' : 'badge-neutral'}`}
                        >
                          {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            aria-label={`Edit ${user.name}`}
                            onClick={() => handleOpenFormModal(user)}
                            title="Edit"
                            className="btn btn-ghost btn-icon"
                          >
                            <EditIcon className="w-5 h-5" />
                          </button>
                          <button
                            aria-label={`${user.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${user.name}`}
                            onClick={() => handleToggleStatus(user)}
                            title={
                              isSuperAdmin
                                ? 'Super Admin tidak bisa dinonaktifkan'
                                : user.isActive
                                  ? 'Nonaktifkan'
                                  : 'Aktifkan'
                            }
                            disabled={isSuperAdmin}
                            className={`btn btn-ghost btn-icon ${user.isActive ? 'text-amber-600 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}
                          >
                            <PowerIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={
                      currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 5 : 4
                    }
                  >
                    <EmptyState
                      icon={<UsersIcon className="mx-auto w-12 h-12 text-slate-400" />}
                      title={searchTerm ? 'Pengguna Tidak Ditemukan' : 'Belum Ada Pengguna'}
                      description={
                        searchTerm
                          ? 'Coba kata kunci lain atau tambahkan pengguna baru.'
                          : 'Mulai dengan menambahkan pengguna pertama Anda.'
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {sortedUsers.length > 0 ? (
            sortedUsers.map((user) => {
              const isSuperAdmin = user.role === UserRole.SuperAdmin;
              return (
                <div
                  key={user.id}
                  className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg text-slate-800 dark:text-slate-200">
                        {user.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{user.role}</p>
                      {currentUser?.role === UserRole.SuperAdmin &&
                        selectedStoreId === 'all' &&
                        user.role !== UserRole.SuperAdmin && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            {user.storeName}
                          </p>
                        )}
                    </div>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      {user.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-2 border-t dark:border-slate-600 pt-2">
                    <button
                      aria-label={`Edit ${user.name}`}
                      onClick={() => {
                        setCurrentUserToEdit(user);
                        setIsFormModalOpen(true);
                      }}
                      title="Edit"
                      className="btn btn-ghost btn-icon"
                    >
                      <EditIcon className="w-5 h-5" />
                    </button>
                    <button
                      aria-label={`${user.isActive ? 'Nonaktifkan' : 'Aktifkan'} ${user.name}`}
                      onClick={() => setUserToToggleStatus(user)}
                      title={
                        isSuperAdmin
                          ? 'Super Admin tidak bisa dinonaktifkan'
                          : user.isActive
                            ? 'Nonaktifkan'
                            : 'Aktifkan'
                      }
                      disabled={isSuperAdmin}
                      className={`btn btn-ghost btn-icon ${user.isActive ? 'text-amber-600 dark:text-amber-400' : 'text-green-700 dark:text-green-400'}`}
                    >
                      <PowerIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              icon={<UsersIcon className="mx-auto w-12 h-12 text-slate-400" />}
              title={searchTerm ? 'Pengguna Tidak Ditemukan' : 'Belum Ada Pengguna'}
              description={
                searchTerm
                  ? 'Coba kata kunci lain atau tambahkan pengguna baru.'
                  : 'Mulai dengan menambahkan pengguna pertama Anda.'
              }
            />
          )}
        </div>
      </div>

      {isFormModalOpen && (
        <UserFormModal
          user={currentUserToEdit}
          onClose={handleCloseFormModal}
          onSave={handleSaveUser}
          disabled={isSaving}
        />
      )}

      {userToToggleStatus && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setUserToToggleStatus(null)}
          onConfirm={confirmToggleStatus}
          title={`${userToToggleStatus.isActive ? 'Nonaktifkan' : 'Aktifkan'} Pengguna`}
          message={`Apakah Anda yakin ingin ${userToToggleStatus.isActive ? 'menonaktifkan' : 'mengaktifkan'} pengguna "${userToToggleStatus.name}"?`}
          confirmText={userToToggleStatus.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          confirmVariant={userToToggleStatus.isActive ? 'danger' : 'primary'}
        />
      )}
    </div>
  );
};

export default UsersPage;

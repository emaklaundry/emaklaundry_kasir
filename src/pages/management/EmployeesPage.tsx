import { Link } from 'react-router-dom';
import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useEmployees } from '../../contexts/useEmployees';
import { useUsers } from '../../contexts/UserContext';
import useAppContext from '../../contexts/useAppContext';
import useToasts from '../../contexts/useToasts';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import Modal from '../../components/Modal';
import EmployeeFormModal from '../../components/employees/EmployeeFormModal';
import { Employee, EmployeeFormData, EmployeeRole } from '../../types/hrm';
import { User, UserRole } from '../../types';
import {
  PlusCircleIcon,
  EditIcon,
  TrashIcon,
  UserIcon,
  ArrowDownIcon,
  SpinnerIcon,
} from '../../components/icons';
import { formatRupiah } from '../../utils/formatting';
import { EMPLOYEE_ROLE_LABELS, formatSchedule } from '../../utils/employeeSchedule';
import { revokeEmployeeLogin, setEmployeePin, syncEmployeeLogin } from '../../utils/employeeLogin';
import SearchInput from '../../components/SearchInput';

type StatusFilter = 'active' | 'inactive' | 'all';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Nonaktif' },
  { value: 'all', label: 'Semua' },
];

const mapUserRoleToEmployeeRole = (userRole: UserRole): EmployeeRole => {
  switch (userRole) {
    case UserRole.Cashier:
      return 'kasir';
    case UserRole.Admin:
    case UserRole.SuperAdmin:
      return 'admin';
    case UserRole.Operator:
    default:
      return 'operator';
  }
};

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`badge ${active ? 'badge-success' : 'badge-neutral'}`}>
    {active ? 'Aktif' : 'Nonaktif'}
  </span>
);

const LoginBadge: React.FC<{ enabled?: boolean }> = ({ enabled }) =>
  enabled ? (
    <span className="text-sm font-medium text-green-700 dark:text-green-400">Bisa login</span>
  ) : (
    <span className="text-sm text-slate-500 dark:text-slate-400">Belum diatur</span>
  );

const EmployeesPage: React.FC = () => {
  const { employees, isLoading, fetchEmployees, addEmployee, updateEmployee, deleteEmployee } =
    useEmployees();
  const { users } = useUsers();
  const { currentUser, stores, selectedStoreId } = useAppContext();
  const { addToast } = useToasts();
  const [confirm, confirmDialog] = useConfirmDialog();

  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
  const ownStoreId = currentUser?.storeId ?? '';

  const [storeFilter, setStoreFilter] = useState<string>(
    isSuperAdmin ? selectedStoreId || 'all' : ownStoreId,
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [initialData, setInitialData] = useState<Partial<EmployeeFormData> | undefined>();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) setStoreFilter(selectedStoreId || 'all');
  }, [isSuperAdmin, selectedStoreId]);

  useEffect(() => {
    fetchEmployees(storeFilter || undefined);
  }, [storeFilter, fetchEmployees]);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? '-';
  const showStoreColumn = isSuperAdmin && storeFilter === 'all';
  const defaultStoreId = storeFilter && storeFilter !== 'all' ? storeFilter : ownStoreId;

  const counts = useMemo(
    () => ({
      active: employees.filter((e) => e.isActive).length,
      inactive: employees.filter((e) => !e.isActive).length,
      canLogin: employees.filter((e) => e.loginEnabled).length,
    }),
    [employees],
  );

  const visibleEmployees = useMemo(() => {
    const term = deferredQuery.trim().toLocaleLowerCase('id-ID');
    return employees
      .filter((e) =>
        statusFilter === 'all' ? true : statusFilter === 'active' ? e.isActive : !e.isActive,
      )
      .filter(
        (e) =>
          !term ||
          e.name.toLocaleLowerCase('id-ID').includes(term) ||
          (e.phone ?? '').includes(term),
      );
  }, [employees, statusFilter, deferredQuery]);

  const openForm = (employee: Employee | null, data?: Partial<EmployeeFormData>) => {
    setEditing(employee);
    setInitialData(data);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (isSaving) return;
    setFormOpen(false);
    setEditing(null);
    setInitialData(undefined);
  };

  const refresh = () => fetchEmployees(storeFilter || undefined);

  const handleSubmit = async (data: EmployeeFormData, pin: string) => {
    setIsSaving(true);
    let saved: Employee | null = editing;
    try {
      if (editing) {
        await updateEmployee(editing.id, data);
      } else {
        saved = await addEmployee(data);
      }
    } catch (err) {
      addToast(errorMessage(err, 'Gagal menyimpan data karyawan.'), 'error');
      setIsSaving(false);
      return;
    }

    // Data karyawan sudah tersimpan; akun login diurus terpisah agar pesan galatnya jelas.
    try {
      if (saved && pin) await setEmployeePin(saved.id, pin);
      else if (saved && editing?.loginEnabled) await syncEmployeeLogin(saved.id);
      addToast(
        pin
          ? 'Data karyawan tersimpan dan PIN login sudah diatur.'
          : editing
            ? 'Data karyawan berhasil diperbarui.'
            : 'Karyawan baru berhasil ditambahkan.',
        'success',
      );
    } catch (err) {
      addToast(
        `Data karyawan tersimpan, tetapi akun login gagal diperbarui: ${errorMessage(err, 'coba lagi.')}`,
        'warning',
      );
    } finally {
      await refresh();
      setIsSaving(false);
      setFormOpen(false);
      setEditing(null);
      setInitialData(undefined);
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    const nextActive = !employee.isActive;
    if (
      !nextActive &&
      !(await confirm({
        title: 'Nonaktifkan karyawan',
        message: `Nonaktifkan ${employee.name}? Login-nya ditutup, data dan riwayatnya tetap tersimpan.`,
        confirmText: 'Nonaktifkan',
      }))
    )
      return;
    try {
      await updateEmployee(employee.id, { isActive: nextActive });
      if (employee.loginEnabled || !nextActive) await syncEmployeeLogin(employee.id);
      addToast(
        nextActive
          ? `${employee.name} diaktifkan kembali. Atur PIN bila perlu login.`
          : `${employee.name} dinonaktifkan.`,
        'success',
      );
    } catch (err) {
      addToast(errorMessage(err, 'Gagal mengubah status karyawan.'), 'error');
    } finally {
      await refresh();
    }
  };

  const handleRevokeLogin = async (employee: Employee) => {
    const ok = await confirm({
      title: 'Cabut akses login',
      message: `Cabut akses login ${employee.name}? PIN-nya tidak bisa dipakai lagi.`,
      confirmText: 'Cabut akses',
    });
    if (!ok) return;
    setIsSaving(true);
    try {
      await revokeEmployeeLogin(employee.id);
      addToast(`Akses login ${employee.name} dicabut.`, 'success');
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      addToast(errorMessage(err, 'Gagal mencabut akses login.'), 'error');
    } finally {
      setIsSaving(false);
      await refresh();
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (
      !(await confirm({
        title: 'Hapus karyawan',
        message: `Hapus permanen ${employee.name}? Riwayat absensi, kasbon, dan gaji karyawan ini ikut terhapus.\n\nUntuk karyawan yang berhenti, gunakan Nonaktifkan.`,
        confirmText: 'Hapus permanen',
      }))
    )
      return;
    try {
      if (employee.loginEnabled) await revokeEmployeeLogin(employee.id);
      await deleteEmployee(employee.id);
      addToast(`${employee.name} dihapus.`, 'success');
    } catch (err) {
      addToast(errorMessage(err, 'Gagal menghapus karyawan.'), 'error');
      await refresh();
    }
  };

  const handleImportUser = (user: User) => {
    setIsImportOpen(false);
    openForm(null, {
      storeId: user.storeId || defaultStoreId,
      name: user.name,
      role: mapUserRoleToEmployeeRole(user.role),
    });
    addToast('Data pengguna dimuat. Lengkapi jadwal dan kompensasinya.', 'info');
  };

  const compensation = (e: Employee) =>
    [
      `Rp ${formatRupiah(e.baseSalary)}/hari`,
      e.commissionRate > 0 ? `+${e.commissionRate}% komisi` : '',
      e.monthlyIncentive > 0 ? `+Rp ${formatRupiah(e.monthlyIncentive)} insentif` : '',
    ]
      .filter(Boolean)
      .join(' ');

  const actionButtons = (employee: Employee) => (
    <>
      <button
        type="button"
        onClick={() => openForm(employee)}
        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 touch-target"
      >
        <EditIcon className="h-4 w-4" />
        Edit
      </button>
      <button
        type="button"
        onClick={() => handleToggleActive(employee)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 touch-target"
      >
        {employee.isActive ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
      <button
        type="button"
        onClick={() => handleDelete(employee)}
        aria-label={`Hapus ${employee.name}`}
        title="Hapus permanen"
        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 touch-target"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </>
  );

  const importableUsers = users.filter((u) => u.role !== UserRole.SuperAdmin);

  return (
    <div className="space-y-4">
      <div
        id="employees-header"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-slate-600 dark:text-slate-400">
            {counts.active} aktif · {counts.inactive} nonaktif · {counts.canLogin} bisa login
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Data SDM (gaji, jadwal, absensi). Beri PIN agar karyawan bisa login — hak aksesnya
            mengikuti posisi. Akun email dikelola di{' '}
            <Link
              to="/management/users"
              className="font-medium text-blue-700 underline dark:text-blue-300"
            >
              Akun Login
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2">
          <button
            id="employees-import-btn"
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 sm:flex-none touch-target"
          >
            <ArrowDownIcon className="h-5 w-5" />
            Import dari Akun Login
          </button>
          <button
            id="employees-add-btn"
            type="button"
            onClick={() => openForm(null)}
            className="btn btn-primary flex-1 sm:flex-none"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Tambah Karyawan
          </button>
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <SearchInput
          id="employee-search"
          label="Cari karyawan"
          placeholder="Cari nama atau nomor HP"
          value={query}
          onValueChange={setQuery}
          wrapperClassName="flex-1"
        />
        {isSuperAdmin && (
          <div>
            <label htmlFor="employee-store-filter" className="sr-only">
              Filter cabang
            </label>
            <select
              id="employee-store-filter"
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="form-input px-3 py-2.5 md:w-48"
            >
              <option value="all">Semua cabang</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div
          role="radiogroup"
          aria-label="Filter status"
          className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 dark:bg-slate-700"
        >
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={statusFilter === f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div id="employees-list">
        {isLoading ? (
          <div className="py-12 text-center" role="status">
            <SpinnerIcon className="h-8 w-8 mx-auto block text-brand-blue-600 dark:text-brand-blue-400" />
            <p className="mt-3 text-slate-500">Memuat data karyawan…</p>
          </div>
        ) : visibleEmployees.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center dark:border-slate-600">
            <UserIcon className="mx-auto mb-3 h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="font-medium text-slate-700 dark:text-slate-200">
              {employees.length === 0
                ? 'Belum ada data karyawan.'
                : 'Tidak ada karyawan yang cocok dengan filter.'}
            </p>
            {employees.length === 0 && (
              <button
                type="button"
                onClick={() => openForm(null)}
                className="btn btn-primary btn-sm mt-4"
              >
                Tambah karyawan pertama
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop: tabel */}
            <div className="card hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 text-xs uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2.5">Karyawan</th>
                    <th className="px-4 py-2.5">Posisi</th>
                    {showStoreColumn && <th className="px-4 py-2.5">Cabang</th>}
                    <th className="hidden px-4 py-2.5 lg:table-cell">Jadwal</th>
                    <th className="px-4 py-2.5">Kompensasi</th>
                    <th className="px-4 py-2.5">Login</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEmployees.map((e) => (
                    <tr key={e.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="px-4 py-2.5">
                        <span className="block font-medium text-slate-900 dark:text-white">
                          {e.name}
                        </span>
                        <span className="text-xs text-slate-500">{e.phone || '-'}</span>
                      </td>
                      <td className="px-4 py-2.5">{EMPLOYEE_ROLE_LABELS[e.role] ?? e.role}</td>
                      {showStoreColumn && <td className="px-4 py-2.5">{storeName(e.storeId)}</td>}
                      <td className="hidden px-4 py-2.5 lg:table-cell">
                        {formatSchedule(e.workDays, e.shiftStart, e.shiftEnd)}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums">{compensation(e)}</td>
                      <td className="px-4 py-2.5">
                        <LoginBadge enabled={e.loginEnabled} />
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge active={e.isActive} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">{actionButtons(e)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: kartu */}
            <ul className="space-y-3 md:hidden">
              {visibleEmployees.map((e) => (
                <li
                  key={e.id}
                  className="card p-4"
                  aria-label={e.name}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {e.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {EMPLOYEE_ROLE_LABELS[e.role] ?? e.role}
                        {showStoreColumn ? ` · ${storeName(e.storeId)}` : ''}
                        {e.phone ? ` · ${e.phone}` : ''}
                      </p>
                    </div>
                    <StatusBadge active={e.isActive} />
                  </div>
                  <dl className="mt-3 grid grid-cols-1 gap-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Jadwal</dt>
                      <dd className="text-right text-slate-800 dark:text-slate-200">
                        {formatSchedule(e.workDays, e.shiftStart, e.shiftEnd)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Kompensasi</dt>
                      <dd className="text-right tabular-nums text-slate-800 dark:text-slate-200">
                        {compensation(e)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Login</dt>
                      <dd>
                        <LoginBadge enabled={e.loginEnabled} />
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                    {actionButtons(e)}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {formOpen && (
        <EmployeeFormModal
          key={editing?.id ?? 'new'}
          isOpen
          employee={editing}
          initialData={initialData}
          stores={stores}
          canChooseStore={isSuperAdmin}
          defaultStoreId={defaultStoreId}
          isSaving={isSaving}
          onClose={closeForm}
          onSubmit={handleSubmit}
          onRevokeLogin={handleRevokeLogin}
        />
      )}

      <Modal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        title="Import dari Pengguna"
        footer={
          <button
            type="button"
            onClick={() => setIsImportOpen(false)}
            className="btn btn-secondary"
          >
            Tutup
          </button>
        }
      >
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Pilih pengguna aplikasi yang ingin dijadikan karyawan. Nama, cabang, dan posisi diambil
          otomatis.
        </p>
        <div className="max-h-96 space-y-2 overflow-y-auto">
          {importableUsers.length === 0 ? (
            <p className="py-4 text-center text-slate-500">Tidak ada pengguna yang tersedia.</p>
          ) : (
            importableUsers.map((user) => {
              const isAlreadyEmployee = employees.some(
                (e) => e.name.toLowerCase() === user.name.toLowerCase(),
              );
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => !isAlreadyEmployee && handleImportUser(user)}
                  disabled={isAlreadyEmployee}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-brand-blue-200 hover:bg-brand-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                >
                  <span>
                    <span className="block font-medium text-slate-900 dark:text-white">
                      {user.name}
                    </span>
                    <span className="text-xs text-slate-500">{user.role}</span>
                  </span>
                  {isAlreadyEmployee && (
                    <span className="text-xs font-medium text-slate-400">Sudah ditambahkan</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </Modal>
      {confirmDialog}
    </div>
  );
};

export default EmployeesPage;

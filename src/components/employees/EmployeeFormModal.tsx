import { ROLE_DESCRIPTIONS, EMPLOYEE_TO_USER_ROLE } from '../../config/permissions';
import React, { useState } from 'react';
import Modal from '../Modal';
import { Employee, EmployeeFormData, EmployeeRole, WorkDay } from '../../types/hrm';
import { Store } from '../../types';
import {
  EMPLOYEE_ROLE_LABELS,
  WORK_DAYS,
  emptyEmployeeForm,
  validateEmployeeForm,
} from '../../utils/employeeSchedule';

const inputClass =
  'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white';
const labelClass = 'mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300';

interface EmployeeFormModalProps {
  isOpen: boolean;
  employee: Employee | null;
  /** Data awal untuk karyawan baru (mis. dari Import Pengguna). */
  initialData?: Partial<EmployeeFormData>;
  stores: Store[];
  /** Super Admin boleh memilih cabang; Admin terkunci ke cabangnya. */
  canChooseStore: boolean;
  defaultStoreId: string;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeFormData, pin: string) => void;
  onRevokeLogin: (employee: Employee) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <fieldset className="space-y-3">
    <legend className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {title}
    </legend>
    {children}
  </fieldset>
);

const formFromEmployee = (employee: Employee): EmployeeFormData => ({
  storeId: employee.storeId,
  name: employee.name,
  phone: employee.phone ?? '',
  address: employee.address ?? '',
  role: employee.role,
  startDate: employee.startDate ?? '',
  shiftStart: employee.shiftStart ?? '',
  shiftEnd: employee.shiftEnd ?? '',
  workDays: employee.workDays,
  lateToleranceMinutes: employee.lateToleranceMinutes,
  baseSalary: employee.baseSalary,
  commissionRate: employee.commissionRate,
  monthlyIncentive: employee.monthlyIncentive,
  isActive: employee.isActive,
});

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  employee,
  initialData,
  stores,
  canChooseStore,
  defaultStoreId,
  isSaving,
  onClose,
  onSubmit,
  onRevokeLogin,
}) => {
  // Komponen ini di-mount ulang setiap kali dibuka (lihat `key` di EmployeesPage),
  // jadi nilai awal cukup diambil sekali di sini.
  const [form, setForm] = useState<EmployeeFormData>(() =>
    employee
      ? formFromEmployee(employee)
      : { ...emptyEmployeeForm(defaultStoreId), ...initialData },
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleDay = (day: WorkDay) =>
    set(
      'workDays',
      form.workDays.includes(day)
        ? form.workDays.filter((d) => d !== day)
        : [...form.workDays, day],
    );

  const numberValue = (value: string) => Math.max(0, Number(value) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = validateEmployeeForm(form, pin);
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    onSubmit(form, pin);
  };

  const storeName = stores.find((s) => s.id === form.storeId)?.name ?? '-';
  const loginEnabled = Boolean(employee?.loginEnabled);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? 'Edit Karyawan' : 'Tambah Karyawan'}
      footer={
        <>
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 touch-target"
          >
            Batal
          </button>
          <button
            type="submit"
            form="employee-form"
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form
        id="employee-form"
        aria-label="Form karyawan"
        noValidate
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
          >
            {error}
          </p>
        )}

        <Section title="Profil">
          <div>
            <label htmlFor="employee-name" className={labelClass}>
              Nama lengkap *
            </label>
            <input
              id="employee-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              autoComplete="off"
              className={inputClass}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="employee-phone" className={labelClass}>
                Nomor HP
              </label>
              <input
                id="employee-phone"
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="08xxxxxxxxxx"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="employee-role" className={labelClass}>
                Posisi / jabatan
              </label>
              <select
                id="employee-role"
                value={form.role}
                onChange={(e) => set('role', e.target.value as EmployeeRole)}
                className={inputClass}
              >
                {(Object.keys(EMPLOYEE_ROLE_LABELS) as EmployeeRole[]).map((role) => (
                  <option key={role} value={role}>
                    {EMPLOYEE_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="employee-address" className={labelClass}>
              Alamat
            </label>
            <textarea
              id="employee-address"
              rows={2}
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="sm:w-1/2">
            <label htmlFor="employee-start-date" className={labelClass}>
              Tanggal mulai bekerja
            </label>
            <input
              id="employee-start-date"
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              className={inputClass}
            />
          </div>
        </Section>

        <Section title="Penempatan & status">
          <div>
            <label htmlFor="employee-store" className={labelClass}>
              Cabang *
            </label>
            {canChooseStore ? (
              <select
                id="employee-store"
                value={form.storeId}
                onChange={(e) => set('storeId', e.target.value)}
                className={inputClass}
              >
                <option value="">Pilih cabang</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            ) : (
              <input id="employee-store" value={storeName} disabled className={inputClass} />
            )}
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-600">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-slate-300 text-brand-blue-600"
            />
            <span>
              <span className="block font-medium text-slate-900 dark:text-white">
                Karyawan aktif
              </span>
              <span className="block text-sm text-slate-600 dark:text-slate-400">
                Matikan bila karyawan berhenti/resign. Data tetap tersimpan dan login-nya ditutup.
              </span>
            </span>
          </label>
        </Section>

        <Section title="Jadwal & absensi">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="employee-shift-start" className={labelClass}>
                Jam masuk
              </label>
              <input
                id="employee-shift-start"
                type="time"
                value={form.shiftStart}
                onChange={(e) => set('shiftStart', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="employee-shift-end" className={labelClass}>
                Jam pulang
              </label>
              <input
                id="employee-shift-end"
                type="time"
                value={form.shiftEnd}
                onChange={(e) => set('shiftEnd', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <span id="employee-workdays-label" className={labelClass}>
              Hari kerja
            </span>
            <div
              role="group"
              aria-labelledby="employee-workdays-label"
              className="grid grid-cols-7 gap-1.5"
            >
              {WORK_DAYS.map((day) => {
                const checked = form.workDays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    title={day.long}
                    className={`flex cursor-pointer select-none items-center justify-center rounded-lg border py-2 text-sm font-medium transition-colors ${
                      checked
                        ? 'border-brand-blue-600 bg-brand-blue-600 text-white'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleDay(day.value)}
                      aria-label={day.long}
                    />
                    {day.short}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="sm:w-1/2">
            <label htmlFor="employee-late-tolerance" className={labelClass}>
              Toleransi terlambat (menit)
            </label>
            <input
              id="employee-late-tolerance"
              type="number"
              inputMode="numeric"
              min={0}
              max={240}
              value={form.lateToleranceMinutes}
              onChange={(e) => set('lateToleranceMinutes', numberValue(e.target.value))}
              className={inputClass}
            />
          </div>
        </Section>

        <Section title="Kompensasi">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="employee-salary" className={labelClass}>
                Gaji pokok / bulan (Rp)
              </label>
              <input
                id="employee-salary"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.baseSalary}
                onChange={(e) => set('baseSalary', numberValue(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="employee-commission" className={labelClass}>
                Komisi (%)
              </label>
              <input
                id="employee-commission"
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step={0.1}
                value={form.commissionRate}
                onChange={(e) => set('commissionRate', numberValue(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="employee-incentive" className={labelClass}>
                Insentif / bulan (Rp)
              </label>
              <input
                id="employee-incentive"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.monthlyIncentive}
                onChange={(e) => set('monthlyIncentive', numberValue(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>
        </Section>

        <Section title="Akun login">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Karyawan masuk dengan memilih namanya di halaman login lalu mengetik PIN. Hak aksesnya
            mengikuti posisi: <strong>{EMPLOYEE_ROLE_LABELS[form.role]}</strong> di cabang
            penempatan.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {ROLE_DESCRIPTIONS[EMPLOYEE_TO_USER_ROLE[form.role]].summary}
          </p>
          <p className="text-sm font-medium">
            Status:{' '}
            {loginEnabled ? (
              <span className="text-green-700 dark:text-green-400">Login aktif</span>
            ) : (
              <span className="text-slate-600 dark:text-slate-400">Belum bisa login</span>
            )}
          </p>
          <div className="sm:w-1/2">
            <label htmlFor="employee-login-pin" className={labelClass}>
              {loginEnabled ? 'PIN baru (reset)' : 'PIN login (6 angka)'}
            </label>
            <input
              id="employee-login-pin"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              aria-describedby="employee-login-pin-help"
              className={`${inputClass} font-mono tracking-[0.4em]`}
            />
            <p id="employee-login-pin-help" className="mt-1 text-xs text-slate-500">
              {loginEnabled
                ? 'Kosongkan bila PIN tidak diubah.'
                : 'Isi untuk mengaktifkan login karyawan ini.'}
            </p>
          </div>
          {employee && loginEnabled && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onRevokeLogin(employee)}
              className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30 touch-target"
            >
              Cabut akses login
            </button>
          )}
        </Section>
      </form>
    </Modal>
  );
};

export default EmployeeFormModal;

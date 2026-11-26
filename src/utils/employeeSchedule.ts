import { EmployeeFormData, EmployeeRole, WorkDay } from '../types/hrm';

export const WORK_DAYS: { value: WorkDay; short: string; long: string }[] = [
  { value: 1, short: 'Sen', long: 'Senin' },
  { value: 2, short: 'Sel', long: 'Selasa' },
  { value: 3, short: 'Rab', long: 'Rabu' },
  { value: 4, short: 'Kam', long: 'Kamis' },
  { value: 5, short: 'Jum', long: 'Jumat' },
  { value: 6, short: 'Sab', long: 'Sabtu' },
  { value: 7, short: 'Min', long: 'Minggu' },
];

export const EMPLOYEE_ROLE_LABELS: Record<EmployeeRole, string> = {
  operator: 'Operator',
  kasir: 'Kasir',
  admin: 'Admin',
};

/** "Sen–Sab, 08:00–17:00" atau "Belum diatur". */
export function formatSchedule(
  workDays: WorkDay[],
  shiftStart?: string,
  shiftEnd?: string,
): string {
  const days = [...workDays].sort((a, b) => a - b);
  let dayText = '';
  if (days.length === 7) dayText = 'Setiap hari';
  else if (days.length > 0) {
    const isRange = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
    const label = (d: WorkDay) => WORK_DAYS[d - 1].short;
    dayText =
      isRange && days.length > 2
        ? `${label(days[0])}–${label(days[days.length - 1])}`
        : days.map(label).join(', ');
  }
  const shiftText = shiftStart && shiftEnd ? `${shiftStart}–${shiftEnd}` : '';
  return [dayText, shiftText].filter(Boolean).join(', ') || 'Belum diatur';
}

export const emptyEmployeeForm = (storeId: string): EmployeeFormData => ({
  storeId,
  name: '',
  phone: '',
  address: '',
  role: 'operator',
  startDate: '',
  shiftStart: '08:00',
  shiftEnd: '17:00',
  workDays: [1, 2, 3, 4, 5, 6],
  lateToleranceMinutes: 15,
  baseSalary: 0,
  commissionRate: 0,
  monthlyIncentive: 0,
  isActive: true,
});

/** Pesan galat pertama, atau null bila form valid. */
export function validateEmployeeForm(form: EmployeeFormData, pin: string): string | null {
  if (!form.name.trim()) return 'Nama karyawan wajib diisi.';
  if (!form.storeId) return 'Pilih cabang penempatan.';
  if (form.phone && !/^(\+62|62|0)8[0-9]{7,12}$/.test(form.phone.replace(/[\s-]/g, '')))
    return 'Format nomor HP tidak valid (contoh: 081234567890).';
  if (Boolean(form.shiftStart) !== Boolean(form.shiftEnd))
    return 'Isi jam mulai dan jam selesai shift, atau kosongkan keduanya.';
  if (form.shiftStart && form.shiftEnd && form.shiftStart === form.shiftEnd)
    return 'Jam mulai dan selesai shift tidak boleh sama.';
  if (form.workDays.length === 0) return 'Pilih minimal satu hari kerja.';
  if (form.lateToleranceMinutes < 0 || form.lateToleranceMinutes > 240)
    return 'Toleransi terlambat harus 0–240 menit.';
  if (form.baseSalary < 0 || form.monthlyIncentive < 0)
    return 'Gaji dan insentif tidak boleh negatif.';
  if (form.commissionRate < 0 || form.commissionRate > 100) return 'Komisi harus 0–100%.';
  if (pin && !/^\d{6}$/.test(pin)) return 'PIN login harus 6 angka.';
  if (pin && !form.isActive) return 'Aktifkan karyawan sebelum mengatur PIN login.';
  return null;
}

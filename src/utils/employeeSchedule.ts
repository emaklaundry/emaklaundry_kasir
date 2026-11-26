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

export const FLEXIBLE_SCHEDULE_LABEL = 'Fleksibel (diatur owner)';

/** Jadwal standar yang dipakai saat jadwal fleksibel dimatikan. */
export const DEFAULT_FIXED_SCHEDULE: Pick<
  EmployeeFormData,
  'shiftStart' | 'shiftEnd' | 'workDays'
> = { shiftStart: '08:00', shiftEnd: '17:00', workDays: [1, 2, 3, 4, 5, 6] };

/**
 * Jadwal fleksibel: tanpa jam shift dan tanpa hari kerja tetap, karena owner
 * menentukan sendiri siapa masuk pagi atau siang. Absensi tetap mencatat jam
 * masuk/pulang, tapi tidak menghitung terlambat atau libur.
 */
export const isFlexibleSchedule = (s: { shiftStart?: string; workDays: WorkDay[] }): boolean =>
  !s.shiftStart && s.workDays.length === 0;

/** "Sen–Sab, 08:00–17:00" atau "Fleksibel (diatur owner)". */
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
  return [dayText, shiftText].filter(Boolean).join(', ') || FLEXIBLE_SCHEDULE_LABEL;
}

export const emptyEmployeeForm = (storeId: string): EmployeeFormData => ({
  storeId,
  name: '',
  phone: '',
  address: '',
  role: 'operator',
  startDate: '',
  // Default fleksibel: shift di laundry diatur owner sesuai kebutuhan, bukan dijadwal per hari.
  shiftStart: '',
  shiftEnd: '',
  workDays: [],
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
  if (form.shiftStart && form.workDays.length === 0)
    return 'Pilih minimal satu hari kerja, atau aktifkan jadwal fleksibel.';
  if (form.lateToleranceMinutes < 0 || form.lateToleranceMinutes > 240)
    return 'Toleransi terlambat harus 0–240 menit.';
  if (form.baseSalary < 0 || form.monthlyIncentive < 0)
    return 'Gaji dan insentif tidak boleh negatif.';
  if (form.commissionRate < 0 || form.commissionRate > 100) return 'Komisi harus 0–100%.';
  if (pin && !/^\d{6}$/.test(pin)) return 'PIN login harus 6 angka.';
  if (pin && !form.isActive) return 'Aktifkan karyawan sebelum mengatur PIN login.';
  return null;
}

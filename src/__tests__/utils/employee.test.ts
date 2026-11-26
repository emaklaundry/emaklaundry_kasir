import { describe, expect, it } from 'vitest';
import { mapEmployeeRow, toEmployeeRow } from '@/utils/employeeMappers';
import {
  DEFAULT_FIXED_SCHEDULE,
  emptyEmployeeForm,
  formatSchedule,
  isFlexibleSchedule,
  validateEmployeeForm,
} from '@/utils/employeeSchedule';

describe('employee mappers', () => {
  it('mengubah teks kosong jadi NULL dan mengurutkan hari kerja', () => {
    const row = toEmployeeRow({
      ...emptyEmployeeForm('store-1'),
      name: '  Siti  ',
      phone: '',
      address: '   ',
      startDate: '',
      shiftStart: '',
      shiftEnd: '',
      workDays: [6, 1, 3],
    });
    expect(row).toMatchObject({
      store_id: 'store-1',
      name: 'Siti',
      phone: null,
      address: null,
      start_date: null,
      shift_start: null,
      shift_end: null,
      work_days: [1, 3, 6],
    });
  });

  it('menonaktifkan karyawan ikut menutup login (aturan database)', () => {
    expect(toEmployeeRow({ isActive: false })).toEqual({ is_active: false, login_enabled: false });
    expect(toEmployeeRow({ isActive: true })).toEqual({ is_active: true });
  });

  it('membaca jam shift dari database sebagai HH:MM', () => {
    const employee = mapEmployeeRow({
      id: 'e1',
      store_id: 's1',
      name: 'Budi',
      phone: null,
      role: 'operator',
      base_salary: 2000000,
      commission_rate: 2.5,
      is_active: true,
      login_enabled: false,
      address: null,
      start_date: '2026-01-05',
      shift_start: '08:00:00',
      shift_end: '17:30:00',
      work_days: [1, 2, 3, 4, 5],
      late_tolerance_minutes: 10,
      monthly_incentive: 150000,
      photo_url: null,
      photo_path: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    });
    expect(employee).toMatchObject({
      shiftStart: '08:00',
      shiftEnd: '17:30',
      startDate: '2026-01-05',
      phone: undefined,
      monthlyIncentive: 150000,
    });
  });
});

describe('employee schedule', () => {
  it('meringkas jadwal', () => {
    expect(formatSchedule([1, 2, 3, 4, 5, 6], '08:00', '17:00')).toBe('Sen–Sab, 08:00–17:00');
    expect(formatSchedule([1, 3, 5])).toBe('Sen, Rab, Jum');
    expect(formatSchedule([1, 2, 3, 4, 5, 6, 7], '07:00', '15:00')).toBe(
      'Setiap hari, 07:00–15:00',
    );
    expect(formatSchedule([])).toBe('Fleksibel (diatur owner)');
  });

  it('karyawan baru default jadwal fleksibel', () => {
    const form = { ...emptyEmployeeForm('s1'), name: 'Ani' };
    expect(isFlexibleSchedule(form)).toBe(true);
    expect(validateEmployeeForm(form, '')).toBeNull();
    expect(isFlexibleSchedule({ ...form, ...DEFAULT_FIXED_SCHEDULE })).toBe(false);
  });

  it('memvalidasi form', () => {
    const base = { ...emptyEmployeeForm('s1'), ...DEFAULT_FIXED_SCHEDULE, name: 'Ani' };
    expect(validateEmployeeForm(base, '')).toBeNull();
    expect(validateEmployeeForm({ ...base, name: ' ' }, '')).toMatch(/Nama/);
    expect(validateEmployeeForm({ ...base, storeId: '' }, '')).toMatch(/cabang/);
    expect(validateEmployeeForm({ ...base, phone: '12345' }, '')).toMatch(/HP/);
    expect(validateEmployeeForm({ ...base, shiftEnd: '' }, '')).toMatch(/shift/);
    expect(validateEmployeeForm({ ...base, workDays: [] }, '')).toMatch(/hari kerja/);
    expect(validateEmployeeForm({ ...base, commissionRate: 120 }, '')).toMatch(/Komisi/);
    expect(validateEmployeeForm(base, '12a')).toMatch(/PIN/);
    expect(validateEmployeeForm({ ...base, isActive: false }, '123987')).toMatch(/Aktifkan/);
  });
});

import { Database } from '../types/supabase';
import { Employee, EmployeeFormData, EmployeeRole, WorkDay } from '../types/hrm';

type EmployeeRow = Database['public']['Tables']['employees']['Row'];

/** "08:00:00" -> "08:00" */
const toHourMinute = (value: string | null) => (value ? value.slice(0, 5) : undefined);
const blankToNull = (value: string | undefined) => (value && value.trim() ? value.trim() : null);

export function mapEmployeeRow(row: EmployeeRow): Employee {
  return {
    id: row.id,
    storeId: row.store_id ?? '',
    name: row.name,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    role: row.role as EmployeeRole,
    startDate: row.start_date ?? undefined,
    shiftStart: toHourMinute(row.shift_start),
    shiftEnd: toHourMinute(row.shift_end),
    workDays: (row.work_days ?? []) as WorkDay[],
    lateToleranceMinutes: Number(row.late_tolerance_minutes ?? 0),
    baseSalary: Number(row.base_salary ?? 0),
    commissionRate: Number(row.commission_rate ?? 0),
    monthlyIncentive: Number(row.monthly_incentive ?? 0),
    isActive: row.is_active,
    loginEnabled: row.login_enabled,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/** Kolom database dari form. Teks kosong disimpan sebagai NULL. */
export function toEmployeeRow(
  data: Partial<EmployeeFormData>,
): Database['public']['Tables']['employees']['Update'] {
  const row: Database['public']['Tables']['employees']['Update'] = {};
  if (data.storeId !== undefined) row.store_id = data.storeId || null;
  if (data.name !== undefined) row.name = data.name.trim();
  if (data.phone !== undefined) row.phone = blankToNull(data.phone);
  if (data.address !== undefined) row.address = blankToNull(data.address);
  if (data.role !== undefined) row.role = data.role;
  if (data.startDate !== undefined) row.start_date = blankToNull(data.startDate);
  if (data.shiftStart !== undefined) row.shift_start = blankToNull(data.shiftStart);
  if (data.shiftEnd !== undefined) row.shift_end = blankToNull(data.shiftEnd);
  if (data.workDays !== undefined) row.work_days = [...data.workDays].sort((a, b) => a - b);
  if (data.lateToleranceMinutes !== undefined)
    row.late_tolerance_minutes = data.lateToleranceMinutes;
  if (data.baseSalary !== undefined) row.base_salary = data.baseSalary;
  if (data.commissionRate !== undefined) row.commission_rate = data.commissionRate;
  if (data.monthlyIncentive !== undefined) row.monthly_incentive = data.monthlyIncentive;
  if (data.isActive !== undefined) {
    row.is_active = data.isActive;
    // Database mewajibkan login nonaktif untuk karyawan nonaktif.
    if (!data.isActive) row.login_enabled = false;
  }
  return row;
}

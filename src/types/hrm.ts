/**
 * HRM (Human Resource Management) Types
 */

export type EmployeeRole = 'operator' | 'kasir' | 'admin';

/** Hari kerja ISO: 1 = Senin ... 7 = Minggu. */
export type WorkDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Employee {
  id: string;
  storeId: string;
  name: string;
  phone?: string;
  address?: string;
  /** Posisi kerja. */
  role: EmployeeRole;
  /** Tanggal mulai bekerja (YYYY-MM-DD). */
  startDate?: string;
  /** Jam mulai & selesai shift (HH:MM). Keduanya diisi atau keduanya kosong. */
  shiftStart?: string;
  shiftEnd?: string;
  workDays: WorkDay[];
  /** Menit toleransi sebelum absensi masuk dihitung terlambat. */
  lateToleranceMinutes: number;
  /** Gaji per hari (Rp); otomatis jadi pengeluaran "Gaji" tiap hari absen masuk. */
  baseSalary: number;
  commissionRate: number; // percentage
  /** Insentif tetap per bulan (Rp). */
  monthlyIncentive: number;
  isActive: boolean;
  loginEnabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  clockIn?: Date;
  clockOut?: Date;
  /** Aktivitas terakhir di aplikasi; jam pulang otomatis bila tidak menekan Keluar. */
  lastSeenAt?: Date;
  /** 'auto' = dari login karyawan, 'manual' = dicatat admin. */
  clockInSource?: 'auto' | 'manual';
  /** 'logout' = menekan Keluar, 'manual' = dicatat admin. */
  clockOutSource?: 'logout' | 'manual';
  notes?: string;
  createdAt: Date;
  // Computed
  employee?: Employee;
  hoursWorked?: number;
}

export interface Advance {
  id: string;
  employeeId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  reason?: string;
  isDeducted: boolean;
  createdAt: Date;
  // Computed
  employee?: Employee;
}

export type PayrollStatus = 'pending' | 'paid';

export interface Payroll {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  commissionTotal: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  paidAt?: Date;
  createdAt: Date;
  // Computed
  employee?: Employee;
}

// Form types
export type EmployeeFormData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'loginEnabled'>;
export type AdvanceFormData = Omit<Advance, 'id' | 'createdAt' | 'employee'>;

/**
 * HRM (Human Resource Management) Types
 */

export type EmployeeRole = 'operator' | 'kasir' | 'admin';

export interface Employee {
  id: string;
  storeId: string;
  name: string;
  phone?: string;
  role: EmployeeRole;
  baseSalary: number;
  commissionRate: number; // percentage
  isActive: boolean;
  photoUrl?: string | null;
  photoPath?: string | null;
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
export type EmployeeFormData = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;
export type AdvanceFormData = Omit<Advance, 'id' | 'createdAt' | 'employee'>;

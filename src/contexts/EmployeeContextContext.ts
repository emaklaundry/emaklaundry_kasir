import { createContext } from 'react';
import { Employee, Attendance, Advance, EmployeeFormData, AdvanceFormData } from '../types/hrm';

interface EmployeeContextType {
  employees: Employee[];
  attendance: Attendance[];
  advances: Advance[];
  isLoading: boolean;
  error: string | null;
  fetchEmployees: (storeId?: string) => Promise<void>;
  addEmployee: (employee: EmployeeFormData) => Promise<Employee | null>;
  updateEmployee: (id: string, employee: Partial<EmployeeFormData>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  clockIn: (employeeId: string) => Promise<void>;
  clockOut: (employeeId: string) => Promise<void>;
  fetchAttendance: (date?: string, employeeId?: string) => Promise<void>;
  addAdvance: (advance: AdvanceFormData) => Promise<void>;
  fetchAdvances: (employeeId?: string) => Promise<void>;
}

const EmployeeContext = createContext<EmployeeContextType | null>(null);

export default EmployeeContext;

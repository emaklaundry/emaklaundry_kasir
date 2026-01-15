import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Database } from '../types/supabase';
import { Employee, Attendance, Advance, EmployeeFormData, AdvanceFormData } from '../types/hrm';

// Helper to convert snake_case to camelCase
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Helper to convert camelCase to snake_case
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

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

export const EmployeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async (storeId?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from('employees').select('*');
      if (storeId && storeId !== 'all') {
        query = query.eq('store_id', storeId);
      }
      const { data, error: err } = await query.order('name');
      if (err) throw err;
      setEmployees((data || []).map((e) => toCamelCase(e) as unknown as Employee));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEmployee = useCallback(async (employee: EmployeeFormData): Promise<Employee | null> => {
    try {
      const { data, error: err } = await supabase
        .from('employees')
        .insert([
          toSnakeCase(employee as unknown as Record<string, unknown>) as Database['public']['Tables']['employees']['Insert'],
        ])
        .select()
        .single();
      if (err) throw err;
      const newEmployee = toCamelCase(data) as unknown as Employee;
      setEmployees((prev) => [...prev, newEmployee]);
      return newEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add employee');
      return null;
    }
  }, []);

  const updateEmployee = useCallback(async (id: string, employee: Partial<EmployeeFormData>) => {
    try {
      const payload = toSnakeCase(employee as unknown as Record<string, unknown>) as Database['public']['Tables']['employees']['Update'];
      const { error: err } = await supabase.from('employees').update(payload).eq('id', id);
      if (err) throw err;
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...employee } : e)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase.from('employees').delete().eq('id', id);
      if (err) throw err;
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  }, []);

  const fetchAttendance = useCallback(async (date?: string, employeeId?: string) => {
    try {
      let query = supabase.from('attendance').select('*');
      if (date) query = query.eq('date', date);
      if (employeeId) query = query.eq('employee_id', employeeId);
      const { data, error: err } = await query.order('date', { ascending: false });
      if (err) throw err;
      setAttendance((data || []).map((a) => toCamelCase(a) as unknown as Attendance));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attendance');
    }
  }, []);

  const clockIn = useCallback(async (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { error: err } = await supabase.from('attendance').upsert(
        {
          employee_id: employeeId,
          date: today,
          clock_in: new Date().toISOString(),
        },
        { onConflict: 'employee_id,date' },
      );
      if (err) throw err;
      await fetchAttendance(today);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock in');
    }
  }, [fetchAttendance]);

  const clockOut = useCallback(async (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { error: err } = await supabase
        .from('attendance')
        .update({ clock_out: new Date().toISOString() })
        .eq('employee_id', employeeId)
        .eq('date', today);
      if (err) throw err;
      await fetchAttendance(today);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clock out');
    }
  }, [fetchAttendance]);

  const fetchAdvances = useCallback(async (employeeId?: string) => {
    try {
      let query = supabase.from('advances').select('*');
      if (employeeId) query = query.eq('employee_id', employeeId);
      const { data, error: err } = await query.order('date', { ascending: false });
      if (err) throw err;
      setAdvances((data || []).map((a) => toCamelCase(a) as unknown as Advance));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch advances');
    }
  }, []);

  const addAdvance = useCallback(async (advance: AdvanceFormData) => {
    try {
      const { error: err } = await supabase
        .from('advances')
        .insert([
          toSnakeCase(advance as unknown as Record<string, unknown>) as Database['public']['Tables']['advances']['Insert'],
        ]);
      if (err) throw err;
      await fetchAdvances(advance.employeeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add advance');
    }
  }, [fetchAdvances]);



  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return (
    <EmployeeContext.Provider
      value={{
        employees,
        attendance,
        advances,
        isLoading,
        error,
        fetchEmployees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        clockIn,
        clockOut,
        fetchAttendance,
        addAdvance,
        fetchAdvances,
      }}
    >
      {children}
    </EmployeeContext.Provider>
  );
};

export const useEmployees = () => {
  const context = useContext(EmployeeContext);
  if (!context) {
    throw new Error('useEmployees must be used within EmployeeProvider');
  }
  return context;
};

import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Database } from '../types/supabase';
import { Employee, Attendance, Advance, EmployeeFormData, AdvanceFormData } from '../types/hrm';
import { mapEmployeeRow, toEmployeeRow } from '../utils/employeeMappers';
import { getLocalDateString } from '../utils/dateHelpers';
import EmployeeContext from './EmployeeContextContext';

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
      setEmployees((data || []).map(mapEmployeeRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch employees');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addEmployee = useCallback(async (employee: EmployeeFormData): Promise<Employee> => {
    try {
      const { data, error: err } = await supabase
        .from('employees')
        .insert([toEmployeeRow(employee) as Database['public']['Tables']['employees']['Insert']])
        .select()
        .single();
      if (err) throw err;
      const newEmployee = mapEmployeeRow(data);
      setEmployees((prev) => [...prev, newEmployee]);
      return newEmployee;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add employee');
      throw err;
    }
  }, []);

  const updateEmployee = useCallback(async (id: string, employee: Partial<EmployeeFormData>) => {
    try {
      const { data, error: err } = await supabase
        .from('employees')
        .update(toEmployeeRow(employee))
        .eq('id', id)
        .select()
        .single();
      if (err) throw err;
      const updated = mapEmployeeRow(data);
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      throw err;
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      const { error: err } = await supabase.from('employees').delete().eq('id', id);
      if (err) throw err;
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
      throw err;
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

  const clockIn = useCallback(
    async (employeeId: string) => {
      const today = getLocalDateString();
      try {
        const { error: err } = await supabase.from('attendance').upsert(
          {
            employee_id: employeeId,
            date: today,
            clock_in: new Date().toISOString(),
            clock_in_source: 'manual',
          },
          { onConflict: 'employee_id,date' },
        );
        if (err) throw err;
        await fetchAttendance(today);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clock in');
      }
    },
    [fetchAttendance],
  );

  const clockOut = useCallback(
    async (employeeId: string) => {
      const today = getLocalDateString();
      try {
        const { error: err } = await supabase
          .from('attendance')
          .update({ clock_out: new Date().toISOString(), clock_out_source: 'manual' })
          .eq('employee_id', employeeId)
          .eq('date', today);
        if (err) throw err;
        await fetchAttendance(today);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to clock out');
      }
    },
    [fetchAttendance],
  );

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

  const addAdvance = useCallback(
    async (advance: AdvanceFormData) => {
      try {
        const { error: err } = await supabase
          .from('advances')
          .insert([
            toSnakeCase(
              advance as unknown as Record<string, unknown>,
            ) as Database['public']['Tables']['advances']['Insert'],
          ]);
        if (err) throw err;
        await fetchAdvances(advance.employeeId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add advance');
      }
    },
    [fetchAdvances],
  );

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

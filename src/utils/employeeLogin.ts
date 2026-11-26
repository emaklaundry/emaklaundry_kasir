import { supabase } from './supabaseClient';

type EmployeeLoginAction = 'set-pin' | 'sync' | 'delete';

async function callEmployeeLogin(
  action: EmployeeLoginAction,
  employeeId: string,
  extra: Record<string, unknown> = {},
  fallbackMessage: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('manage-employee-login', {
    body: { action, employeeId, ...extra },
  });
  if (error || data?.error) throw new Error(data?.error || error?.message || fallbackMessage);
}

/** Buat akun login (bila belum ada) atau reset PIN akun yang sudah ada. */
export const setEmployeePin = (employeeId: string, pin: string) =>
  callEmployeeLogin('set-pin', employeeId, { pin }, 'Gagal mengatur PIN karyawan.');

/** Samakan nama, cabang & status aktif akun login dengan data karyawan. */
export const syncEmployeeLogin = (employeeId: string) =>
  callEmployeeLogin('sync', employeeId, {}, 'Gagal menyinkronkan akun login karyawan.');

/** Cabut akses login: akun dihapus, PIN tidak berlaku lagi. Data karyawan tetap. */
export const revokeEmployeeLogin = (employeeId: string) =>
  callEmployeeLogin('delete', employeeId, {}, 'Gagal mencabut akses login karyawan.');

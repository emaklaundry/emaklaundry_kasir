import type { Attendance, Employee, WorkDay } from '../types/hrm';
import { parseLocalDate } from './dateHelpers';

/**
 * Tanpa aktivitas selama ini (hari ini), karyawan dianggap sudah pulang.
 * Sedikit di atas batas logout otomatis (5 menit) + jeda pencatatan aktivitas (2 menit).
 */
export const STILL_WORKING_WINDOW_MS = 10 * 60 * 1000;

export type ClockOutKind = 'logout' | 'manual' | 'activity';

export interface AttendanceSummary {
  clockIn?: Date;
  clockInKind?: 'auto' | 'manual';
  /** Jam pulang efektif: tombol Keluar / koreksi admin, atau aktivitas terakhir. */
  clockOut?: Date;
  clockOutKind?: ClockOutKind;
  stillWorking: boolean;
  /** Menit terlambat melewati jam shift + toleransi; 0 bila tepat waktu / tanpa shift. */
  lateMinutes: number;
  /** Durasi kerja dalam menit; undefined bila belum ada jam masuk & pulang. */
  workedMinutes?: number;
  scheduledToday: boolean;
}

const toDate = (value?: Date | string): Date | undefined => (value ? new Date(value) : undefined);

/** Hari ISO (1 = Senin ... 7 = Minggu) untuk tanggal YYYY-MM-DD. */
export const isoWeekday = (date: string): WorkDay => {
  const day = parseLocalDate(date).getDay();
  return (day === 0 ? 7 : day) as WorkDay;
};

export const summarizeAttendance = (
  att: Attendance | undefined,
  employee: Employee,
  date: string,
  now: number,
  isToday: boolean,
): AttendanceSummary => {
  const workDays = employee.workDays ?? [];
  const scheduledToday = workDays.length === 0 || workDays.includes(isoWeekday(date));

  const clockIn = toDate(att?.clockIn);
  const explicitOut = toDate(att?.clockOut);
  const lastSeen = toDate(att?.lastSeenAt);

  let clockOut: Date | undefined;
  let clockOutKind: ClockOutKind | undefined;
  let stillWorking = false;

  if (explicitOut) {
    clockOut = explicitOut;
    clockOutKind = att?.clockOutSource === 'logout' ? 'logout' : 'manual';
  } else if (clockIn) {
    const lastActive = lastSeen ?? clockIn;
    if (isToday && now - lastActive.getTime() < STILL_WORKING_WINDOW_MS) {
      stillWorking = true;
    } else if (lastSeen) {
      clockOut = lastSeen;
      clockOutKind = 'activity';
    }
  }

  let lateMinutes = 0;
  if (clockIn && employee.shiftStart) {
    const [h, m] = employee.shiftStart.split(':').map(Number);
    const shiftStart = parseLocalDate(date);
    shiftStart.setHours(h, m, 0, 0);
    const minutesAfterShift = Math.floor((clockIn.getTime() - shiftStart.getTime()) / 60000);
    if (minutesAfterShift > (employee.lateToleranceMinutes ?? 0)) lateMinutes = minutesAfterShift;
  }

  const end = clockOut ?? (stillWorking ? new Date(now) : undefined);
  const workedMinutes =
    clockIn && end
      ? Math.max(0, Math.floor((end.getTime() - clockIn.getTime()) / 60000))
      : undefined;

  return {
    clockIn,
    clockInKind: clockIn ? (att?.clockInSource ?? 'manual') : undefined,
    clockOut,
    clockOutKind,
    stillWorking,
    lateMinutes,
    workedMinutes,
    scheduledToday,
  };
};

export const formatMinutes = (minutes?: number): string => {
  if (minutes === undefined) return '-';
  return `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
};

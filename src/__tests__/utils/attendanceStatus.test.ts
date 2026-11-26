import { describe, it, expect } from 'vitest';
import { summarizeAttendance, STILL_WORKING_WINDOW_MS } from '@/utils/attendanceStatus';
import type { Attendance, Employee } from '@/types/hrm';

const DATE = '2026-11-23'; // Senin
const at = (hh: number, mm: number) => new Date(2026, 10, 23, hh, mm);

const employee = {
  id: 'e1',
  storeId: 's1',
  name: 'Sari',
  role: 'kasir',
  shiftStart: '08:00',
  shiftEnd: '16:00',
  workDays: [1, 2, 3, 4, 5, 6],
  lateToleranceMinutes: 10,
  baseSalary: 0,
  commissionRate: 0,
  monthlyIncentive: 0,
  isActive: true,
  loginEnabled: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as Employee;

const att = (over: Partial<Attendance>): Attendance => ({
  id: 'a1',
  employeeId: 'e1',
  date: DATE,
  createdAt: new Date(),
  ...over,
});

describe('summarizeAttendance', () => {
  it('masih bekerja bila aktivitas terakhir baru saja', () => {
    const s = summarizeAttendance(
      att({ clockIn: at(8, 5), clockInSource: 'auto', lastSeenAt: at(11, 0) }),
      employee,
      DATE,
      at(11, 3).getTime(),
      true,
    );
    expect(s.stillWorking).toBe(true);
    expect(s.clockOut).toBeUndefined();
    expect(s.lateMinutes).toBe(0);
    expect(s.workedMinutes).toBe(178);
  });

  it('jam pulang = aktivitas terakhir bila tidak menekan Keluar', () => {
    const lastSeen = at(16, 20);
    const s = summarizeAttendance(
      att({ clockIn: at(8, 0), lastSeenAt: lastSeen }),
      employee,
      DATE,
      lastSeen.getTime() + STILL_WORKING_WINDOW_MS + 1,
      true,
    );
    expect(s.stillWorking).toBe(false);
    expect(s.clockOut).toEqual(lastSeen);
    expect(s.clockOutKind).toBe('activity');
    expect(s.workedMinutes).toBe(8 * 60 + 20);
  });

  it('tombol Keluar diutamakan dan keterlambatan melewati toleransi dihitung', () => {
    const s = summarizeAttendance(
      att({
        clockIn: at(8, 25),
        lastSeenAt: at(15, 0),
        clockOut: at(16, 0),
        clockOutSource: 'logout',
      }),
      employee,
      DATE,
      at(20, 0).getTime(),
      true,
    );
    expect(s.clockOutKind).toBe('logout');
    expect(s.clockOut).toEqual(at(16, 0));
    expect(s.lateMinutes).toBe(25);
  });

  it('tidak dijadwalkan pada hari libur', () => {
    const sunday = '2026-11-22';
    const s = summarizeAttendance(undefined, employee, sunday, at(12, 0).getTime(), false);
    expect(s.scheduledToday).toBe(false);
    expect(s.clockIn).toBeUndefined();
  });
});

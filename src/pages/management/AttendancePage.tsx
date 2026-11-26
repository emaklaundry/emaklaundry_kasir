import React, { useState, useEffect, useMemo } from 'react';
import { useEmployees } from '../../contexts/useEmployees';
import useAppContext from '../../contexts/useAppContext';
import useToasts from '../../contexts/useToasts';
import { Employee, Attendance } from '../../types/hrm';
import { Link } from 'react-router-dom';
import { ClockIcon, UserIcon, CheckCircleIcon, SpinnerIcon } from '../../components/icons';
import EmptyState from '../../components/EmptyState';
import { getLocalDateString } from '../../utils/dateHelpers';
import { isFlexibleSchedule } from '../../utils/employeeSchedule';
import {
  AttendanceSummary,
  ClockOutKind,
  formatMinutes,
  summarizeAttendance,
} from '../../utils/attendanceStatus';

const REFRESH_INTERVAL_MS = 60 * 1000;

const CLOCK_OUT_LABEL: Record<ClockOutKind, string> = {
  logout: 'tekan Keluar',
  activity: 'aktivitas terakhir',
  manual: 'dicatat admin',
};

const formatTime = (date?: Date) =>
  date ? date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

const AttendancePage: React.FC = () => {
  const { employees, attendance, isLoading, fetchEmployees, fetchAttendance, clockIn, clockOut } =
    useEmployees();
  const { selectedStoreId } = useAppContext();
  const { addToast } = useToasts();

  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());
  const [now, setNow] = useState(() => new Date().getTime());
  const isToday = selectedDate === getLocalDateString(new Date(now));

  useEffect(() => {
    if (selectedStoreId) {
      fetchEmployees(selectedStoreId);
    }
  }, [selectedStoreId, fetchEmployees]);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  // Absensi tercatat otomatis dari aplikasi karyawan, jadi segarkan berkala selama hari ini.
  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => {
      setNow(new Date().getTime());
      fetchAttendance(selectedDate);
    }, REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isToday, selectedDate, fetchAttendance]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance.forEach((a) => {
      if (a.date === selectedDate) {
        map.set(a.employeeId, a);
      }
    });
    return map;
  }, [attendance, selectedDate]);

  const rows = useMemo(
    () =>
      employees
        .filter((e) => e.isActive)
        .map((employee) => ({
          employee,
          summary: summarizeAttendance(
            attendanceMap.get(employee.id),
            employee,
            selectedDate,
            now,
            isToday,
          ),
        })),
    [employees, attendanceMap, selectedDate, now, isToday],
  );

  const stats = useMemo(() => {
    const present = rows.filter((r) => r.summary.clockIn);
    return {
      total: rows.length,
      present: present.length,
      late: present.filter((r) => r.summary.lateMinutes > 0).length,
      absent: rows.filter((r) => !r.summary.clockIn && r.summary.scheduledToday).length,
    };
  }, [rows]);

  const handleClockIn = async (employee: Employee) => {
    await clockIn(employee.id);
    addToast(`Jam masuk ${employee.name} dicatat manual`, 'success');
  };

  const handleClockOut = async (employee: Employee) => {
    await clockOut(employee.id);
    addToast(`Jam pulang ${employee.name} dicatat manual`, 'success');
  };

  const renderOut = (summary: AttendanceSummary) => {
    if (summary.stillWorking) {
      return <p className="font-medium text-blue-600 dark:text-blue-400">Masih bekerja</p>;
    }
    return (
      <>
        <p
          className={`font-medium ${summary.clockOut ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}
        >
          {formatTime(summary.clockOut)}
        </p>
        {summary.clockOutKind && (
          <p className="text-xs text-slate-400">{CLOCK_OUT_LABEL[summary.clockOutKind]}</p>
        )}
      </>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Absensi Karyawan</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tercatat otomatis dari login karyawan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="attendance-date" className="text-sm text-slate-500 dark:text-slate-400">
            Tanggal:
          </label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
        <strong>Masuk</strong> = pertama kali karyawan membuka aplikasi dengan akun PIN-nya hari
        itu. <strong>Pulang</strong> = saat menekan Keluar; jika tidak, diambil dari aktivitas
        terakhirnya. Tombol <em>Catat Masuk / Catat Pulang</em> hanya untuk koreksi, misalnya
        karyawan tanpa akun login.
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Karyawan</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Hadir</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.present}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-700 dark:text-amber-400">Terlambat</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{stats.late}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400">Belum Hadir</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.absent}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <SpinnerIcon className="w-8 h-8 mx-auto block text-brand-blue-600 dark:text-brand-blue-400" />
          <p className="text-slate-500 mt-3">Memuat data...</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600">
          <EmptyState
            icon={<UserIcon className="h-12 w-12" />}
            title="Belum ada karyawan aktif"
            description="Absensi muncul setelah karyawan ditambahkan dan diaktifkan di cabang ini."
          >
            <Link to="/management/employees" className="btn btn-primary">
              Kelola Karyawan
            </Link>
          </EmptyState>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ employee, summary }) => {
            const hasClockedIn = !!summary.clockIn;
            const hasClockedOut = !!summary.clockOut && summary.clockOutKind !== 'activity';

            return (
              <div
                key={employee.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Employee Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{employee.role}</span>
                      {employee.shiftStart && employee.shiftEnd ? (
                        <>
                          {' '}
                          · shift {employee.shiftStart}–{employee.shiftEnd}
                        </>
                      ) : (
                        isFlexibleSchedule(employee) && <> · jadwal fleksibel</>
                      )}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs">
                      {summary.lateMinutes > 0 && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          Terlambat {summary.lateMinutes} mnt
                        </span>
                      )}
                      {!hasClockedIn && !summary.scheduledToday && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          Libur
                        </span>
                      )}
                      {!employee.loginEnabled && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          Tanpa akun login · catat manual
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clock Times */}
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Masuk</p>
                    <p
                      className={`font-medium ${hasClockedIn ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}
                    >
                      {formatTime(summary.clockIn)}
                    </p>
                    {summary.clockInKind === 'manual' && (
                      <p className="text-xs text-slate-400">dicatat admin</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Pulang</p>
                    {renderOut(summary)}
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Durasi</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatMinutes(summary.workedMinutes)}
                    </p>
                  </div>
                </div>

                {/* Koreksi manual */}
                {isToday && (
                  <div className="flex gap-2">
                    {!hasClockedIn ? (
                      <button
                        onClick={() => handleClockIn(employee)}
                        className="btn btn-secondary btn-sm"
                      >
                        <ClockIcon className="w-4 h-4" />
                        Catat Masuk
                      </button>
                    ) : !hasClockedOut ? (
                      <button
                        onClick={() => handleClockOut(employee)}
                        className="btn btn-secondary btn-sm"
                      >
                        <ClockIcon className="w-4 h-4" />
                        Catat Pulang
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 rounded-lg text-sm font-medium">
                        <CheckCircleIcon className="w-4 h-4" />
                        Selesai
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttendancePage;

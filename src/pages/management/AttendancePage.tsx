import React, { useState, useEffect, useMemo } from 'react';
import { useEmployees } from '../../contexts/EmployeeContext';
import useAppContext from '../../contexts/useAppContext';
import useToasts from '../../contexts/useToasts';
import { Employee, Attendance } from '../../types/hrm';
import { ClockIcon, UserIcon, CheckCircleIcon } from '../../components/icons';

const AttendancePage: React.FC = () => {
  const { employees, attendance, isLoading, fetchEmployees, fetchAttendance, clockIn, clockOut } = useEmployees();
  const { selectedStoreId } = useAppContext();
  const { addToast } = useToasts();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (selectedStoreId) {
      fetchEmployees(selectedStoreId);
    }
  }, [selectedStoreId, fetchEmployees]);

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate, fetchAttendance]);

  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendance.forEach((a) => {
      if (a.date === selectedDate) {
        map.set(a.employeeId, a);
      }
    });
    return map;
  }, [attendance, selectedDate]);

  const activeEmployees = useMemo(() => {
    return employees.filter((e) => e.isActive);
  }, [employees]);

  const handleClockIn = async (employee: Employee) => {
    await clockIn(employee.id);
    addToast(`${employee.name} berhasil clock in`, 'success');
  };

  const handleClockOut = async (employee: Employee) => {
    await clockOut(employee.id);
    addToast(`${employee.name} berhasil clock out`, 'success');
  };

  const formatTime = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateHours = (clockIn?: Date, clockOut?: Date): string => {
    if (!clockIn || !clockOut) return '-';
    const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}j ${minutes}m`;
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Absensi Karyawan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Clock-in dan clock-out harian
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 dark:text-slate-400">Tanggal:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-600 dark:text-blue-400">Total Karyawan</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {activeEmployees.length}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-600 dark:text-green-400">Sudah Masuk</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {activeEmployees.filter((e) => attendanceMap.get(e.id)?.clockIn).length}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
          <p className="text-sm text-purple-600 dark:text-purple-400">Sudah Pulang</p>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {activeEmployees.filter((e) => attendanceMap.get(e.id)?.clockOut).length}
          </p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-600 dark:text-orange-400">Belum Hadir</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
            {activeEmployees.filter((e) => !attendanceMap.get(e.id)?.clockIn).length}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-slate-500 mt-3">Memuat data...</p>
        </div>
      ) : activeEmployees.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <UserIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-slate-400">Belum ada karyawan aktif</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeEmployees.map((employee) => {
            const att = attendanceMap.get(employee.id);
            const hasClockedIn = !!att?.clockIn;
            const hasClockedOut = !!att?.clockOut;

            return (
              <div
                key={employee.id}
                className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                {/* Employee Info */}
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
                      {employee.role}
                    </p>
                  </div>
                </div>

                {/* Clock Times */}
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Masuk</p>
                    <p className={`font-medium ${hasClockedIn ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                      {formatTime(att?.clockIn)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Pulang</p>
                    <p className={`font-medium ${hasClockedOut ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`}>
                      {formatTime(att?.clockOut)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500 dark:text-slate-400">Durasi</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {calculateHours(att?.clockIn, att?.clockOut)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {isToday && (
                  <div className="flex gap-2">
                    {!hasClockedIn ? (
                      <button
                        onClick={() => handleClockIn(employee)}
                        className="flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                      >
                        <ClockIcon className="w-4 h-4" />
                        Clock In
                      </button>
                    ) : !hasClockedOut ? (
                      <button
                        onClick={() => handleClockOut(employee)}
                        className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                      >
                        <ClockIcon className="w-4 h-4" />
                        Clock Out
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

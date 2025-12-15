import React, { useMemo, useState } from 'react';
import { useAuditLogs } from '../contexts/AuditLogContext';
import useStoreFilteredData from '../hooks/useStoreFilteredData';
import useAppContext from '../contexts/useAppContext';
import { HistoryIcon, SearchIcon, ArrowUpIcon, ArrowDownIcon } from '../components/icons';
import useSortableData from '../hooks/useSortableData';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/Pagination';
import { UserRole } from '@/types';

const AuditLogPage: React.FC = () => {
  const { logs: allLogs, isLoading } = useAuditLogs();
  const { currentUser, selectedStoreId, stores } = useAppContext();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs = useStoreFilteredData(allLogs as any) as unknown as typeof allLogs;

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        log.user.toLowerCase().includes(searchLower) ||
        log.action.toLowerCase().includes(searchLower);

      // Date range filter
      const logDate = new Date(log.timestamp);
      logDate.setHours(0, 0, 0, 0); // Reset to start of day for comparison

      let matchesDateRange = true;

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && logDate >= start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && logDate <= end;
      }

      return matchesSearch && matchesDateRange;
    });
  }, [logs, searchTerm, startDate, endDate]);

  const logsWithStore = useMemo(() => {
    return filteredLogs.map((log) => ({
      ...log,
      storeName: stores.find((s) => s.id === log.storeId)?.name || '-',
    }));
  }, [filteredLogs, stores]);

  type LogWithStore = (typeof logsWithStore)[0];

  const {
    items: sortedLogs,
    requestSort,
    sortConfig,
  } = useSortableData<LogWithStore>(logsWithStore, { key: 'timestamp', direction: 'descending' });
  const {
    currentData: paginatedLogs,
    currentPage,
    totalPages,
    onPageChange,
  } = usePagination(sortedLogs, 20);

  const getSortIcon = (key: keyof LogWithStore) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    if (sortConfig.direction === 'ascending')
      return <ArrowUpIcon className="w-4 h-4 inline ml-1" />;
    return <ArrowDownIcon className="w-4 h-4 inline ml-1" />;
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  const filtersApplied = Boolean(searchTerm || startDate || endDate);

  const getStoreName = (storeId?: string) => {
    if (!storeId) return '-';
    const store = stores.find((s) => s.id === storeId);
    return store?.name || 'Unknown Store';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
      <h1 className="text-2xl font-semibold mb-4 text-slate-900 dark:text-white">Log Audit</h1>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 flex-wrap">
        <div className="relative w-full md:w-64">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari pengguna atau aksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full pl-10 p-3 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="startDate"
            className="text-base text-slate-600 dark:text-slate-300 flex-shrink-0"
          >
            Dari:
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate || undefined}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="endDate"
            className="text-base text-slate-600 dark:text-slate-300 flex-shrink-0"
          >
            Hingga:
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-base rounded-lg block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
          />
        </div>
        {filtersApplied && (
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Reset Filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-base text-left text-slate-500 dark:text-slate-400">
          <thead className="text-sm text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('timestamp')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Waktu {getSortIcon('timestamp')}
                </button>
              </th>
              <th className="px-4 py-3">
                <button
                  onClick={() => requestSort('user')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Pengguna {getSortIcon('user')}
                </button>
              </th>
              {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                <th className="px-4 py-3">
                  <button
                    onClick={() => requestSort('storeName')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    Cabang {getSortIcon('storeName')}
                  </button>
                </th>
              )}
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <tr key={log.id} className="border-b dark:border-slate-700">
                  <td className="px-4 py-3">
                    {log.timestamp.toLocaleString('id-ID', {
                      dateStyle: 'medium',
                      timeStyle: 'medium',
                    })}
                  </td>
                  <td className="px-4 py-3">{log.user}</td>
                  {currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' && (
                    <td className="px-4 py-3">{getStoreName(log.storeId)}</td>
                  )}
                  <td className="px-4 py-3">{log.action}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={
                    currentUser?.role === UserRole.SuperAdmin && selectedStoreId === 'all' ? 4 : 3
                  }
                  className="text-center py-12"
                >
                  <HistoryIcon className="mx-auto w-12 h-12 text-slate-400" />
                  <h3 className="mt-2 text-xl font-semibold text-slate-800 dark:text-slate-200">
                    Tidak Ada Log Ditemukan
                  </h3>
                  <p className="mt-1 text-base text-slate-500">
                    {filtersApplied
                      ? 'Tidak ada log yang cocok dengan kriteria filter Anda.'
                      : 'Belum ada aktivitas yang tercatat.'}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
};

export default AuditLogPage;

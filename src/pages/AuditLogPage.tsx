import React, { useMemo, useState } from 'react';
import { AuditLogQuery, useAuditLogList } from '../contexts/AuditLogContext';
import useAppContext from '../contexts/useAppContext';
import {
  HistoryIcon,
  SearchIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SpinnerIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RefreshCwIcon,
} from '../components/icons';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import useDebounce from '../hooks/useDebounce';
import { AuditLog, UserRole } from '@/types';

const PAGE_SIZE = 50;

const CATEGORY_OPTIONS: { value: AuditLogQuery['category']; label: string }[] = [
  { value: 'all', label: 'Semua kategori' },
  { value: 'data', label: 'Perubahan data' },
  { value: 'aktivitas', label: 'Aktivitas' },
  { value: 'navigasi', label: 'Buka halaman' },
  { value: 'klik', label: 'Klik & isian' },
  { value: 'sesi', label: 'Sesi & koneksi' },
  { value: 'error', label: 'Error' },
];

const CATEGORY_STYLE: Record<string, { label: string; className: string }> = {
  data: { label: 'Data', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' },
  aktivitas: { label: 'Aktivitas', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' },
  navigasi: { label: 'Halaman', className: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  klik: { label: 'Klik', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' },
  sesi: { label: 'Sesi', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200' },
  error: { label: 'Error', className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' },
};

const OPERATION_LABEL: Record<string, string> = {
  INSERT: 'Ditambahkan',
  UPDATE: 'Diubah',
  DELETE: 'Dihapus',
};

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

const hasDetail = (log: AuditLog) =>
  !!(log.oldData || log.newData || log.page || (log.metadata && Object.keys(log.metadata).length));

const LogDetail: React.FC<{ log: AuditLog }> = ({ log }) => {
  const isUpdate = log.operation === 'UPDATE';
  const fields = isUpdate
    ? log.changedFields || Object.keys(log.newData || {})
    : Object.keys(log.newData || log.oldData || {});
  const source = log.operation === 'DELETE' ? log.oldData : log.newData;

  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
        {log.tableName && (
          <>
            <dt className="text-slate-500 dark:text-slate-400">Tabel</dt>
            <dd className="font-mono text-slate-800 dark:text-slate-200">
              {log.tableName}
              {log.operation && ` · ${OPERATION_LABEL[log.operation] || log.operation}`}
            </dd>
          </>
        )}
        {log.recordId && (
          <>
            <dt className="text-slate-500 dark:text-slate-400">ID data</dt>
            <dd className="font-mono text-slate-800 dark:text-slate-200 break-all">{log.recordId}</dd>
          </>
        )}
        {log.page && (
          <>
            <dt className="text-slate-500 dark:text-slate-400">Halaman</dt>
            <dd className="font-mono text-slate-800 dark:text-slate-200 break-all">{log.page}</dd>
          </>
        )}
        {log.metadata &&
          Object.entries(log.metadata).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt className="text-slate-500 dark:text-slate-400">{key}</dt>
              <dd className="font-mono text-slate-800 dark:text-slate-200 break-all whitespace-pre-wrap">
                {formatValue(value)}
              </dd>
            </React.Fragment>
          ))}
      </dl>

      {fields.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Kolom</th>
                {isUpdate ? (
                  <>
                    <th className="px-3 py-2 text-left font-medium">Sebelum</th>
                    <th className="px-3 py-2 text-left font-medium">Sesudah</th>
                  </>
                ) : (
                  <th className="px-3 py-2 text-left font-medium">Nilai</th>
                )}
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <tr key={field} className="border-t border-slate-200 dark:border-slate-700 align-top">
                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{field}</td>
                  {isUpdate ? (
                    <>
                      <td className="px-3 py-2 font-mono whitespace-pre-wrap break-all text-red-700 dark:text-red-300 max-w-md">
                        {formatValue(log.oldData?.[field])}
                      </td>
                      <td className="px-3 py-2 font-mono whitespace-pre-wrap break-all text-emerald-700 dark:text-emerald-300 max-w-md">
                        {formatValue(log.newData?.[field])}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-2 font-mono whitespace-pre-wrap break-all text-slate-800 dark:text-slate-200">
                      {formatValue(source?.[field])}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const AuditLogPage: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<AuditLogQuery['category']>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pageState, setPageState] = useState({ filterKey: '', page: 1 });
  const [sortKey, setSortKey] = useState<AuditLogQuery['sortKey']>('timestamp');
  const [sortDirection, setSortDirection] = useState<AuditLogQuery['sortDirection']>('descending');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(searchTerm, 400);

  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
  const showStoreColumn = isSuperAdmin && selectedStoreId === 'all';
  const storeId = isSuperAdmin ? selectedStoreId || 'all' : currentUser?.storeId;
  const noStoreAccess = !isSuperAdmin && !currentUser?.storeId;

  // Nomor halaman otomatis kembali ke 1 bila filter/urutan berubah.
  const filterKey = [debouncedSearch, category, startDate, endDate, storeId, sortKey, sortDirection].join('|');
  const page = pageState.filterKey === filterKey ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ filterKey, page: next });

  const { data, isLoading, isFetching, error, refetch } = useAuditLogList({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    category,
    startDate,
    endDate,
    storeId: storeId || undefined,
    sortKey,
    sortDirection,
  });

  const logs = noStoreAccess ? [] : data?.logs || [];
  const total = noStoreAccess ? 0 : data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const storeNames = useMemo(() => new Map(stores.map((s) => [s.id, s.name])), [stores]);

  const requestSort = (key: AuditLogQuery['sortKey']) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === 'ascending' ? 'descending' : 'ascending'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'timestamp' ? 'descending' : 'ascending');
    }
  };

  const getSortIcon = (key: AuditLogQuery['sortKey']) => {
    if (sortKey !== key) return null;
    return sortDirection === 'ascending' ? (
      <ArrowUpIcon className="w-4 h-4 inline ml-1" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 inline ml-1" />
    );
  };

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setStartDate('');
    setEndDate('');
  };

  const filtersApplied = Boolean(searchTerm || startDate || endDate || category !== 'all');
  const columnCount = showStoreColumn ? 5 : 4;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <SpinnerIcon className="h-12 w-12 text-brand-blue-600 dark:text-brand-blue-400" />
          <span className="text-lg text-slate-600 dark:text-slate-300">Memuat log audit...</span>
        </div>
      </div>
    );
  }

  return (
    // data-audit-ignore: membuka/menyaring log tidak ikut dicatat sebagai klik,
    // agar halaman ini tidak memenuhi dirinya sendiri. Kunjungan halaman tetap tercatat.
    <div className="card p-4" data-audit-ignore>
      <div className="flex flex-col md:flex-row items-center gap-4 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 flex-wrap">
        <div className="relative w-full md:w-64">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            id="audit-search"
            name="audit-search"
            aria-label="Cari pengguna atau aksi"
            placeholder="Cari pengguna atau aksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10"
            autoComplete="off"
          />
        </div>
        <select
          id="audit-category"
          aria-label="Kategori log"
          value={category}
          onChange={(e) => setCategory(e.target.value as AuditLogQuery['category'])}
          className="form-input p-2.5 w-full md:w-48"
        >
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label htmlFor="startDate" className="text-base text-slate-600 dark:text-slate-300 flex-shrink-0">
            Dari:
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            max={endDate || undefined}
            className="form-input p-2.5"
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="endDate" className="text-base text-slate-600 dark:text-slate-300 flex-shrink-0">
            Hingga:
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            className="form-input p-2.5"
            autoComplete="off"
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
        <button
          onClick={() => refetch()}
          className="md:ml-auto inline-flex items-center gap-2 px-4 py-2 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
        >
          <RefreshCwIcon className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          Muat ulang
        </button>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3" aria-live="polite">
        {total.toLocaleString('id-ID')} log
        {filtersApplied ? ' cocok dengan filter' : ' tercatat'}
        {page === 1 && ' · diperbarui otomatis tiap 30 detik'}
      </p>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          Gagal memuat log audit: {(error as Error).message}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2.5">
                <button
                  onClick={() => requestSort('timestamp')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Waktu {getSortIcon('timestamp')}
                </button>
              </th>
              <th className="px-4 py-2.5">
                <button
                  onClick={() => requestSort('user')}
                  className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200"
                >
                  Pengguna {getSortIcon('user')}
                </button>
              </th>
              {showStoreColumn && <th className="px-4 py-2.5">Cabang</th>}
              <th className="px-4 py-2.5">Kategori</th>
              <th className="px-4 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log) => {
                const isOpen = expanded.has(log.id);
                const style = CATEGORY_STYLE[log.category || 'aktivitas'] || CATEGORY_STYLE.aktivitas;
                const expandable = hasDetail(log);
                return (
                  <React.Fragment key={log.id}>
                    <tr className="border-b dark:border-slate-700 align-top">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {log.timestamp.toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="px-4 py-2.5">{log.user}</td>
                      {showStoreColumn && (
                        <td className="px-4 py-2.5">
                          {log.storeId ? storeNames.get(log.storeId) || 'Unknown Store' : '-'}
                        </td>
                      )}
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${style.className}`}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {expandable ? (
                          <button
                            onClick={() => toggleExpanded(log.id)}
                            aria-expanded={isOpen}
                            className="flex items-start gap-1 text-left text-slate-700 dark:text-slate-200 hover:text-brand-blue-600 dark:hover:text-brand-blue-400"
                          >
                            {isOpen ? (
                              <ChevronDownIcon className="w-4 h-4 mt-1 flex-shrink-0" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 mt-1 flex-shrink-0" />
                            )}
                            <span>{log.action}</span>
                          </button>
                        ) : (
                          <span className="pl-5 block">{log.action}</span>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                        <td colSpan={columnCount} className="px-4 py-4">
                          <LogDetail log={log} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td colSpan={columnCount}>
                  <EmptyState
                    icon={<HistoryIcon className="h-12 w-12" />}
                    title="Tidak Ada Log Ditemukan"
                    description={
                      filtersApplied
                        ? 'Tidak ada log yang cocok dengan kriteria filter Anda.'
                        : 'Belum ada aktivitas yang tercatat.'
                    }
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
};

export default AuditLogPage;

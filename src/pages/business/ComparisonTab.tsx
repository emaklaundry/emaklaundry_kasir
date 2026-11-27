import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAppContext from '../../contexts/useAppContext';
import useToday from '../../hooks/useToday';
import { can } from '../../config/permissions';
import { UserRole } from '../../types';
import { fetchTargetVsActual, type TargetVsActual } from '../../utils/businessTargets';
import {
  buildComparison,
  computePlan,
  daysElapsed,
  daysInMonth,
  formatCurrency,
  sumPlanValues,
  type ComparisonRow,
  type RowStatus,
} from '../../utils/businessPlan';
import CumulativeChart from './CumulativeChart';

const TABLE = 'w-full text-sm text-left text-slate-600 dark:text-slate-300';
const THEAD =
  'text-xs uppercase tracking-wide text-slate-600 bg-slate-50 dark:bg-slate-700/60 dark:text-slate-300';
const TH = 'px-4 py-2 font-semibold';
const TD = 'px-4 py-2';
const TR = 'border-b border-slate-100 last:border-0 dark:border-slate-700';
const NAME = `${TD} font-medium text-slate-900 dark:text-white`;
const NUM = `${TD} text-right tabular-nums`;

const MIGRATION_MESSAGE = 'Fitur ini butuh pembaruan database. Hubungi pengelola sistem.';

const oneDecimal = (n: number) =>
  new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

function formatValue(kind: ComparisonRow['kind'], v: number | null, signed = false): string {
  if (v === null || !Number.isFinite(v)) return '—';
  // Hindari "-Rp 0" / "-0,0": nilai di bawah setengah satuan tampil sebagai 0.
  const eps = kind === 'currency' || kind === 'perMonth' ? 0.5 : 0.05;
  if (Math.abs(v) < eps) v = 0;
  const sign = signed && v > 0 ? '+' : '';
  switch (kind) {
    case 'currency':
      return sign + formatCurrency(v);
    case 'perDay':
      return sign + oneDecimal(v);
    case 'perMonth':
      return sign + (Math.round(v) || 0).toLocaleString('id-ID');
    case 'percent':
      return `${sign}${oneDecimal(v)}%`;
    case 'months':
      return `${sign}${oneDecimal(v)} bln`;
  }
}

export const StatusIcon: React.FC<{ status: RowStatus }> = ({ status }) => {
  if (status === 'ok')
    return (
      <span
        role="img"
        aria-label="sesuai target"
        className="font-bold text-green-600 dark:text-green-400"
      >
        ✓
      </span>
    );
  if (status === 'warn')
    return (
      <span role="img" aria-label="perlu perhatian" className="font-bold text-amber-500">
        ⚠
      </span>
    );
  if (status === 'running')
    return <span className="text-xs text-slate-500 dark:text-slate-400">berjalan</span>;
  return null;
};

const monthName = (monthYmd: string) =>
  new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(
    new Date(Number(monthYmd.slice(0, 4)), Number(monthYmd.slice(5, 7)) - 1, 1),
  );

const formatStartDate = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return ymd;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(y, m - 1, d));
};

const ComparisonTab: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const today = useToday();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const monthYmd = `${month}-01`;

  const isSuperAdmin = currentUser?.role === UserRole.SuperAdmin;
  const effectiveStoreId = isSuperAdmin
    ? selectedStoreId
    : (currentUser?.storeId ?? selectedStoreId);
  const isAllStores = !effectiveStoreId || effectiveStoreId === 'all';
  const canManage = can(currentUser?.role, 'business.targets.manage');

  const query = useQuery<TargetVsActual>({
    queryKey: ['target-vs-actual', isAllStores ? 'all' : effectiveStoreId, monthYmd, today],
    queryFn: () =>
      fetchTargetVsActual({
        storeId: isAllStores ? null : effectiveStoreId,
        monthYmd,
        asOfYmd: today,
      }),
    enabled: !!currentUser && /^\d{4}-\d{2}$/.test(month),
    retry: false,
  });
  const data = query.data;

  const dim = daysInMonth(monthYmd);
  const el = daysElapsed(monthYmd, today);
  const running = el > 0 && el < dim;

  const plan = useMemo(
    () => (data && data.targets.length ? sumPlanValues(data.targets.map((t) => t.values)) : null),
    [data],
  );
  const rows = useMemo(
    () => (plan && data ? buildComparison(plan, data.actual, { monthYmd, todayYmd: today }) : []),
    [plan, data, monthYmd, today],
  );
  const monthlyTarget = useMemo(
    () => (plan ? computePlan(plan, dim).revenue.total : 0),
    [plan, dim],
  );

  const periodLabel =
    el === 0
      ? 'Bulan belum dimulai'
      : el >= dim
        ? 'Bulan selesai'
        : `${monthName(monthYmd)} · hari ke-${el} dari ${dim}`;

  const storeLabel = isAllStores
    ? 'Semua cabang'
    : (stores.find((s: { id: string; name: string }) => s.id === effectiveStoreId)?.name ??
      'Cabang');
  const withoutTarget = data ? stores.length - data.targets.length : 0;

  const errorMessage = query.error
    ? query.error instanceof Error && query.error.message === 'MIGRATION_MISSING'
      ? MIGRATION_MESSAGE
      : 'Gagal memuat perbandingan. Coba lagi.'
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          <span className="mb-1 block">Bulan</span>
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <p className="pb-2 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">{storeLabel}</span>
        </p>
      </div>

      {query.isLoading && <p className="text-sm text-slate-500">Memuat…</p>}

      {errorMessage && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
        >
          {errorMessage}
        </p>
      )}

      {data && !plan && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-800">
          {canManage ? (
            <>
              <p className="mb-3 text-slate-600 dark:text-slate-300">
                Belum ada target tersimpan untuk cabang ini.
              </p>
              <Link to="?tab=kalkulator&view=rencana" className="btn btn-primary">
                Atur target
              </Link>
            </>
          ) : (
            <p className="text-slate-600 dark:text-slate-300">Target belum diatur oleh pemilik.</p>
          )}
        </div>
      )}

      {data && plan && (
        <>
          <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400">
            <p className="font-medium text-slate-700 dark:text-slate-300">{periodLabel}</p>
            <p>
              Omzet = nilai nota yang dibuat; Pendapatan = uang yang diterima; Biaya = pengeluaran
              tercatat.
            </p>
            {isAllStores && withoutTarget > 0 && (
              <p>
                Cabang tanpa target: {withoutTarget} (tetap terhitung di angka nyata, tidak di
                target)
              </p>
            )}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
            <table className={TABLE}>
              <thead className={THEAD}>
                <tr>
                  <th scope="col" className={TH}>
                    Baris
                  </th>
                  <th scope="col" className={`${TH} text-right`}>
                    Target
                  </th>
                  {running && (
                    <th scope="col" className={`${TH} text-right`}>
                      Target s.d. hari ini
                    </th>
                  )}
                  <th scope="col" className={`${TH} text-right`}>
                    Nyata
                  </th>
                  <th scope="col" className={`${TH} text-right`}>
                    Selisih
                  </th>
                  <th scope="col" className={`${TH} text-center`}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className={TR}>
                    <td className={NAME}>
                      {r.key === 'operatingProfit' && running ? `${r.label} (sementara)` : r.label}
                      {r.note && (
                        <span className="mt-0.5 block text-xs font-normal text-slate-500 dark:text-slate-400">
                          {r.note}
                        </span>
                      )}
                    </td>
                    <td className={NUM}>{formatValue(r.kind, r.target)}</td>
                    {running && <td className={NUM}>{formatValue(r.kind, r.targetToDate)}</td>}
                    <td className={NUM}>{formatValue(r.kind, r.actual)}</td>
                    <td className={NUM}>{formatValue(r.kind, r.diff, true)}</td>
                    <td className={`${TD} text-center`}>
                      <StatusIcon status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {el > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Pendapatan diterima kumulatif
              </h3>
              <CumulativeChart daily={data.daily} monthlyTarget={monthlyTarget} daysInMonth={dim} />
            </div>
          )}

          {data.sinceStart && (
            <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Sejak mulai operasi
              </h3>
              <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                Sejak {formatStartDate(data.sinceStart.startDate)}
              </p>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Akumulasi laba operasional vs investasi
                  </dt>
                  <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(data.sinceStart.operatingProfit)} /{' '}
                    {formatCurrency(plan.investment)}
                    {plan.investment > 0 && (
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        ({oneDecimal((data.sinceStart.operatingProfit / plan.investment) * 100)}%)
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">
                    Belanja modal nyata vs investasi target
                  </dt>
                  <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                    {formatCurrency(data.sinceStart.capex)} / {formatCurrency(plan.investment)}
                  </dd>
                </div>
              </dl>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ComparisonTab;

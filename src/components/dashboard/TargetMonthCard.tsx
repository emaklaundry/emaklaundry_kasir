import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import useAppContext from '../../contexts/useAppContext';
import useToday from '../../hooks/useToday';
import { can } from '../../config/permissions';
import { fetchTargetVsActual, type TargetVsActual } from '../../utils/businessTargets';
import {
  buildComparison,
  daysElapsed,
  daysInMonth,
  formatCurrency,
  sumPlanValues,
} from '../../utils/businessPlan';
import { StatusIcon } from '../../pages/business/ComparisonTab';

const ROW_KEYS = ['collected', 'operatingProfit'] as const;

const TargetMonthCard: React.FC<{ storeId: string | null }> = ({ storeId }) => {
  const { currentUser } = useAppContext();
  const today = useToday();
  const monthYmd = `${today.slice(0, 7)}-01`;
  const allowed = can(currentUser?.role, 'finance.view') && can(currentUser?.role, 'business.hub');

  const query = useQuery<TargetVsActual>({
    queryKey: ['target-vs-actual', storeId ?? 'all', monthYmd, today],
    queryFn: () => fetchTargetVsActual({ storeId, monthYmd, asOfYmd: today }),
    enabled: !!currentUser && allowed,
    retry: false,
  });
  const data = query.data;

  const elapsed = daysElapsed(monthYmd, today);
  const running = elapsed > 0 && elapsed < daysInMonth(monthYmd);

  const rows = useMemo(() => {
    if (!data || !data.targets.length) return [];
    const plan = sumPlanValues(data.targets.map((t) => t.values));
    return buildComparison(plan, data.actual, { monthYmd, todayYmd: today }).filter((r) =>
      (ROW_KEYS as readonly string[]).includes(r.key),
    );
  }, [data, monthYmd, today]);

  if (!allowed || query.isLoading || query.error || rows.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Target bulan ini</h2>
        <Link
          to="/business?tab=kalkulator&view=perbandingan"
          className="text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          Lihat perbandingan
        </Link>
      </div>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">
                {r.key === 'operatingProfit' && running ? `${r.label} (sementara)` : r.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {r.key === 'operatingProfit' ? (
                  <>Target bulan ini {formatCurrency(r.target ?? 0)}</>
                ) : (
                  <>
                    Target s.d. hari ini {formatCurrency(r.targetToDate ?? r.target ?? 0)} · bulan{' '}
                    {formatCurrency(r.target ?? 0)}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span className="font-semibold text-slate-900 dark:text-white">
                {formatCurrency(r.actual ?? 0)}
              </span>
              <StatusIcon status={r.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TargetMonthCard;

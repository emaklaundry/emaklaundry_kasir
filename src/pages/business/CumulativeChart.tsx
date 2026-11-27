import React, { useMemo } from 'react';
import { formatCurrency } from '@/utils/businessPlan';
import type { TargetVsActual } from '@/utils/businessTargets';

interface Props {
  daily: TargetVsActual['daily'];
  monthlyTarget: number;
  daysInMonth: number;
}

const compact = (v: number) => {
  const trim = (n: number) => n.toFixed(1).replace(/\.0$/, '').replace('.', ',');
  if (Math.abs(v) >= 1e9) return `${trim(v / 1e9)}M`;
  if (Math.abs(v) >= 1e6) return `${trim(v / 1e6)}jt`;
  if (Math.abs(v) >= 1e3) return `${trim(v / 1e3)}rb`;
  return String(Math.round(v));
};

/** Garis kumulatif pendapatan diterima per hari vs garis lurus target bulanan. */
const CumulativeChart: React.FC<Props> = ({ daily, monthlyTarget, daysInMonth }) => {
  const rows = useMemo(() => {
    const byDay = new Map<number, number>();
    let lastDay = 0;
    daily.forEach((d) => {
      const day = Number(d.date.slice(8, 10));
      if (!Number.isFinite(day) || day < 1 || day > daysInMonth) return;
      byDay.set(day, (byDay.get(day) ?? 0) + d.collected);
      lastDay = Math.max(lastDay, day);
    });
    const out: { day: number; actual: number | null; target: number }[] = [];
    let cum = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      cum += byDay.get(day) ?? 0;
      out.push({
        day,
        actual: day <= lastDay ? cum : null,
        target: (monthlyTarget * day) / daysInMonth,
      });
    }
    return out;
  }, [daily, monthlyTarget, daysInMonth]);

  const width = 640;
  const height = 240;
  const padTop = 12;
  const padBottom = 26;
  const padLeft = 56;
  const padRight = 12;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const maxValue = Math.max(1, ...rows.map((r) => Math.max(r.target, r.actual ?? 0)));
  const xOf = (day: number) =>
    padLeft + (daysInMonth > 1 ? ((day - 1) / (daysInMonth - 1)) * plotW : 0);
  const yOf = (v: number) => padTop + plotH - (Math.max(v, 0) / maxValue) * plotH;
  const ticks = 4;

  const actualPoints = rows
    .filter((r) => r.actual !== null)
    .map((r) => `${xOf(r.day)},${yOf(r.actual as number)}`)
    .join(' ');
  const targetPoints = rows.map((r) => `${xOf(r.day)},${yOf(r.target)}`).join(' ');

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-green-500" /> Pendapatan diterima (kumulatif)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t-2 border-dashed border-slate-400" /> Target
        </span>
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          role="img"
          aria-labelledby="cumulative-chart-title"
          className="max-w-none"
        >
          <title id="cumulative-chart-title">
            Grafik kumulatif pendapatan diterima dibanding target bulanan
          </title>
          {Array.from({ length: ticks + 1 }).map((_, i) => {
            const v = (maxValue / ticks) * i;
            const y = yOf(v);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-700"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-current text-[11px] text-slate-500 dark:text-slate-400"
                >
                  {compact(v)}
                </text>
              </g>
            );
          })}
          {rows
            .filter((r) => r.day === 1 || r.day % 5 === 0)
            .map((r) => (
              <text
                key={r.day}
                x={xOf(r.day)}
                y={height - 8}
                textAnchor="middle"
                className="fill-current text-[11px] text-slate-500 dark:text-slate-400"
              >
                {r.day}
              </text>
            ))}
          <polyline
            points={targetPoints}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="6 4"
            className="text-slate-400"
          />
          {actualPoints && (
            <polyline
              points={actualPoints}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="text-green-500"
            />
          )}
        </svg>
      </div>
      <table className="sr-only">
        <caption>Data kumulatif pendapatan diterima per hari</caption>
        <thead>
          <tr>
            <th>Hari</th>
            <th>Kumulatif diterima</th>
            <th>Target kumulatif</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.day}>
              <td>{r.day}</td>
              <td>{r.actual === null ? '—' : formatCurrency(r.actual)}</td>
              <td>{formatCurrency(r.target)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CumulativeChart;

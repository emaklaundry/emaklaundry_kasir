import { describe, expect, it } from 'vitest';
import { buildSeries, computeReportRange, parseYmd, toYmd } from '@/utils/reportDates';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('reportDates', () => {
  it('formats and parses local dates without UTC shift', () => {
    expect(toYmd(d(2026, 11, 1))).toBe('2026-11-01');
    expect(parseYmd('2026-11-01')?.getDate()).toBe(1);
    expect(parseYmd('')).toBeNull();
    expect(parseYmd('bukan tanggal')).toBeNull();
  });

  it('this month compares with the same days of last month (clamped)', () => {
    const r = computeReportRange('monthly', d(2026, 3, 31));
    expect([r.startYmd, r.endYmd]).toEqual(['2026-03-01', '2026-03-31']);
    expect([r.prevStartYmd, r.prevEndYmd]).toEqual(['2026-02-01', '2026-02-28']);
  });

  it('this month in January compares with December last year', () => {
    const r = computeReportRange('monthly', d(2026, 1, 15));
    expect([r.prevStartYmd, r.prevEndYmd]).toEqual(['2025-12-01', '2025-12-15']);
  });

  it('this week starts on Monday and compares with last week', () => {
    const r = computeReportRange('weekly', d(2026, 11, 29)); // Minggu
    expect([r.startYmd, r.endYmd]).toEqual(['2026-11-23', '2026-11-29']);
    expect([r.prevStartYmd, r.prevEndYmd]).toEqual(['2026-11-16', '2026-11-22']);
  });

  it('last month covers the whole previous month', () => {
    const r = computeReportRange('lastMonth', d(2026, 11, 27));
    expect([r.startYmd, r.endYmd]).toEqual(['2026-10-01', '2026-10-31']);
    expect([r.prevStartYmd, r.prevEndYmd]).toEqual(['2026-09-01', '2026-09-30']);
  });

  it('custom range swaps reversed dates and compares with the preceding span', () => {
    const r = computeReportRange('custom', d(2026, 11, 27), '2026-11-20', '2026-11-11');
    expect(r.swapped).toBe(true);
    expect([r.startYmd, r.endYmd]).toEqual(['2026-11-11', '2026-11-20']);
    expect([r.prevStartYmd, r.prevEndYmd]).toEqual(['2026-11-01', '2026-11-10']);
  });

  it('custom range survives an emptied date input', () => {
    const r = computeReportRange('custom', d(2026, 11, 27), '', '');
    expect([r.startYmd, r.endYmd]).toEqual(['2026-11-01', '2026-11-27']);
  });

  it('"all" has no comparison period', () => {
    const r = computeReportRange('all', d(2026, 11, 27));
    expect(r.prevStartYmd).toBeNull();
  });

  it('builds a gap-filled daily series for short ranges', () => {
    const { granularity, rows } = buildSeries(
      [{ date: '2026-11-02', revenue: 100, expenses: 30 }],
      d(2026, 11, 1),
      d(2026, 11, 3),
      false,
    );
    expect(granularity).toBe('day');
    expect(rows.map((r) => r.revenue)).toEqual([0, 100, 0]);
    expect(rows[1].profit).toBe(70);
  });

  it('builds a monthly series for long ranges, starting at the first data for "all"', () => {
    const { granularity, rows } = buildSeries(
      [
        { date: '2026-01-15', revenue: 100, expenses: 0 },
        { date: '2026-01-20', revenue: 50, expenses: 10 },
        { date: '2026-04-02', revenue: 10, expenses: 0 },
      ],
      d(1970, 1, 1),
      d(2026, 4, 30),
      true,
    );
    expect(granularity).toBe('month');
    expect(rows.map((r) => r.label)).toEqual(['Jan', 'Feb', 'Mar', 'Apr']);
    expect(rows[0]).toMatchObject({ revenue: 150, expenses: 10, profit: 140 });
  });
});

// src/utils/reportDates.ts
// Helper tanggal & periode untuk halaman Laporan. Semua dalam waktu LOKAL
// (hindari toISOString() yang bergeser ke UTC).

export type RangeType = 'weekly' | 'monthly' | 'lastMonth' | 'yearly' | 'all' | 'custom';

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' menurut waktu lokal. */
export const toYmd = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

/** 'YYYY-MM-DD' (atau awalan ISO) -> Date tengah malam lokal. */
export const parseYmd = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
};

/** Nilai tanggal apa pun (string tanggal, ISO, Date) -> 'YYYY-MM-DD' lokal. */
export const looseToYmd = (value: unknown): string | null => {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === 'string' || value instanceof Date) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : toYmd(d);
  }
  return null;
};

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const dayDiff = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 86400000);

export interface ReportRange {
  start: Date;
  end: Date;
  startYmd: string;
  endYmd: string;
  /** Periode pembanding (null untuk "Semua"). */
  prevStartYmd: string | null;
  prevEndYmd: string | null;
  /** Tanggal kustom terbalik lalu ditukar otomatis. */
  swapped: boolean;
}

/**
 * Hitung rentang laporan + periode pembanding yang sebanding:
 * - Minggu ini  → hari yang sama minggu lalu
 * - Bulan ini   → tanggal 1 s.d. tanggal yang sama bulan lalu
 * - Bulan lalu  → bulan sebelumnya penuh
 * - Tahun ini   → 1 Jan s.d. tanggal yang sama tahun lalu
 * - Kustom      → rentang sepanjang yang sama tepat sebelumnya
 */
export function computeReportRange(
  type: RangeType,
  today: Date,
  customStart?: string,
  customEnd?: string,
): ReportRange {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let start: Date;
  let end: Date = t;
  let prevStart: Date | null = null;
  let prevEnd: Date | null = null;
  let swapped = false;

  switch (type) {
    case 'all':
      start = new Date(1970, 0, 1);
      break;
    case 'weekly': {
      const day = t.getDay(); // 0 = Minggu
      start = addDays(t, -(day === 0 ? 6 : day - 1)); // Senin
      prevStart = addDays(start, -7);
      prevEnd = addDays(end, -7);
      break;
    }
    case 'lastMonth':
      start = new Date(t.getFullYear(), t.getMonth() - 1, 1);
      end = new Date(t.getFullYear(), t.getMonth(), 0);
      prevStart = new Date(t.getFullYear(), t.getMonth() - 2, 1);
      prevEnd = new Date(t.getFullYear(), t.getMonth() - 1, 0);
      break;
    case 'yearly': {
      start = new Date(t.getFullYear(), 0, 1);
      prevStart = new Date(t.getFullYear() - 1, 0, 1);
      const y = t.getFullYear() - 1;
      prevEnd = new Date(y, t.getMonth(), Math.min(t.getDate(), daysInMonth(y, t.getMonth())));
      break;
    }
    case 'custom': {
      const s = parseYmd(customStart) ?? new Date(t.getFullYear(), t.getMonth(), 1);
      const e = parseYmd(customEnd) ?? t;
      swapped = s.getTime() > e.getTime();
      [start, end] = swapped ? [e, s] : [s, e];
      const len = dayDiff(start, end) + 1;
      prevEnd = addDays(start, -1);
      prevStart = addDays(prevEnd, -(len - 1));
      break;
    }
    case 'monthly':
    default: {
      start = new Date(t.getFullYear(), t.getMonth(), 1);
      const py = t.getMonth() === 0 ? t.getFullYear() - 1 : t.getFullYear();
      const pm = (t.getMonth() + 11) % 12;
      prevStart = new Date(py, pm, 1);
      prevEnd = new Date(py, pm, Math.min(t.getDate(), daysInMonth(py, pm)));
    }
  }

  const endOfDay = new Date(end);
  endOfDay.setHours(23, 59, 59, 999);
  return {
    start,
    end: endOfDay,
    startYmd: toYmd(start),
    endYmd: toYmd(end),
    prevStartYmd: prevStart ? toYmd(prevStart) : null,
    prevEndYmd: prevEnd ? toYmd(prevEnd) : null,
    swapped,
  };
}

export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

export interface SeriesRow {
  key: string;
  label: string;
  /** Label lengkap untuk tooltip/tabel. */
  fullLabel: string;
  revenue: number;
  expenses: number;
  profit: number;
}

/**
 * Susun deret grafik dari data harian. Rentang ≤ 62 hari → per hari (hari kosong
 * diisi 0); lebih panjang → per bulan. Untuk "Semua", deret mulai dari data pertama.
 */
export function buildSeries(
  daily: { date: string; revenue: number; expenses: number }[],
  start: Date,
  end: Date,
  isAll: boolean,
): { granularity: 'day' | 'month'; rows: SeriesRow[] } {
  let first = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  if (isAll) {
    const firstData = daily
      .map((d) => d.date)
      .filter(Boolean)
      .sort()[0];
    const parsed = parseYmd(firstData);
    if (!parsed) return { granularity: 'month', rows: [] };
    first = parsed;
  }
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const span = dayDiff(first, last) + 1;

  if (span <= 62) {
    const byDay = new Map(daily.map((d) => [d.date, d]));
    const rows: SeriesRow[] = [];
    for (let d = first; d <= last; d = addDays(d, 1)) {
      const k = toYmd(d);
      const v = byDay.get(k);
      const revenue = v?.revenue ?? 0;
      const expenses = v?.expenses ?? 0;
      rows.push({
        key: k,
        label: String(d.getDate()),
        fullLabel: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        revenue,
        expenses,
        profit: revenue - expenses,
      });
    }
    return { granularity: 'day', rows };
  }

  const buckets = new Map<string, { revenue: number; expenses: number }>();
  daily.forEach((d) => {
    const k = d.date.slice(0, 7);
    const b = buckets.get(k) ?? { revenue: 0, expenses: 0 };
    b.revenue += d.revenue;
    b.expenses += d.expenses;
    buckets.set(k, b);
  });
  const spansYears = first.getFullYear() !== last.getFullYear();
  const rows: SeriesRow[] = [];
  for (
    let d = new Date(first.getFullYear(), first.getMonth(), 1);
    d <= last;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    const k = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    const b = buckets.get(k) ?? { revenue: 0, expenses: 0 };
    rows.push({
      key: k,
      label: spansYears
        ? `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
        : MONTH_NAMES[d.getMonth()],
      fullLabel: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
      revenue: b.revenue,
      expenses: b.expenses,
      profit: b.revenue - b.expenses,
    });
  }
  return { granularity: 'month', rows };
}

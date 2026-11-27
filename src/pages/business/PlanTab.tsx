import React, { useId, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalculatorIcon,
  TrendingUpIcon,
  DollarSignIcon,
  BanknoteIcon,
  CheckIcon,
  AlertTriangleIcon,
  TargetIcon,
} from 'lucide-react';
import useAppContext from '../../contexts/useAppContext';
import useToasts from '../../contexts/useToasts';
import { useAuditLogs } from '../../contexts/AuditLogContext';
import { can } from '../../config/permissions';
import useConfirmDialog from '../../hooks/useConfirmDialog';
import {
  DEFAULT_PLAN_VALUES,
  computePlan,
  daysInMonth,
  formatCurrency,
  type PlanValues,
} from '../../utils/businessPlan';
import { fetchStoreTargets, saveStoreTarget } from '../../utils/businessTargets';

const MIGRATION_MESSAGE = 'Fitur target butuh pembaruan database. Hubungi pengelola sistem.';
const DEFAULT_PERIOD = 'default';

type NumericSection = Exclude<keyof PlanValues, 'investment' | 'startDate'>;

const isMigrationMissing = (err: unknown) =>
  err instanceof Error && err.message === 'MIGRATION_MISSING';

const pad = (n: number) => String(n).padStart(2, '0');

/** Default + 12 bulan ke belakang dan 12 bulan ke depan, nilai 'YYYY-MM-01'. */
const buildPeriodOptions = (now = new Date()) => {
  const options = [{ value: DEFAULT_PERIOD, label: 'Default (setiap bulan)' }];
  for (let offset = -12; offset <= 12; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    options.push({
      value: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    });
  }
  return options;
};

// --- Reusable Simple Components ---

const Card = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
    <h3 className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 p-4 text-lg font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-100">
      {icon}
      {title}
    </h3>
    <div className="space-y-6 p-4">{children}</div>
  </section>
);

/** Kolom angka berlabel; label terhubung ke input lewat `htmlFor`. */
const NumberField = ({
  label,
  value,
  onChange,
  hint,
  inputClassName = '',
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
  hint?: string;
  inputClassName?: string;
}) => {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`form-input px-3 py-2 tabular-nums ${inputClassName}`}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
    </div>
  );
};

const RevenueStream = ({
  title,
  revenue,
  children,
}: {
  title: string;
  revenue: number;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h4>
      <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
        {formatCurrency(revenue)}
        <span className="font-normal text-slate-500 dark:text-slate-400">/bln</span>
      </span>
    </div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
  </div>
);

const Conclusion = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <li className="flex items-start gap-2">
    {ok ? (
      <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" aria-label="Baik" />
    ) : (
      <AlertTriangleIcon
        className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
        aria-label="Perlu perhatian"
      />
    )}
    <span>{children}</span>
  </li>
);

// ----------------------------------

const PlanTab: React.FC = () => {
  const { currentUser, selectedStoreId, stores } = useAppContext();
  const { addToast } = useToasts();
  const { addAuditLog } = useAuditLogs();
  const queryClient = useQueryClient();
  const [confirm, confirmDialog] = useConfirmDialog();
  const canManage = can(currentUser?.role, 'business.targets.manage');

  const [values, setValues] = useState<PlanValues>(DEFAULT_PLAN_VALUES);
  const [baseline, setBaseline] = useState<PlanValues | null>(null);
  const [chosenStoreId, setStoreId] = useState<string>('');
  // Turunan: pilihan pengguna, atau cabang aktif / cabang pertama (stores bisa datang belakangan).
  const storeId =
    chosenStoreId ||
    (selectedStoreId && selectedStoreId !== 'all' ? selectedStoreId : (stores?.[0]?.id ?? ''));
  const [period, setPeriod] = useState<string>(DEFAULT_PERIOD);
  const [busy, setBusy] = useState(false);
  const periodOptions = useMemo(() => buildPeriodOptions(), []);

  const startDateId = useId();
  const storeSelectId = useId();
  const periodSelectId = useId();

  const now = new Date();
  const monthYmd =
    period === DEFAULT_PERIOD ? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01` : period;
  const plan = computePlan(values, daysInMonth(monthYmd));
  const { revenue, hpp, profit, margin, paybackMonths } = plan;
  const hppRatio = revenue.total > 0 ? (hpp.total / revenue.total) * 100 : 0;

  const savedQuery = useQuery({
    queryKey: ['business-targets', storeId],
    queryFn: () => fetchStoreTargets(storeId),
    enabled: canManage && !!storeId,
    retry: false,
  });
  const wantedPeriod = period === DEFAULT_PERIOD ? null : period;
  const savedRow = savedQuery.data?.find((r) => r.period === wantedPeriod) ?? null;
  const reference = savedRow ? savedRow.values : baseline;
  const dirty = reference !== null && JSON.stringify(reference) !== JSON.stringify(values);

  const handleChange = (section: 'investment' | NumericSection, field: string, raw: string) => {
    const n = Math.max(0, parseFloat(raw) || 0);
    setValues((prev) =>
      section === 'investment'
        ? { ...prev, investment: n }
        : { ...prev, [section]: { ...prev[section], [field]: n } },
    );
  };

  const periodLabel = periodOptions.find((o) => o.value === period)?.label ?? period;
  const storeName = stores?.find((s) => s.id === storeId)?.name ?? storeId;

  const changeStore = (id: string) => {
    setStoreId(id);
    setBaseline(null);
  };
  const changePeriod = (p: string) => {
    setPeriod(p);
    setBaseline(null);
  };

  const failureMessage = (err: unknown, fallback: string) =>
    isMigrationMissing(err) ? MIGRATION_MESSAGE : fallback;

  const handleLoad = async () => {
    if (!storeId) return;
    setBusy(true);
    try {
      const rows = await queryClient.fetchQuery({
        queryKey: ['business-targets', storeId],
        queryFn: () => fetchStoreTargets(storeId),
        staleTime: 0,
      });
      const wanted = period === DEFAULT_PERIOD ? null : period;
      const found = rows.find((r) => r.period === wanted);
      if (!found) {
        addToast(`Belum ada target tersimpan untuk ${periodLabel}.`, 'info');
        return;
      }
      setValues(found.values);
      setBaseline(found.values);
      addToast('Target tersimpan dimuat.', 'success');
    } catch (err) {
      addToast(failureMessage(err, 'Gagal memuat target.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!storeId) return;
    // Pemeriksaan target tersimpan gagal (bukan migrasi): jangan menimpa tanpa sepengetahuan.
    if (savedQuery.isError && !isMigrationMissing(savedQuery.error)) {
      const ok = await confirm({
        title: 'Periksa target tersimpan gagal',
        message: 'Tidak bisa memeriksa target tersimpan. Tetap simpan?',
        confirmText: 'Tetap simpan',
      });
      if (!ok) return;
    }
    // Ada target tersimpan yang belum dimuat ke form ini dan isinya berbeda: jangan ditimpa diam-diam.
    else if (savedRow && baseline === null && dirty) {
      const ok = await confirm({
        title: 'Timpa target tersimpan?',
        message: `Timpa target tersimpan untuk ${storeName} · ${periodLabel}?`,
        confirmText: 'Timpa',
      });
      if (!ok) return;
    }
    setBusy(true);
    try {
      await saveStoreTarget(storeId, period === DEFAULT_PERIOD ? null : period, values);
      setBaseline(values);
      addToast(`Target ${storeName} (${periodLabel}) disimpan.`, 'success');
      addAuditLog(`Menyimpan target bisnis ${storeName} untuk periode ${periodLabel}.`, storeId, {
        period: periodLabel,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['business-targets', storeId] }),
        queryClient.invalidateQueries({ queryKey: ['target-vs-actual'] }),
      ]);
    } catch (err) {
      addToast(failureMessage(err, 'Gagal menyimpan target.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 md:flex-row md:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg sm:text-lg font-bold text-slate-900 dark:text-white">
            <CalculatorIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Simulasi Bisnis Laundry
          </h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Proyeksi bisnis laundry kiloan, satuan, dan cuci sepatu dalam satu dashboard.
          </p>
        </div>

        <div className="w-full rounded-xl border border-slate-200 bg-white p-5 text-center md:w-auto md:min-w-[200px] dark:border-slate-700 dark:bg-slate-800">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            ROI (Break Even Point)
          </p>
          <p className="flex items-baseline justify-center gap-1 text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {paybackMonths !== null ? paybackMonths.toFixed(1) : '∞'}{' '}
            <span className="text-xl font-medium text-slate-600 dark:text-slate-300">Bulan</span>
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Investasi {formatCurrency(values.investment)}
          </p>
        </div>
      </div>

      {confirmDialog}
      {canManage && (
        <section
          aria-labelledby="target-panel-heading"
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
        >
          <h3
            id="target-panel-heading"
            className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-slate-100"
          >
            <TargetIcon className="h-5 w-5 text-brand-blue-600 dark:text-brand-blue-300" />
            Target cabang
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={storeSelectId} className="form-label">
                Cabang
              </label>
              <select
                id={storeSelectId}
                value={storeId}
                onChange={(e) => changeStore(e.target.value)}
                disabled={busy}
                className="form-input px-3 py-2"
              >
                {(stores ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={periodSelectId} className="form-label">
                Periode
              </label>
              <select
                id={periodSelectId}
                value={period}
                onChange={(e) => changePeriod(e.target.value)}
                disabled={busy}
                className="form-input px-3 py-2"
              >
                {periodOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleLoad}
              disabled={busy || !storeId}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Muat target tersimpan
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={busy || !storeId || savedQuery.isPending}
              className="rounded-lg bg-brand-blue-600 px-4 py-2 font-semibold text-white hover:bg-brand-blue-700 disabled:opacity-50"
            >
              Simpan sebagai target
            </button>
            {savedRow && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                Target tersimpan ada untuk periode ini
              </span>
            )}
            {dirty && (
              <span role="status" className="text-sm text-amber-600 dark:text-amber-400">
                Ada perubahan yang belum disimpan
              </span>
            )}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* INPUT COLUMN */}
        <div className="space-y-8 lg:col-span-2">
          {/* 1. INVESTASI */}
          <Card
            title="1. Investasi Awal & Asumsi"
            icon={<BanknoteIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
          >
            <NumberField
              label="Total Modal Investasi (Rp)"
              value={values.investment}
              onChange={(v) => handleChange('investment', '', v)}
              hint="Termasuk renovasi, mesin, peralatan, dan biaya awal lainnya."
              inputClassName="text-lg font-bold"
            />
            <div>
              <label htmlFor={startDateId} className="form-label">
                Tanggal mulai operasi (opsional)
              </label>
              <input
                id={startDateId}
                type="date"
                value={values.startDate ?? ''}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, startDate: e.target.value || null }))
                }
                className="form-input px-3 py-2"
              />
            </div>
          </Card>

          {/* 2. REVENUE STREAMS */}
          <Card
            title="2. Sumber Pendapatan (Omzet)"
            icon={<TrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
          >
            <RevenueStream title="Laundry Kiloan" revenue={revenue.kiloan}>
              <NumberField
                label="Target Kg / Hari"
                value={values.kiloan.kgPerDay}
                onChange={(v) => handleChange('kiloan', 'kgPerDay', v)}
              />
              <NumberField
                label="Harga / Kg"
                value={values.kiloan.price}
                onChange={(v) => handleChange('kiloan', 'price', v)}
              />
            </RevenueStream>

            <RevenueStream title="Laundry Satuan" revenue={revenue.satuan}>
              <NumberField
                label="Target Pcs / Hari"
                value={values.satuan.pcsPerDay}
                onChange={(v) => handleChange('satuan', 'pcsPerDay', v)}
              />
              <NumberField
                label="Harga Rata-rata / Pcs"
                value={values.satuan.price}
                onChange={(v) => handleChange('satuan', 'price', v)}
              />
            </RevenueStream>

            <RevenueStream title="Cuci Sepatu" revenue={revenue.shoes}>
              <NumberField
                label="Target Pasang / Hari"
                value={values.shoes.pairsPerDay}
                onChange={(v) => handleChange('shoes', 'pairsPerDay', v)}
              />
              <NumberField
                label="Harga / Pasang"
                value={values.shoes.price}
                onChange={(v) => handleChange('shoes', 'price', v)}
              />
            </RevenueStream>

            <RevenueStream title="Cuci Karpet (Seasonal)" revenue={revenue.carpet}>
              <NumberField
                label="Target m² / Bulan"
                value={values.carpet.m2PerMonth}
                onChange={(v) => handleChange('carpet', 'm2PerMonth', v)}
              />
              <NumberField
                label="Harga / m²"
                value={values.carpet.price}
                onChange={(v) => handleChange('carpet', 'price', v)}
              />
            </RevenueStream>
          </Card>

          {/* 3. OPEX */}
          <Card
            title="3. Biaya Operasional (Bulanan)"
            icon={<DollarSignIcon className="h-5 w-5 text-red-500 dark:text-red-400" />}
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <NumberField
                label="Gaji Karyawan & Bonus"
                value={values.costs.salary}
                onChange={(v) => handleChange('costs', 'salary', v)}
              />
              <NumberField
                label="Sewa Tempat (Amortisasi)"
                value={values.costs.rent}
                onChange={(v) => handleChange('costs', 'rent', v)}
              />
              <NumberField
                label="Listrik & Air"
                value={values.costs.utilities}
                onChange={(v) => handleChange('costs', 'utilities', v)}
              />
              <NumberField
                label="Marketing & Pemeliharaan"
                value={values.costs.marketing}
                onChange={(v) => handleChange('costs', 'marketing', v)}
              />
              <NumberField
                label="Biaya lain"
                value={values.costs.other}
                onChange={(v) => handleChange('costs', 'other', v)}
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="form-label">Estimasi HPP (Bahan Baku)</p>
                <p className="my-1 text-xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
                  {formatCurrency(hpp.total)}
                </p>
                <p className="text-sm leading-snug text-slate-500 dark:text-slate-400">
                  Dihitung otomatis: {values.hpp.kiloanPercent}% Kiloan, {values.hpp.satuanPercent}%
                  Satuan, {values.hpp.shoesPercent}% Sepatu, {values.hpp.carpetPercent}% Karpet.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* RESULTS COLUMN */}
        <div>
          <section
            aria-labelledby="calc-summary-heading"
            className="sticky top-6 overflow-hidden rounded-2xl bg-slate-900 text-white dark:border dark:border-slate-700"
          >
            <div className="border-b border-slate-700 p-6">
              <h3 id="calc-summary-heading" className="text-xl font-bold">
                Ringkasan Profit
              </h3>
              <p className="text-sm text-slate-400">Proyeksi Bulanan</p>
            </div>

            <div className="space-y-6 p-6 tabular-nums">
              <div>
                <p className="mb-1 text-sm font-medium uppercase text-slate-400">Total Omzet</p>
                <p className="text-3xl font-extrabold tracking-tight text-green-400 xl:text-4xl">
                  {formatCurrency(revenue.total)}
                </p>
              </div>

              <div className="space-y-3 border-t border-slate-700 pt-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-300">Biaya HPP</span>
                  <span className="font-medium text-red-300">({formatCurrency(hpp.total)})</span>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-300">Biaya Operasional</span>
                  <span className="font-medium text-red-300">
                    ({formatCurrency(plan.costs.total - hpp.total)})
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-t border-slate-700 pt-3 font-bold text-slate-100">
                  <span>Total Pengeluaran</span>
                  <span className="text-red-400">{formatCurrency(plan.costs.total)}</span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <p className="mb-2 text-sm font-medium uppercase text-slate-400">
                  Laba operasional
                </p>
                <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
                  <p
                    className={`text-3xl font-extrabold tracking-tight xl:text-4xl ${
                      profit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {formatCurrency(profit)}
                  </p>
                  <p className="mt-2 flex items-center justify-between text-sm font-medium text-slate-300">
                    <span>Net Profit Margin</span>
                    <span className="rounded bg-slate-700 px-2 py-1 text-slate-100">
                      {margin.toFixed(1)}%
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-800 p-4">
                <p className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-200">
                  Kesimpulan
                </p>
                <ul className="space-y-2 text-sm leading-relaxed text-slate-300">
                  <Conclusion ok={margin > 30}>
                    Margin {margin > 30 ? 'Sangat Sehat (>30%)' : margin > 0 ? 'Standard' : 'Rugi'}
                  </Conclusion>
                  <Conclusion ok={paybackMonths !== null}>
                    {paybackMonths !== null
                      ? `Balik Modal: ${paybackMonths.toFixed(1)} Bulan (${(paybackMonths / 12).toFixed(1)} Tahun)`
                      : 'Belum balik modal: laba bersih masih nol atau minus'}
                  </Conclusion>
                  <Conclusion ok={revenue.total > 0 && hppRatio <= 30}>
                    HPP Ratio: {hppRatio.toFixed(1)}% dari Omzet
                  </Conclusion>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PlanTab;

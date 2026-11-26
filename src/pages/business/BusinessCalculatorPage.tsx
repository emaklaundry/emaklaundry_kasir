import React, { useId, useState } from 'react';
import {
  CalculatorIcon,
  TrendingUpIcon,
  DollarSignIcon,
  BanknoteIcon,
  CheckIcon,
  AlertTriangleIcon,
} from 'lucide-react';

// Default assumptions from user example
const DEFAULT_VALUES = {
  investment: 160000000,
  kiloan: { kgPerDay: 80, price: 9000 },
  satuan: { pcsPerDay: 5, price: 20000 },
  shoes: { pairsPerDay: 3, price: 50000 },
  carpet: { m2PerMonth: 20, price: 20000 },
  costs: {
    salary: 6000000,
    rent: 3500000,
    marketing: 1500000,
  },
  hpp: {
    kiloanPercent: 25,
    satuanPercent: 10,
    shoesPercent: 15,
    carpetPercent: 10,
  },
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);

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

const BusinessCalculatorPage = () => {
  const [values, setValues] = useState(DEFAULT_VALUES);
  // Derived state - Calculated whenever values change (no useEffect needed)
  // 1. Revenue
  const revKiloan = values.kiloan.kgPerDay * 30 * values.kiloan.price;
  const revSatuan = values.satuan.pcsPerDay * 30 * values.satuan.price;
  const revShoes = values.shoes.pairsPerDay * 30 * values.shoes.price;
  const revCarpet = values.carpet.m2PerMonth * values.carpet.price;

  const totalRev = revKiloan + revSatuan + revShoes + revCarpet;

  // 2. Costs
  const hppKiloan = revKiloan * (values.hpp.kiloanPercent / 100);
  const hppSatuan = revSatuan * (values.hpp.satuanPercent / 100);
  const hppShoes = revShoes * (values.hpp.shoesPercent / 100);
  const hppCarpet = revCarpet * (values.hpp.carpetPercent / 100);

  // Total HPP
  const totalHpp = hppKiloan + hppSatuan + hppShoes + hppCarpet;

  const totalOperationalCost =
    totalHpp + values.costs.salary + values.costs.rent + values.costs.marketing;

  // 3. Results
  const ebitda = totalRev - totalOperationalCost;
  const margin = totalRev > 0 ? (ebitda / totalRev) * 100 : 0;
  const roi = ebitda > 0 ? values.investment / ebitda : Infinity;
  const hppRatio = totalRev > 0 ? (totalHpp / totalRev) * 100 : 0;
  const breaksEven = Number.isFinite(roi);

  const handleChange = (section: string, field: string, value: string) => {
    const numValue = Math.max(0, parseFloat(value) || 0);
    setValues((prev) => ({
      ...prev,
      [section]:
        typeof prev[section as keyof typeof prev] === 'object'
          ? { ...(prev[section as keyof typeof prev] as object), [field]: numValue }
          : numValue,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700 md:flex-row md:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
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
            {breaksEven ? roi.toFixed(1) : '∞'}{' '}
            <span className="text-xl font-medium text-slate-600 dark:text-slate-300">Bulan</span>
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Investasi {formatCurrency(values.investment)}
          </p>
        </div>
      </div>

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
          </Card>

          {/* 2. REVENUE STREAMS */}
          <Card
            title="2. Sumber Pendapatan (Omzet)"
            icon={<TrendingUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
          >
            <RevenueStream title="Laundry Kiloan" revenue={revKiloan}>
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

            <RevenueStream title="Laundry Satuan" revenue={revSatuan}>
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

            <RevenueStream title="Cuci Sepatu" revenue={revShoes}>
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

            <RevenueStream title="Cuci Karpet (Seasonal)" revenue={revCarpet}>
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
                label="Marketing & Maintenance"
                value={values.costs.marketing}
                onChange={(v) => handleChange('costs', 'marketing', v)}
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                <p className="form-label">Estimasi HPP (Bahan Baku)</p>
                <p className="my-1 text-xl font-bold tabular-nums text-slate-800 dark:text-slate-100">
                  {formatCurrency(totalHpp)}
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
                  {formatCurrency(totalRev)}
                </p>
              </div>

              <div className="space-y-3 border-t border-slate-700 pt-4">
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-300">Biaya HPP</span>
                  <span className="font-medium text-red-300">({formatCurrency(totalHpp)})</span>
                </div>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-300">Biaya Operasional</span>
                  <span className="font-medium text-red-300">
                    ({formatCurrency(totalOperationalCost - totalHpp)})
                  </span>
                </div>
                <div className="flex justify-between gap-3 border-t border-slate-700 pt-3 font-bold text-slate-100">
                  <span>Total Pengeluaran</span>
                  <span className="text-red-400">{formatCurrency(totalOperationalCost)}</span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-6">
                <p className="mb-2 text-sm font-medium uppercase text-slate-400">
                  EBITDA (Laba Bersih)
                </p>
                <div className="rounded-xl border border-slate-600 bg-slate-800 p-4">
                  <p
                    className={`text-3xl font-extrabold tracking-tight xl:text-4xl ${
                      ebitda >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {formatCurrency(ebitda)}
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
                  <Conclusion ok={breaksEven}>
                    {breaksEven
                      ? `Balik Modal: ${roi.toFixed(1)} Bulan (${(roi / 12).toFixed(1)} Tahun)`
                      : 'Belum balik modal: laba bersih masih nol atau minus'}
                  </Conclusion>
                  <Conclusion ok={totalRev > 0 && hppRatio <= 30}>
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

export default BusinessCalculatorPage;

import React, { useState } from 'react';
import { CalculatorIcon, TrendingUpIcon, DollarSignIcon, BanknoteIcon } from 'lucide-react';

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

// --- Reusable Simple Components ---

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-4 border-b border-slate-100 ${className}`}>{children}</div>;

const CardTitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <h3 className={`font-bold text-slate-800 ${className}`}>{children}</h3>;

const CardContent = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-4 ${className}`}>{children}</div>;

const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <label
    className={`block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ${className}`}
  >
    {children}
  </label>
);

const Input = ({
  type = 'text',
  value,
  onChange,
  className = '',
}: {
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${className}`}
  />
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

  const results = {
    revenueKiloan: revKiloan,
    revenueSatuan: revSatuan,
    revenueShoes: revShoes,
    revenueCarpet: revCarpet,
    totalRevenue: totalRev,
    hppTotal: totalHpp,
    totalCost: totalOperationalCost,
    ebitda,
    netProfitMargin: margin,
    roiMonths: roi,
  };

  const handleChange = (section: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setValues((prev) => ({
      ...prev,
      [section]:
        typeof prev[section as keyof typeof prev] === 'object'
          ? { ...(prev[section as keyof typeof prev] as object), [field]: numValue }
          : numValue,
    }));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalculatorIcon className="w-8 h-8 text-blue-600" />
            Simulasi Bisnis Laundry
          </h1>
          <p className="text-slate-500 mt-1">
            Proyeksi bisnis laundry kiloan, satuan, dan cuci sepatu dalam satu dashboard.
          </p>
        </div>

        <div className="bg-blue-600 text-white rounded-xl shadow-lg p-5 min-w-[200px] text-center transform hover:scale-105 transition-transform">
          <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">
            ROI (Break Even Point)
          </p>
          <p className="text-4xl font-extrabold flex items-baseline justify-center gap-1">
            {results.roiMonths === Infinity ? '∞' : results.roiMonths.toFixed(1)}{' '}
            <span className="text-xl font-medium">Bulan</span>
          </p>
          <div className="mt-2 text-xs bg-blue-700 py-1 px-2 rounded inline-block">
            Investasi {formatCurrency(values.investment)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* INPUT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. INVESTASI */}
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BanknoteIcon className="w-5 h-5 text-slate-500" />
                1. Investasi Awal & Asumsi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <Label>Total Modal Investasi (Rp)</Label>
                  <Input
                    type="number"
                    value={values.investment}
                    onChange={(e) => handleChange('investment', '', e.target.value)}
                    className="text-lg font-bold text-slate-700"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Termasuk renovasi, mesin, peralatan, dan biaya awal lainnya.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. REVENUE STREAMS */}
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUpIcon className="w-5 h-5 text-green-600" />
                2. Sumber Pendapatan (Omzet)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kiloan */}
              <div className="p-4 bg-green-50/50 rounded-xl border border-green-100/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700 text-lg">Laundry Kiloan</h4>
                  <span className="text-green-700 font-bold bg-green-100 px-3 py-1 rounded-full text-sm">
                    {formatCurrency(results.revenueKiloan)}/bln
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Kg / Hari</Label>
                    <Input
                      type="number"
                      value={values.kiloan.kgPerDay}
                      onChange={(e) => handleChange('kiloan', 'kgPerDay', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Harga / Kg</Label>
                    <Input
                      type="number"
                      value={values.kiloan.price}
                      onChange={(e) => handleChange('kiloan', 'price', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Satuan */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700 text-lg">Laundry Satuan</h4>
                  <span className="text-blue-700 font-bold bg-blue-100 px-3 py-1 rounded-full text-sm">
                    {formatCurrency(results.revenueSatuan)}/bln
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Pcs / Hari</Label>
                    <Input
                      type="number"
                      value={values.satuan.pcsPerDay}
                      onChange={(e) => handleChange('satuan', 'pcsPerDay', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Harga Rata-rata / Pcs</Label>
                    <Input
                      type="number"
                      value={values.satuan.price}
                      onChange={(e) => handleChange('satuan', 'price', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Shoes */}
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700 text-lg">Cuci Sepatu</h4>
                  <span className="text-purple-700 font-bold bg-purple-100 px-3 py-1 rounded-full text-sm">
                    {formatCurrency(results.revenueShoes)}/bln
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target Pasang / Hari</Label>
                    <Input
                      type="number"
                      value={values.shoes.pairsPerDay}
                      onChange={(e) => handleChange('shoes', 'pairsPerDay', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Harga / Pasang</Label>
                    <Input
                      type="number"
                      value={values.shoes.price}
                      onChange={(e) => handleChange('shoes', 'price', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Karpet */}
              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700 text-lg">Cuci Karpet (Seasonal)</h4>
                  <span className="text-orange-700 font-bold bg-orange-100 px-3 py-1 rounded-full text-sm">
                    {formatCurrency(results.revenueCarpet)}/bln
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target m² / Bulan</Label>
                    <Input
                      type="number"
                      value={values.carpet.m2PerMonth}
                      onChange={(e) => handleChange('carpet', 'm2PerMonth', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Harga / m²</Label>
                    <Input
                      type="number"
                      value={values.carpet.price}
                      onChange={(e) => handleChange('carpet', 'price', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. OPEX */}
          <Card>
            <CardHeader className="bg-slate-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSignIcon className="w-5 h-5 text-red-500" />
                3. Biaya Operasional (Bulanan)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Gaji Karyawan & Bonus</Label>
                  <Input
                    type="number"
                    value={values.costs.salary}
                    onChange={(e) => handleChange('costs', 'salary', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sewa Tempat (Amortisasi)</Label>
                  <Input
                    type="number"
                    value={values.costs.rent}
                    onChange={(e) => handleChange('costs', 'rent', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Marketing & Maintenance</Label>
                  <Input
                    type="number"
                    value={values.costs.marketing}
                    onChange={(e) => handleChange('costs', 'marketing', e.target.value)}
                  />
                </div>
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200">
                  <Label>Estimasi HPP (Bahan Baku)</Label>
                  <div className="text-xl font-bold text-slate-700 my-1">
                    {formatCurrency(results.hppTotal)}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight">
                    *HPP dihitung otomatis: {values.hpp.kiloanPercent}% Kiloan,{' '}
                    {values.hpp.satuanPercent}% Satuan, {values.hpp.shoesPercent}% Sepatu
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RESULTS COLUMN */}
        <div className="space-y-6">
          <div className="sticky top-6">
            <div className="bg-slate-900 text-white rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <h3 className="text-xl font-bold">Ringkasan Profit</h3>
                <p className="text-slate-400 text-sm">Proyeksi Bulanan</p>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="text-sm font-medium text-slate-400 uppercase mb-1">Total Omzet</p>
                  <p className="text-4xl font-extrabold text-green-400 tracking-tight">
                    {formatCurrency(results.totalRevenue)}
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Biaya HPP</span>
                    <span className="text-red-300 font-medium">
                      ({formatCurrency(results.hppTotal)})
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Biaya Operasional</span>
                    <span className="text-red-300 font-medium">
                      ({formatCurrency(results.totalCost - results.hppTotal)})
                    </span>
                  </div>
                  <div className="flex justify-between font-bold pt-3 border-t border-slate-700 text-slate-100">
                    <span>Total Pengeluaran</span>
                    <span className="text-red-400">{formatCurrency(results.totalCost)}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700">
                  <p className="text-sm font-medium text-slate-400 uppercase mb-2">
                    EBITDA (Laba Bersih)
                  </p>
                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-600">
                    <p className="text-4xl font-extrabold text-blue-400 tracking-tight">
                      {formatCurrency(results.ebitda)}
                    </p>
                    <p className="text-sm text-blue-200 mt-2 font-medium flex items-center justify-between">
                      <span>Net Profit Margin</span>
                      <span className="bg-blue-900/50 px-2 py-1 rounded text-blue-300">
                        {results.netProfitMargin.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>

                <div className="bg-slate-800 p-4 rounded-xl mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUpIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-bold text-yellow-500 uppercase tracking-wider">
                      Kesimpulan
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-300 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      Margin {results.netProfitMargin > 30 ? 'Sangat Sehat (>30%)' : 'Standard'}
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      Balik Modal: {results.roiMonths.toFixed(1)} Bulan (
                      {(results.roiMonths / 12).toFixed(1)} Tahun)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      HPP Ratio: {((results.hppTotal / results.totalRevenue) * 100).toFixed(1)}%
                      dari Omzet
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCalculatorPage;

import React from 'react';
import { ArrowTrendingUpIcon } from '../components/icons';

const BusinessGuidePage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <ArrowTrendingUpIcon className="w-8 h-8 text-brand-blue-600 dark:text-brand-blue-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Panduan Bisnis Laundry
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Kumpulan alat perhitungan, metrik bisnis, dan strategi untuk memaksimalkan keuntungan
          usaha laundry Anda.
        </p>

        <div className="space-y-6">
          {/* Kalkulator Bisnis */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              1. Kalkulator Bisnis Laundry
            </h3>

            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  📊 Rumus Harga Jual
                </h4>
                <code className="block bg-slate-800 text-green-400 p-3 rounded text-sm font-mono mb-2">
                  Harga Jual = (Biaya per Kg × Markup) + Margin Keuntungan
                </code>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Contoh:</strong> Biaya Rp 3.000/kg × 2.5 = Rp 7.500/kg (markup 150%)
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  📈 Break-Even Point (BEP)
                </h4>
                <code className="block bg-slate-800 text-green-400 p-3 rounded text-sm font-mono mb-2">
                  BEP (Kg) = Biaya Tetap Bulanan ÷ (Harga Jual/Kg - Biaya Variabel/Kg)
                </code>
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>Contoh:</strong> Rp 5.000.000 ÷ (Rp 7.500 - Rp 3.000) = 1.111 Kg/bulan
                </p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  💰 Margin Keuntungan
                </h4>
                <code className="block bg-slate-800 text-green-400 p-3 rounded text-sm font-mono mb-2">
                  Margin (%) = ((Harga Jual - Biaya) ÷ Harga Jual) × 100
                </code>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Target Sehat:</strong> Margin minimal 40-60% untuk bisnis laundry
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded border border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  🎯 Estimasi Pendapatan Bulanan
                </h4>
                <code className="block bg-slate-800 text-green-400 p-3 rounded text-sm font-mono mb-2">
                  Pendapatan = Rata-rata Kg/Hari × Harga/Kg × 30 Hari
                </code>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  <strong>Contoh:</strong> 50 Kg × Rp 7.500 × 30 = Rp 11.250.000/bulan
                </p>
              </div>
            </div>
          </section>

          {/* Analisis Biaya */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              2. Analisis Biaya Operasional
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  🏢 Biaya Tetap (Fixed Cost)
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Sewa tempat: Rp 1.500.000 - 3.000.000/bulan</li>
                  <li>• Gaji karyawan: Rp 1.800.000 - 2.500.000/orang</li>
                  <li>• Listrik base: Rp 500.000 - 1.000.000/bulan</li>
                  <li>• Air PDAM: Rp 200.000 - 400.000/bulan</li>
                  <li>• Internet + POS: Rp 300.000/bulan</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  📦 Biaya Variabel (per Kg)
                </h4>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Deterjen: Rp 500 - 800/kg</li>
                  <li>• Pewangi: Rp 200 - 400/kg</li>
                  <li>• Plastik packing: Rp 300 - 500/kg</li>
                  <li>• Air tambahan: Rp 200 - 300/kg</li>
                  <li>• Listrik mesin: Rp 400 - 600/kg</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                💡 <strong>Estimasi Total Biaya Variabel:</strong> Rp 1.600 - 2.600/kg
              </p>
            </div>
          </section>

          {/* KPI */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              3. KPI & Metrik Penting
            </h3>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Metrik
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Target
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Cara Menghitung
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Customer Retention Rate
                    </td>
                    <td className="px-3 py-2 text-green-600 dark:text-green-400 font-medium">
                      &gt; 60%
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">
                      (Pelanggan Repeat ÷ Total Pelanggan) × 100
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Avg. Transaction Value
                    </td>
                    <td className="px-3 py-2 text-green-600 dark:text-green-400 font-medium">
                      &gt; Rp 50.000
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">
                      Total Pendapatan ÷ Jumlah Transaksi
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Order Turnaround Time
                    </td>
                    <td className="px-3 py-2 text-green-600 dark:text-green-400 font-medium">
                      &lt; 48 jam
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">
                      Waktu selesai - Waktu order masuk
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Kapasitas Utilization
                    </td>
                    <td className="px-3 py-2 text-green-600 dark:text-green-400 font-medium">
                      &gt; 70%
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">
                      Kg Aktual ÷ Kg Kapasitas Max
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Gross Profit Margin
                    </td>
                    <td className="px-3 py-2 text-green-600 dark:text-green-400 font-medium">
                      &gt; 50%
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400 text-xs">
                      (Pendapatan - Biaya Variabel) ÷ Pendapatan
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Strategi Bisnis */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              4. Strategi Bisnis
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                  💎 Pricing Strategy
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>
                    • <strong>Premium:</strong> Harga tinggi, layanan express, parfum pilihan
                  </li>
                  <li>
                    • <strong>Volume:</strong> Harga kompetitif, target quantity tinggi
                  </li>
                  <li>
                    • <strong>Hybrid:</strong> Reguler + Express dengan harga berbeda
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <h4 className="font-bold text-green-900 dark:text-green-100 mb-2">
                  🎁 Loyalty Program
                </h4>
                <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                  <li>• Bonus kg ke-10 gratis</li>
                  <li>• Member card dengan poin</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                <h4 className="font-bold text-amber-900 dark:text-amber-100 mb-2">
                  📅 Seasonal Planning
                </h4>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>
                    • <strong>Lebaran/Natal:</strong> Promo cuci karpet, gorden
                  </li>
                  <li>
                    • <strong>Musim Hujan:</strong> Layanan express lebih mahal
                  </li>
                  <li>
                    • <strong>Back to School:</strong> Promo seragam, tas
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                <h4 className="font-bold text-purple-900 dark:text-purple-100 mb-2">
                  🚀 Ekspansi Usaha
                </h4>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                  <li>• Tambah layanan: Dry cleaning, laundry sepatu</li>
                  <li>• Pickup & delivery service</li>
                  <li>• Franchise atau buka cabang</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Tips */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              💡 Tips Sukses Bisnis Laundry
            </h4>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>✅ Konsistensi kualitas cucian adalah kunci repeat customer</li>
              <li>✅ Catat semua pengeluaran untuk analisis profit akurat</li>
              <li>✅ Investasi di mesin berkualitas untuk efisiensi jangka panjang</li>
              <li>✅ Gunakan WhatsApp notification untuk meningkatkan customer experience</li>
              <li>✅ Monitor KPI mingguan untuk deteksi masalah dini</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessGuidePage;

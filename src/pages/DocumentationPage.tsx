import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  ChevronRightIcon,
  HomeIcon,
  UsersIcon as UserGroupIcon, // Alias UsersIcon as UserGroupIcon
  ShoppingCartIcon,
  ArchiveBoxIcon,
  WrenchIcon,
  BarChartIcon as ChartBarIcon, // Alias BarChartIcon as ChartBarIcon
  BoltIcon,
  PackageIcon,
  DollarSignIcon,
  SettingsIcon,
  CommandIcon,
  HistoryIcon,
  UserIcon,
} from '../components/icons';

const DocumentationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Memulai',
      icon: HomeIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Selamat Datang di Emak Laundry POS
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Sistem manajemen laundry modern yang dirancang untuk membantu Anda mengelola bisnis
            laundry dengan lebih efisien, mulai dari pencatatan transaksi, manajemen pelanggan,
            hingga laporan keuangan.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Fitur Utama
            </h3>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Pencatatan Transaksi & Struk Digital (WhatsApp)</li>
              <li>Pelanggan & Riwayat Order</li>
              <li>Stok & Inventaris, termasuk resep pemakaian bahan</li>
              <li>Karyawan, jadwal kerja, absensi, dan login PIN</li>
              <li>Laporan Keuangan & Statistik</li>
              <li>Banyak Cabang (Multi-Store)</li>
            </ul>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Halaman ini merangkum cara kerja tiap fitur. Untuk langkah demi langkah dan tur
            interaktif, buka{' '}
            <Link
              to="/help"
              className="font-medium text-blue-700 hover:underline dark:text-blue-300"
            >
              Bantuan / Tutorial
            </Link>
            .
          </p>
        </div>
      ),
    },
    {
      id: 'transactions',
      title: 'Transaksi',
      icon: ShoppingCartIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Panduan Transaksi</h2>

          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                1. Membuat Transaksi Baru
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Masuk ke menu <strong>Transaksi</strong> &gt; klik tombol{' '}
                <strong>Transaksi Baru</strong>.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-2">
                <li>
                  Pilih <strong>Pelanggan</strong> atau buat pelanggan baru.
                </li>
                <li>
                  Pilih <strong>Layanan</strong> (Kiloan, Satuan, Sepatu, atau Karpet) dan masukkan
                  jumlah, berat, atau ukurannya.
                </li>
                <li>Tambahkan catatan jika ada (misal: "Baju luntur jangan dicampur").</li>
                <li>
                  Pilih <strong>Bayar Nanti</strong> atau <strong>Bayar Sekarang</strong> (Tunai,
                  QRIS, Transfer Bank). Total adalah jumlah harga layanan, tanpa diskon atau pajak.
                </li>
                <li>
                  Klik <strong>Simpan Transaksi</strong>.
                </li>
              </ol>
            </section>

            <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                2. Mengirim Struk WhatsApp
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Setelah transaksi dibuat, status pesanan adalah <strong>Diproses</strong>. Anda
                dapat mengirim struk digital ke pelanggan via WhatsApp dengan mengklik tombol{' '}
                <strong>WhatsApp</strong> pada detail transaksi atau saat menyelesaikan pesanan.
              </p>
            </section>

            <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2">
                3. Menyelesaikan Pesanan
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Ubah status pesanan sesuai progres fisik:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 ml-2">
                <li>
                  <strong>Diproses</strong>: Cucian sedang dikerjakan.
                </li>
                <li>
                  <strong>Siap Diambil</strong>: Cucian selesai dan siap diambil pelanggan.
                  Notifikasi WhatsApp otomatis disiapkan.
                </li>
                <li>
                  <strong>Selesai</strong>: Pelanggan sudah mengambil cucian dan melunasi
                  pembayaran.
                </li>
              </ul>
            </section>
          </div>
        </div>
      ),
    },
    {
      id: 'customers',
      title: 'Pelanggan',
      icon: UserGroupIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Pelanggan</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Kelola data pelanggan untuk memudahkan pemesanan berulang dan loyalitas.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
                Tambah Pelanggan
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Input data: Nama, No. HP (WA), dan Alamat. No. HP penting untuk notifikasi otomatis.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
                Riwayat Transaksi
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Lihat riwayat laundry pelanggan di halaman detail pelanggan untuk memantau frekuensi
                dan total pengeluaran mereka.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'inventory',
      title: 'Inventaris',
      icon: ArchiveBoxIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Stok & Inventaris</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Pantau penggunaan bahan baku seperti Deterjen, Pewangi, dan Plastik Packing.
          </p>

          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-300 mt-1">
                Update Stok
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Tambah stok setelah belanja lewat <strong>Aksi Cepat &gt; Update Stok</strong>, atau
                edit barangnya di halaman Inventaris.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-red-900 dark:text-red-300 mt-1">
                Resep & Opname
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                <strong>Resep</strong> memotong stok bahan otomatis setiap transaksi.{' '}
                <strong>Opname</strong> mencocokkan stok sistem dengan hitungan fisik.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-yellow-900 dark:text-yellow-300 mt-1">
                Low Stock Alert
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Sistem otomatis memberi peringatan di Dashboard jika stok menipis di bawah ambang
                batas minimum.
              </span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'assets',
      title: 'Aset & Perawatan',
      icon: WrenchIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Aset & Jadwal Perawatan
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Jaga umur peralatan laundry Anda (Mesin Cuci, Pengering, Setrika) dengan jadwal
            perawatan rutin.
          </p>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Cara Kerja</h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>Daftarkan Aset (Contoh: "Mesin Cuci LG 1").</li>
              <li>
                Buat <strong>Jadwal Perawatan</strong> (Contoh: "Bersihkan Filter" setiap 7 hari).
              </li>
              <li>
                Dashboard menampilkan kartu <strong>Perawatan Terjadwal</strong> saat ada perawatan
                yang jatuh tempo; klik kartunya untuk membuka daftar di halaman Aset.
              </li>
              <li>
                Buka jadwal perawatannya lalu klik <strong>Tandai Selesai</strong>; jadwal
                berikutnya terhitung otomatis.
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'employees',
      title: 'Karyawan & Absensi',
      icon: UserIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Karyawan & Absensi</h2>
          <p className="text-slate-600 dark:text-slate-300">
            (Khusus Admin) Semua data karyawan diatur dari menu <strong>SDM &amp; Aset</strong>.
            Kasir tidak bisa membuka halaman ini.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">Data karyawan</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Profil, cabang, jadwal shift &amp; hari kerja, toleransi terlambat, gaji pokok,
                komisi, dan insentif. Karyawan yang berhenti cukup <strong>dinonaktifkan</strong>;
                datanya tetap tersimpan.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white">Login PIN</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Isi PIN 6 angka di form karyawan agar karyawan bisa masuk sebagai Kasir dengan
                memilih namanya di halaman login. PIN bisa direset atau aksesnya dicabut kapan saja.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700 sm:col-span-2">
              <h3 className="font-bold text-slate-900 dark:text-white">Absensi</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Absensi tercatat otomatis dari login PIN karyawan: jam masuk saat pertama membuka
                aplikasi hari itu, jam pulang saat menekan Keluar (atau aktivitas terakhirnya bila
                lupa). Di menu <strong>Absensi</strong> admin melihat rekapnya, termasuk yang
                terlambat, dan bisa mengoreksi secara manual.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'reports',
      title: 'Laporan',
      icon: ChartBarIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Laporan & Analisis</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Dapatkan wawasan mendalam tentang performa bisnis Anda.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white">Laporan Keuangan</h4>
              <p className="text-xs text-slate-500 mt-1">Pemasukan vs Pengeluaran, Laba Rugi.</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white">Laporan Transaksi</h4>
              <p className="text-xs text-slate-500 mt-1">
                Detail setiap transaksi dalam periode tertentu.
              </p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white">Performa Layanan</h4>
              <p className="text-xs text-slate-500 mt-1">Layanan mana yang paling laris?</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'services',
      title: 'Manajemen Layanan',
      icon: PackageIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Manajemen Layanan</h2>
          <p className="text-slate-600 dark:text-slate-300">
            Atur jenis layanan laundry yang Anda tawarkan (Kiloan, Satuan, Karpet, dll).
          </p>

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
              Menambah Layanan Baru
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                Masuk ke menu <strong>Layanan &amp; Pelanggan &gt; Layanan</strong>.
              </li>
              <li>
                Klik tombol <strong>+ Tambah Layanan</strong>.
              </li>
              <li>Isi Nama Layanan (misal: "Cuci Setrika Reguler").</li>
              <li>
                Pilih <strong>Kategori</strong> (Kiloan, Satuan, Sepatu, Karpet).
              </li>
              <li>
                Tentukan <strong>Harga</strong> per unit.
              </li>
              <li>(Opsional) Isi durasi estimasi pengerjaan.</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: 'expenses',
      title: 'Pengeluaran',
      icon: DollarSignIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Pencatatan Pengeluaran
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Catat semua operasional toko agar Laporan Laba Rugi akurat.
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300">
            <li>
              Catat pembayaran Listrik, Air, dan Sewa Ruko. Biaya yang rutin tiap bulan bisa
              didaftarkan di <strong>Daftar tagihan</strong>.
            </li>
            <li>Catat gaji karyawan.</li>
            <li>Catat pembelian konsumsi atau kebutuhan mendadak lainnya.</li>
          </ul>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-sm text-yellow-800 dark:text-yellow-200 mt-2">
            💡 <strong>Tips:</strong> Pengeluaran untuk pembelian stok (deterjen, dll) sebaiknya
            disertai <strong>Update Stok</strong> di Inventaris agar stok ikut bertambah.
          </div>
        </div>
      ),
    },
    {
      id: 'quick-actions',
      title: 'Tindakan Cepat',
      icon: CommandIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Command Palette (Tindakan Cepat)
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Navigasi super cepat tanpa mouse untuk efisiensi kasir.
          </p>

          <div className="flex items-center gap-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-700">
            <div className="text-center">
              <span className="font-bold text-2xl text-slate-800 dark:text-white">CTRL + K</span>
              <p className="text-xs text-slate-500">Windows</p>
            </div>
            <div className="text-xl text-slate-400">atau</div>
            <div className="text-center">
              <span className="font-bold text-2xl text-slate-800 dark:text-white">CMD + K</span>
              <p className="text-xs text-slate-500">Mac</p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Tekan kombinasi tombol di atas untuk membuka menu pencarian cepat. Anda bisa langsung
            mencari menu, membuat transaksi baru, atau mencari pelanggan.
          </p>
        </div>
      ),
    },
    {
      id: 'settings',
      title: 'Pengaturan & Lainnya',
      icon: SettingsIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Pengaturan Sistem</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" /> Pengaturan Toko
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Ubah Footer WhatsApp dan Pesan Struk di menu <strong>Pengaturan</strong>.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" /> PIN Supervisor
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                (Khusus Admin) PIN 6 angka untuk menyetujui aksi sensitif Kasir. Atur di menu{' '}
                <strong>Pengaturan</strong> dengan konfirmasi password akun.
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HistoryIcon className="w-4 h-4" /> Log Audit
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                (Khusus Admin) Pantau siapa yang menghapus transaksi atau mengubah data sensitif di
                menu <strong>Log Audit</strong>.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'api-integration',
      title: 'Integrasi API',
      icon: BoltIcon,
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Integrasi API (Landing Page)
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Panduan menggunakan API untuk mengecek status pesanan dari website lain (Landing Page).
          </p>

          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">Endpoint</h3>
            <code className="block bg-slate-800 text-white p-3 rounded text-sm overflow-x-auto mb-4">
              GET https://[PROJECT-REF].supabase.co/functions/v1/check-order?invoice=[NO-INVOICE]
            </code>

            <h3 className="font-semibold text-slate-800 dark:text-white mb-2">
              Contoh Request (Javascript)
            </h3>
            <pre className="bg-slate-800 text-slate-300 p-4 rounded text-sm overflow-x-auto font-mono">
              {`async function checkOrderStatus(invoiceNumber) {
  const API_URL = 'https://[PROJECT_REF].supabase.co/functions/v1/check-order';
  
  try {
    const response = await fetch(\`\${API_URL}?invoice=\${invoiceNumber}\`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('Status:', data.status);
      console.log('Total:', data.total);
      return data;
    } else {
      console.error('Error:', data.error);
    }
  } catch (error) {
    console.error('Network Error:', error);
  }
}`}
            </pre>
          </div>
        </div>
      ),
    },
    {
      id: 'electrical-wiring',
      title: 'Wiring & Infrastruktur Listrik',
      icon: BoltIcon,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Wiring & Infrastruktur Listrik
          </h2>
          <p className="text-slate-600 dark:text-slate-300">
            Dokumentasi Master Blueprint (DED) untuk infrastruktur kelistrikan usaha Emak Laundry.
            Desain ini mengutamakan: <strong>Safety & Compliance</strong> (PUIL 2011/2020),{' '}
            <strong>Scalability</strong> (siap upgrade ke 3500VA-5500VA),{' '}
            <strong>Smart Monitoring</strong> (IoT Low-cost), dan <strong>Cost Efficiency</strong>.
          </p>

          {/* Ringkasan Teknis */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              1. Ringkasan Teknis
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Parameter
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Spesifikasi
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Catatan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Sistem Tegangan
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      1 Phase, 2 Wire + PE (220V / 50Hz)
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      Standar PLN Indonesia
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Kapasitas Panel
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Max 32 Ampere (~7000 Watt)
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      Over-spec untuk keamanan jangka panjang
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Earthing System
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      TN-S (Terra Neutral-Separate)
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      Fasa, Netral, dan Ground terpisah
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Target Grounding
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">&lt; 5 Ohm</td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      Wajib untuk proteksi kebocoran arus air
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      Proteksi Manusia
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      RCBO 30mA (High Sensitivity)
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      Trip jika ada sengatan listrik kecil
                    </td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">Proteksi Aset</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      SPD & MCB Separate Group
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-400">
                      Mencegah kerusakan PC/Server
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* BoM - Komponen Panel Utama */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              2. Rencana Anggaran Biaya (BoM)
            </h3>

            <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
              A. Komponen Panel Utama
            </h4>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Nama Barang
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Spesifikasi
                    </th>
                    <th className="px-2 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                      Qty
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Est. Harga
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      Box Panel 18 Modul
                    </td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      Outbow/Inbow, Pintu Transparan
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">1</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 120.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      Main MCB 2-Pole
                    </td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      32A, 4.5kA, Kurva C
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">1</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 55.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">RCBO Slim Type</td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      1P+N, 10A, 30mA
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">3</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 255.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">MCB Heavy Duty</td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      1-Pole, 16A, 4.5kA
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">1</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 35.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">Busbar Sisir</td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      1 Fasa, Tembaga Murni
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">1</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 35.000
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Subtotal A:
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Rp 500.000
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
              B. Kabel & Distribusi Daya
            </h4>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Nama Barang
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Spesifikasi
                    </th>
                    <th className="px-2 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                      Qty
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Est. Harga
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">Kabel Feeder</td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">NYM 3x4mm²</td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">5m</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 175.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      Kabel Distribusi
                    </td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">NYM 3x2.5mm²</td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">
                      30m
                    </td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 540.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      Kabel Wiring Panel
                    </td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">NYAF 6mm²</td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">3m</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 30.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">Stop Kontak</td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      Panasonic/Broco + Inbow Dus
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">6</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 210.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      Steker Heavy Duty
                    </td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      Arde, Broco/Panasonic
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">2</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 30.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">Skun Kabel</td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      Paket Pin + Ring + Heatshrink
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">1</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 50.000
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Subtotal B:
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Rp 1.035.000
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <h4 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2">
              C. Modul Smart Monitoring (IoT)
            </h4>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Nama Barang
                    </th>
                    <th className="px-2 py-2 text-left font-semibold text-slate-700 dark:text-slate-200">
                      Spesifikasi
                    </th>
                    <th className="px-2 py-2 text-center font-semibold text-slate-700 dark:text-slate-200">
                      Qty
                    </th>
                    <th className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Est. Harga
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      Power Meter Sensor
                    </td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      PZEM-004T v3.0 (100A) + CT
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">1</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 85.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      Microcontroller
                    </td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      ESP32 DevKit V1
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">1</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 65.000
                    </td>
                  </tr>
                  <tr>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-300">
                      Casing 3D Print
                    </td>
                    <td className="px-2 py-2 text-slate-500 dark:text-slate-400">
                      Custom Case DIN Rail Mount
                    </td>
                    <td className="px-2 py-2 text-center text-slate-600 dark:text-slate-300">1</td>
                    <td className="px-2 py-2 text-right text-slate-600 dark:text-slate-300">
                      Rp 50.000
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Subtotal C:
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-slate-700 dark:text-slate-200">
                      Rp 200.000
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-200 font-semibold">
                💰 Grand Total Estimasi: Rp 1.735.000,-
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Investasi aset jangka panjang untuk keamanan bisnis dan data. Belum termasuk ongkos
                tukang.
              </p>
            </div>
          </section>

          {/* Wiring Diagram */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              3. Wiring Diagram & Layout Panel
            </h3>
            <pre className="bg-slate-900 text-slate-100 p-4 rounded text-xs overflow-x-auto font-mono leading-relaxed">
              {`[ KABEL DARI KWH METER (NYM 3x4mm) ]
| L (Fasa)  | N (Netral)
v           v
+----------------------------------+
|    MAIN MCB 2-POLE (32A)         | <--- Saklar Induk
+----------------------------------+
|  Out L    |  Out N
    [CT PZEM] ----O     |
    (Kalungkan)   |     +-----------> KE BUSBAR NOL (Biru)
                  |     |
                  +----[Kabel PZEM]--> POWER MONITORING
                  |
+==================================+ <--- BUSBAR SISIR TEMBAGA (Fasa)
|     |     |     |     |
+------+ +------+ +------+ +------+ +------+
| SPD  | | RCBO | | RCBO | | RCBO | | MCB  |
|(Opt) | | 10A  | | 10A  | | 10A  | | 16A  |
+------+ +------+ +------+ +------+ +------+
   |        |        |        |        |
  GND       v        v        v        v
(Ke Rod)  RUMAH   LAUNDRY  LAUNDRY  HEAVY
         (Server) (Mesin   (Mesin  (Vakum)
                  1 & 2)   3 & 4)`}
            </pre>
          </section>

          {/* Catatan Instalasi */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              4. Catatan Kritis Instalasi (SOP)
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  A. Persiapan (Pre-Install)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 ml-2">
                  <li>
                    <strong>Cek Grounding:</strong> Ukur resistansi tanah. Jika &gt;5 Ohm, tambah
                    batang arde.
                  </li>
                  <li>
                    <strong>Balancing Beban:</strong> Tandai kabel keluaran. Pastikan beban terbagi
                    rata di RCBO.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  B. Saat Terminasi Kabel
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 ml-2">
                  <li>
                    <strong>Pengupasan:</strong> Gunakan wire stripper. Jangan sampai tembaga
                    tergores.
                  </li>
                  <li>
                    <strong>Crimping:</strong> Pasang Ferrules (Skun Jarum) pada ujung kabel serabut
                    sebelum masuk MCB.
                  </li>
                  <li>
                    <strong>Torque:</strong> Kencangkan baut terminal, wiggle (goyang) kabel,
                    kencangkan lagi. Ulangi 2x.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">
                  C. Integrasi IoT (PZEM)
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300 ml-2">
                  <li>
                    <strong>Safety Gap:</strong> Beri jarak minimal 1 modul (18mm) antara komponen
                    tegangan tinggi dengan ESP32.
                  </li>
                  <li>
                    <strong>CT Direction:</strong> Pasang CT sensor pada kabel Fasa Utama. Pastikan
                    klip terkunci ("Klik").
                  </li>
                  <li>
                    <strong>Powering ESP32:</strong> Gunakan charger HP bekas, bungkus heatshrink.
                    Output 5V USB ke ESP32.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Scalability Roadmap */}
          <section className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-3">
              5. Skema Pengembangan (Scalability Roadmap)
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold text-blue-900 dark:text-blue-100">
                  Tahap 1 (Sekarang - 2200VA)
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1">
                  <li>• SOP manajemen beban (tidak semua nyala bareng)</li>
                  <li>• Panel sudah siap beban penuh</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                <h4 className="font-bold text-amber-900 dark:text-amber-100">
                  Tahap 2 (Upgrade 3500VA/4400VA)
                </h4>
                <ul className="text-sm text-amber-800 dark:text-amber-200 mt-2 space-y-1">
                  <li>• Panggil PLN ganti MCB Meteran</li>
                  <li>• Panel: Tidak ada perubahan</li>
                  <li>• Semua mesin bisa nyala bersamaan</li>
                </ul>
              </div>

              <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded border border-sky-200 dark:border-sky-800">
                <h4 className="font-bold text-sky-900 dark:text-sky-100">
                  Tahap 3 (Expand - 3 Phase)
                </h4>
                <ul className="text-sm text-sky-800 dark:text-sky-200 mt-2 space-y-1">
                  <li>• Jika mesin &gt;8 unit</li>
                  <li>• Ganti Main MCB jadi 4-Pole</li>
                  <li>• Ganti Busbar Sisir 3 Phase</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      ),
    },
  ];

  const activeContent = sections.find((s) => s.id === activeSection)?.content;

  return (
    <div className="flex flex-col md:flex-row gap-6 min-h-[calc(100vh-120px)]">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden sticky top-6">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5 text-blue-600" />
              Dokumentasi
            </h3>
          </div>
          <nav className="p-2 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <section.icon
                    className={`w-5 h-5 ${activeSection === section.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                  />
                  <span>{section.title}</span>
                </div>
                {activeSection === section.id && (
                  <ChevronRightIcon className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 sm:p-8 min-h-full animate-fadeIn transition-all">
          {activeContent}
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;

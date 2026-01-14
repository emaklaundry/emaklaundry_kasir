import React, { useState } from 'react';
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
              <li>Manajemen Pelanggan & Riwayat Order</li>
              <li>Manajemen Stok & Inventaris</li>
              <li>Laporan Keuangan & Statistik</li>
              <li>Manajemen Banyak Cabang (Multi-Store)</li>
            </ul>
          </div>
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
                <strong>Buat Transaksi Baru</strong>.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-2">
                <li>
                  Pilih <strong>Pelanggan</strong> atau buat pelanggan baru.
                </li>
                <li>
                  Pilih <strong>Layanan</strong> (Kiloan/Satuan) dan masukkan jumlah.
                </li>
                <li>Tambahkan catatan jika ada (misal: "Baju luntur jangan dicampur").</li>
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
                Stok Masuk
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Catat setiap pembelian inventory baru untuk menambah stok.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-red-900 dark:text-red-300 mt-1">
                Stok Keluar
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                Catat pemakaian harian atau barang rusak/hilang.
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
                Dashboard akan menampilkan notifikasi saat jadwal perawatan sudah jatuh tempo.
              </li>
              <li>Klik "Tandai Selesai" di Dashboard setelah perawatan dilakukan.</li>
            </ol>
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
                Masuk ke menu <strong>Manajemen &gt; Layanan</strong>.
              </li>
              <li>
                Klik tombol <strong>+ Tambah Layanan</strong>.
              </li>
              <li>Isi Nama Layanan (misal: "Cuci Setrika Reguler").</li>
              <li>
                Pilih <strong>Kategori</strong> (Kiloan/Satuan).
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
            <li>Catat pembayaran Listrik, Air, dan Sewa Ruko.</li>
            <li>Catat gaji karyawan.</li>
            <li>Catat pembelian konsumsi atau kebutuhan mendadak lainnya.</li>
          </ul>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-sm text-yellow-800 dark:text-yellow-200 mt-2">
            💡 <strong>Tips:</strong> Pengeluaran untuk pembelian stok (deterjen, dll) sebaiknya
            dicatat di menu <strong>Inventaris &gt; Stok Masuk</strong> agar stok otomatis
            bertambah. Menu Pengeluaran ini untuk biaya non-stok.
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
                Ubah Footer WhatsApp, Pesan Struk, dan Tarif Pajak/Diskon Global di menu{' '}
                <strong>Pengaturan</strong>.
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

import { TourKey } from '../contexts/TutorialContextContext';

/**
 * Isi halaman Bantuan. Kelompok (`section`) memakai judul yang sama dengan
 * kelompok menu di sidebar (src/config/navigation.ts), dan urutannya juga sama.
 * Perbarui di sini setiap kali alur aplikasi berubah.
 */
export interface HelpTopic {
  id: string;
  section: string;
  title: string;
  /** Kalimat ringkas di bawah judul. */
  summary: string;
  steps: string[];
  tips?: string[];
  /** Hanya untuk Admin / Super Admin. */
  adminOnly?: boolean;
  /** Halaman terkait, ditampilkan sebagai tautan. */
  link?: { to: string; label: string };
  /** Kata tambahan untuk pencarian. */
  keywords?: string;
}

export interface HelpTour {
  key: TourKey;
  label: string;
  path: string;
  adminOnly?: boolean;
}

export const HELP_TOURS: HelpTour[] = [
  { key: 'dashboard', label: 'Tur Dashboard', path: '/' },
  { key: 'new_transaction', label: 'Tur Transaksi Baru', path: '/transactions/new' },
  { key: 'transaction_list', label: 'Tur Daftar Transaksi', path: '/transactions' },
  { key: 'employees', label: 'Tur Karyawan', path: '/management/employees', adminOnly: true },
];

export const HELP_TOPICS: HelpTopic[] = [
  // --- Operasional Utama -------------------------------------------------------
  {
    id: 'login',
    section: 'Operasional Utama',
    title: 'Masuk ke aplikasi',
    summary: 'Admin masuk dengan email, karyawan masuk dengan nama dan PIN.',
    steps: [
      'Admin dan pengguna berakun email: isi email dan password, lalu tekan Masuk.',
      'Karyawan dengan login PIN: pilih nama Anda di daftar karyawan, ketik PIN 6 angka, lalu tekan Masuk.',
      'Lupa PIN karyawan? Minta Admin mengatur ulang PIN di menu Karyawan.',
    ],
    keywords: 'login masuk password pin akun',
  },
  {
    id: 'dashboard',
    section: 'Operasional Utama',
    title: 'Membaca Dashboard',
    summary: 'Ringkasan hari ini: pendapatan, pesanan aktif, dan transaksi terbaru.',
    steps: [
      'Lihat kartu ringkasan di bagian atas untuk pendapatan dan jumlah pesanan.',
      'Pesanan yang belum lunas atau belum diambil bisa langsung diproses dari daftar transaksi terbaru.',
      'Peringatan stok menipis muncul di Dashboard bila ada bahan di bawah batas minimum.',
    ],
    link: { to: '/', label: 'Buka Dashboard' },
    keywords: 'ringkasan pendapatan omzet beranda',
  },
  {
    id: 'new-transaction',
    section: 'Operasional Utama',
    title: 'Membuat transaksi baru',
    summary: 'Dari memilih layanan sampai pesan WhatsApp ke pelanggan.',
    steps: [
      'Buka Transaksi lalu tekan Transaksi Baru.',
      'Pilih layanan. Untuk kiloan, isi beratnya di keranjang. Untuk satuan, tambahkan catatan per item bila perlu. Untuk karpet (meter), isi panjang dan lebar.',
      'Pilih pelanggan, atau tekan Tambah Pelanggan untuk pelanggan baru.',
      'Isi catatan bila ada permintaan khusus.',
      'Pilih Bayar Nanti, atau Bayar Sekarang lalu pilih metode pembayaran.',
      'Untuk Tunai, isi Uang Diterima. Kembalian dihitung otomatis dari uang diterima dikurangi total.',
      'Tekan Simpan Transaksi, lalu kirim detail pesanan ke pelanggan lewat WhatsApp.',
    ],
    tips: [
      'Total transaksi adalah jumlah harga layanan. Tidak ada diskon, pajak, atau pembulatan.',
      'Super Admin harus memilih cabang tertentu di header sebelum membuat transaksi.',
    ],
    link: { to: '/transactions/new', label: 'Buat transaksi' },
    keywords: 'kasir order pesanan nota kiloan satuan karpet tunai qris transfer kembalian',
  },
  {
    id: 'payment',
    section: 'Operasional Utama',
    title: 'Menerima pembayaran',
    summary: 'Melunasi transaksi yang dibuat dengan Bayar Nanti.',
    steps: [
      'Buka transaksi dari daftar Transaksi atau Dashboard.',
      'Tekan Bayar, lalu pilih Tunai, QRIS, atau Transfer Bank.',
      'Untuk Tunai, isi uang yang diterima; kembalian tampil otomatis.',
      'Untuk QRIS, tunjukkan kode QR yang muncul ke pelanggan (bila QRIS sudah diatur Admin).',
      'Tekan Simpan Pembayaran. Pembayaran harus sebesar sisa tagihan.',
    ],
    keywords: 'bayar lunas pelunasan qris transfer tunai',
  },
  {
    id: 'order-status',
    section: 'Operasional Utama',
    title: 'Menyiapkan dan menyelesaikan pesanan',
    summary: 'Ubah status Diproses → Siap Diambil → Selesai.',
    steps: [
      'Buka detail transaksi.',
      'Tekan Tandai Siap Ambil saat cucian selesai dikerjakan, lalu kabari pelanggan lewat WhatsApp.',
      'Saat pelanggan mengambil, pastikan sudah Lunas, lalu tekan Tandai Selesai.',
    ],
    tips: ['Pesanan tidak bisa diselesaikan sebelum lunas.'],
    keywords: 'status siap ambil selesai diproses pengambilan',
  },
  {
    id: 'receipt',
    section: 'Operasional Utama',
    title: 'Mencetak struk dan mengirim WhatsApp',
    summary: 'Nota bisa dicetak atau dikirim ulang kapan saja.',
    steps: [
      'Buka detail transaksi lalu pilih Struk untuk mencetak.',
      'Pilih WhatsApp untuk mengirim detail pesanan atau kabar siap diambil.',
      'Pesan WhatsApp otomatis memakai footer dari Pengaturan.',
    ],
    keywords: 'struk nota cetak print whatsapp wa kirim',
  },
  {
    id: 'paid-edit',
    section: 'Operasional Utama',
    title: 'Mengubah nota yang sudah lunas',
    summary: 'Hanya Admin yang dapat mengubah pembayaran nota lunas.',
    steps: [
      'Kasir tidak dapat mengubah status, metode, atau jumlah bayar pada transaksi yang sudah Lunas.',
      'Bila ada kesalahan, minta Admin cabang memeriksanya.',
      'Setiap perubahan yang disetujui Admin tercatat di Log Audit.',
    ],
    keywords: 'salah input koreksi lunas pin supervisor',
  },
  {
    id: 'quick-actions',
    section: 'Operasional Utama',
    title: 'Aksi Cepat di ponsel',
    summary: 'Pintasan pekerjaan harian dari menu bawah.',
    steps: [
      'Di ponsel, tekan Aksi Cepat di menu bawah.',
      'Pilih Transaksi Baru, Daftar Transaksi, Update Stok, Catat Pengeluaran, atau Lapor Kerusakan.',
    ],
    link: { to: '/quick-actions', label: 'Buka Aksi Cepat' },
    keywords: 'pintasan shortcut mobile hp',
  },

  // --- Layanan & Pelanggan -----------------------------------------------------
  {
    id: 'customers',
    section: 'Layanan & Pelanggan',
    title: 'Mengelola pelanggan',
    summary: 'Tambah, ubah, cari, dan lihat riwayat pelanggan.',
    steps: [
      'Buka Pelanggan. Gunakan kolom pencarian untuk nama atau nomor HP.',
      'Tekan Tambah Pelanggan untuk pelanggan baru, atau ikon pensil untuk mengubah.',
      'Klik nama pelanggan untuk melihat total belanja dan riwayat transaksinya.',
      'Gunakan Import/Export Excel untuk memindahkan data pelanggan sekaligus.',
    ],
    adminOnly: true,
    link: { to: '/management/customers', label: 'Buka Pelanggan' },
    keywords: 'customer konsumen import export excel',
  },
  {
    id: 'services',
    section: 'Layanan & Pelanggan',
    title: 'Mengatur layanan dan harga',
    summary: 'Daftar layanan yang muncul saat membuat transaksi.',
    steps: [
      'Buka Layanan lalu tekan Tambah Layanan.',
      'Isi nama, kategori (Kiloan, Satuan, Sepatu, Karpet), harga, satuan, dan durasi pengerjaan.',
      'Durasi dipakai untuk menghitung estimasi selesai di nota.',
    ],
    adminOnly: true,
    link: { to: '/management/services', label: 'Buka Layanan' },
    keywords: 'harga tarif kiloan satuan karpet sepatu durasi',
  },
  {
    id: 'inventory',
    section: 'Layanan & Pelanggan',
    title: 'Mengelola stok bahan',
    summary: 'Deterjen, parfum, plastik, dan bahan lain.',
    steps: [
      'Buka Inventaris untuk melihat stok setiap bahan.',
      'Atur batas stok minimum; bahan di bawah batas ditandai stok menipis.',
      'Tambah stok setelah belanja lewat Aksi Cepat → Update Stok, atau edit barangnya di Inventaris. Tekan Opname untuk mencocokkan hitungan fisik.',
      'Tekan Resep untuk mengatur pemakaian bahan per layanan, agar stok terpotong otomatis setiap ada transaksi.',
    ],
    adminOnly: true,
    link: { to: '/management/inventory', label: 'Buka Inventaris' },
    keywords: 'stok bahan deterjen parfum opname resep menipis',
  },
  {
    id: 'expenses',
    section: 'Layanan & Pelanggan',
    title: 'Mencatat pengeluaran',
    summary: 'Belanja harian dan biaya rutin bulanan.',
    steps: [
      'Buka Pengeluaran lalu tekan Tambah Pengeluaran.',
      'Isi tanggal, keterangan, kategori, dan jumlah.',
      'Untuk biaya tetap seperti sewa atau listrik, tekan Tambah tagihan di bagian Daftar tagihan agar tercatat sebagai tagihan bulanan.',
    ],
    adminOnly: true,
    link: { to: '/management/expenses', label: 'Buka Pengeluaran' },
    keywords: 'biaya belanja sewa listrik rutin bulanan',
  },

  // --- SDM & Aset -------------------------------------------------------------
  {
    id: 'employees',
    section: 'SDM & Aset',
    title: 'Mengelola karyawan',
    summary: 'Profil, penempatan cabang, jadwal, gaji, dan akun login karyawan.',
    steps: [
      'Buka Karyawan lalu tekan Tambah Karyawan (atau Import dari Pengguna untuk mengambil nama dari akun yang sudah ada).',
      'Profil: isi nama lengkap, nomor HP, posisi, alamat, dan tanggal mulai bekerja.',
      'Penempatan & status: pilih cabang (Super Admin) dan pastikan Karyawan aktif tercentang.',
      'Jadwal & absensi: atur jam masuk, jam pulang, hari kerja, dan toleransi terlambat.',
      'Kompensasi: isi gaji pokok per bulan, komisi (%), dan insentif per bulan.',
      'Akun login: isi PIN 6 angka agar karyawan bisa masuk sebagai Kasir. Untuk lupa PIN, isi PIN baru (reset). Tekan Cabut akses login bila perlu.',
      'Karyawan yang berhenti: tekan Nonaktifkan. Login-nya ditutup, data dan riwayatnya tetap tersimpan.',
      'Gunakan pencarian, filter status (Aktif/Nonaktif/Semua), dan filter cabang untuk menemukan karyawan.',
    ],
    tips: ['Menu Karyawan hanya untuk Admin dan Super Admin.'],
    adminOnly: true,
    link: { to: '/management/employees', label: 'Buka Karyawan' },
    keywords: 'karyawan pegawai staf gaji komisi shift jadwal pin login resign nonaktif',
  },
  {
    id: 'attendance',
    section: 'SDM & Aset',
    title: 'Mencatat absensi',
    summary: 'Jam masuk dan pulang karyawan setiap hari.',
    steps: [
      'Buka Absensi dan pilih tanggal.',
      'Tekan Masuk saat karyawan datang dan Pulang saat karyawan selesai bekerja.',
    ],
    adminOnly: true,
    link: { to: '/management/attendance', label: 'Buka Absensi' },
    keywords: 'absen hadir masuk pulang kehadiran',
  },
  {
    id: 'assets',
    section: 'SDM & Aset',
    title: 'Aset dan jadwal perawatan',
    summary: 'Mesin cuci, pengering, dan peralatan lain.',
    steps: [
      'Buka Aset & Pemeliharaan lalu tambahkan aset beserta tanggal beli dan biayanya.',
      'Buat jadwal perawatan berkala (misalnya tiap 3 bulan).',
      'Saat perawatan dikerjakan, buka jadwalnya lalu tekan Tandai Selesai; jadwal berikutnya terhitung otomatis.',
    ],
    adminOnly: true,
    link: { to: '/management/assets', label: 'Buka Aset' },
    keywords: 'mesin cuci pengering servis perawatan kerusakan',
  },

  // --- Laporan & Analisis ---------------------------------------------------------
  {
    id: 'reports',
    section: 'Laporan & Analisis',
    title: 'Membaca laporan',
    summary: 'Pendapatan, pengeluaran, laba, dan performa kasir.',
    steps: [
      'Buka Laporan dan pilih rentang tanggal.',
      'Lihat pendapatan, pengeluaran, laba bersih, layanan terlaris, dan performa kasir.',
      'Tekan Cetak untuk mencetak atau menyimpan laporan sebagai PDF.',
    ],
    adminOnly: true,
    link: { to: '/reports', label: 'Buka Laporan' },
    keywords: 'laporan omzet laba keuntungan cetak pdf',
  },
  {
    id: 'calculator',
    section: 'Laporan & Analisis',
    title: 'Kalkulator Bisnis',
    summary: 'Proyeksi omzet, biaya, dan profit bulanan.',
    steps: [
      'Buka Kalkulator Bisnis.',
      'Isi modal investasi, target dan harga per layanan (kiloan, satuan, sepatu, karpet), serta biaya gaji, sewa, dan HPP.',
      'Lihat Ringkasan Profit: total omzet, total pengeluaran, dan net profit margin per bulan.',
    ],
    link: { to: '/business/calculator', label: 'Buka Kalkulator' },
    keywords: 'hpp modal harga jual bep impas',
  },

  // --- Sistem & Keamanan --------------------------------------------------------
  {
    id: 'users',
    section: 'Sistem & Keamanan',
    title: 'Mengelola akun pengguna',
    summary: 'Akun email untuk Admin dan Kasir.',
    steps: [
      'Buka Pengguna lalu tekan Tambah Pengguna.',
      'Isi nama, email, password awal (minimal 8 karakter), peran, dan cabang.',
      'Nonaktifkan akun yang tidak dipakai lagi agar tidak bisa masuk.',
    ],
    adminOnly: true,
    link: { to: '/management/users', label: 'Buka Pengguna' },
    keywords: 'akun user peran role admin kasir email',
  },
  {
    id: 'settings',
    section: 'Sistem & Keamanan',
    title: 'Pengaturan toko',
    summary: 'Pesan struk, footer WhatsApp, QRIS, dan lokasi toko.',
    steps: [
      'Buka Pengaturan.',
      'Ubah Pesan Struk dan Footer WhatsApp sesuai kebutuhan.',
      'Tempel kode QRIS statis toko agar QRIS dinamis muncul saat pembayaran.',
      'Isi koordinat lokasi toko untuk fitur cuaca.',
      'Tekan Simpan.',
    ],
    adminOnly: true,
    link: { to: '/settings', label: 'Buka Pengaturan' },
    keywords: 'pengaturan struk whatsapp qris lokasi',
  },
  {
    id: 'supervisor-pin',
    section: 'Sistem & Keamanan',
    title: 'PIN Supervisor',
    summary: 'PIN Admin untuk menyetujui aksi sensitif Kasir.',
    steps: [
      'Buka Pengaturan, lalu bagian PIN Supervisor.',
      'Isi PIN 6 angka, ulangi PIN, lalu masukkan password akun Anda untuk konfirmasi.',
      'Jangan bagikan PIN ke Kasir. Setiap persetujuan tercatat atas nama Anda di Log Audit.',
    ],
    tips: ['PIN yang mudah ditebak seperti 123456 atau 000000 akan ditolak.'],
    adminOnly: true,
    link: { to: '/settings', label: 'Atur PIN' },
    keywords: 'pin supervisor otorisasi persetujuan keamanan',
  },
  {
    id: 'audit-log',
    section: 'Sistem & Keamanan',
    title: 'Log Audit',
    summary: 'Siapa melakukan apa, dan kapan.',
    steps: [
      'Buka Log Audit untuk melihat riwayat aktivitas: login, transaksi, perubahan data.',
      'Gunakan pencarian untuk menemukan aktivitas tertentu.',
    ],
    adminOnly: true,
    link: { to: '/audit-log', label: 'Buka Log Audit' },
    keywords: 'riwayat aktivitas log jejak',
  },
  {
    id: 'backup',
    section: 'Sistem & Keamanan',
    title: 'Backup dan restore data',
    summary: 'Simpan cadangan seluruh data ke file.',
    steps: [
      'Buka Backup & Restore lalu tekan Download Full Backup untuk mengunduh semua data.',
      'Simpan file di tempat aman, misalnya Google Drive.',
      'Untuk memulihkan, pilih file backup lalu tekan Restore Sekarang.',
    ],
    tips: ['Lakukan backup rutin, minimal seminggu sekali.'],
    adminOnly: true,
    link: { to: '/management/backup', label: 'Buka Backup' },
    keywords: 'cadangan backup restore excel pulihkan',
  },

  // --- Bantuan & Panduan --------------------------------------------------------
  {
    id: 'guides',
    section: 'Bantuan & Panduan',
    title: 'SOP, Panduan Bisnis, dan Dokumentasi',
    summary: 'Bacaan lengkap untuk prosedur kerja dan pengembangan usaha.',
    steps: [
      'SOP (Prosedur) berisi langkah kerja standar di toko (khusus Admin).',
      'Panduan Bisnis berisi tips mengelola dan mengembangkan laundry.',
      'Dokumentasi berisi penjelasan teknis aplikasi dan perawatan mesin.',
    ],
    link: { to: '/docs', label: 'Buka Dokumentasi' },
    keywords: 'sop prosedur panduan dokumentasi',
  },
  {
    id: 'account',
    section: 'Bantuan & Panduan',
    title: 'Akun, tampilan, dan koneksi',
    summary: 'Ganti password, mode gelap, dan status online.',
    steps: [
      'Tekan ikon kunci di header untuk mengganti password.',
      'Tekan ikon bulan/matahari untuk beralih ke mode gelap atau terang.',
      'Tanda Online/Offline di header menunjukkan koneksi. Saat Offline, transaksi tidak bisa disimpan; tunggu sampai Online.',
    ],
    keywords: 'password ganti mode gelap dark offline online internet',
  },
];

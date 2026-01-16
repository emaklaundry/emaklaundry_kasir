import { Step } from 'react-joyride';

export const dashboardSteps: Step[] = [
  {
    target: 'body',
    content: 'Selamat datang di Emak Laundry POS! Ini adalah tur singkat untuk membantu Anda memulai.',
    placement: 'center',
  },
  {
    target: '#dashboard-stats',
    content: 'Di sini Anda dapat melihat ringkasan performa laundry Anda hari ini.',
  },
  {
    target: '#dashboard-chart',
    content: 'Grafik ini menunjukkan tren pendapatan Anda dalam 7 hari terakhir.',
  },
  {
    target: '#dashboard-recent',
    content: 'Daftar transaksi terbaru akan muncul di sini untuk akses cepat.',
  },
];

export const newTransactionSteps: Step[] = [
  {
    target: '#service-selector',
    content: 'Mulai dengan memilih layanan laundry di sini (Kiloan atau Satuan).',
  },
  {
    target: '#customer-selector',
    content: 'Cari pelanggan yang sudah ada atau tambahkan pelanggan baru di sini.',
  },
  {
    target: '#transaction-items',
    content: 'Item yang dipilih akan muncul di tabel ini. Anda bisa mengubah jumlah atau menambahkan detail.',
  },
  {
    target: '#notes-section',
    content: 'Tambahkan catatan khusus untuk laundry ini jika diperlukan.',
  },
  {
    target: '#payment-section',
    content: 'Lihat total tagihan, berikan diskon, dan proses pembayaran di sini.',
  },
];

export const transactionListSteps: Step[] = [
  {
    target: '#transaction-actions',
    content: 'Gunakan tombol ini untuk ekspor data, import data, atau membuat transaksi baru.',
  },
  {
    target: '#transaction-filters',
    content: 'Filter transaksi berdasarkan nama, tanggal, atau status pembayaran di sini.',
  },
  {
    target: '#transaction-table',
    content: 'Daftar semua transaksi Anda muncul di sini. Klik ID untuk melihat detail.',
  },
];

export const employeesSteps: Step[] = [
  {
    target: '#employees-header',
    content: 'Halaman ini untuk mengelola data karyawan, gaji, dan komisi.',
    disableBeacon: true,
  },
  {
    target: '#employees-import-btn',
    content: 'Fitur Baru! Anda bisa mengimport data dari pengguna (User) yang sudah ada agar tidak perlu mengetik ulang.',
  },
  {
    target: '#employees-add-btn',
    content: 'Atau tambah karyawan secara manual dengan mengisi form lengkap.',
  },
  {
    target: '#employees-list',
    content: 'Daftar karyawan aktif beserta status dan kinerjanya akan muncul di sini.',
  },
];

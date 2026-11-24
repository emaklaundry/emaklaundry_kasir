# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Kasir dan admin laundry, termasuk pengelola multi-cabang.

## Product Purpose

Sistem manajemen laundry berbasis web untuk mendukung transaksi kasir dan operasional admin, termasuk pengelolaan cabang, pelanggan, layanan, inventaris, aset, dan laporan.

## Positioning

Belum ditentukan. Jangan membuat klaim pembeda atau positioning pemasaran tanpa konfirmasi.

## Operating Context

- Kasir membuat dan mengelola transaksi kiloan maupun satuan, termasuk layanan karpet dan sepatu.
- Admin mengelola pelanggan, layanan, inventaris, aset dan perawatan, pengeluaran, pengguna, karyawan, absensi, SOP, pengaturan, backup, dan audit log.
- Super Admin memiliki alur pengelolaan cabang.
- Aplikasi ditujukan untuk operasi multi-cabang dan memiliki antarmuka responsif serta kemampuan PWA.

## Capabilities and Constraints

- Fitur yang ada mencakup saldo diskon pelanggan, laporan keuangan dan performa, ekspor Excel, pembayaran QRIS dinamis, serta pengelolaan aset dan jadwal perawatan.
- Implementasi menggunakan React, TypeScript, Vite, Tailwind CSS, dan Supabase. Data cabang dan akses peran merupakan bagian dari model produk.
- TypeScript dan build frontend saat ini menargetkan ES2024. Kebijakan dukungan browser di luar kebutuhan fitur ES2024 belum ditentukan.
- Positioning, kebijakan dukungan browser yang lebih spesifik, dan batasan produk tambahan belum dikonfirmasi.

## Brand Commitments

- Nama produk yang digunakan adalah Emak Laundry.
- Pertahankan logo dan aset identitas yang sudah ada kecuali pengguna meminta perubahan. Belum ada panduan suara merek yang ditetapkan.

## Evidence on Hand

- Implementasi aplikasi dan alur berdasarkan role di `src/App.tsx`.
- Dokumentasi fitur di `README.md` dan halaman operasional yang tercantum dalam routing aplikasi.
- Aset logo/favikon di `public/` dan aset QRIS di `public/Kode QRIS Emak Laundry.png`.
- Belum ada positioning unik atau bukti pemasaran seperti testimoni dan benchmark yang dikonfirmasi; jangan mengarangnya.

## Product Principles

- Jaga ketepatan transaksi dan laporan keuangan.
- Pertahankan pemisahan akses dan data sesuai cabang serta peran.
- Dukung alur kerja operasional laundry di perangkat mobile.

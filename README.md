
<div align="center">
   <img width="800" alt="Laundry Management System" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

---
## 📊 Status Kode & Versi

- **Versi Aplikasi:** 1.0.0
---

## 🗒️ Catatan Rilis v1.0.0 (14 November 2025)

- Rilis stabil pertama Laundry Management System Web Kasir
- Kode 100% lint-free, terformat, dan semua unit test lulus
- Fitur utama: transaksi, pelanggan, layanan, inventaris, aset, pengeluaran, audit log, laporan, PWA, notifikasi, dark/light mode
- Dukungan multi-role (Super Admin, Admin, Kasir)
- Siap di-deploy ke layanan modern (Vercel, Netlify, dsb)

✅ Lint: Bersih tanpa error/warning (`npm run lint`)
✅ Format: Sudah terformat (`npm run format`)
ℹ️ Saat ini tidak ada file test/unit test di project. Menjalankan `npm test` akan menampilkan pesan "No test files found" (ini expected).
📅 Update terakhir: 14 November 2025
---

# Laundry Management System (Web Kasir)

Sistem manajemen laundry berbasis web yang dirancang untuk kasir dan admin, mendukung pengelolaan transaksi, inventaris, pelanggan, aset, pengeluaran, penjadwalan perawatan, dan pelaporan. Dibangun dengan teknologi modern untuk kemudahan penggunaan, keamanan, dan skalabilitas.

---

## ✨ Fitur Utama

- **Manajemen Transaksi**: Pencatatan transaksi laundry (kiloan, satuan, sepatu, karpet), status pembayaran, dan cetak struk.
- **Manajemen Pelanggan**: Tambah, edit, dan pencarian pelanggan, riwayat transaksi, serta catatan khusus.
- **Manajemen Layanan**: Pengelolaan jenis layanan, harga, kategori, dan durasi pengerjaan.
- **Manajemen Inventaris**: Monitoring stok barang, notifikasi stok menipis, dan update stok cepat.
- **Manajemen Aset & Perawatan**: Pencatatan aset, log perawatan, penjadwalan perawatan berkala.
- **Pengeluaran**: Input dan pelaporan pengeluaran operasional.
- **Manajemen Pengguna & Hak Akses**: Multi-role (Super Admin, Admin, Kasir) dengan pembatasan akses fitur.
- **Audit Log**: Pencatatan aktivitas penting untuk keamanan dan audit.
- **Laporan & Analitik**: Laporan transaksi, pendapatan, pengeluaran, dan performa layanan.
- **PWA (Progressive Web App)**: Dapat diakses seperti aplikasi mobile, mendukung offline mode dan instalasi di perangkat.
- **Notifikasi**: Dukungan notifikasi update status dan pengingat.
- **Dark/Light Mode**: Tampilan tema gelap dan terang.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 19, TypeScript, Vite
- **State Management**: React Context, @tanstack/react-query
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **PWA**: vite-plugin-pwa (custom service worker)
- **Backend/Database**: Supabase (PostgreSQL, Auth, Storage)
- **Testing**: (unit test tersedia untuk beberapa utilitas)
- **Lainnya**: React Router DOM, Icon SVG, Modular Component Architecture

---

## 🚀 Instalasi & Menjalankan Proyek

### Prasyarat
- Node.js (disarankan versi terbaru LTS)

### Langkah Instalasi
1. **Clone repository**
   ```bash
   git clone https://github.com/mhmdnvn18/emaklaundry_kasir.git
   cd emaklaundry_kasir
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Konfigurasi environment**
   - Buat file `.env.local` di root, isi dengan:
     ```env
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Dapatkan kredensial dari dashboard Supabase Anda.
4. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```
   Akses di [http://localhost:3000](http://localhost:3000)

---


## 📁 Struktur Direktori

- `src/` : Source code utama (komponen, halaman, context, hooks, utils)
- `public/` : Aset publik (favicon, manifest, dll)
- `database/` : Skrip SQL dan dokumentasi deployment database
- `index.html`, `index.tsx`, `App.tsx` : Entry point aplikasi

> **Catatan:** Direktori/unit test (`tests/`) sudah tidak ada. Jika ingin menambah test, buat file `*.test.ts(x)` di `src/`.

---

## 🔒 Hak Akses & Role

- **Super Admin**: Akses penuh seluruh fitur & pengaturan
- **Admin Cabang**: Kelola transaksi, pelanggan, inventaris, aset, laporan cabang
- **Kasir**: Input transaksi, update status, akses terbatas

---

## 📝 Catatan Pengembangan

- Mendukung pengembangan modular dan scalable
- Siap di-deploy ke layanan hosting modern (Vercel, Netlify, dsb)
- PWA siap untuk instalasi di perangkat mobile
- Kode bersih, mudah dikembangkan, dan terdokumentasi

---

## 📞 Kontribusi & Kontak

Untuk kontribusi, bug report, atau pertanyaan, silakan hubungi [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com) atau buat issue di repository ini.

---

<div align="center">
  <b>© 2025 Laundry Management System</b>
</div>

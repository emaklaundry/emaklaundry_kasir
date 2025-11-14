git push origin main
<div align="center">
  <img width="800" alt="Laundry Management System" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

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
- `tests/` : Unit test
- `index.html`, `index.tsx`, `App.tsx` : Entry point aplikasi

---

## 🔒 Hak Akses & Role

- **Super Admin**: Akses penuh seluruh fitur & pengaturan
- **Admin Cabang**: Kelola transaksi, pelanggan, inventaris, aset, laporan cabang
- **Kasir**: Input transaksi, update status, akses terbatas

---


## 📝 Catatan Pengembangan & Perubahan Terbaru

- Mendukung pengembangan modular dan scalable
- Siap di-deploy ke layanan hosting modern (Vercel, Netlify, dsb)
- PWA siap untuk instalasi di perangkat mobile
- Kode bersih, mudah dikembangkan, dan terdokumentasi

### Pembaruan Terbaru

- **Input Berat Kiloan**: Sekarang mendukung input hingga 2 angka desimal (misal: 1,25 kg).
- **Field Diskon, Jumlah Bayar, Uang Diterima**: Dapat dikosongkan (tidak otomatis terisi 0), lebih fleksibel untuk kasir.
- **Invoice WhatsApp**: ID invoice pada pesan WhatsApp kini otomatis dipendekkan (6 karakter terakhir, huruf besar).
- **Format Nomor WhatsApp**: Nomor HP pelanggan otomatis diformat ke awalan 62 jika dimulai dari 0.

---

## 📞 Kontribusi & Kontak

Untuk kontribusi, bug report, atau pertanyaan, silakan hubungi [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com) atau buat issue di repository ini.

---

<div align="center">
  <b>© 2025 Laundry Management System</b>
</div>

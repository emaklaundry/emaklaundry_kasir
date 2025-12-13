---
---

# Laundry Management System (Web Kasir)

**Versi:** 1.3.0  
**Update terakhir:** 11 Desember 2025

---

Sistem manajemen laundry berbasis web untuk kasir dan admin. Mendukung transaksi, inventaris, pelanggan, aset, pengeluaran, penjadwalan perawatan, pelaporan, backup database otomatis/manual, dan kini siap multi-cabang (multi-tenant) dengan performa dan keamanan optimal.

---

## ✨ Fitur Utama

- Manajemen transaksi laundry (kiloan, satuan, sepatu, karpet) & invoice pendek
- Manajemen pelanggan, layanan, inventaris, aset, pengeluaran
- Multi-cabang: Pengaturan, transaksi, dan laporan per store/cabang
- Multi-role: Super Admin, Admin, Kasir
- Audit log, laporan, analitik
- PWA: offline mode, installable
- Notifikasi, dark/light mode
- Backup database otomatis/manual (Supabase)
- Pengujian otomatis per-file (Vitest, Testing Library)
- Penanganan tanggal aset dan pengeluaran sudah timezone-safe (lokal, bukan UTC/ISO)

---

## 🛠️ Teknologi

- **Frontend:** React 19, TypeScript, Vite
- **State:** React Context, React Query
- **Styling:** Tailwind CSS

---

## 🚀 Backup Database

Jalankan perintah berikut di PowerShell:

### Backup Data Saja (Data Only)
```powershell
supabase db dump --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" --data-only -f database/backup/data.sql
```
Output: `database/backup/data.sql`

### Backup Lengkap (Schema + Data)
```powershell
supabase db dump --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" -f database/backup/full_backup.sql
```
Output: `database/backup/full_backup.sql`

---

 
## 🔄 Backup Otomatis (GitHub Actions)

Backup otomatis harian ke folder `database/backup/` via GitHub Actions. Lihat `.github/workflows/backup.yml` dan tambahkan secret `SUPABASE_DB_URL` di GitHub Settings. Hasil backup dapat diunduh dari tab Actions.

---

## 📁 Struktur Direktori

- `src/` : Source code utama (komponen, halaman, context, hooks, utils)
- `public/` : Aset publik (favicon, manifest, dll)
- `database/` : Skrip SQL dan dokumentasi deployment database
- `index.html`, `index.tsx`, `App.tsx` : Entry point aplikasi

---

## 🔒 Hak Akses & Role

- **Super Admin**: Akses penuh seluruh fitur & pengaturan
- **Admin Cabang**: Kelola transaksi, pelanggan, inventaris, aset, laporan cabang
- **Kasir**: Input transaksi, update status, akses terbatas

---

## 📝 Catatan Pengembangan & Perubahan Terbaru

- Modular & scalable, siap deploy ke Vercel/Netlify
- PWA siap instalasi mobile
- Kode bersih, mudah dikembangkan, terdokumentasi
- **Versioning Otomatis**: Versi aplikasi tampil di seluruh halaman utama/login, mengikuti `package.json`
- Penanganan tanggal aset & pengeluaran sudah timezone-safe (lokal, bukan UTC/ISO)
- Semua pengujian, lint, dan format lolos tanpa error

---


## 📝 Catatan Rilis (Changelog)

### v1.3.0 - 11 Desember 2025
- Peningkatan versi aplikasi.
- [Tambahkan highlight perubahan terbaru di sini jika ada]

### v1.2.0 - 2 Desember 2025
- Tingkatkan versi aplikasi.
- Perbaikan bug, pembaruan dependensi, dan peningkatan stabilitas.

### v1.1.9 - 2 Desember 2025
- [Fix] Penanganan tanggal aset dan pengeluaran sudah timezone-safe (lokal, bukan UTC/ISO)
- [Fix] Semua error lint/TypeScript (no-unused-vars, null checks) sudah diperbaiki
- [Docs] README diperbarui, lebih ringkas dan up-to-date
- [Test] Semua pengujian, lint, dan format lolos tanpa error

### v1.1.8 - 1 Desember 2025
- [Security] Database siap multi-cabang: kolom dan index storeId di semua tabel utama
- [Security] Trigger handle_new_user otomatis untuk fail-safe RLS
- [Fix] Semua perintah CREATE INDEX dan ALTER PUBLICATION sudah diurutkan setelah seluruh CREATE TABLE (tidak ada lagi error "relation does not exist")
- [Fix] Duplikasi CREATE TABLE (customers) dihilangkan (tidak ada lagi error "relation already exists")
- [Docs] Update README, dokumentasi best practice production-ready
- [Test] Semua pengujian, lint, dan format lolos tanpa error

---

## 📞 Kontribusi & Kontak

Untuk kontribusi, bug report, atau pertanyaan, silakan hubungi [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com) atau buat issue di repository ini.

---

## 🎨 Standar UI Design System

### Color Palette

#### Primary Colors
- **Blue (Primary)**: bg-blue-600 hover:bg-blue-700
- **Green (Success)**: bg-green-600 hover:bg-green-700
- **Red (Danger)**: bg-red-600 hover:bg-red-700
- **Yellow (Warning)**: bg-yellow-500 hover:bg-yellow-600
- **Slate (Secondary)**: bg-white border-slate-300 hover:bg-slate-100

#### Dark Mode
- **Primary Dark**: dark:bg-blue-700 dark:hover:bg-blue-600
- **Card Dark**: dark:bg-slate-800
- **Text Dark**: dark:text-white

### Button Styles

1. **Primary Button** (Simpan, Submit): `bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-6 py-3 text-lg`
2. **Secondary Button** (Batal): `bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600`
3. **Success Button** (Bayar): `bg-green-600 hover:bg-green-700 text-white`
4. **Danger Button** (Hapus): `bg-red-600 hover:bg-red-700 text-white`

### Card/Container
- **Main Container**: `bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md`
- **Table Header**: `bg-slate-50 dark:bg-slate-700 text-sm uppercase`

### Input Styles
- **Text Input**: `bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-base rounded-lg p-3`
- **Checkbox**: `w-5 h-5 text-blue-600 bg-slate-100 rounded`

---

## 📱 Optimasi Mobile

### Fitur Optimasi Mobile
- ✅ **Responsive Layout**: Grid adaptif (1 kolom mobile, 2 tablet, 4 desktop)
- ✅ **Touch Targets**: Minimum 44x44px untuk semua elemen interaktif
- ✅ **Font Responsif**: `text-sm sm:text-base md:text-lg`
- ✅ **Bottom Navigation**: Fixed navbar di mobile dengan akses cepat
- ✅ **Table Overflow**: Scroll horizontal untuk tabel di mobile
- ✅ **Prevent Zoom iOS**: Input font-size 16px minimum

### Meta Tags Mobile
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### Breakpoints
- **sm**: 640px (Mobile landscape)
- **md**: 768px (Tablet)
- **lg**: 1024px (Desktop)
- **xl**: 1280px (Large desktop)

### Komponen Responsif
1. **Header**: Padding `p-2 sm:p-4`, Font `text-lg sm:text-2xl md:text-3xl`
2. **Dashboard Cards**: Padding `p-4 sm:p-6`, Grid responsif
3. **Tabel**: Font `text-sm sm:text-base`, Padding cell responsif
4. **Modal**: Max-height 95vh, rounded adaptif
5. **Bottom Nav**: Tampil di mobile (`sm:hidden`), 5 menu utama

---

## ⚠️ Catatan Keamanan & Dependency

- Ekspor Excel menggunakan library `exceljs` (migrasi dari `xlsx` untuk alasan keamanan).
- Selalu cek update dependency secara berkala dan lakukan audit dengan `npm audit`.

---
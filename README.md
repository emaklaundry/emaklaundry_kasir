---
---

# Laundry Management System (Web Kasir)

**Versi:** 1.1.9  
**Update terakhir:** 2 Desember 2025

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


---

## ⚠️ Catatan Keamanan & Dependency

- Ekspor Excel menggunakan library `xlsx`. Terdapat 1 high severity vulnerability pada versi terbaru (per 2 Desember 2025), namun **tidak ada perbaikan resmi** dari maintainer. Selama hanya digunakan untuk ekspor data lokal (bukan upload file dari user), risiko sangat minimal.
- Selalu cek update dependency secara berkala dan lakukan audit dengan `npm audit`.

---

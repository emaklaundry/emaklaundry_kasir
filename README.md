---
---

# Laundry Management System (Web Kasir)

**Versi:** 1.1.7  
**Update terakhir:** 1 Desember 2025

---

Sistem manajemen laundry berbasis web untuk kasir dan admin. Mendukung transaksi, inventaris, pelanggan, aset, pengeluaran, penjadwalan perawatan, pelaporan, dan backup database otomatis/manual.

---

## ✨ Fitur Utama

- Manajemen transaksi laundry (kiloan, satuan, sepatu, karpet) & invoice pendek
- Manajemen pelanggan, layanan, inventaris, aset, pengeluaran
- Multi-role: Super Admin, Admin, Kasir
- Audit log, laporan, analitik
- PWA: offline mode, installable
- Notifikasi, dark/light mode
- Backup database otomatis/manual (Supabase)
- Pengujian otomatis per-file (Vitest, Testing Library)

---

## 🛠️ Teknologi

- **Frontend:** React 19, TypeScript, Vite
- **State:** React Context, React Query
- **Styling:** Tailwind CSS

- **URL Encoding Password:** Jika password database mengandung karakter spesial (seperti #), karakter tersebut wajib diganti dengan kode URL.
  - Contoh: `#` menjadi `%23`
  - Password: `#Password123` → `%23Password123`
- **Gunakan Session Pooler URL:** Jangan gunakan URL `db.project.supabase.co` (Direct Connection) karena sering bermasalah dengan resolusi DNS di dalam Docker Container. Gunakan URL Session Pooler (biasanya berakhiran `.pooler.supabase.com`).
- **Port:** 5432 (Session Mode) atau 6543 (Transaction Mode). Gunakan 5432 untuk pg_dump.

---

## 🚀 Perintah Backup

Jalankan perintah berikut di PowerShell.

### 1. Backup Data Saja (Data Only)

Gunakan ini jika Anda sudah memiliki struktur tabel (Schema) dan hanya ingin mem-backup isi datanya (baris-baris tabel).

```powershell
supabase db dump --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" --data-only -f database/backup/data.sql
```

Output: File `database/backup/backup_schema.sql`.

### 2. Backup Lengkap (Schema + Data)

Gunakan ini untuk snapshot penuh database.

```powershell
supabase db dump --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" -f database/backup/full_backup.sql
```

Output: File `database/backup/full_backup.sql`.

---

## 🔄 Backup Otomatis Database Supabase (GitHub Actions)

Mulai v1.1.3, aplikasi ini mendukung backup otomatis database Supabase menggunakan GitHub Actions. Backup berjalan harian dan hasilnya akan otomatis disimpan di folder `backup/` (bisa diunduh dari tab Actions di GitHub).

**Cara setup:**

1. Pastikan file `.github/workflows/backup.yml` sudah ada (lihat repo ini).
2. Di GitHub, buka Settings > Secrets and variables > Actions, lalu tambahkan secret baru:
   - **Name:** `SUPABASE_DB_URL`
   - **Value:** (isi dengan connection string Supabase Anda, format postgresql://...)
3. Workflow akan berjalan otomatis setiap hari. Hasil backup akan berada di folder `database/backup/` dan dapat diunduh di tab Actions > run yang sukses > Artifacts.

Contoh isi file workflow (backup otomatis ke folder `database/backup/`):

```yaml
name: Daily Supabase Backup
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install PostgreSQL Client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      - name: Create backup folder
        run: mkdir -p database/backup
      - name: Backup Database
        run: |
          pg_dump "${{ secrets.SUPABASE_DB_URL }}" -f database/backup/backup_$(date +%Y-%m-%d).sql
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: db-backup
          path: database/backup/*.sql
          retention-days: 7
```

> **Tips:** Connection string bisa didapat dari dashboard Supabase > Database > Connection Pooling/Settings. Jangan bagikan secret ke publik.

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
- **Versioning Otomatis**: Versi aplikasi akan selalu tampil di seluruh halaman utama dan halaman login, mengikuti versi di `package.json`.

---

## 📝 Catatan Rilis (Changelog)

### v1.1.5 - 1 Desember 2025

- [Release] Peningkatan versi aplikasi ke 1.1.5.
- [Docs] Update README, status pengujian, dan coverage terbaru (Desember 2025).
- [Test] Seluruh pengujian per-file, coverage >85%, dan tidak ada lagi error context/mocking.

### v1.1.4 - 30 November 2025

- **Admin Cabang**: Kelola transaksi, pelanggan, inventaris, aset, laporan cabang
- **Kasir**: Input transaksi, update status, akses terbatas

---

## 📞 Kontribusi & Kontak

Untuk kontribusi, bug report, atau pertanyaan, silakan hubungi [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com) atau buat issue di repository ini.

---

## 🧪 Pengujian Otomatis

Aplikasi ini dilengkapi dengan unit test menggunakan Vitest dan Testing Library. Untuk menjalankan seluruh pengujian:

```bash
npm test
```

- Semua file test berada di dalam folder `src/` (misal: `src/utils/*.test.ts`, `src/components/*.test.tsx`, dll).
- Pastikan seluruh pengujian lulus sebelum melakukan deploy atau merge ke branch utama.

---

**Versi:** 1.1.7  
**Update terakhir:** 1 Desember 2025

---

Sistem manajemen laundry berbasis web untuk kasir dan admin. Mendukung transaksi, inventaris, pelanggan, aset, pengeluaran, penjadwalan perawatan, pelaporan, dan backup database otomatis/manual.

---

## ✨ Fitur Utama

- Manajemen transaksi laundry (kiloan, satuan, sepatu, karpet) & invoice pendek
- Manajemen pelanggan, layanan, inventaris, aset, pengeluaran
- Multi-role: Super Admin, Admin, Kasir
- Audit log, laporan, analitik
- PWA: offline mode, installable
- Notifikasi, dark/light mode
- Backup database otomatis/manual (Supabase)
- Pengujian otomatis per-file (Vitest, Testing Library)

---

## 🛠️ Teknologi

- **Frontend:** React 19, TypeScript, Vite
- **State:** React Context, React Query
- **Styling:** Tailwind CSS

- **URL Encoding Password:** Jika password database mengandung karakter spesial (seperti #), karakter tersebut wajib diganti dengan kode URL.
  - Contoh: `#` menjadi `%23`
  - Password: `#Password123` → `%23Password123`
- **Gunakan Session Pooler URL:** Jangan gunakan URL `db.project.supabase.co` (Direct Connection) karena sering bermasalah dengan resolusi DNS di dalam Docker Container. Gunakan URL Session Pooler (biasanya berakhiran `.pooler.supabase.com`).
- **Port:** 5432 (Session Mode) atau 6543 (Transaction Mode). Gunakan 5432 untuk pg_dump.

---

## 🚀 Perintah Backup

Jalankan perintah berikut di PowerShell.

### 1. Backup Data Saja (Data Only)

Gunakan ini jika Anda sudah memiliki struktur tabel (Schema) dan hanya ingin mem-backup isi datanya (baris-baris tabel).

```powershell
supabase db dump --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" --data-only -f database/backup/data.sql
```

Output: File `database/backup/backup_schema.sql`.

### 3. Backup Lengkap (Schema + Data)

Gunakan ini untuk snapshot penuh database.

```powershell
supabase db dump --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" -f database/backup/full_backup.sql
```

## Output: File `database/backup/full_backup.sql`.

on:
jobs:
git push origin main

---

## 🔄 Backup Otomatis Database Supabase (GitHub Actions)

Mulai v1.1.3, aplikasi ini mendukung backup otomatis database Supabase menggunakan GitHub Actions. Backup berjalan harian dan hasilnya akan otomatis disimpan di folder `backup/` (bisa diunduh dari tab Actions di GitHub).

**Cara setup:**

1. Pastikan file `.github/workflows/backup.yml` sudah ada (lihat repo ini).
2. Di GitHub, buka Settings > Secrets and variables > Actions, lalu tambahkan secret baru:
   - **Name:** `SUPABASE_DB_URL`
   - **Value:** (isi dengan connection string Supabase Anda, format postgresql://...)
3. Workflow akan berjalan otomatis setiap hari. Hasil backup akan berada di folder `database/backup/` dan dapat diunduh di tab Actions > run yang sukses > Artifacts.

jobs:
Contoh isi file workflow (backup otomatis ke folder `database/backup/`):

```yaml
name: Daily Supabase Backup
on:
  schedule:
    - cron: '0 0 * * *'
jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install PostgreSQL Client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      - name: Create backup folder
        run: mkdir -p database/backup
      - name: Backup Database
        run: |
          pg_dump "${{ secrets.SUPABASE_DB_URL }}" -f database/backup/backup_$(date +%Y-%m-%d).sql
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: db-backup
          path: database/backup/*.sql
          retention-days: 7
```

> **Tips:** Connection string bisa didapat dari dashboard Supabase > Database > Connection Pooling/Settings. Jangan bagikan secret ke publik.

---

<div align="center">
  <img width="800" alt="Laundry Management System" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Laundry Management System (Web Kasir)

Sistem manajemen laundry berbasis web yang dirancang untuk kasir dan admin, mendukung pengelolaan transaksi, inventaris, pelanggan, aset, pengeluaran, penjadwalan perawatan, dan pelaporan. Dibangun dengan teknologi modern untuk kemudahan penggunaan, keamanan, dan skalabilitas.

---

## ✨ Fitur Utama

- **Manajemen Transaksi**: Pencatatan transaksi laundry (kiloan, satuan, sepatu, karpet), status pembayaran, cetak struk, dan kode invoice pendek ramah pelanggan (misal: EM-AB12CD).

### 🔑 Fitur Baru (v1.1.3)

- [Docs] Instruksi backup otomatis database Supabase via GitHub Actions langsung di README.

### 🔑 Fitur Baru (v1.1.2)

- [Enhancement] Tombol "Tandai Selesai" hanya aktif jika pembayaran sudah lunas **dan/atau** status sudah "Siap Diambil" (mencegah penyelesaian pesanan sebelum waktunya).

### 🔑 Fitur Sebelumnya (v1.1.1)

- [Fix] Data transaksi kini lebih aman: catatan item (notes) otomatis dibersihkan jika jumlah item dikurangi, mencegah "zombie notes".
- [Fix] Semua tombol metode pembayaran kini konsisten secara visual dan aksesibel di seluruh aplikasi.
- [Fix] Notifikasi diskon kini tampil sebagai info banner, bukan toast, agar tidak mengganggu kasir.
- [Enhancement] Versi aplikasi kini diambil otomatis dari package.json.
- [Enhancement] Utility generateUUID kini DRY dan digunakan di seluruh aplikasi.
- [Enhancement] Perhitungan subtotal item lebih aman secara tipe data.
- [Docs] Perbaikan dan penambahan dokumentasi fitur serta changelog.

### 🔑 Fitur Sebelumnya (v1.1.0)

- Setiap transaksi kini memiliki kode invoice pendek (invoice_code) yang unik dan mudah diingat, otomatis dibuat oleh sistem.
- Tampilan ID Transaksi di seluruh aplikasi kini menggunakan kode invoice pendek (jika tersedia), sehingga lebih mudah dicatat dan disebutkan pelanggan.
- Struk cetak, detail transaksi, WhatsApp, dan riwayat pelanggan kini menampilkan kode invoice pendek.

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

### 🔄 Backup & Restore Database (Supabase CLI)

- **Supabase CLI** tidak lagi bisa diinstal global via npm. Gunakan [Scoop](https://scoop.sh/) (Windows) atau download manual dari [Supabase CLI Releases](https://github.com/supabase/cli/releases).
- **Docker Desktop** wajib terinstal & berjalan untuk perintah database lokal/backup.

**Langkah instalasi Supabase CLI di Windows:**

1. Instal [Scoop](https://scoop.sh/) jika belum ada:
   ```powershell
   Set-ExecutionPolicy RemoteSigned -scope CurrentUser
   irm get.scoop.sh | iex
   ```
2. Instal Supabase CLI:
   ```powershell
   scoop install supabase
   ```
3. Instal [Docker Desktop](https://docs.docker.com/desktop/windows/install/) dan pastikan statusnya "Running".

**Backup database (manual via pg_dump):**

```bash
pg_dump "postgresql://postgres:[PASSWORD]@db.kxylzjjmakbhzuirvnyd.supabase.co:5432/postgres" -f backup_schema.sql
```

Ganti `[PASSWORD]` dengan password database Supabase Anda.

**Backup database (otomatis via Supabase CLI):**

```powershell
supabase db dump -f backup_schema.sql
```

Jika muncul error terkait Docker, pastikan Docker Desktop sudah berjalan.

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
- **Versioning Otomatis**: Versi aplikasi akan selalu tampil di seluruh halaman utama dan halaman login, mengikuti versi di `package.json`.

---

## 📝 Catatan Rilis (Changelog)

### v1.1.5 - 1 Desember 2025

- [Release] Peningkatan versi aplikasi ke 1.1.5.
- [Docs] Update README, status pengujian, dan coverage terbaru (Desember 2025).
- [Test] Seluruh pengujian per-file, coverage >85%, dan tidak ada lagi error context/mocking.

### v1.1.4 - 30 November 2025

- **Admin Cabang**: Kelola transaksi, pelanggan, inventaris, aset, laporan cabang
- **Kasir**: Input transaksi, update status, akses terbatas

---

## 📝 Catatan Pengembangan & Perubahan Terbaru

- Mendukung pengembangan modular dan scalable
- Siap di-deploy ke layanan hosting modern (Vercel, Netlify, dsb)
- PWA siap untuk instalasi di perangkat mobile
- Kode bersih, mudah dikembangkan, dan terdokumentasi
- **Versioning Otomatis**: Versi aplikasi akan selalu tampil di seluruh halaman utama dan halaman login, mengikuti versi di `package.json`.

---

## 📝 Catatan Rilis (Changelog)

### v1.1.3 - 30 November 2025

- [Docs] Instruksi backup otomatis database Supabase via GitHub Actions langsung di README.

### v1.1.2 - 20 November 2025

- [Enhancement] Tombol "Tandai Selesai" hanya aktif jika pembayaran sudah lunas **dan/atau** status sudah "Siap Diambil" (mencegah penyelesaian pesanan sebelum waktunya).

### v1.1.1

- [Fix] Data transaksi kini lebih aman: catatan item (notes) otomatis dibersihkan jika jumlah item dikurangi, mencegah "zombie notes".
- [Fix] Semua tombol metode pembayaran kini konsisten secara visual dan aksesibel di seluruh aplikasi.
- [Fix] Notifikasi diskon kini tampil sebagai info banner, bukan toast, agar tidak mengganggu kasir.
- [Enhancement] Versi aplikasi kini diambil otomatis dari package.json.
- [Enhancement] Utility generateUUID kini DRY dan digunakan di seluruh aplikasi.
- [Enhancement] Perhitungan subtotal item lebih aman secara tipe data.
- [Docs] Perbaikan dan penambahan dokumentasi fitur serta changelog.

### v1.1.0 - 16 November 2025

- Fitur kode invoice pendek (invoice_code) otomatis pada setiap transaksi
- Tampilan ID Transaksi di seluruh aplikasi kini menggunakan kode invoice pendek (ramah pelanggan)
- Struk, detail, WhatsApp, dan riwayat pelanggan menampilkan kode invoice pendek

---

## 📞 Kontribusi & Kontak

Untuk kontribusi, bug report, atau pertanyaan, silakan hubungi [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com) atau buat issue di repository ini.

---

## 🧪 Pengujian Otomatis

Aplikasi ini dilengkapi dengan unit test menggunakan Vitest dan Testing Library. Untuk menjalankan seluruh pengujian:

```bash
npm test
```

- Semua file test berada di dalam folder `src/` (misal: `src/utils/*.test.ts`, `src/components/*.test.tsx`, dll).
- Pastikan seluruh pengujian lulus sebelum melakukan deploy atau merge ke branch utama.

---

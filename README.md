---


# Laundry Management System (Web Kasir)

**Versi:** 1.1.6  
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
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Testing:** Vitest, Testing Library

---

## 🚀 Instalasi
1. **Clone repo & install dependencies**
   ```bash
   git clone https://github.com/mhmdnvn18/emaklaundry_kasir.git
   cd emaklaundry_kasir
   npm install
   ```
2. **Buat file `.env.local`**
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. **Jalankan aplikasi**
   ```bash
   npm run dev
   ```
   Akses di http://localhost:3000

---

## 🧪 Pengujian Otomatis
- Jalankan seluruh test:
  ```bash
  npm test
  ```
- Coverage >85%, seluruh test per-file modular, tidak ada error context/mocking

---

## 🔄 Backup Database Supabase
- **Manual:**
  ```powershell
  supabase db dump --db-url "postgresql://[user]:[password]@[host]:5432/postgres" -f database/backup/full_backup.sql
  ```
- **Otomatis (GitHub Actions):**
  1. Pastikan `.github/workflows/backup.yml` ada
  2. Tambahkan secret `SUPABASE_DB_URL` di GitHub
  3. Backup harian otomatis, hasil di tab Actions > Artifacts

---

## 📁 Struktur Direktori
- `src/` : Source code utama
- `public/` : Aset publik
- `database/` : Skrip SQL & backup
- `coverage/` : Hasil pengujian

---


## 📝 Changelog (Ringkasan)
- **v1.1.6 (1 Des 2025):**
  - Peningkatan stabilitas, lint & test 100% lolos, coverage >85%
  - README dan dokumentasi diperbarui, siap CI/CD
- **v1.1.5:**
  - Modular context, robust test, backup otomatis
- **v1.1.3:**
  - Backup otomatis Supabase via GitHub Actions
- **v1.1.0:**
  - Kode invoice pendek, UI/UX kasir lebih ramah

---

## 📞 Kontak & Kontribusi
- Email: mhmdnvn18@gmail.com
- Issue & PR: https://github.com/mhmdnvn18/emaklaundry_kasir

---

# Panduan Manual Backup Database Supabase

<details>
<summary>Klik untuk panduan backup manual & detail lanjutan</summary>

Dokumen ini menjelaskan cara melakukan backup database Supabase secara manual menggunakan Supabase CLI di lingkungan Windows (PowerShell). Metode ini menggunakan **Session Pooler** untuk koneksi yang lebih stabil dan mengatasi masalah DNS pada Docker.

## 📋 Prasyarat

Pastikan *tools* berikut sudah terinstal dan berjalan:

1.  **Scoop** (Package Manager untuk Windows).
2.  **Supabase CLI** (via Scoop).
3.  **Docker Desktop** (Wajib berjalan/running saat menjalankan perintah).

### Instalasi Awal (Jika belum)

```powershell
# 1. Instal Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 2. Login ke Supabase (Browser akan terbuka untuk otentikasi)
supabase login
```

⚠️ **Catatan Penting Konfigurasi**

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

Output: File `database/backup/data.sql`.

### 2. Backup Struktur Saja (Schema Only)

Gunakan ini jika Anda hanya ingin mem-backup definisi tabel, fungsi, trigger, dan policy tanpa data.

```powershell
supabase db dump --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" -f database/backup/backup_schema.sql
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

- [Test] Semua komponen utama dan halaman management kini memiliki minimal 1 file test.
- [Test] Penambahan test coverage dan .gitignore untuk folder coverage.
- [Docs] Update README dan instruksi pengujian otomatis.

### v1.1.3 - 30 November 2025

- [Docs] Instruksi backup otomatis database Supabase via GitHub Actions langsung di README.
- [Enhancement] Semua file backup (manual & otomatis) kini diarahkan ke folder `database/backup/`.

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

### v0.1.0 - 16 November 2025

- Penambahan fitur versioning otomatis di seluruh aplikasi (tampil di layout utama dan halaman login)
- Perbaikan bug pada ReceiptPage: normalisasi data pelanggan agar tidak error
- Peningkatan stabilitas dan konsistensi tampilan

### v0.0.0

- Inisialisasi proyek

---

## 📞 Kontribusi & Kontak

Untuk kontribusi, bug report, atau pertanyaan, silakan hubungi [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com) atau buat issue di repository ini.

---

<div align="center">
  <b>© 2025 Laundry Management System</b>
</div>
### Perbaikan Bug Penting

- **[20 Nov 2025]**: Memperbaiki error `TypeError: p.find is not a function` pada halaman Laporan (ReportsPage) dengan memastikan data hasil query pelanggan (`customers`) selalu dinormalisasi menjadi array sebelum digunakan dengan `.find`. Jika Anda mengalami error serupa, pastikan sudah menggunakan kode terbaru.
- **[20 Nov 2025]**: Untuk error TypeScript `Cannot find type definition file for 'node'`, pastikan sudah menginstall dependency:
  ```bash
  npm install --save-dev @types/node
  ```

---

## 🧪 Pengujian Otomatis & Coverage

Aplikasi ini dilengkapi dengan unit test menggunakan **Vitest** dan **Testing Library**. Untuk menjalankan seluruh pengujian:

```bash
npm test
```

Untuk menjalankan pengujian sekaligus coverage:

```bash
npx vitest run --coverage
```

- Semua file test berada di dalam folder `src/` (misal: `src/utils/*.test.ts`, `src/components/*.test.tsx`, dll).
- Pastikan seluruh pengujian lulus sebelum melakukan deploy atau merge ke branch utama.
- Folder `coverage/` otomatis di-ignore dari git.
- Hasil pengujian terakhir (**Desember 2025**):
  - **73 file test dijalankan**
  - **118 pengujian (tests) semuanya lulus**
  - **Coverage komponen utama >85%**
  - Tidak ada lagi file master test, seluruh pengujian berjalan per-file (modular, robust, dan bebas error context/mocking)

---

## 🔄 Backup Otomatis Database Supabase (GitHub Actions)

Mulai v1.1.3, aplikasi ini mendukung backup otomatis database Supabase menggunakan GitHub Actions. Backup berjalan harian dan hasilnya dapat diunduh dari tab Actions di GitHub.

**Cara setup:**

1. Pastikan file [.github/workflows/backup.yml](.github/workflows/backup.yml) sudah ada.
2. Di GitHub, buka **Settings > Secrets and variables > Actions**, lalu tambahkan secret baru:
   - **Name:** `SUPABASE_DB_URL`
   - **Value:** (isi dengan connection string Supabase Anda, format `postgresql://...`)
3. Workflow akan berjalan otomatis setiap hari. Hasil backup dapat diunduh di tab Actions > run yang sukses > Artifacts.

Contoh isi file workflow:

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
      - name: Backup Database
        run: |
          pg_dump "${{ secrets.SUPABASE_DB_URL }}" -f backup_$(date +%Y-%m-%d).sql
      - name: Upload Artifact
        uses: actions/upload-artifact@v4
        with:
          name: db-backup
          path: '*.sql'
          retention-days: 7
```

> **Tips:** Connection string bisa didapat dari dashboard Supabase > Database > Connection Pooling/Settings. Jangan bagikan secret ke publik.

---

# Laundry Management System (Web Kasir)

<p align="right"><strong>Versi aplikasi: 1.1.5</strong></p>

Sistem manajemen laundry berbasis web yang dirancang untuk kasir dan admin, mendukung pengelolaan transaksi, inventaris, pelanggan, aset, pengeluaran, penjadwalan perawatan, dan pelaporan. Dibangun dengan teknologi modern untuk kemudahan penggunaan, keamanan, dan skalabilitas.

---

## ✨ Fitur Utama

- **Manajemen Transaksi**: Pencatatan transaksi laundry (kiloan, satuan, sepatu, karpet), status pembayaran, cetak struk, dan kode invoice pendek ramah pelanggan (misal: EM-AB12CD).
- **Manajemen Pelanggan**: Tambah, edit, pencarian pelanggan, riwayat transaksi, serta catatan khusus.
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
- **Testing**: Vitest, Testing Library

---

## 🚀 Instalasi & Menjalankan Proyek

### Prasyarat

- Node.js (disarankan versi terbaru LTS)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opsional, untuk backup/restore manual)
- Docker Desktop (untuk backup/restore lokal)

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

- **Backup database (manual via pg_dump):**

  ```bash
  pg_dump "postgresql://postgres:[PASSWORD]@db.kxylzjjmakbhzuirvnyd.supabase.co:5432/postgres" -f backup_schema.sql
  ```

  Ganti `[PASSWORD]` dengan password database Supabase Anda.

- **Backup database (otomatis via Supabase CLI):**
  ```powershell
  supabase db dump -f backup_schema.sql
  ```
  Jika muncul error terkait Docker, pastikan Docker Desktop sudah berjalan.

---

## 📁 Struktur Direktori

- [`src/`](src/) : Source code utama (komponen, halaman, context, hooks, utils)
- [`public/`](public/) : Aset publik (favicon, manifest, dll)
- [`database/`](database/) : Skrip SQL dan dokumentasi deployment database
- [`tests/`](src/) : Unit test (di dalam folder `src/`)
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

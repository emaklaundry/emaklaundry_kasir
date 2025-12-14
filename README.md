# Laundry Management System (Web Kasir)

**Versi:** 2.0.0  
**Update terakhir:** 14 Desember 2025  
**Status:** ✅ Production Ready

---

Sistem manajemen laundry berbasis web untuk kasir dan admin. Mendukung transaksi, inventaris, pelanggan, aset, pengeluaran, penjadwalan perawatan, pelaporan, backup database otomatis/manual, dan kini siap multi-cabang (multi-tenant) dengan performa dan keamanan optimal.

---

## 📚 Documentation

Dokumentasi lengkap tersedia di folder [`docs/`](./docs/):

- **[FINAL_AUDIT_REPORT.md](./docs/FINAL_AUDIT_REPORT.md)** - Comprehensive code audit & security analysis
- **[IMPROVEMENTS.md](./docs/IMPROVEMENTS.md)** - Implementation details & improvements
- **[DATA_CONSISTENCY.md](./docs/DATA_CONSISTENCY.md)** - Conservative data consistency strategy  
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Production deployment guide
- **[MAINTENANCE_MODE.md](./docs/MAINTENANCE_MODE.md)** - 🔧 Maintenance mode guide
- **[Database Setup & Backup](./database/README.md)** - Database scripts & backup guide

---

## ✨ Fitur Utama

- ✅ Manajemen transaksi laundry (kiloan, satuan, sepatu, karpet) & invoice pendek
- ✅ Manajemen pelanggan, layanan, inventaris, aset, pengeluaran
- ✅ Multi-cabang: Pengaturan, transaksi, dan laporan per store/cabang
- ✅ Multi-role: Super Admin, Admin, Kasir
- ✅ 🔧 **Maintenance Mode**: Nonaktifkan akses saat perbaikan (hanya Super Admin)
- ✅ Audit log, laporan, analitik
- ✅ PWA: offline mode, installable
- ✅ Notifikasi, dark/light mode
- ✅ Conservative data consistency (zero data loss)
- ✅ Auto-retry & verification mechanism
- ✅ Mobile-first responsive design (WCAG AA)
- ✅ Comprehensive error handling
- ✅ Backup database otomatis/manual (Supabase)
- ✅ Timezone-safe date handling

---

## 🛠️ Teknologi

- **Frontend:** React 19, TypeScript, Vite 6
- **State:** React Context, TanStack Query 5
- **Styling:** Tailwind CSS 3
- **Database:** Supabase (PostgreSQL + RLS)
- **Testing:** Vitest, Testing Library
- **PWA:** Service Worker + Manifest

---

## 📂 Project Structure

```
emaklaundry_kasir/
├── .github/workflows/      # 🔄 GitHub Actions (auto backup)
├── docs/                   # 📚 Documentation
│   ├── README.md          # Documentation index
│   ├── FINAL_AUDIT_REPORT.md
│   ├── IMPROVEMENTS.md
│   ├── DATA_CONSISTENCY.md
│   ├── DEPLOYMENT.md
│   └── STRUCTURE.md       # Project structure guide
├── database/              # 💾 Database scripts
│   ├── README.md         # Database documentation
│   ├── setup/            # SQL setup scripts
│   │   ├── 0.droptable.sql
│   │   ├── 1.database.sql
│   │   ├── 2.apply_rpc_and_seed.sql
│   │   └── 3.security_and_performance.sql
│   └── backup/           # Database backups
│       ├── database-backup.md  # Backup guide
│       └── full_backup.sql     # Latest backup
├── public/               # 🌐 Public assets
│   ├── favicon/         # App icons
│   └── manifest.webmanifest
├── src/                  # 💻 Source code
│   ├── components/      # React components
│   ├── contexts/        # State management
│   ├── hooks/           # Custom hooks
│   ├── pages/           # Page components
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── __tests__/       # Test files
├── supabase/            # ⚙️ Supabase config
│   ├── config.toml
│   └── functions/       # Edge functions
└── README.md            # This file
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ dan npm
- Akun Supabase (gratis)

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd emaklaundry_kasir
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Copy template .env
   cp .env.example .env
   
   # Edit .env dan isi dengan Supabase credentials:
   # VITE_SUPABASE_URL=https://your-project.supabase.co
   # VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   
   Dapatkan credentials dari: Supabase Dashboard → Settings → API

4. **Setup database**
   - Buka Supabase Dashboard → SQL Editor
   - Copy isi file `database/setup/complete_setup.sql`
   - Paste & Run di SQL Editor
   - ✅ Database siap!

5. **Run development server**
   ```bash
   npm run dev
   ```
   
   Buka http://localhost:5173

### Build
```bash
npm run build
npm run preview
```

### Testing
```bash
npm run test
npm run test:all  # Format, lint, dan test
```

### Database Setup & Backup
Lihat panduan lengkap di [database/README.md](./database/README.md) atau [database/backup/database-backup.md](./database/backup/database-backup.md).

**Quick Setup (⭐ RECOMMENDED):**
```bash
# 1 file saja - copy & paste ke Supabase SQL Editor:
database/setup/complete_setup.sql
```

**Manual Setup (Step-by-step):**
```bash
# Jalankan berurutan:
1. database/setup/0.droptable.sql  # Reset (opsional)
2. database/setup/1.database.sql   # Schema
3. database/setup/2.apply_rpc_and_seed.sql  # RPC & seed
4. database/setup/3.security_and_performance.sql  # Security
5. database/setup/4.add_maintenance_mode.sql  # Maintenance mode
```

Panduan lengkap: [database/setup/SETUP_GUIDE.md](./database/setup/SETUP_GUIDE.md)

**Auto Backup:** GitHub Actions menjalankan backup otomatis setiap hari. Lihat [.github/workflows/backup.yml](.github/workflows/backup.yml).

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


## 📝 Changelog

### v2.0.0 - 14 Desember 2025
- ✅ Production ready dengan comprehensive audit
- ✅ Conservative data consistency (zero data loss)
- ✅ Multi-tenant (multi-cabang) support
- ✅ Auto-retry & verification mechanism
- ✅ Enhanced security & performance optimization
- ✅ Reorganized project structure & documentation
- ✅ 🔧 **NEW: Maintenance Mode** - Nonaktifkan sistem saat perbaikan

**Detail lengkap:** Lihat [IMPROVEMENTS.md](./docs/IMPROVEMENTS.md) dan [FINAL_AUDIT_REPORT.md](./docs/FINAL_AUDIT_REPORT.md)

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
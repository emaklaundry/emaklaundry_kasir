# Laundry Management System (Web Kasir)

**Versi:** 2.7.0  
**Update terakhir:** 26 Desember 2024  
**Status:** ✅ Production Ready

---

Sistem manajemen laundry berbasis web untuk kasir dan admin. Mendukung transaksi (kiloan/satuan), sistem saldo diskon pelanggan, inventaris, aset, dan laporan keuangan multi-cabang. Dibangun dengan fokus pada performa, keamanan (RLS), dan pengalaman pengguna mobile (PWA).

---

## 📚 Documentation

Dokumentasi lengkap tersedia di folder [`docs/`](./docs/):

- **[FINAL_AUDIT_REPORT.md](./docs/FINAL_AUDIT_REPORT.md)** - Laporan audit terakhir (v2.7.0)
- **[DEPLOYMENT.md](./docs/DEPLOYMENT.md)** - Panduan deployment production
- **[Database Setup](./supabase/setup/README.md)** - Script setup database & seed data
- **[MAINTENANCE_MODE.md](./docs/MAINTENANCE_MODE.md)** - Panduan mode maintenance

---

## ✨ Fitur Utama

- ✅ **Smart Transaction**: Kiloan, Satuan, Karpet, Sepatu dengan perhitungan otomatis
- ✅ **Sistem Saldo Diskon**: Otomatis simpan kembalian receh (< Rp 500) ke saldo pelanggan
- ✅ **Multi-Cabang**: Isolasi data per store dengan Super Admin overview
- ✅ **Mobile Optimized**: Tampilan responsif sempurna untuk kasir HP/Tablet
- ✅ **Laporan Lengkap**: Pendapatan, performa kasir, layanan terlaris, ekspor Excel
- ✅ **Manajemen Aset**: Jadwal maintenance & tracking nilai aset
- ✅ **PWA Ready**: Installable, offline support, auto-update
- ✅ **Secure**: proteksi Row Level Security (RLS) & Role Based Access

---

## 📝 Changelog

### v2.7.0 (26 Desember 2024) - "Polished Production Release"

**✨ New Features & Logic Improvements**

- **Smart Discount Balance System**:
  - Otomatis konversi kembalian receh (rounding < Rp 500) menjadi saldo pelanggan
  - Pelanggan bisa pakai saldo diskon tersimpan untuk transaksi berikutnya
  - Utilitas recalculation otomatis untuk sinkronisasi histori transaksi
- **Enhanced Database Functions**:
  - Updated RPC `get_public_services` dengan field `wash_type`
  - Consolidated setup script (`0.complete_setup.sql`) yang lebih robust dan clean
  - Fixed `updatedAt` trigger logic pada inventory

**📱 UI/UX Refinements**

- **Mobile Transaction View**: Fixed card collapsing & double rendering issues
- **Responsive Layout**: Improved padding & spacing pada layar kecil
- **Banner Info**: Fixed format currency pada banner saldo diskon (Rp X instead of %)

**🔧 Technical**

- **Lint Free**: 0 ESLint errors
- **Clean Code**: Removed redundant SQL functions & triggers
- **Build Optimized**: Bundle size 938KB (Gzipped)

---

### v2.6.0 (24 Desember 2024)

**Critical Fixes**

- **Reports Accuracy**: Perbaikan perhitungan revenue menggunakan sales value
- **Data Integrity**: Service ID mapping fix untuk import Excel
- **Audit Success**: Lolos comprehensive audit dengan score 99/100

---

## 📂 Project Structure

```
emaklaundry_kasir/
├── supabase/             # 💾 Semua backend (lihat supabase/setup/README.md)
│   ├── config.toml       # Pengaturan Supabase CLI
│   ├── migrations/       # Perubahan database bertahap (supabase db push)
│   ├── functions/        # Edge Functions (login karyawan, buat pengguna, dll.)
│   ├── setup/            # SQL Setup (Schema + Triggers)
│   │   ├── 0.complete_setup.sql    # MAIN SCRIPT (Run this first)
│   │   └── 1.seed_data_awal.sql    # Basic Seed (Stores, Users)
│   ├── seeds/            # Data Seeds (Services, Inventory)
│   │   └── 00_full_seed_bundle.sql # ALL SEEDS MERGED (Run this second)
│   └── backup/           # Cadangan data (xlsx/csv/pdf)
├── src/                  # 💻 Source Code
│   ├── components/      # UI Components (Modals, Widgets)
│   ├── pages/           # Application Pages
│   ├── hooks/           # Custom React Hooks
│   ├── utils/           # Logic Utilities (Discount, Format)
│   └── types/           # TypeScript Definitions
└── public/               # Static Assets
```

---

## 🚀 Quick Start (Database Setup)

**1. Setup Schema & Functions:**
Copy & Run isi file ini di Supabase SQL Editor:

```bash
supabase/setup/0.complete_setup.sql
```

**2. Isi Data Awal (Wajib):**

```bash
supabase/setup/1.seed_data_awal.sql
```

**3. Isi Data Pelengkap (Services, dll):**

```bash
supabase/seeds/00_full_seed_bundle.sql
```

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS 3
- **Language**: TypeScript 5.6
- **State**: TanStack Query 5 (Server State)
- **Database**: Supabase (PostgreSQL 15)
- **Testing**: Vitest, React Testing Library

---

## 📞 Support

Kontak tim teknis di [mhmdnvn18@gmail.com](mailto:mhmdnvn18@gmail.com) untuk pelaporan bug atau request fitur.

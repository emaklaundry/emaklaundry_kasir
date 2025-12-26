# 📦 Database Setup - Documentation

## 📋 File Structure

### 🎯 Main Setup Files

1. **`0.complete_setup.sql`** (Schema & Logic)
   - **Tipe**: Schema & Functions
   - **Isi**: Tables, Indexes, RLS Policies, RPC Functions, Triggers
   - **Wajib**: YA, harus dijalankan pertama kali
   - **Efek**: Membuat struktur database kosong yang aman & optimized

2. **`1.seed_data_awal.sql`** (Essential Data)
   - **Tipe**: Basic Data
   - **Isi**: 1 Store Default, 6 User Profiles, Default Settings
   - **Wajib**: YA, untuk development & testing
   - **Efek**: Mengisi data dasar agar aplikasi bisa dilogin dan dipakai

3. **`../seeds/00_full_seed_bundle.sql`** (Content Data)
   - **Tipe**: Content Data
   - **Isi**: 66 Layanan, Inventaris, Aset, Jadwal Maintenance
   - **Wajib**: OPSIONAL (Disarankan untuk demo/testing)
   - **Efek**: Mengisi konten aplikasi agar tidak kosong

---

## 🚀 Quick Start

### For Fresh Install (Recommended)

Jalankan script berikut secara berurutan di Supabase SQL Editor:

```sql
-- Step 1: Struktur & Logic (WAJIB)
database/setup/0.complete_setup.sql

-- Step 2: Data Dasar (WAJIB untuk login)
database/setup/1.seed_data_awal.sql

-- Step 3: Isi Konten Lengkap (OPSIONAL)
database/seeds/00_full_seed_bundle.sql
```

### For Production (Clean)

```sql
-- Production Setup (Data Bersih):
1. Jalankan 0.complete_setup.sql
2. Jalankan 1.seed_data_awal.sql (Hanya jika butuh user admin awal)
3. Skip 00_full_seed_bundle.sql (Input data real manual via aplikasi)
```

---

## 📁 File Details

### `0.complete_setup.sql` (v3.0.0)

- **DROP TABLES (Optional)**: Commented out by default. Uncomment untuk reset total.
- **CREATE TABLES**: Stores, Profiles, Customers, Services, Transactions, Inventory, Assets, Expenses.
- **FUNCTIONS & RPC**: Business logic (`get_public_services`, `update_transaction_status`).
- **SECURITY**: RLS Policies (Row Level Security) ketat per store & role.
- **TRIGGERS**: Auto timestamp, immutable checks.

### `1.seed_data_awal.sql`

- **Store**: "Cimenyan, Kota Banjar"
- **Users**: Super Admin, Admin, Kasir (Yopi, Ani, dll)
- **Settings**: Default receipt header/footer

### `00_full_seed_bundle.sql`

- Bundle gabungan dari: `seed_services`, `seed_inventory`, `seed_assets`, `seed_maintenances`.
- Menggunakan encoding UTF-8 safe.

---

## ✅ What's New in v2.7.0?

```
✅ 0.complete_setup.sql    - Updated RPC get_public_services (added wash_type)
✅ 00_full_seed_bundle.sql - Consolidated seed files into one easy bundle
✅ fix_*.sql               - Removed temporary fix files (integrated to main setup)
```

**Benefits:**

- ✅ **Single Source of Truth**: Semua logic ada di `complete_setup`.
- ✅ **Module Seeding**: Data konten terpisah dari struktur.
- ✅ **Clean**: Tidak ada file migrasi kecil-kecil yang membingungkan.

---

## 🔧 Maintenance & Updates

### Adding New Features to Schema

1. Edit `0.complete_setup.sql`.
2. Gunakan `CREATE OR REPLACE` atau `IF NOT EXISTS`.
3. Update version number.

### Adding New Seed Data

1. Tambahkan di file individual di `database/seeds/`.
2. Rebuild bundle (jika perlu) atau jalankan file individual.

---

## ✅ Verification Checklist

Setelah run setup, verifikasi:

### 1. Database Tables

```sql
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: ~15 tables
```

### 2. Functions & RPC

```sql
-- Cek RPC function baru
SELECT * FROM pg_proc WHERE proname = 'get_public_services';
```

### 3. Data (Jika run seed)

```sql
SELECT count(*) FROM services; -- Expected: ~66 rows
SELECT count(*) FROM profiles; -- Expected: ~6 rows
```

---

## 📚 Related Documentation

- 📖 [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed step-by-step setup
- 📖 [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- 📖 [Database Backup Guide](../backup/database-backup.md) - Backup & restore
- 📖 [Main Database README](../README.md) - Database overview

---

## 💡 Tips & Tricks

### Tip 1: Safe to Re-run

- `0.complete_setup.sql` menggunakan `IF NOT EXISTS` dan `CREATE OR REPLACE`
- `1.seed_data_awal.sql` menggunakan `ON CONFLICT DO NOTHING`
- Aman di-run berkali-kali tanpa error atau duplicate data

### Tip 2: Reset Database

Jika perlu reset total, uncomment Section 1 di `complete_setup.sql`:

```sql
-- Uncomment baris-baris ini:
drop table if exists transaction_items cascade;
drop table if exists transactions cascade;
drop table if exists expenses cascade;
-- etc...
```

### Tip 3: Production vs Development

```sql
-- Production: Schema only
1. Run 0.complete_setup.sql
2. SKIP 1.seed_data_awal.sql dan database/seeds/*.sql
3. Insert data production sesuai kebutuhan

-- Development/Testing: Schema + Sample Data
1. Run 0.complete_setup.sql
2. Run 1.seed_data_awal.sql (stores, users, settings)
3. Run database/seeds/*.sql (optional: services, inventory, assets, maintenances)
4. Langsung ready untuk testing
```

### Tip 4: Troubleshooting

- Error saat run: Cek apakah sudah di Supabase SQL Editor
- Function tidak muncul: Cek di Database → Functions
- RLS blocking query: Pastikan user sudah login dan punya profile

---

## 📊 File Statistics

| File                            | Purpose        | Priority   |
| :------------------------------ | :------------- | :--------- |
| `0.complete_setup.sql`          | Main Structure | ⭐⭐⭐⭐⭐ |
| `1.seed_data_awal.sql`          | Basic Data     | ⭐⭐⭐⭐⭐ |
| `seeds/00_full_seed_bundle.sql` | Content Data   | ⭐⭐⭐     |

**Last Updated:** December 26, 2024
**Setup Version:** 3.1.0
**Status:** ✅ Production Ready

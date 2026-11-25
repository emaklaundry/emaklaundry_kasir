# 🚀 Database Setup - Quick Guide (Updated v2.7.0)

## ⭐ Cara Setup (Recommended)

### 3 Tahap Setup dengan File Terkonsolidasi

1.  **Data Structure & Logic (WAJIB)**
    - Copy & Run: `supabase/setup/0.complete_setup.sql`
    - ✅ Membuat Tables, RPC Functions, Triggers, RLS Policies.

2.  **Basic Data (WAJIB untuk Login)**
    - Copy & Run: `supabase/setup/1.seed_data_awal.sql`
    - ✅ Insert Store default, User (Super Admin, Kasir), & Settings.

3.  **Content Data (Opsional)**
    - Copy & Run: `supabase/seeds/00_full_seed_bundle.sql`
    - ✅ Insert 66 Layanan, Inventaris, Aset, & Jadwal.

---

## 📋 Apa yang Di-Setup?

Default `0.complete_setup.sql` mencakup **SEMUA** struktur:

### ✅ Tables & Schema

- Stores, Profiles, Customers
- Transactions, Inventory, Services
- Assets, Expenses, Audit Logs

### ✅ Automated Logic

- **Auto Timestamp**: `updatedAt` update via trigger.
- **Wash Type**: RPC function `get_public_services` return wash_type.
- **Maintenance Mode**: Configurable di settings.

---

## 🔧 Troubleshooting

### Error: "relation already exists"

**Fix**: Abaikan saja jika menggunakan script terbaru, atau uncomment Section 1 `DROP TABLES` jika ingin reset total (hati-hati data hilang).

### Error: "cannot change return type of existing function"

**Fix**: Script `v2.7.0` sudah handle ini dengan `DROP FUNCTION IF EXISTS`. Pastikan Anda copy versi terbaru file `0.complete_setup.sql`.

### Data Seed Tidak Muncul?

**Fix**: Pastikan `storeId` di URL aplikasi cocok dengan `id` di table `stores`.
Default Store ID: `9b7e1c2a-1234-4bcd-8e9f-abcdef123456`

---

## 🧪 Verifikasi

Cek apakah setup berhasil:

```sql
-- 1. Cek RPC function baru
SELECT * FROM pg_proc WHERE proname = 'get_public_services';

-- 2. Cek Data Konten (jika step 3 dijalankan)
SELECT count(*) FROM services; -- Expected 66
```

---

**Catatan:** Jangan gunakan file `fix_*.sql` lagi karena semua fix sudah dimasukan ke `0.complete_setup.sql`.

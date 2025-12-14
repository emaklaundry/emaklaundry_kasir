# 🚀 Database Setup - Quick Guide

## ⭐ Cara Tercepat (RECOMMENDED)

### Setup dengan 1 File Saja!

1. **Buka Supabase Dashboard**
   - Login ke https://supabase.com
   - Pilih project Anda
   - Klik **SQL Editor** di sidebar kiri

2. **Copy File SQL**
   - Buka file: `database/setup/complete_setup.sql`
   - Copy seluruh isinya (Ctrl+A, Ctrl+C)

3. **Paste & Run**
   - Paste di Supabase SQL Editor (Ctrl+V)
   - Klik tombol **RUN** (atau tekan Ctrl+Enter)
   - Tunggu hingga selesai (~30 detik)

4. **Done! ✅**
   - Database sudah siap digunakan
   - Semua tables, functions, indexes sudah dibuat
   - Data seed services sudah ada
   - Maintenance mode sudah aktif

---

## 📋 Apa yang Di-Setup?

File `complete_setup.sql` mencakup **SEMUA** yang dibutuhkan:

### ✅ Section 1: Drop Tables (Optional)

- Drop semua tabel existing
- **Default: COMMENTED OUT** (tidak akan drop data)
- Uncomment jika ingin reset total

### ✅ Section 2: Create Tables & Functions

- Stores, Settings, Profiles
- Customers, Services
- Transactions, Transaction Items
- Inventory, Assets, Maintenance
- Expenses, Audit Logs
- Triggers & Helper Functions

### ✅ Section 3: RPC Functions & Seed Data

- `get_laundry_status()` - Cek status transaksi
- `update_transaction_status_safe()` - Update status dengan validasi
- `bulk_update_order_status()` - Bulk update
- **50+ services** pre-loaded (Kiloan, Satuan, Sepatu, Karpet)

### ✅ Section 4: Security & Performance

- Row Level Security (RLS) policies
- Performance indexes untuk query optimization
- Composite indexes untuk filter kompleks
- GIN index untuk full-text search

### ✅ Section 5: Maintenance Mode

- Kolom `isMaintenanceMode` & `maintenanceMessage`
- Default: `FALSE` (sistem aktif)
- Comments untuk dokumentasi

---

## 🔧 Opsi Advanced (Manual Step-by-Step)

Jika ingin kontrol penuh atau troubleshooting:

### Step 1: Reset (Opsional)

```bash
# File: 0.droptable.sql
# Hapus semua tabel existing
```

### Step 2: Schema & Tables

```bash
# File: 1.database.sql
# Buat semua tables, enums, triggers
```

### Step 3: Functions & Seed

```bash
# File: 2.apply_rpc_and_seed.sql
# RPC functions + 50+ services
```

### Step 4: Security & Index

```bash
# File: 3.security_and_performance.sql
# RLS policies + performance indexes
```

### Step 5: Maintenance Mode

```bash
# File: 4.add_maintenance_mode.sql
# Tambah fitur maintenance mode
```

---

## ⚠️ Important Notes

### 1. **DROP TABLES Di-Comment Out**

File `complete_setup.sql` **TIDAK** akan drop data existing secara default.

Jika ingin reset total, uncomment section 1:

```sql
-- Uncomment baris dibawah jika ingin reset:
drop table if exists transaction_items cascade;
drop table if exists transactions cascade;
-- dst...
```

### 2. **Safe to Re-run**

File menggunakan `IF NOT EXISTS` dan `CREATE OR REPLACE`:

- ✅ Aman di-run ulang
- ✅ Tidak akan duplicate data
- ✅ Akan update functions jika ada perubahan

### 3. **Execution Time**

- First time: ~30-60 detik
- Re-run: ~10-20 detik

---

## 🧪 Verifikasi Setup Berhasil

### Cek di Supabase Dashboard:

**1. Tables Created:**

- Database → Tables
- Harus ada: stores, settings, profiles, customers, services, transactions, dll.

**2. Functions Available:**

- Database → Functions
- Harus ada: `get_laundry_status`, `update_transaction_status_safe`, `handle_new_user`

**3. Seed Data:**

```sql
SELECT COUNT(*) FROM services;
-- Expected: 50+ services
```

**4. Indexes:**

```sql
SELECT * FROM pg_indexes
WHERE tablename IN ('transactions', 'customers', 'audit_logs');
-- Harus ada beberapa indexes
```

---

## 🐛 Troubleshooting

### Error: "relation already exists"

**Cause:** Table sudah ada  
**Fix:** Either:

1. Drop manual via SQL Editor
2. Uncomment section 1 di `complete_setup.sql`

### Error: "permission denied"

**Cause:** Insufficient privileges  
**Fix:** Pastikan run dengan user yang punya permission CREATE TABLE

### Error: "function does not exist"

**Cause:** Functions belum dibuat  
**Fix:** Re-run `complete_setup.sql`, pastikan section 2 & 3 ter-execute

### Seed Data Tidak Muncul

**Cause:** Store belum ada  
**Fix:** Buat store dulu atau update UUID di section 3:

```sql
-- Cari baris ini di complete_setup.sql
WHERE id = '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'
-- Ganti dengan UUID store Anda
```

---

## 📊 File Statistics

**complete_setup.sql:**

- **Lines:** ~1000+ baris
- **Size:** ~50-60 KB
- **Sections:** 5 sections
- **Runtime:** ~30-60 seconds
- **Tables:** 13 tables
- **Functions:** 5+ functions
- **Indexes:** 10+ indexes
- **Seed Data:** 50+ services

---

## ✅ Post-Setup Checklist

Setelah run `complete_setup.sql`:

- [ ] All tables created (13 tables)
- [ ] All functions available (5+ functions)
- [ ] Seed data loaded (50+ services)
- [ ] Indexes created (10+ indexes)
- [ ] RLS policies active
- [ ] Maintenance mode columns exist
- [ ] Test create transaction
- [ ] Test RPC functions

---

## 🔗 Related Documentation

- [Database README](../README.md) - Overview & structure
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- [Backup Guide](../backup/database-backup.md) - Backup & restore

---

**Catatan:** File individual (0.droptable.sql s/d 4.add_maintenance_mode.sql) tetap tersedia untuk referensi atau troubleshooting.

**Last Updated:** December 14, 2025  
**Version:** 2.0.0

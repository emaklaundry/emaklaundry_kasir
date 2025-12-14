# 📦 Database Setup - Summary

## ✅ File SQL Sudah Disatukan!

Sebelumnya Anda harus jalankan **5 file SQL** secara berurutan.  
Sekarang cukup **1 file saja**: `complete_setup.sql` ⭐

---

## 📊 Perbandingan

### ❌ Before (Cara Lama)
```bash
# Harus jalankan 5 file berurutan:
1. 0.droptable.sql          # Reset
2. 1.database.sql           # Schema (~650 lines)
3. 2.apply_rpc_and_seed.sql # RPC & seed (~100 lines)
4. 3.security_and_performance.sql # Security (~200 lines)
5. 4.add_maintenance_mode.sql # Maintenance (~30 lines)

Total: 5 file, ~980 lines
Effort: Copy-paste 5 kali, run 5 kali
Risk: Lupa urutan, skip file
Time: ~5-10 menit
```

### ✅ After (Cara Baru)
```bash
# Cukup 1 file:
1. complete_setup.sql  # ALL-IN-ONE (~1030 lines)

Total: 1 file, ~1030 lines  
Effort: Copy-paste 1 kali, run 1 kali
Risk: Minimal, semua terstruktur
Time: ~1-2 menit
```

---

## 🚀 Cara Menggunakan

### Step 1: Buka Supabase SQL Editor
- Login ke https://supabase.com
- Pilih project
- Klik **SQL Editor**

### Step 2: Copy & Paste
```bash
# Buka file:
database/setup/complete_setup.sql

# Copy semua isi file (Ctrl+A, Ctrl+C)
# Paste di SQL Editor (Ctrl+V)
```

### Step 3: Run
- Klik tombol **RUN** (atau Ctrl+Enter)
- Tunggu ~30-60 detik
- Done! ✅

---

## 📋 Isi File complete_setup.sql

```sql
-- ============================================
-- SECTION 1: DROP TABLES (OPTIONAL)
-- ============================================
-- Default: COMMENTED OUT
-- Uncomment jika ingin reset total

-- ============================================
-- SECTION 2: CREATE TABLES & FUNCTIONS
-- ============================================
-- ✅ Stores, Settings, Profiles
-- ✅ Customers, Services
-- ✅ Transactions, Items
-- ✅ Inventory, Assets
-- ✅ Maintenance Logs
-- ✅ Expenses, Audit Logs
-- ✅ Triggers & Functions

-- ============================================
-- SECTION 3: RPC FUNCTIONS & SEED DATA
-- ============================================
-- ✅ get_laundry_status()
-- ✅ update_transaction_status_safe()
-- ✅ bulk_update_order_status()
-- ✅ 50+ services (Kiloan, Satuan, Sepatu, Karpet)

-- ============================================
-- SECTION 4: SECURITY & PERFORMANCE
-- ============================================
-- ✅ RLS policies
-- ✅ Performance indexes
-- ✅ Composite indexes
-- ✅ Full-text search indexes

-- ============================================
-- SECTION 5: MAINTENANCE MODE
-- ============================================
-- ✅ isMaintenanceMode column
-- ✅ maintenanceMessage column
-- ✅ Default values
```

---

## 🔍 File Individual Masih Ada

File-file individual (`0.droptable.sql` s/d `4.add_maintenance_mode.sql`) **TETAP TERSEDIA** untuk:

- 📖 **Referensi** - Lihat detail masing-masing section
- 🔧 **Troubleshooting** - Debug masalah spesifik
- 🎯 **Selective Update** - Update hanya 1 section tertentu
- 📚 **Learning** - Memahami struktur database

---

## ✅ Checklist Verifikasi

Setelah run `complete_setup.sql`, verifikasi:

**Database:**
- [ ] 13 tables created
- [ ] 5+ functions available
- [ ] 50+ services seeded
- [ ] 10+ indexes created

**Test Query:**
```sql
-- Cek tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Cek functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Cek seed data
SELECT COUNT(*) FROM services; -- Expected: 50+

-- Cek indexes
SELECT * FROM pg_indexes 
WHERE tablename IN ('transactions', 'customers');
```

---

## 📁 Struktur File Database

```
database/
├── setup/
│   ├── complete_setup.sql       ⭐ USE THIS (All-in-One)
│   ├── SETUP_GUIDE.md          📖 Panduan lengkap
│   │
│   └── Individual files (untuk referensi):
│       ├── 0.droptable.sql
│       ├── 1.database.sql
│       ├── 2.apply_rpc_and_seed.sql
│       ├── 3.security_and_performance.sql
│       └── 4.add_maintenance_mode.sql
│
└── backup/
    ├── full_backup.sql
    └── database-backup.md
```

---

## 💡 Tips

### Tip 1: Safe to Re-run
File menggunakan `IF NOT EXISTS` dan `CREATE OR REPLACE`:
- ✅ Aman di-run berkali-kali
- ✅ Tidak akan duplicate data
- ✅ Akan update functions jika ada perubahan

### Tip 2: Reset Database
Jika ingin reset total, uncomment section 1:
```sql
-- Uncomment baris ini:
drop table if exists transaction_items cascade;
drop table if exists transactions cascade;
-- dst...
```

### Tip 3: Custom Store ID
Jika ingin mengubah store untuk seed data:
```sql
-- Cari baris ini di section 3:
WHERE id = '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'

-- Ganti dengan UUID store Anda
```

---

## 📊 Statistics

**complete_setup.sql:**
- **Total Lines:** ~1030 lines
- **File Size:** ~55 KB
- **Sections:** 5 sections
- **Execution Time:** ~30-60 seconds
- **Tables Created:** 13 tables
- **Functions Created:** 5+ functions
- **Indexes Created:** 10+ indexes
- **Seed Records:** 50+ services

---

## 📚 Dokumentasi Terkait

- 📖 [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Panduan lengkap setup
- 📖 [Database README](../README.md) - Overview struktur
- 📖 [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment
- 📖 [Backup Guide](../backup/database-backup.md) - Backup & restore

---

## 🎯 Quick Reference

| Task | File | Action |
|------|------|--------|
| **Setup Baru** | `complete_setup.sql` | Copy-paste ke SQL Editor, Run |
| **Reset Total** | `complete_setup.sql` | Uncomment section 1, Run |
| **Update Function** | `complete_setup.sql` | Re-run (safe) |
| **Add Maintenance** | `4.add_maintenance_mode.sql` | Run individual file |
| **Backup** | Manual | See backup/database-backup.md |

---

**Created:** December 14, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

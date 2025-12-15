# 📦 Database Setup - Documentation

## 📋 File Structure

### 🎯 Main Setup Files

- **`complete_setup.sql`** - Complete schema, functions, RPC, security, triggers
  - Schema: Tables, indexes, constraints
  - Functions: Business logic, RPC functions
  - Security: RLS policies, performance indexes
  - Features: Maintenance mode, triggers
  - **NO seed data** (schema only)
  - Total: ~1100+ lines

- **`seed_data.sql`** - Sample data untuk testing/development
  - Stores: 1 toko default
  - Profiles: 6 user dengan berbagai role
  - Services: 66 layanan laundry lengkap
  - Settings: Default configuration
  - Safe to re-run (uses ON CONFLICT)
  - Total: ~250 lines

---

## 🚀 Quick Start

### For Fresh Install (New Database)

```sql
-- Step 1: Setup schema & functions
-- Jalankan di Supabase SQL Editor:
1. Copy isi file complete_setup.sql
2. Paste ke SQL Editor
3. Run

-- Step 2: (Optional) Insert sample data
1. Copy isi file seed_data.sql
2. Paste ke SQL Editor
3. Run
```

### For Production

```sql
-- Production Setup (tanpa sample data):
1. Jalankan complete_setup.sql
2. Skip seed_data.sql
3. Insert data real sesuai kebutuhan
```

---

## 📁 File Details

### `complete_setup.sql` (v3.0.0)

**Section 1: DROP TABLES (Optional)**

- Drop existing tables untuk reset database
- **Default: COMMENTED OUT** untuk keamanan
- Uncomment hanya jika perlu fresh install

**Section 2: CREATE TABLES & FUNCTIONS**

- Schema untuk 13 tabel utama
- Helper functions: `handle_new_user`, dll
- Row Level Security (RLS) policies untuk setiap tabel
- Constraints dan foreign keys

**Section 3: RPC FUNCTIONS**

- `complete_scheduled_maintenance` - Update maintenance schedule
- `get_laundry_status` - Query status cucian by invoice/ID
- `update_transaction_status_safe` - Update transaction dengan validasi
- Dan functions lainnya untuk business logic

**Section 4: SECURITY & PERFORMANCE**

- Additional RLS policies untuk granular access control
- Performance optimizations
- Database indexes untuk query cepat
- Input validation di RPC functions

**Section 5: TRIGGERS & AUTOMATION**

- Auto-update `updatedAt` trigger
- Maintenance Mode configuration
- WhatsApp Custom Footer settings
- Final verification

### `seed_data.sql`

**Sample Data Included:**

- **1 Store**: "Laundry Emak" (default toko)
- **6 Profiles**: Super Admin, Admin, Owner, Kasir dengan berbagai role
- **66 Services**: Layanan lengkap (Kiloan, Satuan, Express, Setrika)
- **1 Settings**: Default configuration untuk aplikasi

**Features:**

- Uses `ON CONFLICT DO NOTHING` untuk safe re-run
- Data lengkap untuk testing environment
- Production: Skip file ini dan input data real

---

## ✅ What Changed?

### Version 3.0.0 (Dec 15, 2025)

```
✅ complete_setup.sql (v3.0.0) - Schema & functions only, NO seed data
✅ seed_data.sql (NEW)         - All sample data separated
❌ Migration files REMOVED     - All updates consolidated
```

### Before (Old Structure)

```
❌ 0.droptable.sql          - Merged to complete_setup.sql
❌ 1.database.sql           - Merged to complete_setup.sql
❌ 2.apply_rpc_and_seed.sql - Merged to complete_setup.sql
❌ 3.security_and_performance.sql - Merged to complete_setup.sql
❌ 4.add_maintenance_mode.sql - Merged to complete_setup.sql
❌ 5.add_whatsapp_footer.sql  - Merged to complete_setup.sql
```

**Benefits:**

- ✅ Lebih clean dan organized
- ✅ 2 file saja: schema + seed
- ✅ Tidak perlu migration file terpisah
- ✅ Mudah maintenance dan update

---

## 🔧 Maintenance & Updates

### Adding New Features to Schema

1. Edit `complete_setup.sql` di section yang sesuai
2. Test di development database
3. Update version number di header
4. Update README.md

### Adding/Updating Sample Data

1. Edit `seed_data.sql`
2. Test untuk memastikan `ON CONFLICT` bekerja
3. Dokumentasikan perubahan

### Best Practices

- ✅ Selalu gunakan `IF NOT EXISTS` untuk ALTER TABLE
- ✅ Gunakan `CREATE OR REPLACE` untuk functions
- ✅ Test di development dulu
- ✅ Backup database sebelum major changes
- ✅ Dokumentasikan perubahan dengan comment

---

## ✅ Verification Checklist

Setelah run setup, verifikasi:

### Database Tables

```sql
-- Cek semua tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
-- Expected: 13 tables
```

### Functions & RPC

```sql
-- Cek functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
-- Expected: 5+ functions
```

### Seed Data (jika menjalankan seed_data.sql)

```sql
-- Cek stores
SELECT COUNT(*) FROM stores;
-- Expected: 1 store

-- Cek profiles/users
SELECT COUNT(*) FROM profiles;
-- Expected: 6 users

-- Cek services
SELECT COUNT(*) FROM services;
-- Expected: 66 services

-- Cek settings
SELECT * FROM settings LIMIT 1;
-- Expected: 1 row dengan default configuration
```

### Performance Indexes

```sql
-- Cek indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
-- Expected: 10+ indexes
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

- `complete_setup.sql` menggunakan `IF NOT EXISTS` dan `CREATE OR REPLACE`
- `seed_data.sql` menggunakan `ON CONFLICT DO NOTHING`
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
1. Run complete_setup.sql
2. SKIP seed_data.sql
3. Insert data production sesuai kebutuhan

-- Development/Testing: Schema + Sample Data
1. Run complete_setup.sql
2. Run seed_data.sql
3. Langsung ready untuk testing
```

### Tip 4: Troubleshooting

- Error saat run: Cek apakah sudah di Supabase SQL Editor
- Function tidak muncul: Cek di Database → Functions
- RLS blocking query: Pastikan user sudah login dan punya profile

---

## 📊 File Statistics

| File                         | Size   | Lines | Purpose                        |
| ---------------------------- | ------ | ----- | ------------------------------ |
| `complete_setup.sql`         | ~48 KB | ~1250 | Main setup (all-in-one)        |
| `4.add_maintenance_mode.sql` | ~1 KB  | ~40   | Migration: Maintenance feature |
| `5.add_whatsapp_footer.sql`  | ~1 KB  | ~35   | Migration: WhatsApp footer     |

**Execution Time:** ~30-60 seconds for complete_setup.sql

---

**Last Updated:** December 15, 2025  
**Database Version:** 2.0.0
| **Add Maintenance** | `4.add_maintenance_mode.sql` | Run individual file |
| **Backup** | Manual | See backup/database-backup.md |

---

**Created:** December 14, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

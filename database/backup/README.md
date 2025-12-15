# Database Backup

## Files

- **complete_backup.sql** - Full database backup with all schemas, tables, and data (includes schema definitions)
- **restore_data.sql** - Data only (INSERT statements) - Compatible with complete_setup.sql

## Usage

### Option 1: Restore Only Data (Recommended)

Jika Anda sudah menjalankan `complete_setup.sql` dan hanya ingin restore data:

```bash
# 1. Pastikan complete_setup.sql sudah dijalankan
# 2. Restore data saja
psql -U postgres -d your_database < restore_data.sql
```

File `restore_data.sql` berisi:
- ✅ 1 Store (Cabang Kota Banjar)
- ✅ 6 Users/Profiles
- ✅ 67 Services (Layanan lengkap)
- ✅ 1 Settings (Konfigurasi sistem)
- ❌ Customers (TIDAK disertakan - data sensitif)
- ❌ Transactions (TIDAK disertakan - data operasional)
- ❌ Audit logs (TIDAK disertakan - data historical)

### Option 2: Full Database Restore

Restore lengkap dengan schema dan data:

```bash
# Using psql
psql -U postgres -d your_database < complete_backup.sql

# Or using Supabase CLI
supabase db reset --db-url "your_connection_string"
```

### Notes

- The backup script now includes `DROP TYPE IF EXISTS ... CASCADE` statements
- This allows the script to be run multiple times without errors
- All custom ENUM types will be recreated if they exist
- Use with caution in production - this will drop and recreate types
- **restore_data.sql** uses `ON CONFLICT DO UPDATE` for safe data restoration

## Custom Types

The following custom ENUM types are defined:

1. **order_status**: `'Diproses'`, `'Siap Diambil'`, `'Selesai'`
2. **payment_method**: `'Tunai'`, `'QRIS'`, `'Transfer Bank'`
3. **payment_status**: `'Lunas'`, `'Belum Lunas'`, `'Bayar Sebagian'`
4. **service_category**: `'Kiloan'`, `'Satuan'`, `'Sepatu'`, `'Karpet'`
5. **user_role**: `'Super Admin'`, `'Admin'`, `'Kasir'`

## Workflow Recommendation

```bash
# Setup baru / Fresh install
1. supabase db reset                    # Reset database
2. Run: database/setup/complete_setup.sql   # Setup schema
3. Run: database/setup/seed_data.sql        # Seed data (optional)

# Atau restore dari backup
1. supabase db reset                    # Reset database
2. Run: database/setup/complete_setup.sql   # Setup schema
3. Run: database/backup/restore_data.sql    # Restore real data
```

## Backup Schedule

Automated backups are created via GitHub Actions workflow on:
- Every push to main branch
- Manual trigger via workflow_dispatch

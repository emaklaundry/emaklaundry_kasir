# Database Backup

## 📁 Files in This Folder

### Backup Files

- **complete_backup.sql** - Full database backup with all schemas, tables, and data (includes schema definitions)
- **full_backup.sql** - Alternative full backup file
- **Rekap Keuangan Laundry.pdf** - Financial report/recap document (business data reference)

## 📖 Usage

### Restore Database from Backup

Choose one of the backup files to restore your database:

**Using complete_backup.sql:**

```bash
# Using psql
psql -U postgres -d your_database < database/backup/complete_backup.sql

# Or using Supabase SQL Editor:
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy contents of complete_backup.sql
# 3. Paste and Run
```

**Using full_backup.sql:**

```bash
# Using psql
psql -U postgres -d your_database < database/backup/full_backup.sql

# Or via Supabase CLI
supabase db reset --db-url "your_connection_string"
```

### What's Included

Both backup files contain:

- ✅ Complete database schema (tables, constraints, indexes)
- ✅ Custom ENUM types
- ✅ All existing data
- ✅ Functions and triggers
- ✅ RLS policies

### Important Notes

- Backup scripts include `DROP TYPE IF EXISTS ... CASCADE` statements
- Safe to run multiple times (will recreate database from scratch)
- ⚠️ **Use with caution in production** - this will drop and recreate the entire database
- For production incremental backups, use Supabase Dashboard backup features

## 🔧 Custom Types

The following custom ENUM types are defined:

1. **order_status**: `'Diproses'`, `'Siap Diambil'`, `'Selesai'`
2. **payment_method**: `'Tunai'`, `'QRIS'`, `'Transfer Bank'`
3. **payment_status**: `'Lunas'`, `'Belum Lunas'`, `'Bayar Sebagian'`
4. **service_category**: `'Kiloan'`, `'Satuan'`, `'Sepatu'`, `'Karpet'`
5. **user_role**: `'Super Admin'`, `'Admin'`, `'Kasir'`

## 🚀 Workflow Recommendation

### Fresh Install / Setup Baru

```bash
# Option 1: Setup dari scratch dengan seed data
1. Run: database/setup/0.complete_setup.sql    # Setup schema
2. Run: database/setup/1.seed_data_awal.sql    # Basic seed data
3. Run: database/seeds/seed_*.sql              # Optional: additional seed data

# Option 2: Restore dari backup lengkap
1. Run: database/backup/complete_backup.sql    # Restore schema + data
   # ATAU
   Run: database/backup/full_backup.sql        # Restore alternatif
```

### Development Workflow

```bash
# Reset database dan mulai dari awal
1. supabase db reset                           # Reset database (if using Supabase CLI)
2. Run: database/setup/0.complete_setup.sql    # Setup schema
3. Run: database/setup/1.seed_data_awal.sql    # Seed dengan sample data
```

## 📅 Backup Schedule

Automated backups are created via GitHub Actions workflow on:

- Every push to main branch
- Manual trigger via workflow_dispatch

## 💡 Best Practices

1. **Regular Backups**: Always backup before major schema changes
2. **Test Restores**: Periodically test backup restoration in a dev environment
3. **Version Control**: Keep backups versioned with dates or git tags
4. **Incremental Backups**: For production, use Supabase's built-in backup features
5. **Documentation**: Document any manual data migrations or special procedures

## 📞 Support

For backup/restore issues, see [database/setup/SETUP_GUIDE.md](../setup/SETUP_GUIDE.md) or contact the development team.

---

**Last Updated:** December 18, 2024  
**Status:** ✅ Active

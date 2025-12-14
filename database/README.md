# 📁 Struktur Database

Folder ini berisi file-file setup dan backup database Supabase.

## 📂 Struktur Folder

```
database/
├── backup/              # Backup database
│   ├── full_backup.sql  # Backup lengkap (schema + data)
│   ├── data_1.sql       # Backup lama (referensi)
│   └── database-backup.md  # Panduan backup
│
└── setup/               # Setup database awal
    ├── complete_setup.sql  # ⭐ ALL-IN-ONE setup (RECOMMENDED)
    ├── 0.droptable.sql  # Drop semua tabel
    ├── 1.database.sql   # Schema & trigger
    ├── 2.apply_rpc_and_seed.sql  # RPC & seed data
    ├── 3.security_and_performance.sql  # Security & index
    ├── 4.add_maintenance_mode.sql  # ✨ Fitur maintenance mode
    └── DEPLOYMENT.md    # Panduan deployment
```

## 🚀 Quick Start

### Opsi 1: Setup All-in-One (⭐ RECOMMENDED)

**Jalankan 1 file saja:**

1. Buka Supabase Dashboard → SQL Editor
2. Copy-paste isi file `complete_setup.sql`
3. Run
4. Done! ✅

**File ini sudah include:**

- ✅ Schema & tables
- ✅ Triggers & functions
- ✅ RPC functions
- ✅ Seed data (services)
- ✅ Security policies
- ✅ Performance indexes
- ✅ Maintenance mode

### Opsi 2: Setup Manual (Step-by-Step)

Jika ingin kontrol penuh, jalankan secara berurutan:

1. `0.droptable.sql` - Reset database (opsional)
2. `1.database.sql` - Buat schema & trigger
3. `2.apply_rpc_and_seed.sql` - Tambah RPC & seed data
4. `3.security_and_performance.sql` - Keamanan & optimasi
5. `4.add_maintenance_mode.sql` - Fitur maintenance mode (opsional)

### Backup Database

Lihat [database-backup.md](backup/database-backup.md) untuk panduan lengkap.

---

**Note:** Semua file backup `.sql` (kecuali `full_backup.sql`) di-ignore oleh git.

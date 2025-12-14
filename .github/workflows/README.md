# 🤖 GitHub Actions Workflows

## 📦 backup.yml - Daily Database Backup

Workflow otomatis untuk backup database Supabase setiap hari.

### ⚙️ Konfigurasi

**1. Setup GitHub Secret:**

Di repository GitHub:
1. Buka **Settings** → **Secrets and variables** → **Actions**
2. Klik **New repository secret**
3. Buat secret dengan detail:
   - **Name:** `SUPABASE_DB_URL`
   - **Value:** 
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

**Cara mendapatkan connection string:**
1. Buka Supabase Dashboard → project Anda
2. Pilih **Settings** → **Database**
3. Scroll ke **Connection string**
4. Pilih **URI** mode
5. Copy dan ganti `[YOUR-PASSWORD]` dengan password database Anda

### 🚀 Cara Kerja

**Automatic (Scheduled):**
- Jalan otomatis setiap hari jam **00:00 UTC** (07:00 WIB)
- Membuat file backup: `auto_backup_2025-12-14.sql`
- Commit & push ke folder `database/backup/`
- Upload juga ke GitHub Artifacts (30 hari retention)

**Manual Trigger:**
1. Buka tab **Actions** di GitHub
2. Pilih workflow **Daily Supabase Backup**
3. Klik **Run workflow**
4. Pilih branch → **Run workflow**

### 📁 Output

```
database/backup/
├── auto_backup_2025-12-14.sql
├── auto_backup_2025-12-15.sql
└── auto_backup_2025-12-16.sql
```

### ✅ Fitur

- ✅ Automatic daily backup
- ✅ Manual trigger via workflow_dispatch
- ✅ Commit backup ke repository
- ✅ Upload ke GitHub Artifacts (fallback)
- ✅ Clean dump (no owner, no ACL)
- ✅ 30 hari retention di artifacts

### ⚠️ Perhatian

1. **File size limit:** GitHub repo maksimal 100MB per file
   - Jika database >50MB, pertimbangkan upload ke cloud storage
   
2. **Secrets security:**
   - Jangan commit `SUPABASE_DB_URL` ke code
   - Gunakan GitHub Secrets

3. **Cleanup old backups:**
   - Pertimbangkan hapus backup lama secara manual
   - Atau tambahkan step untuk keep only last 7 backups

### 🔍 Monitoring

**Cek status workflow:**
1. Tab **Actions** di GitHub
2. Lihat run history
3. Cek log jika ada error

**Common issues:**
- ❌ **Secret not found:** Setup `SUPABASE_DB_URL` di GitHub Secrets
- ❌ **Connection failed:** Cek password & connection string
- ❌ **Permission denied:** Pastikan GitHub Actions punya write access

---

**Last Updated:** December 14, 2025

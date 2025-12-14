## 🚀 Backup Database

Panduan untuk melakukan backup database Supabase.

### 📋 Prerequisites
- Supabase CLI terinstall: `npm install -g supabase`
- Database URL dari Supabase Dashboard → Settings → Database → Connection Pooling

### 💾 Backup Lengkap (Schema + Data)
```powershell
supabase db dump --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" -f database/backup/full_backup.sql
```
**Output:** `database/backup/full_backup.sql`

**Catatan:** 
- Ganti `[PASSWORD_ENCODED]` dengan password database yang di-encode URL
- File backup otomatis ditimpa setiap kali menjalankan perintah
- Backup juga berjalan otomatis setiap hari via GitHub Actions (lihat `.github/workflows/backup.yml`)

### 🔄 Restore Database
```powershell
supabase db push --db-url "postgresql://postgres.kxylzjjmakbhzuirvnyd:[PASSWORD_ENCODED]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres" --include-all
```

### 📦 Struktur File Backup
- `full_backup.sql` - Backup lengkap (schema + data) - diperbarui otomatis
- `data_1.sql` - Backup lama (untuk referensi saja)

---

# 🔧 Maintenance Mode - Complete Guide

Fitur maintenance mode memungkinkan Super Admin untuk menonaktifkan akses sistem saat melakukan perbaikan atau update.

---

## 📍 Quick Reference

**Toggle Location:** Settings Page (`/management/settings`) → Scroll ke bagian **Mode Pemeliharaan** (kuning)

**How to Toggle:**

1. Buka halaman **Settings** (`/management/settings`)
2. Scroll ke bagian **Mode Pemeliharaan** (kotak kuning)
3. Toggle switch untuk mengaktifkan/menonaktifkan
4. Klik **Simpan Perubahan**

---

## ✨ Fitur

- ✅ **Hanya Super Admin** yang dapat mengaktifkan/menonaktifkan
- ✅ **Super Admin tetap dapat akses** sistem saat maintenance mode aktif
- ✅ **Kasir dan Admin** akan melihat halaman maintenance yang informatif
- ✅ **Custom message** untuk memberikan informasi lebih detail ke pengguna
- ✅ **UI yang user-friendly** dengan animasi dan informasi lengkap

---

## 🚀 Cara Menggunakan

### 1. Aktifkan Maintenance Mode

**Via UI (Recommended):**

1. Login sebagai **Super Admin**
2. Buka menu **Pengaturan** (`/management/settings`)
3. Scroll ke bagian **Mode Pemeliharaan** (section kuning dengan icon wrench)
4. Centang checkbox **"Aktifkan Mode Pemeliharaan"**
5. (Opsional) Isi **Pesan Pemeliharaan** untuk memberi informasi ke pengguna
6. Klik tombol **Simpan**

**Via Database (Manual):**

```sql
UPDATE public.settings
SET "isMaintenanceMode" = TRUE,
    "maintenanceMessage" = 'Sistem sedang dalam perbaikan. Diperkirakan selesai dalam 30 menit.'
WHERE id = 1;
```

### 2. Matikan Maintenance Mode

**Via UI:**

1. Login sebagai **Super Admin** (Anda tetap bisa akses)
2. Buka menu **Pengaturan**
3. Hilangkan centang pada checkbox **"Aktifkan Mode Pemeliharaan"**
4. Klik tombol **Simpan**

**Via Database:**

```sql
UPDATE public.settings
SET "isMaintenanceMode" = FALSE
WHERE id = 1;
```

---

## 🎨 Tampilan Maintenance Mode

Ketika mode maintenance aktif, pengguna (kecuali Super Admin) akan melihat:

- **Header** dengan gradient kuning-orange dan icon wrench
- **Judul** "Mode Pemeliharaan" yang jelas
- **Pesan custom** (jika diisi) atau pesan default
- **3 Section informasi:**
  - Apa yang sedang terjadi?
  - Kapan sistem akan kembali normal?
  - Data Anda Aman
- **Tombol Refresh** untuk muat ulang halaman
- **Loading indicator** animasi

---

## 📋 Use Cases

### Scenario 1: Update Database

```
1. Aktifkan maintenance mode dengan pesan:
   "Sedang melakukan update database. Estimasi 15 menit."
2. Lakukan migrasi database
3. Test fitur baru
4. Matikan maintenance mode
```

### Scenario 2: Perbaikan Bug Kritis

```
1. Aktifkan maintenance mode dengan pesan:
   "Memperbaiki bug pada sistem pembayaran. Mohon tunggu."
2. Deploy fix
3. Verifikasi fix bekerja
4. Matikan maintenance mode
```

### Scenario 3: Maintenance Terjadwal

```
1. Informasikan ke pengguna sebelumnya
2. Aktifkan maintenance mode dengan pesan:
   "Maintenance terjadwal. Sistem akan kembali normal pukul 15:00 WIB."
3. Lakukan maintenance
4. Matikan maintenance mode
```

---

## 🔒 Keamanan

### Akses Control

- ✅ Hanya **Super Admin** yang melihat toggle maintenance di Settings
- ✅ Hanya **Super Admin** yang dapat bypass maintenance mode
- ✅ Admin dan Kasir tidak dapat mengubah setting ini

### Data Protection

- ✅ Tidak ada data yang hilang saat maintenance mode aktif
- ✅ User yang sedang bekerja akan di-redirect ke halaman maintenance
- ✅ Setting tersimpan di database dan persist

---

## 🧪 Testing

### Manual Testing

1. Login sebagai Super Admin
2. Aktifkan maintenance mode
3. Buka tab incognito/private
4. Login sebagai Kasir atau Admin
5. Verifikasi muncul halaman maintenance
6. Kembali ke tab Super Admin
7. Verifikasi Anda masih bisa akses sistem
8. Matikan maintenance mode
9. Refresh tab Kasir/Admin
10. Verifikasi sistem kembali normal

### Automated Testing

```bash
npm run test MaintenanceMode.test.tsx
```

---

## 📁 File Changes

### New Files:

- `src/components/MaintenanceMode.tsx` - Komponen UI maintenance mode
- `src/components/MaintenanceMode.test.tsx` - Unit tests
- `database/setup/4.add_maintenance_mode.sql` - Database migration
- `docs/MAINTENANCE_MODE.md` - Dokumentasi ini

### Modified Files:

- `src/types/index.ts` - Tambah `isMaintenanceMode` & `maintenanceMessage` di Settings
- `src/App.tsx` - Logic untuk check & tampilkan maintenance mode
- `src/pages/management/SettingsPage.tsx` - UI toggle maintenance mode
- `database/README.md` - Update struktur file

---

## ⚙️ Database Schema

```sql
-- Kolom baru di tabel settings
ALTER TABLE public.settings
ADD COLUMN "isMaintenanceMode" boolean DEFAULT FALSE;

ALTER TABLE public.settings
ADD COLUMN "maintenanceMessage" text;
```

---

## 🎯 Best Practices

1. **Informasi Jelas**: Selalu isi pesan maintenance dengan estimasi waktu
2. **Komunikasi**: Informasikan ke tim sebelum aktifkan maintenance
3. **Timing**: Pilih waktu low-traffic untuk maintenance
4. **Backup**: Selalu backup database sebelum maintenance
5. **Testing**: Test fitur baru di staging sebelum production
6. **Quick Toggle**: Siapkan akses cepat untuk matikan jika ada masalah

---

## 🐛 Troubleshooting

**Q: Maintenance mode tidak muncul setelah diaktifkan?**

- A: Refresh browser atau clear cache

**Q: Super Admin juga kena maintenance mode?**

- A: Periksa role user di database, pastikan `role = 'Super Admin'`

**Q: Tidak bisa matikan maintenance mode?**

- A: Gunakan database query manual atau restart aplikasi

**Q: Pesan maintenance tidak update?**

- A: Clear browser cache atau hard refresh (Ctrl+Shift+R)

---

## 📞 Support

Untuk pertanyaan atau masalah terkait maintenance mode:

- Email: mhmdnvn18@gmail.com
- Dokumentasi: [README.md](../README.md)

---

**Dibuat:** 14 Desember 2025  
**Versi:** 2.0.0

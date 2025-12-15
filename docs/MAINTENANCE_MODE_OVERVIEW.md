# 🔧 MAINTENANCE MODE - Feature Overview

## 🎯 What is Maintenance Mode?

Fitur yang memungkinkan **Super Admin** untuk menonaktifkan akses sistem saat melakukan perbaikan, update database, atau maintenance terjadwal.

---

## ✨ Key Features

| Feature                  | Description                                 | Status |
| ------------------------ | ------------------------------------------- | ------ |
| **Smart Access Control** | Hanya Super Admin yang bisa toggle & bypass | ✅     |
| **Beautiful UI**         | Gradient design dengan animasi              | ✅     |
| **Custom Messages**      | Informasikan detail maintenance ke user     | ✅     |
| **Zero Data Loss**       | Tidak ada data hilang saat maintenance      | ✅     |
| **Dark Mode**            | Support light & dark theme                  | ✅     |
| **Mobile Responsive**    | Optimal di semua device                     | ✅     |
| **Easy Toggle**          | Aktif/nonaktif dengan 1 checkbox            | ✅     |

---

## 📸 Screenshots

### 1. Settings Page (Super Admin View)

```
┌──────────────────────────────────────────────┐
│ 🔧 Mode Pemeliharaan                         │
│ Aktifkan saat melakukan perbaikan sistem     │
├──────────────────────────────────────────────┤
│ ☑️ Aktifkan Mode Pemeliharaan                │
│                                              │
│ ⚠️ Pesan Pemeliharaan (Opsional)            │
│ ┌──────────────────────────────────────┐   │
│ │ Sistem sedang diperbaiki...          │   │
│ │ Estimasi selesai: 30 menit           │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ [💾 Simpan]                                  │
└──────────────────────────────────────────────┘
```

### 2. Maintenance Page (User View)

```
┌────────────────────────────────────────────────┐
│                    🔧                          │
│         MODE PEMELIHARAAN                      │
│         Maintenance Mode                       │
├────────────────────────────────────────────────┤
│                                                │
│ ⚠️ Sistem Tidak Tersedia Sementara            │
│    Sistem sedang dalam perbaikan.              │
│    Mohon tunggu beberapa saat.                 │
│                                                │
│ ℹ️  Apa yang sedang terjadi?                   │
│    Tim kami sedang melakukan pemeliharaan...   │
│                                                │
│ ⏰ Kapan sistem akan kembali normal?           │
│    Pemeliharaan biasanya 15-30 menit.          │
│                                                │
│ ✅ Data Anda Aman                              │
│    Semua data tersimpan dengan aman.           │
│                                                │
│ [🔄 Muat Ulang Halaman]                        │
│                                                │
│ Terima kasih atas kesabaran Anda 🙏            │
└────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### For Super Admin:

**Mengaktifkan Maintenance:**

1. Login sebagai Super Admin
2. Buka menu **Pengaturan**
3. Scroll ke **Mode Pemeliharaan** (section kuning)
4. ☑️ Centang "Aktifkan Mode Pemeliharaan"
5. (Opsional) Isi pesan custom
6. Klik **Simpan**

**Menonaktifkan:**

1. Buka menu **Pengaturan** (Anda tetap bisa akses)
2. ☐ Hilangkan centang
3. Klik **Simpan**

### For Emergency (SQL):

```sql
-- Emergency disable (jika UI tidak bisa diakses)
UPDATE public.settings
SET "isMaintenanceMode" = FALSE
WHERE id = 1;
```

---

## 👥 User Experience

### Super Admin

- ✅ Dapat mengaktifkan/menonaktifkan
- ✅ Tetap bisa akses sistem saat maintenance
- ✅ Melihat toggle di Settings page

### Admin

- ❌ Tidak bisa toggle
- ❌ Tidak bisa akses saat maintenance
- ✅ Melihat halaman maintenance

### Kasir

- ❌ Tidak bisa toggle
- ❌ Tidak bisa akses saat maintenance
- ✅ Melihat halaman maintenance

---

## 💡 Use Cases

### 1. Database Update

```
Scenario: Update struktur database
Duration: 15-30 menit
Message: "Sedang melakukan update database.
         Estimasi selesai dalam 30 menit."
```

### 2. Bug Fix Deployment

```
Scenario: Deploy critical bug fix
Duration: 5-10 menit
Message: "Memperbaiki bug pada sistem pembayaran.
         Mohon tunggu beberapa saat."
```

### 3. Scheduled Maintenance

```
Scenario: Maintenance terjadwal
Duration: 1-2 jam
Message: "Maintenance terjadwal.
         Sistem kembali normal pukul 15:00 WIB."
```

---

## 📊 Technical Details

### Database Schema

```sql
ALTER TABLE public.settings
ADD COLUMN "isMaintenanceMode" boolean DEFAULT FALSE;

ALTER TABLE public.settings
ADD COLUMN "maintenanceMessage" text;
```

### Component Hierarchy

```
App.tsx
├── Check isMaintenanceMode
├── Check user role
└── Render:
    ├── MaintenanceMode (if enabled && not SuperAdmin)
    └── Normal Routes (otherwise)
```

### Access Logic

```typescript
const isMaintenanceMode = settings?.isMaintenanceMode && currentUser?.role !== UserRole.SuperAdmin;
```

---

## 📚 Documentation

| Document           | Purpose                          | Link                                                                       |
| ------------------ | -------------------------------- | -------------------------------------------------------------------------- |
| **Full Guide**     | Panduan lengkap dengan use cases | [MAINTENANCE_MODE.md](./MAINTENANCE_MODE.md)                               |
| **Quick Ref**      | Referensi cepat                  | [MAINTENANCE_MODE_QUICK.md](./MAINTENANCE_MODE_QUICK.md)                   |
| **Implementation** | Detail implementasi              | [MAINTENANCE_MODE_IMPLEMENTATION.md](./MAINTENANCE_MODE_IMPLEMENTATION.md) |

---

## ✅ Testing Checklist

Before going live, verify:

- [ ] Super Admin dapat toggle ON/OFF
- [ ] Super Admin tetap akses saat ON
- [ ] Kasir melihat maintenance page saat ON
- [ ] Admin melihat maintenance page saat ON
- [ ] Custom message ditampilkan dengan benar
- [ ] Tombol refresh berfungsi
- [ ] Semua user bisa akses setelah OFF
- [ ] Dark mode bekerja normal
- [ ] Mobile responsive
- [ ] Setting tersimpan di database

---

## 🎨 Design Highlights

**Colors:**

- 🟨 Yellow/Orange gradient for warmth
- ⚠️ Alert indicators for visibility
- 🔵 Blue accents for actions
- 🌙 Dark mode compatible

**Animations:**

- Pulse effect on wrench icon
- Bounce effect on loading dots
- Smooth transitions
- Hover effects on buttons

**UX:**

- Clear messaging
- Visual hierarchy
- Action-oriented CTAs
- Progress indicators

---

## 🔐 Security

✅ **Role-Based Access:** Super Admin only
✅ **Server-Side Check:** Validated on every request
✅ **No Bypass:** Even direct URL access blocked
✅ **Data Protection:** All data safe during maintenance

---

## 🆘 Support

**Need Help?**

- 📧 Email: mhmdnvn18@gmail.com
- 📖 Full Docs: [MAINTENANCE_MODE.md](./MAINTENANCE_MODE.md)
- 🐛 Issues: Create issue di repository

---

**Feature Version:** 2.0.0  
**Release Date:** December 14, 2025  
**Status:** ✅ Production Ready

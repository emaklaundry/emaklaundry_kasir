# WhatsApp Footer Custom Message

## Overview

Fitur untuk mengatur custom footer pesan WhatsApp yang dikirim ke pelanggan. Admin dapat mengubah link tracking dan form feedback sesuai kebutuhan.

## Bagian yang Dapat Dikustomisasi

Default footer:

```
🔍 Cek status cucian Anda:
https://www.emaklaundry.my.id/

💬 Bantu kami lebih baik! Berikan kritik & saran:
https://forms.gle/8JnjZZ4cu5oTXGYr9
```

## Cara Menggunakan

### 1. Database

Kolom `settings."whatsappFooter"` sudah termasuk di `supabase/setup/0.complete_setup.sql`
(Section 4). Tidak perlu SQL tambahan.

### 2. Ubah di halaman Pengaturan

1. Login sebagai Super Admin atau Admin
2. Buka **Sistem & Keamanan → Pengaturan**
3. Scroll ke bagian **Footer Pesan WhatsApp**
4. Edit teks sesuai kebutuhan
5. Klik **Simpan**

### 3. Footer akan otomatis muncul di pesan WhatsApp

- Status: Processing ✅
- Status: Ready ✅
- Status: Completed ✅

## Database Schema

```sql
settings {
  id: bigint
  receiptMessage: text
  storeId: uuid
  isMaintenanceMode: boolean
  maintenanceMessage: text
  whatsappFooter: text
  qrisStaticCode: text   -- kode QRIS statis (Section 13)
}
```

## Files Modified

- `src/types/index.ts` - Added whatsappFooter field
- `src/pages/management/SettingsPage.tsx` - Added UI for editing
- `src/components/WhatsAppModal.tsx` - Use custom footer
- `supabase/setup/0.complete_setup.sql` - Kolom `whatsappFooter`

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

### 1. Update Database
Jalankan migration di Supabase SQL Editor:
```sql
-- File: database/setup/5.add_whatsapp_footer.sql
```

Atau jalankan manual:
```sql
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS "whatsappFooter" text;
```

### 2. Ubah di Settings Page
1. Login sebagai Super Admin atau Admin
2. Buka **Pengaturan Aplikasi**
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
  taxRate: numeric
  discountRate: numeric
  isMaintenanceMode: boolean
  maintenanceMessage: text
  whatsappFooter: text  ← NEW
}
```

## Files Modified
- `src/types/index.ts` - Added whatsappFooter field
- `src/pages/management/SettingsPage.tsx` - Added UI for editing
- `src/components/WhatsAppModal.tsx` - Use custom footer
- `database/setup/complete_setup.sql` - Added column
- `database/setup/5.add_whatsapp_footer.sql` - Migration script

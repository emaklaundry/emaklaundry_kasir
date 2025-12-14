-- ============================================
-- MIGRATION: Add WhatsApp Footer to Settings
-- Date: December 15, 2025
-- ============================================

-- Tambah kolom whatsappFooter untuk custom footer pesan WhatsApp
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS "whatsappFooter" text;

-- Tambah comment untuk dokumentasi
COMMENT ON COLUMN public.settings."whatsappFooter" IS 'Footer custom untuk pesan WhatsApp (tracking link & feedback form). Jika kosong, akan menggunakan default.';

-- Set default value untuk existing row (opsional)
UPDATE public.settings 
SET "whatsappFooter" = '🔍 Cek status cucian Anda:
https://www.emaklaundry.my.id/

💬 Bantu kami lebih baik! Berikan kritik & saran:
https://forms.gle/8JnjZZ4cu5oTXGYr9'
WHERE "whatsappFooter" IS NULL;

-- Verifikasi
SELECT id, "whatsappFooter" 
FROM public.settings 
LIMIT 1;

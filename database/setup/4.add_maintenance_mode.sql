-- Migration: Add Maintenance Mode to Settings
-- Date: December 14, 2025
-- Description: Tambah kolom isMaintenanceMode dan maintenanceMessage ke tabel settings

-- Tambah kolom isMaintenanceMode (default FALSE)
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS "isMaintenanceMode" boolean DEFAULT FALSE;

-- Tambah kolom maintenanceMessage (opsional)
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS "maintenanceMessage" text;

-- Tambah comment untuk dokumentasi
COMMENT ON COLUMN public.settings."isMaintenanceMode" IS 'Flag untuk mengaktifkan mode pemeliharaan sistem. Hanya Super Admin yang dapat akses saat aktif.';
COMMENT ON COLUMN public.settings."maintenanceMessage" IS 'Pesan custom yang ditampilkan saat sistem dalam mode pemeliharaan.';

-- Update existing settings row jika ada (set default values)
UPDATE public.settings 
SET "isMaintenanceMode" = FALSE
WHERE "isMaintenanceMode" IS NULL;

-- Verifikasi
SELECT id, "isMaintenanceMode", "maintenanceMessage" 
FROM public.settings 
LIMIT 1;

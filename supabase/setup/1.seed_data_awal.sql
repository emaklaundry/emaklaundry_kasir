-- ============================================
-- LAUNDRY MANAGEMENT SYSTEM - SEED DATA
-- Sample Data untuk Testing & Development
-- Version: 2.1.0
-- Date: December 26, 2024
-- ============================================
--
-- IMPORTANT: File ini berisi data contoh/sample
-- - Stores (cabang)
-- - Users (profiles)  
-- - Settings (pengaturan awal)
--
-- DATA LAINNYA sudah dipindahkan ke folder supabase/seeds/:
-- - Services → seed_services.sql
-- - Inventory → seed_inventory.sql
-- - Assets → seed_assets.sql
-- - Maintenances → seed_maintenances.sql
--
-- GUNAKAN untuk:
-- - Development & Testing
-- - Demo purposes
-- - Initial data setup
--
-- JANGAN GUNAKAN untuk:
-- - Production dengan data real
-- - Setelah ada data transaksi aktif
-- ============================================

-- ============================================
-- 1. STORES (Cabang)
-- ============================================

-- Cabang: Cimenyan, Kota Banjar
-- UUID: 9b7e1c2a-1234-4bcd-8e9f-abcdef123456

-- 1.1 Add Coordinates Columns (Idempotent)
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

INSERT INTO public.stores (id, name, address, "isActive", latitude, longitude, "bmkgAdm4")
VALUES (
  '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', 
  'Cimenyan, Kota Banjar', 
  'Kota Banjar', 
  true,
  -7.372186953412669,
  108.53945949758317,
  '32.79.01.1002' -- BMKG: Kel. Mekarsari, Kec. Banjar
)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  "bmkgAdm4" = EXCLUDED."bmkgAdm4";


-- ============================================
-- 2. USERS (Profiles)
-- ============================================
-- CATATAN: User harus sudah dibuat di Supabase Auth terlebih dahulu
-- dengan ID yang sama seperti di bawah

-- Super Admin
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('11c86333-295c-4bd9-9302-a69fda4811c0', 'Anop', 'Super Admin', NULL)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Test Super Admin
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('271ba75d-69c3-43e7-a3ba-3421e51f4045', 'superadmintest', 'Super Admin', NULL)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- TEST ADMIN
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('aeb2315d-c43b-446d-aa61-24f483d4742a', 'admintest', 'Admin', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Admin Cabang Kota Banjar
-- Email: admin@emaklaundry.com
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('0bbe08f0-2cbc-40d9-b2ec-5a2d3ba99c0e', 'emaklaundry', 'Admin', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role;



-- -- Kasir 1: YOPI
-- INSERT INTO public.profiles (id, name, role, store_id)
-- VALUES ('e0efe954-3fcc-4688-a78d-45640228df47', 'YOPI', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
-- ON CONFLICT (id) DO UPDATE SET 
--   name = EXCLUDED.name,
--   role = EXCLUDED.role;

-- -- Kasir 2: ani
-- INSERT INTO public.profiles (id, name, role, store_id)
-- VALUES ('2c093716-8e1e-4237-92a2-04cd5ef2658b', 'ani', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
-- ON CONFLICT (id) DO UPDATE SET 
--   name = EXCLUDED.name,
--   role = EXCLUDED.role;

-- -- Kasir 3: didi
-- INSERT INTO public.profiles (id, name, role, store_id)
-- VALUES ('8cbdd6f3-ee72-4500-b2c8-b6401ed6c053', 'didi', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
-- ON CONFLICT (id) DO UPDATE SET 
--   name = EXCLUDED.name,
--   role = EXCLUDED.role;


-- ============================================
-- 3. SETTINGS (Pengaturan Awal)
-- ============================================

-- Insert default settings untuk Cabang Kota Banjar
INSERT INTO public.settings (
  "receiptMessage", 
  "storeId",
  "isMaintenanceMode",
  "maintenanceMessage",
  "whatsappFooter"
) 
VALUES (
  'Terima kasih telah laundry di tempat kami!', 
  '9b7e1c2a-1234-4bcd-8e9f-abcdef123456',
  FALSE,
  NULL,
  '🔍 Cek status cucian Anda:
https://www.emaklaundry.my.id/

💬 Bantu kami lebih baik! Berikan kritik & saran:
https://forms.gle/8JnjZZ4cu5oTXGYr9'
)
ON CONFLICT ON CONSTRAINT settings_pkey DO UPDATE SET
  "receiptMessage" = EXCLUDED."receiptMessage",
  "whatsappFooter" = EXCLUDED."whatsappFooter";


-- ============================================
-- VERIFICATION
-- ============================================

-- Verifikasi data yang sudah di-insert
DO $$
BEGIN
  RAISE NOTICE 'Verifikasi Basic Seed Data:';
  RAISE NOTICE '- Stores: % records', (SELECT COUNT(*) FROM public.stores);
  RAISE NOTICE '- Profiles: % records', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE '- Settings: % records', (SELECT COUNT(*) FROM public.settings);
  RAISE NOTICE '';
  RAISE NOTICE 'Untuk Services, Inventory, Assets, dan Maintenances:';
  RAISE NOTICE 'Silakan jalankan file di folder supabase/seeds/';
END $$;

-- Query untuk cek data
SELECT 'Stores' as table_name, COUNT(*)::text as records FROM public.stores
UNION ALL
SELECT 'Profiles', COUNT(*)::text FROM public.profiles
UNION ALL
SELECT 'Settings', COUNT(*)::text FROM public.settings;

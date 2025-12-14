-- ============================================
-- LAUNDRY MANAGEMENT SYSTEM - SEED DATA
-- Sample Data untuk Testing & Development
-- Version: 1.0.0
-- Date: December 15, 2025
-- ============================================
--
-- IMPORTANT: File ini berisi data contoh/sample
-- - Stores (cabang)
-- - Users (profiles)  
-- - Services (daftar layanan)
-- - Settings (pengaturan awal)
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

-- Cabang: Kota Banjar
-- UUID: 9b7e1c2a-1234-4bcd-8e9f-abcdef123456
INSERT INTO public.stores (id, name, address, "isActive")
VALUES ('9b7e1c2a-1234-4bcd-8e9f-abcdef123456', 'Cabang Kota Banjar', 'Kota Banjar', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  address = EXCLUDED.address;


-- ============================================
-- 2. USERS (Profiles)
-- ============================================
-- CATATAN: User harus sudah dibuat di Supabase Auth terlebih dahulu
-- dengan ID yang sama seperti di bawah

-- Super Admin
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('11c86333-295c-4bd9-9302-a69fda4811c0', 'Super Admin', 'Super Admin', NULL)
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

-- Kasir 1: YOPI
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('e0efe954-3fcc-4688-a78d-45640228df47', 'YOPI', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Kasir 2: ani
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('2c093716-8e1e-4237-92a2-04cd5ef2658b', 'ani', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Kasir 3: didi
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('8cbdd6f3-ee72-4500-b2c8-b6401ed6c053', 'didi', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Kasir 4: lilis
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('7b13d493-23ea-49a0-99cf-133ed7ecf05e', 'lilis', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role;


-- ============================================
-- 3. SERVICES (Daftar Layanan)
-- ============================================

-- Create unique index untuk prevent duplicate
CREATE UNIQUE INDEX IF NOT EXISTS services_name_store_idx 
  ON public.services (lower(name), "storeId");

-- Insert/Update services untuk Cabang Kota Banjar
WITH target_store AS (
  SELECT id FROM public.stores
  WHERE id = '9b7e1c2a-1234-4bcd-8e9f-abcdef123456' 
     OR name ILIKE 'Cabang Kota Banjar'
  LIMIT 1
)
INSERT INTO public.services (name, category, price, unit, "durationDays", "storeId")
SELECT 
  v.name, 
  v.category::public.service_category, 
  v.price, 
  v.unit, 
  v.duration, 
  ts.id
FROM (
  VALUES
    -- KILOAN
    ('Campuran','Kiloan',10000,'kg',1),
    ('Cuci dan lipat (min. 3 kg) - 1 hari','Kiloan',8000,'kg',1),
    ('Cuci dan lipat (min. 3 kg) - 2 hari','Kiloan',6000,'kg',2),
    ('Cuci dan setrika (min. 3 kg) - 3 hari','Kiloan',5000,'kg',3),
    ('Cuci dan setrika (min. 2 kg) - 2 hari','Kiloan',13000,'kg',2),
    ('Cuci dan setrika (min. 2 kg) - 3 hari','Kiloan',7500,'kg',3),
    ('Cuci dan setrika (min. 2 kg) - 6 jam (ekspres)','Kiloan',20000,'kg',0),
    ('Cuci ekspres - 3 jam','Kiloan',25000,'kg',0),
    ('Cuci lipat mitra laundry','Kiloan',4000,'kg',1),
    ('Cuci dan setrika (min. 2 kg) - 1 hari','Kiloan',15000,'kg',1),
    ('Fitrase','Kiloan',15000,'kg',1),
    ('Gorden','Kiloan',10000,'kg',1),
    ('Karpet cendol','Kiloan',10000,'kg',1),
    ('Karpet permadani','Kiloan',15000,'kg',1),
    ('Karpet tipis','Kiloan',10000,'kg',1),
    ('Kasur busa/lantai','Kiloan',10000,'kg',1),
    ('Kasur Palembang','Kiloan',10000,'kg',1),
    ('Lain-lain','Kiloan',8000,'kg',1),
    ('Mitra cuci komplit','Kiloan',5500,'kg',1),
    ('Mitra setrika','Kiloan',3000,'kg',1),
    ('Setrika saja (min. 3 kg)','Kiloan',5000,'kg',1),
    ('Sprei (kiloan)','Kiloan',10000,'kg',1),
    ('Surpet','Kiloan',10000,'kg',1),
    ('Tikar','Kiloan',10000,'kg',1),
    
    -- KARPET
    ('Karpet tebal (per m)','Karpet',12000,'m2',2),
    ('Karpet tipis / masjid (per m)','Karpet',7000,'m2',2),
    
    -- SATUAN
    ('Bantal','Satuan',15000,'pcs',1),
    ('Bed cover','Satuan',18000,'pcs',1),
    ('Bed cover jumbo/besar','Satuan',25000,'pcs',1),
    ('Bedcover','Satuan',25000,'pcs',1),
    ('Blus','Satuan',20000,'pcs',1),
    ('Boneka/bantal bulu','Satuan',12000,'pcs',1),
    ('Boneka besar','Satuan',25000,'pcs',1),
    ('Boneka jumbo','Satuan',30000,'pcs',1),
    ('Boneka kecil','Satuan',10000,'pcs',1),
    ('Boneka sedang','Satuan',15000,'pcs',1),
    ('Celana panjang','Satuan',15000,'pcs',1),
    ('Celana pendek','Satuan',7500,'pcs',1),
    ('Gamis panjang / dress','Satuan',25000,'pcs',1),
    ('Guling','Satuan',15000,'pcs',1),
    ('Guling kecil','Satuan',6000,'pcs',1),
    ('Jaket jeans','Satuan',15000,'pcs',1),
    ('Jaket kain','Satuan',15000,'pcs',1),
    ('Jaket kulit','Satuan',20000,'pcs',1),
    ('Jas Kaos','Satuan',10000,'pcs',1),
    ('Jas pendek','Satuan',18000,'pcs',1),
    ('Kaus oblong','Satuan',8000,'pcs',1),
    ('Kaus singlet','Satuan',7500,'pcs',1),
    ('Kemeja','Satuan',15000,'pcs',1),
    ('Keset','Satuan',12000,'pcs',1),
    ('Keset besar','Satuan',20000,'pcs',1),
    ('Menghilangkan noda (tinta, darah, minyak)','Satuan',10000,'pcs',1),
    ('Mukena','Satuan',10000,'pcs',1),
    ('Noda di baju','Satuan',15000,'pcs',1),
    ('Rompi','Satuan',15000,'pcs',1),
    ('Sajadah tebal','Satuan',10000,'pcs',1),
    ('Selimut','Satuan',17000,'pcs',1),
    ('Selimut jumbo','Satuan',25000,'pcs',1),
    ('Sepatu','Satuan',20000,'pcs',1),
    ('Sepatu (Kets)','Satuan',20000,'pcs',1),
    ('Setelan jas lengan panjang','Satuan',25000,'pcs',1),
    ('Setelan jas lengan pendek','Satuan',20000,'pcs',1),
    ('Sprei satuan','Satuan',15000,'pcs',1),
    ('Tas besar','Satuan',20000,'pcs',1),
    ('Tas kecil','Satuan',12000,'pcs',1),
    ('Pakaian dalam','Satuan',2500,'pcs',1)
) AS v(name, category, price, unit, duration)
CROSS JOIN target_store ts
ON CONFLICT (lower(name), "storeId") DO UPDATE SET
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays",
  category = EXCLUDED.category;


-- ============================================
-- 4. SETTINGS (Pengaturan Awal)
-- ============================================

-- Insert default settings untuk Cabang Kota Banjar
INSERT INTO public.settings (
  "receiptMessage", 
  "taxRate", 
  "discountRate", 
  "storeId",
  "isMaintenanceMode",
  "maintenanceMessage",
  "whatsappFooter"
) 
VALUES (
  'Terima kasih telah laundry di tempat kami!', 
  0, 
  0, 
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
  RAISE NOTICE 'Verifikasi Seed Data:';
  RAISE NOTICE '- Stores: % records', (SELECT COUNT(*) FROM public.stores);
  RAISE NOTICE '- Profiles: % records', (SELECT COUNT(*) FROM public.profiles);
  RAISE NOTICE '- Services: % records', (SELECT COUNT(*) FROM public.services);
  RAISE NOTICE '- Settings: % records', (SELECT COUNT(*) FROM public.settings);
END $$;

-- Query untuk cek data
SELECT 'Stores' as table_name, COUNT(*)::text as records FROM public.stores
UNION ALL
SELECT 'Profiles', COUNT(*)::text FROM public.profiles
UNION ALL
SELECT 'Services', COUNT(*)::text FROM public.services
UNION ALL
SELECT 'Settings', COUNT(*)::text FROM public.settings;

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
-- - Inventory Items (stok barang)
-- - Assets (aset & peralatan)
-- - Scheduled Maintenances (jadwal pemeliharaan)
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
-- 5. INVENTORY ITEMS (Stok Barang)
-- ============================================

-- ID 1: Sabun Soklin Liquid
INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111111', 'Sabun Soklin Liquid', 18, 4, 'Jerigen (5 Liter)', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;

-- ID 2: Parfum Laundry Sakura
INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111112', 'Parfum Laundry Sakura', 25, 5, 'Botol (1 Liter)', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;

-- ID 3: Plastik Packing 35x50
INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111113', 'Plastik Packing 35x50', 5, 2, 'Pack (50 lembar)', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;

-- ID 4: Gas LPG 3kg
INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111114', 'Gas LPG 3kg', 6, 2, 'Tabung', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;

-- ID 5: Label Tag Anti Air
INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES 
  ('a1b2c3d4-1111-4444-8888-111111111115', 'Label Tag Anti Air', 10, 2, 'Roll', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;


-- ============================================
-- 6. ASSETS (Aset & Peralatan)
-- ============================================

-- ID 101: Mesin Cuci LG Front Load 20kg (dengan maintenance history)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222101', 'Mesin Cuci LG Front Load 20kg', 'LG-COM-101', '2023-01-15', 18500000, 'Active', 
   '[{"date": "2023-11-05", "description": "Servis berkala deep cleaning drum (descaling)", "cost": 200000, "technician": "Internal Staff", "status": "Completed"}]'::jsonb, 
   '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status,
  "maintenanceHistory" = EXCLUDED."maintenanceHistory";

-- ID 102: Mesin Pengering Maytag Commercial (dengan maintenance history)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222102', 'Mesin Pengering Maytag Commercial', 'MAYTAG-MDG20-102', '2023-01-20', 22000000, 'Active', 
   '[{"date": "2023-06-15", "description": "Pembersihan lint filter dan pengecekan selang gas", "cost": 150000, "technician": "Budi Teknik", "status": "Completed"}]'::jsonb, 
   '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status,
  "maintenanceHistory" = EXCLUDED."maintenanceHistory";

-- ID 103: Setrika Uap Boiler 15L Maomoto (dengan maintenance history)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222103', 'Setrika Uap Boiler 15L Maomoto', 'MAOMOTO-15L-103', '2023-02-10', 3500000, 'Under Maintenance', 
   '[{"date": "2023-08-20", "description": "Penggantian safety valve yang lemah", "cost": 250000, "technician": "Service Maomoto", "status": "Completed"}, {"date": "2024-01-12", "description": "Kebocoran pada kran output uap", "cost": 0, "technician": "Pending", "status": "Scheduled"}]'::jsonb, 
   '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status,
  "maintenanceHistory" = EXCLUDED."maintenanceHistory";

-- ID 104: Komputer Kasir & Printer
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222104', 'Komputer Kasir & Printer (Paket POS Epson)', 'EPSON-POS-104', '2023-01-10', 4500000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;

-- ID 105: Mesin Cuci Samsung WW70T3020WW (Unit 1)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222105', 'Mesin Cuci Samsung WW70T3020WW', 'SAM-WW70-105', '2024-05-01', 3800000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;

-- ID 106: Mesin Cuci Samsung WW70T3020WW (Unit 2)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222106', 'Mesin Cuci Samsung WW70T3020WW', 'SAM-WW70-106', '2024-05-01', 3800000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;

-- ID 107: Mesin Cuci Electrolux EWF800 (Unit 1)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222107', 'Mesin Cuci Electrolux EWF800', 'ELX-EWF800-107', '2024-06-10', 5500000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;

-- ID 108: Mesin Cuci Electrolux EWF800 (Unit 2)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222108', 'Mesin Cuci Electrolux EWF800', 'ELX-EWF800-108', '2024-06-10', 5500000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;

-- ID 109: Mesin Polisher Karpet
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222109', 'Mesin Polisher Karpet', 'BRANDX-POLISH-109', '2024-07-20', 7500000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;

-- ID 110: Vacuum Cleaner Wet and Dry
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222110', 'Vacuum Cleaner Wet and Dry Flexio Power 1400W', 'FLEXIO-1400-110', '2024-07-20', 1100000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;


-- ============================================
-- 7. SCHEDULED MAINTENANCES (Jadwal Pemeliharaan)
-- ============================================

-- Maintenance Mesin Cuci LG 20kg
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333331', 'b2c3d4e5-2222-5555-9999-222222222101', 'Deep cleaning drum dan descaling', 3, 'months', '2025-02-05', '2023-11-05')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Mesin Pengering Maytag
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333332', 'b2c3d4e5-2222-5555-9999-222222222102', 'Pembersihan lint filter dan pengecekan selang gas', 2, 'months', '2025-01-15', '2023-06-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Setrika Uap Boiler (Pending repair)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333333', 'b2c3d4e5-2222-5555-9999-222222222103', 'Perbaikan kebocoran kran output uap', 1, 'weeks', '2024-01-19', NULL)
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Mesin Cuci Samsung (Unit 1)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333334', 'b2c3d4e5-2222-5555-9999-222222222105', 'Pembersihan filter dan drum', 2, 'months', '2025-01-01', '2024-11-01')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Mesin Cuci Samsung (Unit 2)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333335', 'b2c3d4e5-2222-5555-9999-222222222106', 'Pembersihan filter dan drum', 2, 'months', '2025-01-01', '2024-11-01')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Mesin Cuci Electrolux (Unit 1)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333336', 'b2c3d4e5-2222-5555-9999-222222222107', 'Pembersihan filter dan drum', 2, 'months', '2025-02-10', '2024-12-10')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Mesin Cuci Electrolux (Unit 2)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333337', 'b2c3d4e5-2222-5555-9999-222222222108', 'Pembersihan filter dan drum', 2, 'months', '2025-02-10', '2024-12-10')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Mesin Polisher Karpet
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333338', 'b2c3d4e5-2222-5555-9999-222222222109', 'Pembersihan brush dan filter', 1, 'months', '2025-02-20', '2025-01-20')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Vacuum Cleaner
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333339', 'b2c3d4e5-2222-5555-9999-222222222110', 'Pembersihan filter dan cek motor', 1, 'months', '2025-02-20', '2025-01-20')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";

-- Maintenance Komputer Kasir & Printer
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333340', 'b2c3d4e5-2222-5555-9999-222222222104', 'Cleaning printer head dan system check', 6, 'months', '2025-07-10', '2025-01-10')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate";


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
  RAISE NOTICE '- Inventory Items: % records', (SELECT COUNT(*) FROM public.inventory_items);
  RAISE NOTICE '- Assets: % records', (SELECT COUNT(*) FROM public.assets);
  RAISE NOTICE '- Scheduled Maintenances: % records', (SELECT COUNT(*) FROM public.scheduled_maintenances);
END $$;

-- Query untuk cek data
SELECT 'Stores' as table_name, COUNT(*)::text as records FROM public.stores
UNION ALL
SELECT 'Profiles', COUNT(*)::text FROM public.profiles
UNION ALL
SELECT 'Services', COUNT(*)::text FROM public.services
UNION ALL
SELECT 'Settings', COUNT(*)::text FROM public.settings
UNION ALL
SELECT 'Inventory Items', COUNT(*)::text FROM public.inventory_items
UNION ALL
SELECT 'Assets', COUNT(*)::text FROM public.assets
UNION ALL
SELECT 'Scheduled Maintenances', COUNT(*)::text FROM public.scheduled_maintenances;

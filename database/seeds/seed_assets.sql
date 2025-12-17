-- ============================================
-- SEED DATA: ASSETS (Aset & Peralatan)
-- Laundry Management System
-- Version: 1.0.0
-- ============================================
-- ID 101: Mesin Cuci LG Front Load 20kg (dengan maintenance history)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222101', 'Mesin Cuci LG Front Load 20kg', 'LG-COM-101', '2019-12-12', 18500000, 'Active', 
   '[{"date": "2024-09-15", "description": "Deep cleaning drum dan descaling", "cost": 450000, "technician": "Service LG", "status": "Completed"}]'::jsonb, 
   '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status,
  "maintenanceHistory" = EXCLUDED."maintenanceHistory";
-- ID 102: Mesin Pengering Maytag Commercial (dengan maintenance history)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222102', 'Mesin Pengering Maytag Commercial', 'MAYTAG-MDG20-102', '2019-12-12', 22000000, 'Active', 
   '[{"date": "2024-12-01", "description": "Pembersihan lint filter dan pengecekan selang gas", "cost": 150000, "technician": "Budi Teknik", "status": "Completed"}]'::jsonb, 
   '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status,
  "maintenanceHistory" = EXCLUDED."maintenanceHistory";
-- ID 103: Setrika Uap Boiler 15L Maomoto (dengan maintenance history)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222103', 'Setrika Uap Boiler 15L Maomoto', 'MAOMOTO-15L-103', '2019-12-12', 3500000, 'Active', 
   '[{"date": "2024-08-20", "description": "Penggantian safety valve yang lemah", "cost": 250000, "technician": "Service Maomoto", "status": "Completed"}, {"date": "2024-11-15", "description": "Perbaikan kebocoran kran output uap", "cost": 350000, "technician": "Service Maomoto", "status": "Completed"}]'::jsonb, 
   '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status,
  "maintenanceHistory" = EXCLUDED."maintenanceHistory";
-- ID 104: Komputer Kasir & Printer
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222104', 'Komputer Kasir & Printer (Paket POS Epson)', 'EPSON-POS-104', '2019-12-12', 4500000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;
-- ID 105: Mesin Cuci Samsung WW70T3020WW (Unit 1)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222105', 'Mesin Cuci Samsung WW70T3020WW', 'SAM-WW70-105', '2019-12-12', 3800000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;
-- ID 106: Mesin Cuci Samsung WW70T3020WW (Unit 2)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222106', 'Mesin Cuci Samsung WW70T3020WW', 'SAM-WW70-106', '2019-12-12', 3800000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;
-- ID 107: Mesin Cuci Electrolux EWF800 (Unit 1)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222107', 'Mesin Cuci Electrolux EWF800', 'ELX-EWF800-107', '2019-12-12', 5500000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;
-- ID 108: Mesin Cuci Electrolux EWF800 (Unit 2)
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222108', 'Mesin Cuci Electrolux EWF800', 'ELX-EWF800-108', '2019-12-12', 5500000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;
-- ID 109: Mesin Polisher Karpet
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222109', 'Mesin Polisher Karpet', 'BRANDX-POLISH-109', '2019-12-12', 7500000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;
-- ID 110: Vacuum Cleaner Wet and Dry
INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "storeId")
VALUES 
  ('b2c3d4e5-2222-5555-9999-222222222110', 'Vacuum Cleaner Wet and Dry Flexio Power 1400W', 'FLEXIO-1400-110', '2019-12-12', 1100000, 'Active', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  "serialNumber" = EXCLUDED."serialNumber",
  status = EXCLUDED.status;
-- Verification
SELECT COUNT(*) as total_assets FROM public.assets;
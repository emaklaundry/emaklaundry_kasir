-- ============================================
-- SEED DATA: INVENTORY ITEMS (Stok Barang)
-- Laundry Management System
-- Version: 1.0.0
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
-- Verification
SELECT COUNT(*) as total_inventory FROM public.inventory_items;
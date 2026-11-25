-- ============================================
-- SEED DATA: SCHEDULED MAINTENANCES (Jadwal Pemeliharaan)
-- Laundry Management System
-- Version: 1.0.0
-- ============================================
-- Maintenance Mesin Cuci LG 20kg (Quarterly - 3 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333331', 'b2c3d4e5-2222-5555-9999-222222222101', 'Deep cleaning drum dan descaling', 3, 'months', '2025-12-15', '2024-09-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Mesin Pengering Maytag (Monthly - 1 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333332', 'b2c3d4e5-2222-5555-9999-222222222102', 'Pembersihan lint filter dan pengecekan selang gas', 1, 'months', '2026-01-01', '2024-12-01')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Setrika Uap Boiler (Monthly - 1 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333333', 'b2c3d4e5-2222-5555-9999-222222222103', 'Descaling dan safety valve check', 1, 'months', '2025-12-15', '2024-11-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Mesin Cuci Samsung (Unit 1) - Monthly (1 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333334', 'b2c3d4e5-2222-5555-9999-222222222105', 'Pembersihan filter dan drum', 1, 'months', '2026-01-15', '2024-12-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Mesin Cuci Samsung (Unit 2) - Monthly (1 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333335', 'b2c3d4e5-2222-5555-9999-222222222106', 'Pembersihan filter dan drum', 1, 'months', '2026-01-15', '2024-12-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Mesin Cuci Electrolux (Unit 1) - Monthly (1 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333336', 'b2c3d4e5-2222-5555-9999-222222222107', 'Pembersihan filter dan drum', 1, 'months', '2026-01-15', '2024-12-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Mesin Cuci Electrolux (Unit 2) - Monthly (1 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333337', 'b2c3d4e5-2222-5555-9999-222222222108', 'Pembersihan filter dan drum', 1, 'months', '2026-01-15', '2024-12-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Mesin Polisher Karpet (Monthly - 1 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333338', 'b2c3d4e5-2222-5555-9999-222222222109', 'Pembersihan brush dan filter', 1, 'months', '2026-01-15', '2024-12-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Vacuum Cleaner (Monthly - 1 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333339', 'b2c3d4e5-2222-5555-9999-222222222110', 'Pembersihan filter dan cek motor', 1, 'months', '2026-01-15', '2024-12-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Maintenance Komputer Kasir & Printer (Quarterly - 3 bulan)
INSERT INTO public.scheduled_maintenances (id, "assetId", description, "frequencyValue", "frequencyUnit", "nextDueDate", "lastCompletedDate")
VALUES 
  ('c3d4e5f6-3333-6666-aaaa-333333333340', 'b2c3d4e5-2222-5555-9999-222222222104', 'Cleaning printer head dan system check', 3, 'months', '2026-03-15', '2024-12-15')
ON CONFLICT (id) DO UPDATE SET 
  description = EXCLUDED.description,
  "nextDueDate" = EXCLUDED."nextDueDate",
  "lastCompletedDate" = EXCLUDED."lastCompletedDate";
-- Verification
SELECT COUNT(*) as total_maintenances FROM public.scheduled_maintenances;
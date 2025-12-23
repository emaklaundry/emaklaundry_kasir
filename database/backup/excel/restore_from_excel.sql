-- ============================================
-- LAUNDRY DATABASE RESTORE FROM EXCEL
-- Generated from: IMPORT_READY_LaundryBackup_Merged.xlsx
-- Generated at: 2025-12-23 20:28:45
-- ============================================

-- IMPORTANT: Run this after 0.complete_setup.sql
-- This will INSERT data from the Excel backup

-- Disable triggers temporarily for bulk insert
SET session_replication_role = 'replica';

BEGIN;


-- ============================================
-- CUSTOMERS
-- ============================================

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('373d08ad-34ec-4f07-8196-bf5b5771a82c', '  Raya', NULL, NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('ec1f5c3a-53a8-4ff8-bb6f-bcbd9e3b1fe4', 'Ibu Deti', '085320714739', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('70d7faba-8c9d-4999-aeea-4f20eb28e34a', 'Pa Iskandar', '082119579397', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('d009b27b-e93e-45a4-8e13-e9c9e4bb3f47', 'Pipit', '08211957937', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('198ee5a3-1c3c-432f-925d-b7fff038787b', 'Pa Wahyu', '085175279659', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('137781c5-3c6f-4445-a1c9-736f69959099', 'Ibu Yumna', '081323150112', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('8dcd0c41-3a67-45e7-a33d-9f1421a6f409', 'Naomi', '081779903911', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('5887485c-3a8f-40f7-8a95-3b3949963df5', 'Ihsan', '082118973818', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('701f7041-4a31-4bf0-ad72-d7277ce59a73', 'Pa Agus Hambali', '082225354461', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('36825988-f97d-42af-a612-2efe36f7dbc1', 'EgI', '082343390533', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('53a5b2b0-acc7-418f-9a9f-263aa0c8c315', 'Ayu', '081220511847', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('757e63b9-097c-4acb-a413-4db9c9a49585', 'Rahmi', '085187369373', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();

INSERT INTO public.customers (id, name, phone, address, notes, "defaultDiscount", "createdAt", "updatedAt", "storeId")
VALUES ('7d06937f-06c9-4433-bd65-02a45ef194e1', 'Ocha', '085189735807', NULL, NULL, 0, NOW(), NOW(), '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  notes = EXCLUDED.notes,
  "updatedAt" = NOW();


-- ============================================
-- SERVICES
-- ============================================

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('3435e1c3-48d3-4223-9b5a-6f39090f6ebd', 'Campuran', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('f3dc088b-8bea-4cde-a39c-cea4b835f6d9', 'Cuci dan lipat (min. 3 kg) - 1 hari', 'Kiloan'::service_category, 'Pakaian', 8000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('bf6ab4dc-739d-48d7-8192-a1f5288bd6c1', 'Cuci dan lipat (min. 3 kg) - 2 hari', 'Kiloan'::service_category, 'Pakaian', 6000, 'kg', 2, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('3dae3242-4f20-4bb6-beaa-7b8f3bfa811c', 'Cuci dan setrika (min. 3 kg) - 3 hari', 'Kiloan'::service_category, 'Pakaian', 5000, 'kg', 3, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('9aca98da-cb36-4819-a56e-afda5fcbb6c2', 'Cuci dan setrika (min. 2 kg) - 2 hari', 'Kiloan'::service_category, 'Pakaian', 13000, 'kg', 2, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('8ada7c12-46a6-4bc6-bb40-7eb19e453a0f', 'Cuci dan setrika (min. 2 kg) - 3 hari', 'Kiloan'::service_category, 'Pakaian', 7500, 'kg', 3, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('38d615fc-8e0d-46f9-b813-5c5f474b8e90', 'Cuci dan setrika (min. 2 kg) - 6 jam (ekspres)', 'Kiloan'::service_category, 'Pakaian', 20000, 'kg', 0, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('08cc99e0-087a-46c8-a0be-e7b05a3f6de0', 'Cuci ekspres - 3 jam', 'Kiloan'::service_category, 'Pakaian', 25000, 'kg', 0, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('57b69c60-aac9-46b6-9ca5-8642002ab274', 'Cuci lipat mitra laundry', 'Kiloan'::service_category, 'Pakaian', 4000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('85a8ce8d-d821-42fd-8776-766e6c6f840d', 'Cuci dan setrika (min. 2 kg) - 1 hari', 'Kiloan'::service_category, 'Pakaian', 15000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('488c0dcd-284f-4f56-994b-3c4db0daf605', 'Fitrase', 'Kiloan'::service_category, 'Pakaian', 15000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('7eed58fc-a764-4673-95e0-28ef4af27cb8', 'Gorden', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('afc2f158-5a44-4405-ad20-de63f80ca7ef', 'Karpet cendol', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('55d4cd20-af71-41d7-a7b3-13f93ac7c923', 'Karpet permadani', 'Kiloan'::service_category, 'Pakaian', 15000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('e3dcaa16-e067-4ee2-8f5f-9608bb0f329e', 'Karpet tipis', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('1735ccf4-55bd-42ba-b323-531bcc4085cc', 'Kasur busa/lantai', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('3068a212-a2df-4c51-b092-a7f247162264', 'Kasur Palembang', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('cb2c9d2b-fc68-47ae-8454-00546f00bc01', 'Lain-lain', 'Kiloan'::service_category, 'Pakaian', 8000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('ae927b1e-7eb9-415b-994a-18b83686d753', 'Mitra cuci komplit', 'Kiloan'::service_category, 'Pakaian', 5500, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('a3a25cb3-75c3-4c32-9fb4-6a410f1fdd28', 'Mitra setrika', 'Kiloan'::service_category, 'Pakaian', 3000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('926b6e98-9d2a-4d47-a4f9-caaefdba53f1', 'Setrika saja (min. 3 kg)', 'Kiloan'::service_category, 'Pakaian', 5000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('96174877-aae3-47ce-99b1-85b0d100df58', 'Sprei (kiloan)', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('72be4b71-e01d-47d3-a178-c46b84543e02', 'Surpet', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('60044450-59b2-4499-abd5-38f9124ed16a', 'Tikar', 'Kiloan'::service_category, 'Pakaian', 10000, 'kg', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('24d63a72-ebdb-4c95-b4d5-d33e7bc8454e', 'Karpet tebal (per m)', 'Karpet'::service_category, 'Pakaian', 12000, 'm2', 2, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('355c4e85-32f8-45f4-903f-183a081aadfe', 'Karpet tipis / masjid (per m)', 'Karpet'::service_category, 'Pakaian', 7000, 'm2', 2, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('34462bde-2d7a-4cbb-8371-4b2d0a2d7888', 'Bantal', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('edad1b9c-88f6-4c7c-ae1e-d528506942c3', 'Bed cover', 'Satuan'::service_category, 'Pakaian', 18000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('2e0f1149-e40e-4aea-a560-70879d7c9d2c', 'Bed cover jumbo/besar', 'Satuan'::service_category, 'Pakaian', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('38534e14-80df-492c-8cc2-02692f7a0e30', 'Bedcover', 'Satuan'::service_category, 'Pakaian', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('cf192bce-0140-4653-94bd-35dd19f3914e', 'Blus', 'Satuan'::service_category, 'Pakaian', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('aed03d84-3c35-452c-871d-32d3cec2c220', 'Boneka/bantal bulu', 'Satuan'::service_category, 'Pakaian', 12000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('cdd2aaa7-99b6-42ae-b88f-7287e31cc68f', 'Boneka besar', 'Satuan'::service_category, 'Pakaian', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('3d67d5cb-dddd-44bf-9068-085a5c1abe63', 'Boneka jumbo', 'Satuan'::service_category, 'Pakaian', 30000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('d7f1d180-759b-41e3-bb3d-af7a868895e5', 'Boneka kecil', 'Satuan'::service_category, 'Pakaian', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('92f48cfc-dd02-4cd1-97e0-0df8236d24ff', 'Boneka sedang', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('24e400b3-9afb-4671-944e-0be5065699f8', 'Celana panjang', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('940a9946-1b1e-432a-b2bf-0706ca5e10fd', 'Celana pendek', 'Satuan'::service_category, 'Pakaian', 7500, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('588b3036-7eab-45a7-8cd9-23a9cce0eca4', 'Gamis panjang / dress', 'Satuan'::service_category, 'Pakaian', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('3612597a-b9c1-47b4-8d95-27a356ee412e', 'Guling', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('56e00ac7-501b-4688-98dd-c913e77df76e', 'Guling kecil', 'Satuan'::service_category, 'Pakaian', 6000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('950f25d7-c3bd-4240-883f-46eff4e01ca7', 'Jaket jeans', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('b7aeeae1-840d-4a6c-a3ec-3cc11661587a', 'Jaket kain', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('1bf4d82b-950a-405a-966c-2eaa3d725866', 'Jaket kulit', 'Satuan'::service_category, 'Pakaian', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('f5fca1b9-97c5-4046-9d7d-be243ec0639f', 'Jas Kaos', 'Satuan'::service_category, 'Pakaian', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('10d5c872-088e-40b6-a69b-0d9b6f978053', 'Jas pendek', 'Satuan'::service_category, 'Pakaian', 18000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('36403ba0-494e-4820-b85b-ad5639275ca0', 'Kaus oblong', 'Satuan'::service_category, 'Pakaian', 8000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('20dc29d6-a9e2-4adc-98eb-b701dc8b87d4', 'Kaus singlet', 'Satuan'::service_category, 'Pakaian', 7500, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('39c6bef1-752f-400d-8d62-a9c3c7376ae3', 'Kemeja', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('60af7865-06d4-4d55-bfb7-07eda8c4211c', 'Keset', 'Satuan'::service_category, 'Pakaian', 12000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('74ef6c95-874c-4c1d-9211-8236b36bedd6', 'Keset besar', 'Satuan'::service_category, 'Pakaian', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('c9c8ef47-3c46-4918-9fc2-35b0acb05839', 'Menghilangkan noda (tinta, darah, minyak)', 'Satuan'::service_category, 'Pakaian', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('624b905e-3873-4cde-b52a-d06543661933', 'Mukena', 'Satuan'::service_category, 'Pakaian', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('4f627cc6-ebeb-4a98-9d8a-ab82707ae5c8', 'Noda di baju', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('8ae2deee-c08b-474c-b21b-f80ddffc9825', 'Rompi', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('84583bf8-eaa5-447c-92e5-d12225673540', 'Sajadah tebal', 'Satuan'::service_category, 'Pakaian', 10000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('000237af-2942-44dd-9282-53bea98f378e', 'Selimut', 'Satuan'::service_category, 'Pakaian', 17000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('7cce73bc-9a40-4fbd-9e49-73cebc898a31', 'Selimut jumbo', 'Satuan'::service_category, 'Pakaian', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('f872635b-ab3c-41b3-8904-089e29d035bb', 'Sepatu', 'Satuan'::service_category, 'Pakaian', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('55a3a0cb-f6b3-4515-af03-f96484ab93f4', 'Sepatu (Kets)', 'Satuan'::service_category, 'Pakaian', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('90ccc109-6789-4c4b-bc73-d0927c0198c4', 'Setelan jas lengan panjang', 'Satuan'::service_category, 'Pakaian', 25000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('a72644d3-f26f-4cdb-be85-2700b380e465', 'Setelan jas lengan pendek', 'Satuan'::service_category, 'Pakaian', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('0a3ee445-89c5-4b1c-a24d-d380a138d717', 'Sprei satuan', 'Satuan'::service_category, 'Pakaian', 15000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('07c7f2f6-1425-4c7e-8e2c-ad979a7a918b', 'Tas besar', 'Satuan'::service_category, 'Pakaian', 20000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('a7dfe8ef-4cd7-49b3-a069-8fe6e7a6ab38', 'Tas kecil', 'Satuan'::service_category, 'Pakaian', 12000, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";

INSERT INTO public.services (id, name, category, wash_type, price, unit, "durationDays", "storeId")
VALUES ('23ed72d5-ce66-43d3-80cf-7311ee7326da', 'Pakaian dalam', 'Satuan'::service_category, 'Pakaian', 2500, 'pcs', 1, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays";


-- ============================================
-- INVENTORY ITEMS
-- ============================================

INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES ('a1b2c3d4-1111-4444-8888-111111111111', 'Sabun Soklin Liquid', 18, 4, 'Jerigen (5 Liter)', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;

INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES ('a1b2c3d4-1111-4444-8888-111111111112', 'Parfum Laundry Sakura', 25, 5, 'Botol (1 Liter)', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;

INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES ('a1b2c3d4-1111-4444-8888-111111111113', 'Plastik Packing 35x50', 5, 2, 'Pack (50 lembar)', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;

INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES ('a1b2c3d4-1111-4444-8888-111111111114', 'Gas LPG 3kg', 6, 2, 'Tabung', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;

INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId")
VALUES ('a1b2c3d4-1111-4444-8888-111111111115', 'Label Tag Anti Air', 10, 2, 'Roll', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  stock = EXCLUDED.stock,
  "lowStockThreshold" = EXCLUDED."lowStockThreshold",
  unit = EXCLUDED.unit;


-- ============================================
-- ASSETS
-- ============================================

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222102', 'Mesin Pengering Maytag Commercial', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222104', 'Komputer Kasir & Printer (Paket POS Epson)', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222105', 'Mesin Cuci Samsung WW70T3020WW', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222106', 'Mesin Cuci Samsung WW70T3020WW', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222107', 'Mesin Cuci Electrolux EWF800', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222108', 'Mesin Cuci Electrolux EWF800', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222109', 'Mesin Polisher Karpet', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222110', 'Vacuum Cleaner Wet and Dry Flexio Power 1400W', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222101', 'Mesin Cuci LG Front Load 20kg', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;

INSERT INTO public.assets (id, name, "serialNumber", "purchaseDate", "purchaseCost", status, "maintenanceHistory", "storeId")
VALUES ('b2c3d4e5-2222-5555-9999-222222222103', 'Setrika Uap Boiler 15L Maomoto', NULL, '2019-12-12', 0, 'Active', NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  "purchaseDate" = EXCLUDED."purchaseDate",
  "purchaseCost" = EXCLUDED."purchaseCost",
  status = EXCLUDED.status;


-- ============================================
-- EXPENSES
-- ============================================

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('bd8357e0-0616-a9cc-ebe6-47c55cd00a37', '2019-12-12', 'Pembelian Aset: Mesin Pengering Maytag Commercial', 'Pembelian Aset', 22000000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('bc676f15-eb91-477c-80c9-5c17776813ca', '2024-12-01', 'Perawatan Aset: Mesin Pengering Maytag Commercial (Pembersihan lint filter dan pengecekan selang gas)', 'Pemeliharaan Aset', 150000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('2b735b96-1d2d-5ca2-3125-ce02d2afe8e8', '2019-12-12', 'Pembelian Aset: Komputer Kasir & Printer (Paket POS Epson)', 'Pembelian Aset', 4500000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('91f4a7e2-1d22-744b-5c29-3d5e2e154015', '2019-12-12', 'Pembelian Aset: Mesin Cuci Samsung WW70T3020WW', 'Pembelian Aset', 3800000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('359bb15c-a0b3-f7a3-bfb7-ea4c4f92be69', '2019-12-12', 'Pembelian Aset: Mesin Cuci Samsung WW70T3020WW', 'Pembelian Aset', 3800000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('958fb3a2-4cbd-ed8b-16be-65e18d6b3823', '2019-12-12', 'Pembelian Aset: Mesin Cuci Electrolux EWF800', 'Pembelian Aset', 5500000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('6d75a01a-d29c-7e03-0ebd-edba69317999', '2019-12-12', 'Pembelian Aset: Mesin Cuci Electrolux EWF800', 'Pembelian Aset', 5500000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('ba1133d4-2186-ac3f-1eb6-240e1a2e5e5b', '2019-12-12', 'Pembelian Aset: Mesin Polisher Karpet', 'Pembelian Aset', 7500000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('1e35340c-3ea9-3594-b0cb-643f88c77bea', '2019-12-12', 'Pembelian Aset: Vacuum Cleaner Wet and Dry Flexio Power 1400W', 'Pembelian Aset', 1100000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('c58817e2-e75e-c633-f908-c26b456e1d4b', '2019-12-12', 'Pembelian Aset: Mesin Cuci LG Front Load 20kg', 'Pembelian Aset', 18500000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('31420260-cd96-e205-a94c-9bc0f67a6560', '2024-09-15', 'Perawatan Aset: Mesin Cuci LG Front Load 20kg (Deep cleaning drum dan descaling)', 'Pemeliharaan Aset', 450000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('1d235622-84cd-b1ca-4213-1f850a63959a', '2025-12-17', 'Perawatan Aset: Mesin Cuci LG Front Load 20kg ([Jadwal] - Deep cleaning drum dan descaling)', 'Pemeliharaan Aset', 0, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('e22a9434-2ff2-9369-14eb-54829d2e2c73', '2019-12-12', 'Pembelian Aset: Setrika Uap Boiler 15L Maomoto', 'Pembelian Aset', 3500000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('53f0833a-dff7-3836-866c-a80629f093d8', '2024-08-20', 'Perawatan Aset: Setrika Uap Boiler 15L Maomoto (Penggantian safety valve yang lemah)', 'Pemeliharaan Aset', 250000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('e13520d5-aec8-680b-d6c3-ea2b0b682ddf', '2024-11-15', 'Perawatan Aset: Setrika Uap Boiler 15L Maomoto (Perbaikan kebocoran kran output uap)', 'Pemeliharaan Aset', 350000, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;

INSERT INTO public.expenses (id, date, description, category, amount, "storeId")
VALUES ('58030d18-f4c6-8570-c9ef-1b40e141a278', '2025-12-17', 'Perawatan Aset: Setrika Uap Boiler 15L Maomoto ([Jadwal] - Descaling dan safety valve check)', 'Pemeliharaan Aset', 0, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456')
ON CONFLICT (id) DO UPDATE SET
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  category = EXCLUDED.category,
  date = EXCLUDED.date;


-- ============================================
-- TRANSACTIONS
-- ============================================

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '22398a47-c425-4470-854d-10061c18305d', 'CAB-R9ZBAY', '7d06937f-06c9-4433-bd65-02a45ef194e1', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (4.18 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  31350, 0, 0, 31350,
  'Belum Lunas', 'Diproses', '2025-12-17 19:51:42+00', '2025-12-17 19:51:42+00', '2025-12-20T12:51:42.821+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'b2b6ebcb-ac9c-4848-80b0-727598f44eb2', 'CAB-D3LT4Y', '757e63b9-097c-4acb-a413-4db9c9a49585', '[{"serviceName": "Kasur busa/lantai", "quantity": 4.0, "unit": "kg", "pricePerUnit": 10000, "subtotal": 40000}, {"serviceName": "Sprei (kiloan) (1 kg × Rp 10.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  50000, 0, 0, 50000,
  'Belum Lunas', 'Diproses', '2025-12-17 16:36:00+00', '2025-12-17 16:36:00+00', '2025-12-18T09:36:00.759+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '7ae33fef-e3a5-4154-9708-1fb867357aef', 'CAB-568KML', '53a5b2b0-acc7-418f-9a9f-263aa0c8c315', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari (2.96 kg × Rp 15.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  44400, 0, 0, 44400,
  'Lunas', 'Diproses', '2025-12-17 15:39:58+00', '2025-12-17 15:39:58+00', '2025-12-18T08:39:58.531+00:00',
  44400, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '42c430ee-e89b-4af7-b0e5-e591b44ab506', 'CAB-PH2F3D', '36825988-f97d-42af-a612-2efe36f7dbc1', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (2.6 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  19500, 0, 0, 19500,
  'Lunas', 'Diproses', '2025-12-17 15:32:58+00', '2025-12-17 15:32:58+00', '2025-12-20T08:32:58.092+00:00',
  19500, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '9c547512-4ec9-4836-b50e-9c5337712587', 'CAB-KT7H8G', '701f7041-4a31-4bf0-ad72-d7277ce59a73', '[{"serviceName": "Setrika saja (min. 3 kg) (7.4 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  37000, 0, 0, 37000,
  'Belum Lunas', 'Diproses', '2025-12-16 18:30:09+00', '2025-12-16 18:30:09+00', '2025-12-17T11:30:09.703+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '315ef237-1cb2-4b63-87f9-148cd78f33c2', 'CAB-5LCFST', '5887485c-3a8f-40f7-8a95-3b3949963df5', '[{"serviceName": "Setrika saja (min. 3 kg) (8.4 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  42000, 0, 0, 42000,
  'Belum Lunas', 'Diproses', '2025-12-16 18:27:07+00', '2025-12-16 18:27:07+00', '2025-12-17T11:27:07.215+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '32c56f52-887e-480a-8436-8cff56cfdb61', 'CAB-RWN2D8', '8dcd0c41-3a67-45e7-a33d-9f1421a6f409', '[{"serviceName": "Bed cover", "quantity": 1.0, "unit": "pcs", "pricePerUnit": 18000, "subtotal": 18000}, {"serviceName": "Sprei (kiloan) (1 kg × Rp 10.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}, {"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (3.28 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  52600, 0, 0, 52600,
  'Belum Lunas', 'Diproses', '2025-12-16 18:25:07+00', '2025-12-16 18:25:07+00', '2025-12-19T11:25:07.274+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '282ce41f-3ddc-4fa7-8c0f-2c1f9862c846', 'CAB-BSSHJ2', '137781c5-3c6f-4445-a1c9-736f69959099', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (10.8 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  81000, 0, 0, 81000,
  'Belum Lunas', 'Diproses', '2025-12-16 18:19:37+00', '2025-12-16 18:19:37+00', '2025-12-19T11:19:37.136+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'b12ecbde-e8ac-4b54-91b1-a0b3b7db37db', 'CAB-RQ43HT', '198ee5a3-1c3c-432f-925d-b7fff038787b', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (9.34 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  70050, 0, 0, 70050,
  'Belum Lunas', 'Diproses', '2025-12-16 18:11:10+00', '2025-12-16 18:11:10+00', '2025-12-19T11:11:10.353+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '32253a57-b72b-4fb6-b3c1-829e145a89d4', 'CAB-PPW2KX', 'd009b27b-e93e-45a4-8e13-e9c9e4bb3f47', '[{"serviceName": "Setrika saja (min. 3 kg) (5 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  25000, 0, 0, 25000,
  'Lunas', 'Diproses', '2025-12-16 18:06:24+00', '2025-12-16 18:06:24+00', '2025-12-17T11:06:24.148+00:00',
  25000, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '06c73769-3452-405b-b578-dc34880cebe2', 'CAB-ACQWNS', '70d7faba-8c9d-4999-aeea-4f20eb28e34a', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 6 jam (ekspres) (2 kg × Rp 20.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  40000, 0, 0, 40000,
  'Lunas', 'Selesai', '2025-12-16 18:03:26+00', '2025-12-16 18:03:26+00', '2025-12-16T11:03:26.332+00:00',
  40000, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'c27aae26-cf7d-4ab7-824a-7cbe150255ab', 'CAB-Z2HCXH', 'ec1f5c3a-53a8-4ff8-bb6f-bcbd9e3b1fe4', '[{"serviceName": "Setrika saja (min. 3 kg) (5.93 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  29650, 0, 0, 29650,
  'Belum Lunas', 'Diproses', '2025-12-16 17:59:21+00', '2025-12-16 17:59:21+00', '2025-12-17T10:59:21.105+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '82fabc60-fc9a-44b2-9358-9a00677df50c', 'CAB-H9MURC', '373d08ad-34ec-4f07-8196-bf5b5771a82c', '[{"serviceName": "Karpet tebal (per m) (2 m2 × Rp 12.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  24000, 0, 0, 24000,
  'Belum Lunas', 'Diproses', '2025-12-15 08:43:00+00', '2025-12-15 08:43:00+00', '2025-12-17T01:43:00.765+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '5a1dfce7-26b2-4c98-ba9d-682ee44c7fd9', 'CAB-4ANZ8G', '373d08ad-34ec-4f07-8196-bf5b5771a82c', '[{"serviceName": "Karpet tebal (per m) (4 m2 × Rp 12.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  48000, 0, 0, 48000,
  'Belum Lunas', 'Diproses', '2025-12-15 08:41:09+00', '2025-12-15 08:41:09+00', '2025-12-17T01:41:09.341+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'e4ddb06d-3e24-41d3-893e-239d07c8e014', 'CAB-UXHC6S', '3d1b3aec-efdd-4c99-9d44-7d84cc0b807c', '[{"serviceName": "Setrika saja (min. 3 kg) (5.26 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  26300, 0, 0, 26300,
  'Belum Lunas', 'Diproses', '2025-11-30 15:40:10+00', '2025-11-30 15:40:10+00', '2025-12-01T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'd958e69f-2027-4e75-8f92-6b4ad99430af', 'CAB-6D6UAF', '23f02f1a-910c-4078-8c8f-21cc5a1c94ab', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (4 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  30000, 0, 0, 30000,
  'Lunas', 'Diproses', '2025-11-30 09:04:07+00', '2025-11-30 09:04:07+00', '2025-12-03T00:00:00+00:00',
  30000, 20000, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '26d65493-b475-4630-b870-a3dd1d44a523', 'CAB-25UQLX', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (3.1 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  23250, 0, 0, 23250,
  'Belum Lunas', 'Diproses', '2025-11-30 07:13:15+00', '2025-11-30 07:13:15+00', '2025-12-03T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'e590d1ac-45fe-4cf1-81bf-20e340413e4c', 'CAB-NJJKGQ', '1c70311e-8727-4b0e-8660-56464c7244b7', '[{"serviceName": "Setrika saja (min. 3 kg) (9.8 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  49000, 0, 0, 49000,
  'Belum Lunas', 'Diproses', '2025-11-29 12:15:56+00', '2025-11-29 12:15:56+00', '2025-11-30T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'f540c394-b84c-4cda-93f1-4ec1fb842329', 'CAB-WX2MTK', '029d079d-17f0-45c6-80c2-624ad5ba829c', '[{"serviceName": "Setrika saja (min. 3 kg) (5.9 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  29500, 0, 0, 29500,
  'Belum Lunas', 'Diproses', '2025-11-29 08:44:26+00', '2025-11-29 08:44:26+00', '2025-11-30T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '37d1de27-e957-46a0-b832-e95c6b799944', 'CAB-Z6XQ45', '029d079d-17f0-45c6-80c2-624ad5ba829c', '[{"serviceName": "Setrika saja (min. 3 kg) (5.9 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  29500, 0, 0, 29500,
  'Belum Lunas', 'Diproses', '2025-11-29 08:40:50+00', '2025-11-29 08:40:50+00', '2025-11-30T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '55501eed-958d-43a9-882f-6d7896bd3328', 'CAB-PBC2UU', '498154aa-9596-4a1a-ac85-cc77acfc07a9', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari (3.12 kg × Rp 15.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  46800, 0, 0, 46800,
  'Belum Lunas', 'Diproses', '2025-11-29 08:15:53+00', '2025-11-29 08:15:53+00', '2025-11-30T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'f7edf3df-6b13-48bd-83c1-cc5ee4fd5b25', 'CAB-GK7BQZ', '13bb53cd-b26c-403d-bd60-e5ba87f90e4b', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (4.24 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  31800, 0, 0, 31800,
  'Belum Lunas', 'Diproses', '2025-11-29 08:15:53+00', '2025-11-29 08:15:53+00', '2025-12-02T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '1f92bbab-88e5-4c06-80a6-90c78bfa31f3', 'CAB-JQTAVU', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"serviceName": "Campuran", "quantity": 1.0, "unit": "kg", "pricePerUnit": 10000, "subtotal": 10000}]'::jsonb,
  10000, 0, 0, 10000,
  'Belum Lunas', 'Diproses', '2025-11-29 08:11:16+00', '2025-11-29 08:11:16+00', '2025-11-30T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'f237fc5c-704b-4bfe-9095-43dc9e590470', 'CAB-7SFF6D', '8e48870f-570c-4a08-bec1-6681b5e1a31f', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (4.38 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  32850, 0, 0, 32850,
  'Lunas', 'Diproses', '2025-11-29 08:05:23+00', '2025-11-29 08:05:23+00', '2025-12-02T00:00:00+00:00',
  32850, 7150, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '3252e8f1-d7c1-4e7e-b6e2-e00e3b80c8ab', 'CAB-XDCT4H', '8e48870f-570c-4a08-bec1-6681b5e1a31f', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (4.38 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  32850, 0, 0, 32850,
  'Belum Lunas', 'Diproses', '2025-11-29 08:02:24+00', '2025-11-29 08:02:24+00', '2025-12-02T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '763a127c-912a-457f-8b71-ddf8d9939e6e', 'CAB-YVCDPL', '03ac3b42-eec3-4d14-a1c8-03f4f1fe1b0f', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (4.29 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  32175, 0, 0, 32175,
  'Belum Lunas', 'Diproses', '2025-11-29 07:37:18+00', '2025-11-29 07:37:18+00', '2025-12-02T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '355a7c84-f194-459c-908d-7ea95179d854', 'CAB-5PPR8V', '03ac3b42-eec3-4d14-a1c8-03f4f1fe1b0f', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (4.28 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  32100, 0, 0, 32100,
  'Belum Lunas', 'Diproses', '2025-11-29 07:06:54+00', '2025-11-29 07:06:54+00', '2025-12-02T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '05192dfe-6ca4-4f67-abb4-15b12076d3d9', 'CAB-VN24GF', '3a5533d5-c094-4ba7-bc48-cefbf1ac938f', '[{"serviceName": "Setrika saja (min. 3 kg) (9.18 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  45900, 0, 0, 45900,
  'Belum Lunas', 'Diproses', '2025-11-27 10:50:03+00', '2025-11-27 10:50:03+00', '2025-11-28T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '0055d3fe-b9c4-4caf-a56d-58ec76d66668', 'CAB-KG994Y', '029d079d-17f0-45c6-80c2-624ad5ba829c', '[{"serviceName": "Setrika saja (min. 3 kg) (9.18 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  45900, 0, 0, 45900,
  'Belum Lunas', 'Diproses', '2025-11-27 10:47:22+00', '2025-11-27 10:47:22+00', '2025-11-28T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '3f81ef48-e556-4f8b-992a-6be1c5b05aef', 'CAB-8ZJ7SF', '4fc31f0c-7db7-4829-bbe1-897a3d5213e8', '[{"serviceName": "Cuci dan lipat (min. 3 kg) - 1 hari (3.2 kg × Rp 8.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  25600, 0, 0, 25600,
  'Lunas', 'Diproses', '2025-11-27 10:43:50+00', '2025-11-27 10:43:50+00', '2025-11-28T00:00:00+00:00',
  25600, 24400, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '4e17b9dd-a71c-4fb9-a100-505f3fd4514c', 'CAB-4LXRM6', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"serviceName": "Campuran", "quantity": 2.34, "unit": "kg", "pricePerUnit": 10000, "subtotal": 23400}, {"serviceName": "Cuci dan lipat (min. 3 kg) - 2 hari (3.2 kg × Rp 6.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  42600, 0, 0, 42600,
  'Belum Lunas', 'Diproses', '2025-11-27 10:41:21+00', '2025-11-27 10:41:21+00', '2025-11-29T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '8a2e030f-f541-45e6-b6fc-f050afbe0445', 'CAB-B9CVVW', '5c4f014b-88ca-4a05-99d5-93d7b1eb8cf9', '[{"serviceName": "Sprei (kiloan) (2 kg × Rp 10.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}, {"serviceName": "Bed cover jumbo/besar", "quantity": 1.0, "unit": "pcs", "pricePerUnit": 25000, "subtotal": 25000}]'::jsonb,
  45000, 0, 0, 45000,
  'Belum Lunas', 'Diproses', '2025-11-26 11:46:55+00', '2025-11-26 11:46:55+00', '2025-11-27T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '6947f7ef-9de6-4379-85a7-a7e3f3124fb8', 'CAB-3FT7LK', '9b97b8ae-55df-44f8-bdd6-d4b5b461e8fd', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (2.52 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  18900, 0, 0, 18900,
  'Belum Lunas', 'Diproses', '2025-11-25 18:43:04+00', '2025-11-25 18:43:04+00', '2025-11-28T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '0df70837-eb4b-4f66-96e9-7e2460097926', 'CAB-8HEFRC', 'ded003dd-6c52-435b-bbaf-06abaf562e8f', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (3.48 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  26100, 0, 0, 26100,
  'Belum Lunas', 'Diproses', '2025-11-25 18:39:46+00', '2025-11-25 18:39:46+00', '2025-11-28T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'afc442cc-29b2-42ed-8c40-48414412faa9', 'CAB-QHZAZC', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"serviceName": "Campuran", "quantity": 1.0, "unit": "kg", "pricePerUnit": 10000, "subtotal": 10000}]'::jsonb,
  10000, 0, 0, 10000,
  'Belum Lunas', 'Diproses', '2025-11-25 18:38:11+00', '2025-11-25 18:38:11+00', '2025-11-26T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'b44fc3ec-6f4f-4f49-901d-25caba812435', 'CAB-45PV8Q', '8f9eb6a8-4a69-4dca-b59d-03ba319c25a9', '[{"serviceName": "Cuci dan liprika (min. 3 kg) - 3 hari (5.87 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  29350, 0, 0, 29350,
  'Belum Lunas', 'Diproses', '2025-11-25 18:36:59+00', '2025-11-25 18:36:59+00', '2025-11-28T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '2c575df3-6758-4a50-bd36-33607f9bc9a2', 'CAB-3SHWT4', 'ded003dd-6c52-435b-bbaf-06abaf562e8f', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (3.48 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  26100, 0, 0, 26100,
  'Belum Lunas', 'Diproses', '2025-11-25 18:07:07+00', '2025-11-25 18:07:07+00', '2025-11-28T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '058ecaaa-80ca-40c1-bb5d-9d2937f71db9', 'CAB-DJGJHU', '218461d0-3860-4c18-8d9b-2ca6593d23cf', '[{"serviceName": "Sprei (kiloan) (2 kg × Rp 10.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  20000, 0, 0, 20000,
  'Belum Lunas', 'Diproses', '2025-11-24 19:36:34+00', '2025-11-24 19:36:34+00', '2025-11-25T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '09b16e94-fea1-44bf-b1b9-5181321e2653', 'CAB-99X2ND', '5d708a98-8369-4064-8b39-9ec24ea1031e', '[{"serviceName": "Cuci dan liprika (min. 3 kg) - 3 hari (12.69 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  63450, 0, 0, 63450,
  'Belum Lunas', 'Diproses', '2025-11-24 19:07:34+00', '2025-11-24 19:07:34+00', '2025-11-27T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '7fe09749-1ce4-4051-8bdb-af3b7cee3281', 'CAB-EC2NQ5', '8cdcedea-d403-4067-96ca-f3673142e78a', '[{"serviceName": "Gorden", "quantity": 7.14, "unit": "kg", "pricePerUnit": 10000, "subtotal": 71400}]'::jsonb,
  71400, 0, 0, 71400,
  'Lunas', 'Diproses', '2025-11-24 19:04:38+00', '2025-11-24 19:04:38+00', '2025-11-25T00:00:00+00:00',
  71400, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '7d8a2b76-f597-4ca3-ad00-ba8a1ce55182', 'CAB-47YDNS', '415b3c8f-6942-44d2-a13e-544a97f5af75', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (4.34 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  32550, 0, 0, 32550,
  'Belum Lunas', 'Diproses', '2025-11-23 16:22:10+00', '2025-11-23 16:22:10+00', '2025-11-26T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '32d81672-688d-4d2d-b8eb-8155b0f7ec84', 'CAB-MJXKJA', '4ba0ff6d-dbfa-4d20-a1e6-2c5132b4199a', '[{"serviceName": "Setrika saja (min. 3 kg) (4.7 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  23500, 0, 0, 23500,
  'Belum Lunas', 'Diproses', '2025-11-23 11:24:21+00', '2025-11-23 11:24:21+00', '2025-11-24T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '099f3731-6e9c-4ec5-9553-36a9b99e3a69', 'CAB-QHRQTM', '2a643039-eb7b-429a-a10a-f3a2c93f82bb', '[{"serviceName": "Setrika saja (min. 3 kg) (13.11 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  65550, 0, 0, 65550,
  'Lunas', 'Selesai', '2025-11-23 08:08:59+00', '2025-11-23 08:08:59+00', '2025-11-24T00:00:00+00:00',
  65550, 0, 'QRIS', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '8419b804-968b-440c-b401-9cdeecf40987', 'CAB-MPF79U', '903e6666-8720-49b4-b9f2-e76ab15b6c68', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari (3.14 kg × Rp 15.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  47100, 0, 0, 47100,
  'Lunas', 'Selesai', '2025-11-23 07:35:04+00', '2025-11-23 07:35:04+00', '2025-11-24T00:00:00+00:00',
  47100, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'c5895514-4a99-4418-a523-754039839b54', 'CAB-RH2NER', '1c70311e-8727-4b0e-8660-56464c7244b7', '[{"serviceName": "Setrika saja (min. 3 kg) (9.6 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  48000, 0, 0, 48000,
  'Lunas', 'Selesai', '2025-11-22 12:47:30+00', '2025-11-22 12:47:30+00', '2025-11-23T00:00:00+00:00',
  48000, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '96a4a6fa-8f94-4036-ae48-841a7d47a5c2', 'CAB-7Y3K3Y', '47282850-2a21-4597-ae7d-28b2b431666d', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (2.27 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  17025, 0, 0, 17025,
  'Belum Lunas', 'Diproses', '2025-11-22 09:58:44+00', '2025-11-22 09:58:44+00', '2025-11-25T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '72aea24b-37cc-4b16-a513-5e4f69431faf', 'CAB-XGUW7J', '029d079d-17f0-45c6-80c2-624ad5ba829c', '[{"serviceName": "Setrika saja (min. 3 kg) (15.44 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  77200, 0, 0, 77200,
  'Lunas', 'Selesai', '2025-11-22 09:40:17+00', '2025-11-22 09:40:17+00', '2025-11-23T00:00:00+00:00',
  77200, 0, 'Transfer Bank', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '814617ea-a263-4aef-8427-0530e1101684', 'CAB-NR9RDX', 'cd544fab-d14f-4665-8df0-ff6ffe347bf1', '[{"serviceName": "Setrika saja (min. 3 kg) (6.41 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  32050, 0, 0, 32050,
  'Lunas', 'Selesai', '2025-11-22 09:09:52+00', '2025-11-22 09:09:52+00', '2025-11-23T00:00:00+00:00',
  32050, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'aa31157c-85fb-4983-8b80-2d85cb1d0af7', 'CAB-H3HVZN', '12253d22-758d-41d9-b5b2-650d5ec3f417', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (3.27 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  24525, 0, 0, 24525,
  'Belum Lunas', 'Diproses', '2025-11-22 08:59:44+00', '2025-11-22 08:59:44+00', '2025-11-25T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '0e7f1754-d385-47e3-8b80-50acb768b5b1', 'CAB-XM7YG3', 'ded003dd-6c52-435b-bbaf-06abaf562e8f', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (6 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  45000, 0, 0, 45000,
  'Lunas', 'Selesai', '2025-11-22 08:47:49+00', '2025-11-22 08:47:49+00', '2025-11-25T00:00:00+00:00',
  45000, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'dcf74b37-0c89-4a46-a416-757824af1aed', 'CAB-RQLXQ4', '9e0256d6-9b7c-4749-bc35-5352dd8a01dc', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (3.34 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  25050, 0, 0, 25050,
  'Belum Lunas', 'Diproses', '2025-11-22 08:43:28+00', '2025-11-22 08:43:28+00', '2025-11-25T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  'd2abcff0-4f54-44e5-8b85-a278b8e446ad', 'CAB-H6PD6N', '903e6666-8720-49b4-b9f2-e76ab15b6c68', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 1 hari (4.47 kg × Rp 15.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  67050, 0, 0, 67050,
  'Lunas', 'Selesai', '2025-11-22 07:34:09+00', '2025-11-22 07:34:09+00', '2025-11-23T00:00:00+00:00',
  67050, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '077aa911-e3c8-4b03-9451-d8f6ae43a785', 'CAB-JQ485R', '9b5dbab9-70df-4801-b7f1-67a4c0785e9b', '[{"serviceName": "Cuci dan liprika (min. 3 kg) - 3 hari (4.92 kg × Rp 5.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  24600, 0, 0, 24600,
  'Lunas', 'Selesai', '2025-11-21 19:29:11+00', '2025-11-21 19:29:11+00', '2025-11-24T00:00:00+00:00',
  24600, 5400, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '9992dfe7-e609-409c-b152-a8a67715c947', 'CAB-R4NQCF', 'f765d0e1-b4cc-47c5-98f7-eee5d252eb26', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 3 hari (5.31 kg × Rp 7.500)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  39825, 0, 0, 39825,
  'Belum Lunas', 'Diproses', '2025-11-21 18:40:20+00', '2025-11-21 18:40:20+00', '2025-11-24T00:00:00+00:00',
  0, 0, NULL, '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '205049e5-453e-4437-a07a-f1ee15f7e810', 'CAB-EET67T', '5c269273-6a59-43e8-b01b-1525b23d44e9', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 2 hari (6.1 kg × Rp 13.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  79300, 0, 0, 79300,
  'Lunas', 'Selesai', '2025-11-21 17:17:34+00', '2025-11-21 17:17:34+00', '2025-11-23T00:00:00+00:00',
  79300, 0, 'Tunai', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();

INSERT INTO public.transactions (
  id, "invoiceCode", "customerId", items, subtotal, discount, tax, total,
  "paymentStatus", "orderStatus", "createdAt", "updatedAt", "estimatedCompletionDate",
  "amountPaid", change, "paymentMethod", "storeId", notes
)
VALUES (
  '80047e2e-ee83-41f6-865a-da5ee0c02a97', 'CAB-G6HHQY', '400d33a3-b300-44ea-914a-2cf7b69a8122', '[{"serviceName": "Cuci dan setrika (min. 2 kg) - 6 jam (ekspres) (1 kg × Rp 20.000)", "quantity": 1, "unit": "pcs", "pricePerUnit": 0, "subtotal": 0}]'::jsonb,
  20000, 0, 0, 20000,
  'Lunas', 'Selesai', '2025-11-20 22:26:48+00', '2025-11-20 22:26:48+00', '2025-11-20T00:00:00+00:00',
  20000, 0, 'QRIS', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', NULL
)
ON CONFLICT (id) DO UPDATE SET
  "paymentStatus" = EXCLUDED."paymentStatus",
  "orderStatus" = EXCLUDED."orderStatus",
  "updatedAt" = NOW();


COMMIT;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Count records
SELECT 'customers' as table_name, COUNT(*) as count FROM public.customers
UNION ALL
SELECT 'services', COUNT(*) FROM public.services
UNION ALL
SELECT 'inventory_items', COUNT(*) FROM public.inventory_items
UNION ALL
SELECT 'assets', COUNT(*) FROM public.assets
UNION ALL
SELECT 'expenses', COUNT(*) FROM public.expenses
UNION ALL
SELECT 'transactions', COUNT(*) FROM public.transactions
ORDER BY table_name;

-- Show sample data
SELECT 'Sample Customers:' as info;
SELECT id, name, phone FROM public.customers LIMIT 3;

SELECT 'Sample Transactions:' as info;
SELECT id, "invoiceCode", total, "orderStatus", "paymentStatus" FROM public.transactions LIMIT 3;

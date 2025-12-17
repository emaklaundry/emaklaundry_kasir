-- ============================================
-- SEED DATA: SERVICES (Daftar Layanan)
-- Laundry Management System
-- Version: 1.0.0
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
INSERT INTO public.services (name, category, wash_type, price, unit, "durationDays", "storeId")
SELECT 
  v.name, 
  v.category::public.service_category,
  v.wash_type,
  v.price, 
  v.unit, 
  v.duration, 
  ts.id
FROM (
  VALUES
    -- KILOAN
    ('Campuran','Kiloan','Pakaian',10000,'kg',1),
    ('Cuci dan lipat (min. 3 kg) - 1 hari','Kiloan','Pakaian',8000,'kg',1),
    ('Cuci dan lipat (min. 3 kg) - 2 hari','Kiloan','Pakaian',6000,'kg',2),
    ('Cuci dan setrika (min. 3 kg) - 3 hari','Kiloan','Pakaian',5000,'kg',3),
    ('Cuci dan setrika (min. 2 kg) - 2 hari','Kiloan','Pakaian',13000,'kg',2),
    ('Cuci dan setrika (min. 2 kg) - 3 hari','Kiloan','Pakaian',7500,'kg',3),
    ('Cuci dan setrika (min. 2 kg) - 6 jam (ekspres)','Kiloan','Pakaian',20000,'kg',0),
    ('Cuci ekspres - 3 jam','Kiloan','Pakaian',25000,'kg',0),
    ('Cuci lipat mitra laundry','Kiloan','Pakaian',4000,'kg',1),
    ('Cuci dan setrika (min. 2 kg) - 1 hari','Kiloan','Pakaian',15000,'kg',1),
    ('Fitrase','Kiloan','Pakaian',15000,'kg',1),
    ('Gorden','Kiloan','Gorden',10000,'kg',1),
    ('Karpet cendol','Kiloan','Karpet',10000,'kg',1),
    ('Karpet permadani','Kiloan','Karpet',15000,'kg',1),
    ('Karpet tipis','Kiloan','Karpet',10000,'kg',1),
    ('Kasur busa/lantai','Kiloan','Selimut',10000,'kg',1),
    ('Kasur Palembang','Kiloan','Selimut',10000,'kg',1),
    ('Lain-lain','Kiloan','Lainnya',8000,'kg',1),
    ('Mitra cuci komplit','Kiloan','Pakaian',5500,'kg',1),
    ('Mitra setrika','Kiloan','Pakaian',3000,'kg',1),
    ('Setrika saja (min. 3 kg)','Kiloan','Pakaian',5000,'kg',1),
    ('Sprei (kiloan)','Kiloan','Selimut',10000,'kg',1),
    ('Surpet','Kiloan','Karpet',10000,'kg',1),
    ('Tikar','Kiloan','Karpet',10000,'kg',1),
    
    -- KARPET
    ('Karpet tebal (per m)','Karpet','Karpet',12000,'m2',2),
    ('Karpet tipis / masjid (per m)','Karpet','Karpet',7000,'m2',2),
    
    -- SATUAN
    ('Bantal','Satuan','Selimut',15000,'pcs',1),
    ('Bed cover','Satuan','Selimut',18000,'pcs',1),
    ('Bed cover jumbo/besar','Satuan','Selimut',25000,'pcs',1),
    ('Bedcover','Satuan','Selimut',25000,'pcs',1),
    ('Blus','Satuan','Pakaian',20000,'pcs',1),
    ('Boneka/bantal bulu','Satuan','Boneka',12000,'pcs',1),
    ('Boneka besar','Satuan','Boneka',25000,'pcs',1),
    ('Boneka jumbo','Satuan','Boneka',30000,'pcs',1),
    ('Boneka kecil','Satuan','Boneka',10000,'pcs',1),
    ('Boneka sedang','Satuan','Boneka',15000,'pcs',1),
    ('Celana panjang','Satuan','Pakaian',15000,'pcs',1),
    ('Celana pendek','Satuan','Pakaian',7500,'pcs',1),
    ('Gamis panjang / dress','Satuan','Pakaian',25000,'pcs',1),
    ('Guling','Satuan','Selimut',15000,'pcs',1),
    ('Guling kecil','Satuan','Selimut',6000,'pcs',1),
    ('Jaket jeans','Satuan','Pakaian',15000,'pcs',1),
    ('Jaket kain','Satuan','Pakaian',15000,'pcs',1),
    ('Jaket kulit','Satuan','Pakaian',20000,'pcs',1),
    ('Jas Kaos','Satuan','Pakaian',10000,'pcs',1),
    ('Jas pendek','Satuan','Pakaian',18000,'pcs',1),
    ('Kaus oblong','Satuan','Pakaian',8000,'pcs',1),
    ('Kaus singlet','Satuan','Pakaian',7500,'pcs',1),
    ('Kemeja','Satuan','Pakaian',15000,'pcs',1),
    ('Keset','Satuan','Karpet',12000,'pcs',1),
    ('Keset besar','Satuan','Karpet',20000,'pcs',1),
    ('Menghilangkan noda (tinta, darah, minyak)','Satuan','Pakaian',10000,'pcs',1),
    ('Mukena','Satuan','Pakaian',10000,'pcs',1),
    ('Noda di baju','Satuan','Pakaian',15000,'pcs',1),
    ('Rompi','Satuan','Pakaian',15000,'pcs',1),
    ('Sajadah tebal','Satuan','Karpet',10000,'pcs',1),
    ('Selimut','Satuan','Selimut',17000,'pcs',1),
    ('Selimut jumbo','Satuan','Selimut',25000,'pcs',1),
    ('Sepatu','Satuan','Sepatu',20000,'pcs',1),
    ('Sepatu (Kets)','Satuan','Sepatu',20000,'pcs',1),
    ('Setelan jas lengan panjang','Satuan','Pakaian',25000,'pcs',1),
    ('Setelan jas lengan pendek','Satuan','Pakaian',20000,'pcs',1),
    ('Sprei satuan','Satuan','Selimut',15000,'pcs',1),
    ('Tas besar','Satuan','Tas',20000,'pcs',1),
    ('Tas kecil','Satuan','Tas',12000,'pcs',1),
    ('Pakaian dalam','Satuan','Pakaian',2500,'pcs',1)
) AS v(name, category, wash_type, price, unit, duration)
CROSS JOIN target_store ts
ON CONFLICT (lower(name), "storeId") DO UPDATE SET
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays",
  category = EXCLUDED.category,
  wash_type = EXCLUDED.wash_type;
-- Verification
SELECT COUNT(*) as total_services FROM public.services;
-- ==========================================
-- 5. POLICY: IZINKAN INSERT TRANSAKSI UNTUK USER YANG SAH
-- ==========================================
-- Pastikan policy ini sudah ada di database.sql, tapi tambahkan di sini agar pasti aktif setelah seed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'transactions' AND policyname = 'Allow INSERT for store users'
  ) THEN
    EXECUTE $$
      CREATE POLICY "Allow INSERT for store users" ON public.transactions
        FOR INSERT WITH CHECK (
          public.get_my_role() = 'Super Admin'
          OR "storeId" = public.get_my_store_id()
        );
    $$;
  END IF;
END$$;
BEGIN;

-- ==========================================
-- 1. PASTIKAN TOKO ADA (Cabang Kota Banjar)
-- ==========================================
INSERT INTO public.stores (id, name, address, "isActive")
VALUES (
  '9b7e1c2a-1234-4bcd-8e9f-abcdef123456', 
  'Cabang Kota Banjar', 
  'Kota Banjar', 
  true
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, "isActive" = true;


-- ==========================================
-- 2. REPAIR PROFILE (Buat profile jika belum ada)
-- ==========================================
-- Mencegah error foreign key saat update role di bawah
INSERT INTO public.profiles (id, name, role, store_id, "isActive")
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'name', au.email) as name, 
  'Kasir', -- Default role
  NULL,
  true
FROM auth.users au
LEFT JOIN public.profiles pp ON au.id = pp.id
WHERE pp.id IS NULL;


-- ==========================================
-- 3. SETUP ROLE BERDASARKAN EMAIL (Data Real)
-- ==========================================

-- A. Setup SUPER ADMIN (mhmdnvn18@gmail.com)
UPDATE public.profiles
SET 
  role = 'Super Admin', 
  store_id = NULL
FROM auth.users
WHERE public.profiles.id = auth.users.id
AND auth.users.email = 'mhmdnvn18@gmail.com';

-- B. Setup ADMIN TOKO (emaklaundry12@gmail.com)
UPDATE public.profiles
SET 
  role = 'Admin', 
  store_id = '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'
FROM auth.users
WHERE public.profiles.id = auth.users.id
AND auth.users.email = 'emaklaundry12@gmail.com';

-- C. Setup KASIR (ani, didi, lilis, yopi)
UPDATE public.profiles
SET 
  role = 'Kasir', 
  store_id = '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'
FROM auth.users
WHERE public.profiles.id = auth.users.id
AND auth.users.email IN (
  'ani@gmail.com',
  'didi@gmail.com',
  'lilis@gmail.com',
  'yopi@gmail.com'
);


-- ==========================================
-- 4. SEED LAYANAN (SERVICES)
-- ==========================================
-- Index Unik untuk mencegah duplikasi layanan
CREATE UNIQUE INDEX IF NOT EXISTS services_name_store_idx ON public.services (lower(name), "storeId");

-- Insert Layanan
WITH target_store AS (
  SELECT id FROM public.stores
  WHERE id = '9b7e1c2a-1234-4bcd-8e9f-abcdef123456'
  LIMIT 1
)
INSERT INTO public.services (name, category, price, unit, "durationDays", "storeId")
SELECT v.name, v.category::public.service_category, v.price, v.unit, v.duration, ts.id
FROM (
  VALUES
    ('Campuran','Kiloan',10000,'kg',1),
    ('Cuci dan lipat (min. 3 kg) - 1 hari','Kiloan',8000,'kg',1),
    ('Cuci dan lipat (min. 3 kg) - 2 hari','Kiloan',6000,'kg',2),
    ('Cuci dan liprika (min. 3 kg) - 3 hari','Kiloan',5000,'kg',3),
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
    ('Karpet tebal (per m)','Karpet',12000,'m2',2),
    ('Karpet tipis / masjid (per m)','Karpet',7000,'m2',2),
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
    ('Jas koas','Satuan',10000,'pcs',1),
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
    ('Sepatu (cats)','Satuan',20000,'pcs',1),
    ('Setelan jas lengan panjang','Satuan',25000,'pcs',1),
    ('Setelan jas lengan pendek','Satuan',20000,'pcs',1),
    ('Sprei satuan','Satuan',15000,'pcs',1),
    ('Tas besar','Satuan',20000,'pcs',1),
    ('Tas kecil','Satuan',12000,'pcs',1),
    ('Pakaian dalam','Satuan',2500,'pcs',1)
  )
  AS v(name, category, price, unit, duration)
  CROSS JOIN target_store ts

ON CONFLICT (lower(name), "storeId") DO UPDATE SET
  price = EXCLUDED.price,
  unit = EXCLUDED.unit,
  "durationDays" = EXCLUDED."durationDays",
  category = EXCLUDED.category;

COMMIT;

-- ==========================================
-- 5. VERIFIKASI HASIL
-- ==========================================
SELECT 
  u.email, 
  p.role, 
  s.name as nama_toko 
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
LEFT JOIN public.stores s ON p.store_id = s.id
ORDER BY p.role DESC;
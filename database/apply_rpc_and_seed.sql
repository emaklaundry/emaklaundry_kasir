-- apply_rpc_and_seed.sql
-- This file contains the `update_transaction_progress` RPC and the service seed block
-- that targets the store named 'Cabang Kota Banjar'.
-- Paste this entire file into Supabase SQL Editor (or run with psql) to apply.

BEGIN;

-- Ensure we use public schema
SET LOCAL search_path = public;

-- RPC: update_transaction_progress (idempotent - replaces existing function)
CREATE OR REPLACE FUNCTION public.update_transaction_progress(
  transaction_id_input uuid,
  p_amount_paid numeric DEFAULT NULL,
  p_change numeric DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_order_status text DEFAULT NULL
)
RETURNS SETOF public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_role text;
  caller_store uuid;
  tx_store uuid;
BEGIN
  -- Load caller profile
  SELECT role, store_id INTO caller_role, caller_store FROM public.profiles WHERE id = caller;
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Ensure transaction exists and get its store
  SELECT "storeId" INTO tx_store FROM public.transactions WHERE id = transaction_id_input;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'transaction not found';
  END IF;

  -- Permission check: Super Admin bypasses store check
  IF caller_role <> 'Super Admin' AND tx_store IS DISTINCT FROM caller_store THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Perform update (only allowed progress fields)
  UPDATE public.transactions
  SET
    "amountPaid" = COALESCE(p_amount_paid, "amountPaid"),
    "change" = COALESCE(p_change, "change"),
    "paymentMethod" = COALESCE(p_payment_method, "paymentMethod"),
    "paymentStatus" = COALESCE(p_payment_status, "paymentStatus"),
    "orderStatus" = COALESCE(p_order_status, "orderStatus")
  WHERE id = transaction_id_input;

  -- Best-effort audit log write (do not fail the function if audit fails)
  BEGIN
    INSERT INTO public.audit_logs("user", action, "storeId")
    VALUES ((SELECT name FROM public.profiles WHERE id = caller), concat('Update progress ', transaction_id_input), tx_store);
  EXCEPTION WHEN OTHERS THEN
    -- ignore audit failures
    NULL;
  END;

  RETURN QUERY SELECT * FROM public.transactions WHERE id = transaction_id_input;
END;
$$;

-- Seed services: upsert a large list of services into the target store (Cabang Kota Banjar)
CREATE UNIQUE INDEX IF NOT EXISTS services_name_store_idx ON public.services (lower(name), "storeId");

WITH target_store AS (
  SELECT id FROM public.stores
  WHERE id = '9b7e1c2a-1234-4bcd-8e9f-abcdef123456' OR name ILIKE 'Cabang Kota Banjar'
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

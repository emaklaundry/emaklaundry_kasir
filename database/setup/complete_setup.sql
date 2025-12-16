-- ============================================
-- LAUNDRY MANAGEMENT SYSTEM - DATABASE SETUP
-- Complete Schema & Functions Setup
-- Version: 3.0.0
-- Date: December 15, 2025
-- ============================================
-- 
-- IMPORTANT: Jalankan script ini di Supabase SQL Editor
-- File ini HANYA berisi schema, functions, RPC, dan security
-- TIDAK berisi data sample/seed
-- 
-- Sections:
-- 1. DROP TABLES (Reset) - COMMENTED OUT by default
-- 2. CREATE TABLES & FUNCTIONS
-- 3. RPC FUNCTIONS
-- 4. SECURITY & PERFORMANCE
-- 5. TRIGGERS & AUTOMATION
-- 
-- Untuk data sample/testing, jalankan seed_data.sql setelah ini
-- ============================================

-- ============================================
-- SECTION 1: DROP EXISTING TABLES (OPTIONAL)
-- ============================================
-- CAUTION: Ini akan menghapus semua data!
-- Uncomment baris dibawah jika ingin reset database
--
drop table if exists transaction_items cascade;
drop table if exists transactions cascade;
drop table if exists expenses cascade;
drop table if exists scheduled_maintenances cascade;
drop table if exists maintenance_logs cascade;
drop table if exists assets cascade;
drop table if exists inventory_items cascade;
drop table if exists services cascade;
drop table if exists customers cascade;
drop table if exists profiles cascade;
drop table if exists stores cascade;
drop table if exists audit_logs cascade;
drop table if exists settings cascade;
drop table if exists user_credentials cascade;

-- ============================================
-- SECTION 2: CREATE TABLES & FUNCTIONS
-- ============================================
-- Tabel stores harus dibuat paling awal karena direferensikan oleh banyak tabel lain
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  "isActive" boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT NOW()
);


-- OPTIMASI: Tambah kolom storeId untuk multi-cabang
CREATE TABLE public.settings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "receiptMessage" text,
  "taxRate" numeric,
  "discountRate" numeric,
  "storeId" uuid REFERENCES public.stores(id) ON DELETE CASCADE
);



ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- === DEFINISI FUNGSI handle_new_user (HARUS SEBELUM TRIGGER) ===
CREATE OR REPLACE FUNCTION public.handle_new_user(
  user_id uuid,
  user_name text,
  user_role text,
  store_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, store_id)
  VALUES (user_id, user_name, user_role, store_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Batasi akses eksekusi hanya untuk service_role
REVOKE EXECUTE ON FUNCTION public.handle_new_user(uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user(uuid, text, text, uuid) TO service_role;

-- OPTIMASI: Trigger handle_new_user otomatis saat user baru di auth.users
-- Penyempurnaan: handle_new_user_trigger kini membaca store_id dan role dari metadata
CREATE OR REPLACE FUNCTION public.handle_new_user_trigger()
RETURNS trigger AS $$
BEGIN
  PERFORM public.handle_new_user(
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'Admin' THEN 'Kasir'
      WHEN NEW.raw_user_meta_data->>'role' = 'Super Admin' THEN 'Kasir'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'Kasir')
    END,
    NULLIF(NEW.raw_user_meta_data->>'store_id', '')::uuid
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_trigger();

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL, -- 'Super Admin', 'Admin', 'Kasir'
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL, -- DITAMBAHKAN: ON DELETE SET NULL
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  "isActive" boolean DEFAULT true,
  "canGiveDiscount" boolean DEFAULT false
);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  notes text,
  "defaultDiscount" integer DEFAULT 0,
  "createdAt" timestamp WITH TIME ZONE DEFAULT NOW(),
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);


-- ENUM for service category
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_category') THEN
    CREATE TYPE public.service_category AS ENUM ('Kiloan','Satuan','Sepatu','Karpet');
  END IF;
END$$;

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category public.service_category NOT NULL,
  wash_type text NOT NULL DEFAULT 'Pakaian',
  price integer NOT NULL,
  unit text NOT NULL,
  "durationDays" integer NOT NULL,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);


CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stock integer NOT NULL,
  "lowStockThreshold" integer NOT NULL,
  unit text NOT NULL,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "serialNumber" text,
  "purchaseDate" date,
  "purchaseCost" numeric,
  status text NOT NULL,
  "maintenanceHistory" jsonb,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE public.scheduled_maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assetId" uuid REFERENCES assets(id) ON DELETE CASCADE,
  description text NOT NULL,
  "frequencyValue" integer NOT NULL,
  "frequencyUnit" text NOT NULL,
  "nextDueDate" date NOT NULL,
  "lastCompletedDate" date
);

CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceCode" text UNIQUE, -- konsisten camelCase
  "customerId" uuid REFERENCES customers(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  discount numeric NOT NULL,
  tax numeric NOT NULL,
  total numeric NOT NULL,
  "paymentStatus" text NOT NULL,
  "orderStatus" text NOT NULL,
  "createdAt" timestamp WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" timestamp WITH TIME ZONE DEFAULT NOW(),
  "estimatedCompletionDate" timestamp with time zone,
  "amountPaid" numeric NOT NULL,
  change numeric NOT NULL,
  "paymentMethod" text,
  "createdByUserId" uuid REFERENCES profiles(id) ON DELETE SET NULL,
  "updatedByUserId" uuid REFERENCES profiles(id) ON DELETE SET NULL,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL,
  notes text,
  "idempotencyKey" uuid UNIQUE
);

-- MIGRATION: Pastikan kolom updatedAt dan updatedByUserId ada (untuk database existing)
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS "updatedAt" timestamp WITH TIME ZONE DEFAULT NOW();

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS "updatedByUserId" uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update nilai updatedAt untuk record lama (jika ada)
UPDATE public.transactions 
SET "updatedAt" = "createdAt"
WHERE "updatedAt" IS NULL;


-- === SEMUA INDEX DAN PUBLIKASI DILETAKKAN DI BAWAH SETELAH SEMUA TABEL DIBUAT ===

-- 1. Index untuk Customers (Sekarang aman karena tabel customers sudah ada)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_store
ON public.customers(phone, "storeId")
WHERE phone IS NOT NULL AND phone <> '';

-- 2. Index untuk tabel transactions
CREATE INDEX IF NOT EXISTS idx_transactions_store_id ON public.transactions("storeId");
CREATE INDEX IF NOT EXISTS idx_transactions_idempotency_key ON public.transactions("idempotencyKey");
CREATE INDEX IF NOT EXISTS idx_transactions_invoice_code ON public.transactions("invoiceCode");

-- Tambahan Index Optimasi (untuk performa filter storeId di semua tabel utama)
CREATE INDEX IF NOT EXISTS idx_settings_store_id ON public.settings("storeId");
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON public.customers("storeId"); -- Index non-unique utk filter cepat
CREATE INDEX IF NOT EXISTS idx_inventory_store_id ON public.inventory_items("storeId");
CREATE INDEX IF NOT EXISTS idx_expenses_store_id ON public.expenses("storeId");
CREATE INDEX IF NOT EXISTS idx_assets_store_id ON public.assets("storeId");
CREATE INDEX IF NOT EXISTS idx_services_store_id ON public.services("storeId");

-- 3. Aktifkan Supabase Realtime untuk tabel transaksi (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
END;
$$;

-- === FUNGSI DAN TRIGGER UNTUK INVOICE_CODE ===

CREATE OR REPLACE FUNCTION public.generate_invoice_code(length int DEFAULT 6)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_invoice_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  store_prefix text := 'EM';
  max_attempts int := 10;
  attempt int := 0;
BEGIN
  IF NEW."storeId" IS NOT NULL THEN
     SELECT upper(substr(regexp_replace(name, '[^a-zA-Z]', '', 'g'), 1, 3))
     INTO store_prefix
     FROM public.stores
     WHERE id = NEW."storeId";
     IF store_prefix IS NULL OR length(store_prefix) = 0 THEN
        store_prefix := 'EM';
     END IF;
  END IF;

  WHILE attempt < max_attempts LOOP
    new_code := store_prefix || '-' || public.generate_invoice_code(6);
    IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE "invoiceCode" = new_code) THEN
      NEW."invoiceCode" := new_code;
      RETURN NEW;
    END IF;
    attempt := attempt + 1;
  END LOOP;

  RAISE EXCEPTION 'Gagal membuat invoice_code unik setelah % percobaan', max_attempts;
END;
$$;

DROP TRIGGER IF EXISTS before_transaction_insert_set_code ON public.transactions;
CREATE TRIGGER before_transaction_insert_set_code
BEFORE INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_invoice_code();

-- === AKHIR BAGIAN INVOICE_CODE ===

CREATE TABLE public.audit_logs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  timestamp timestamp WITH TIME ZONE DEFAULT NOW(),
  "user" text,
  action text,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);



-- === 2. AKTIFKAN RLS ===
-- (Ini sama seperti skrip Anda, semua sudah benar)

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;



-- === 3. HELPER FUNCTIONS UNTUK RLS ===

DROP FUNCTION IF EXISTS public.get_my_role();
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER -- DIPERLUKAN: Menjalankan fungsi sebagai pembuat (bukan pemanggil) untuk bypass RLS
SET search_path = public -- DIPERLUKAN: Mencegah pembajakan search path
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

DROP FUNCTION IF EXISTS public.get_my_store_id();
CREATE OR REPLACE FUNCTION public.get_my_store_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER -- DIPERLUKAN: Menjalankan fungsi sebagai pembuat (bukan pemanggil) untuk bypass RLS
SET search_path = public -- DIPERLUKAN: Mencegah pembajakan search path
AS $$
  SELECT store_id FROM public.profiles WHERE id = auth.uid()
$$;


-- === 4. MEMBUAT RLS POLICY YANG BARU DAN AMAN ===
-- --- Tabel: profiles ---
-- Ensure users can always read their own profile so the client can display a helpful message
DROP POLICY IF EXISTS "Users can see their own profile (if active)" ON public.profiles;
CREATE POLICY "Users can see their own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can see profiles in their store" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'Admin' AND store_id = public.get_my_store_id());
CREATE POLICY "Super Admins can see all profiles" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'Super Admin');
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Mencegah user mengubah role mereka sendiri
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    -- Mencegah user mengubah cabang mereka sendiri
    AND store_id = (SELECT store_id FROM public.profiles WHERE id = auth.uid())
  );
DROP POLICY IF EXISTS "Admins can manage profiles in their store" ON public.profiles;

CREATE POLICY "Admins can manage profiles in their store" ON public.profiles
  FOR ALL 
  USING (
    public.get_my_role() = 'Admin' 
    AND store_id = public.get_my_store_id()
  )
  WITH CHECK (
    public.get_my_role() = 'Admin' 
    AND store_id = public.get_my_store_id()
    -- TAMBAHAN PENTING: Mencegah Admin membuat Super Admin
    AND role IN ('Admin', 'Kasir') 
    -- TAMBAHAN PENTING: Mencegah Admin memindahkan user ke toko lain
    AND store_id = public.get_my_store_id() 
  );
CREATE POLICY "Super Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'Super Admin')
  WITH CHECK (public.get_my_role() = 'Super Admin');

-- --- Tabel: stores ---
CREATE POLICY "Allow SELECT for store users" ON public.stores
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR id = public.get_my_store_id());
CREATE POLICY "Allow INSERT/UPDATE/DELETE for Super Admins only" ON public.stores
  FOR ALL USING (public.get_my_role() = 'Super Admin')
  WITH CHECK (public.get_my_role() = 'Super Admin');

-- --- Tabel: customers ---
CREATE POLICY "Allow SELECT for store users" ON public.customers
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for store users" ON public.customers
  FOR INSERT WITH CHECK (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow UPDATE/DELETE for Admins" ON public.customers
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.customers
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: services ---
CREATE POLICY "Allow SELECT for store users" ON public.services
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for Admins" ON public.services
  FOR INSERT WITH CHECK (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow UPDATE/DELETE for Admins" ON public.services
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.services
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: inventory_items ---
CREATE POLICY "Allow SELECT for store users" ON public.inventory_items
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for store users" ON public.inventory_items
  FOR INSERT WITH CHECK (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow UPDATE for Admins" ON public.inventory_items
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.inventory_items
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: assets ---
CREATE POLICY "Allow SELECT for store users" ON public.assets
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for Admins" ON public.assets
  FOR INSERT WITH CHECK (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow UPDATE for Admins" ON public.assets
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.assets
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: scheduled_maintenances ---
CREATE POLICY "Allow SELECT for store users" ON public.scheduled_maintenances
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "assetId" IN (SELECT id FROM public.assets WHERE "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow INSERT for Admins" ON public.scheduled_maintenances
  FOR INSERT WITH CHECK (public.get_my_role() = 'Super Admin' OR "assetId" IN (SELECT id FROM public.assets WHERE "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow UPDATE for Admins" ON public.scheduled_maintenances
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "assetId" IN (SELECT id FROM public.assets WHERE "storeId" = public.get_my_store_id())));
CREATE POLICY "Allow DELETE for Admins" ON public.scheduled_maintenances
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "assetId" IN (SELECT id FROM public.assets WHERE "storeId" = public.get_my_store_id())));

-- --- Tabel: expenses ---
CREATE POLICY "Allow SELECT for store users" ON public.expenses
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for store users" ON public.expenses
  FOR INSERT WITH CHECK (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow UPDATE for Admins" ON public.expenses
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.expenses
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: transactions ---
CREATE POLICY "Allow SELECT for store users" ON public.transactions
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for store users" ON public.transactions
  FOR INSERT WITH CHECK (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());

-- Trigger: Prevent update of immutable fields except by Super Admin
CREATE OR REPLACE FUNCTION public.prevent_immutable_transaction_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
BEGIN
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF current_user_role <> 'Super Admin' THEN
    IF NEW.total IS DISTINCT FROM OLD.total THEN
      RAISE EXCEPTION 'You are not allowed to change total';
    END IF;
    IF NEW.items IS DISTINCT FROM OLD.items THEN
      RAISE EXCEPTION 'You are not allowed to change items';
    END IF;
    IF NEW."customerId" IS DISTINCT FROM OLD."customerId" THEN
      RAISE EXCEPTION 'You are not allowed to change customerId';
    END IF;
    IF NEW."createdByUserId" IS DISTINCT FROM OLD."createdByUserId" THEN
      RAISE EXCEPTION 'You are not allowed to change createdByUserId';
    END IF;
    IF NEW."storeId" IS DISTINCT FROM OLD."storeId" THEN
      RAISE EXCEPTION 'You are not allowed to change storeId';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_immutable_transaction_update ON public.transactions;
CREATE TRIGGER prevent_immutable_transaction_update
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_transaction_update();

DROP POLICY IF EXISTS "Allow UPDATE for Admins" ON public.transactions;
CREATE POLICY "Allow UPDATE for Admins and Kasirs (progress only)" ON public.transactions
  FOR UPDATE
  USING (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin','Kasir')
      AND "storeId" = public.get_my_store_id()
    )
  );

CREATE POLICY "Allow DELETE for Admins" ON public.transactions
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: audit_logs ---
CREATE POLICY "Allow SELECT for Admins" ON public.audit_logs
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
DROP POLICY IF EXISTS "Allow INSERT for all users" ON public.audit_logs;
CREATE POLICY "Allow INSERT for all logged-in users" ON public.audit_logs
  FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- --- Tabel: settings ---
DROP POLICY IF EXISTS "Allow read for store users" ON public.settings;
CREATE POLICY "Allow read access for own store" ON public.settings
  FOR SELECT USING (
    "storeId" = public.get_my_store_id()
    OR public.get_my_role() = 'Super Admin'
    -- Tambahkan OR true jika halaman tracking publik perlu akses ini tanpa login
  );
CREATE POLICY "Allow ALL for Admins" ON public.settings
  FOR ALL USING (public.get_my_role() IN ('Super Admin', 'Admin'))
  WITH CHECK (public.get_my_role() IN ('Super Admin', 'Admin'));


-- ============================================
-- SECTION 3: RPC FUNCTIONS
-- ============================================

-- === RPC: get_public_services ===
-- Return a safe list of services (no pricing) for a given store
CREATE OR REPLACE FUNCTION public.get_public_services(
  store_id_input uuid
)
RETURNS TABLE (
  service_name text,
  category text,
  duration_days integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.name AS service_name,
    s.category::text AS category,
    s."durationDays"::integer AS duration_days
  FROM
    public.services AS s
  WHERE
    s."storeId" = store_id_input;
$$;

-- Note: This RPC intentionally omits price/unit to avoid exposing sensitive pricing data to public clients.

-- === RPC: update_transaction_progress ===
-- Atomically update allowed progress fields on a transaction and insert an audit_log entry.
-- Caller must be authenticated. Super Admin can update any transaction; Admin/Kasir can only update transactions in their store.

-- Penyempurnaan: Validasi status akhir transaksi agar tidak bisa Selesai jika belum Lunas, dan tidak bisa mengubah status bayar jadi Belum Lunas jika sudah Selesai
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
SET search_path = public
AS $$
DECLARE
  caller uuid := auth.uid();
  caller_role text;
  caller_store uuid;
  tx_store uuid;
  current_payment_status text;
  current_order_status text;
  final_payment_status text;
  final_order_status text;
BEGIN
  -- Load caller profile (use table alias to avoid ambiguity)
  SELECT p.role, p.store_id INTO caller_role, caller_store FROM public.profiles p WHERE p.id = caller;
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Ambil status Payment DAN Order saat ini dari database
  SELECT t."storeId", t."paymentStatus", t."orderStatus"
    INTO tx_store, current_payment_status, current_order_status
    FROM public.transactions t WHERE t.id = transaction_id_input;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'transaction not found';
  END IF;

  -- Permission check
  IF caller_role <> 'Super Admin' AND tx_store IS DISTINCT FROM caller_store THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Tentukan Status Akhir (Gunakan input baru jika ada, jika tidak pakai yang lama)
  final_payment_status := COALESCE(p_payment_status, current_payment_status);
  final_order_status := COALESCE(p_order_status, current_order_status);

  -- Validasi Menyeluruh
  -- Tidak boleh ada kondisi dimana Order='Selesai' TAPI Payment!='Lunas'
  IF final_order_status = 'Selesai' AND final_payment_status <> 'Lunas' THEN
    RAISE EXCEPTION 'Inkonsistensi: Pesanan tidak boleh berstatus Selesai jika pembayaran belum Lunas.';
  END IF;
  -- Tidak boleh mengubah status bayar jadi Belum Lunas jika order sudah Selesai
  IF current_order_status = 'Selesai' AND final_payment_status <> 'Lunas' THEN
    RAISE EXCEPTION 'Inkonsistensi: Status pembayaran tidak boleh diubah menjadi belum lunas jika pesanan sudah selesai.';
  END IF;

  -- Perform update
  UPDATE public.transactions
  SET
    "amountPaid" = COALESCE(p_amount_paid, "amountPaid"),
    "change" = COALESCE(p_change, "change"),
    "paymentMethod" = COALESCE(p_payment_method, "paymentMethod"),
    "paymentStatus" = COALESCE(p_payment_status, "paymentStatus"),
    "orderStatus" = COALESCE(p_order_status, "orderStatus")
  WHERE id = transaction_id_input;

  -- Audit log (use table alias to avoid ambiguity)
  INSERT INTO public.audit_logs("user", action, "storeId")
  VALUES ((SELECT p.name FROM public.profiles p WHERE p.id = caller), concat('Update progress ', transaction_id_input), tx_store);

  RETURN QUERY SELECT * FROM public.transactions WHERE id = transaction_id_input;
END;
$$;

-- === RPC: bulk_update_order_status ===
-- Bulk update order status untuk multiple transactions sekaligus
CREATE OR REPLACE FUNCTION public.bulk_update_order_status(
  p_transaction_ids uuid[],
  p_new_status text,
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Update semua transaksi dalam satu transaksi database
  -- updatedAt akan diupdate otomatis oleh trigger
  UPDATE public.transactions
  SET "orderStatus" = p_new_status
  WHERE id = ANY(p_transaction_ids);
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;


-- ============================================
-- SECTION 4: SECURITY & PERFORMANCE
-- ============================================

-- Security and performance enhancements untuk production

CREATE OR REPLACE FUNCTION public.complete_scheduled_maintenance(
  maintenance_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_freq_value int;
  v_freq_unit text;
  v_interval interval;
BEGIN
  -- 1. Ambil frekuensi dari row terkait
  SELECT "frequencyValue", "frequencyUnit"
  INTO v_freq_value, v_freq_unit
  FROM public.scheduled_maintenances
  WHERE id = maintenance_id;

  -- 2. Mapping unit dari frontend ke interval SQL
  CASE v_freq_unit
    WHEN 'days' THEN v_interval := (v_freq_value || ' days')::interval;
    WHEN 'weeks' THEN v_interval := (v_freq_value || ' weeks')::interval;
    WHEN 'months' THEN v_interval := (v_freq_value || ' months')::interval;
    WHEN 'years' THEN v_interval := (v_freq_value || ' years')::interval;
    ELSE v_interval := INTERVAL '30 days'; -- Fallback jika unit tidak dikenali
  END CASE;

  -- 3. Update data
  UPDATE public.scheduled_maintenances
  SET 
    "lastCompletedDate" = CURRENT_DATE, 
    "nextDueDate" = CURRENT_DATE + v_interval
  WHERE id = maintenance_id;
END;
$$;

-- Membuat fungsi baru yang menerima TEXT
DROP FUNCTION IF EXISTS public.get_laundry_status(text);
CREATE OR REPLACE FUNCTION public.get_laundry_status(
  input_identifier text
)
RETURNS TABLE (
  id text,
  "invoiceCode" text,
  "customerName" text,
  "createdAt" timestamp with time zone,
  "estimatedCompletionDate" timestamp with time zone,
  "orderStatus" text,
  "paymentStatus" text,
  total numeric,
  "amountPaid" numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id::text,
    t."invoiceCode" AS "invoiceCode",
    COALESCE(c.name, 'Guest/Dihapus') AS "customerName",
    t."createdAt",
    t."estimatedCompletionDate",
    t."orderStatus",
    t."paymentStatus",
    t.total,
    t."amountPaid"
  FROM
    public.transactions AS t
  LEFT JOIN
    public.customers AS c ON t."customerId" = c.id
  WHERE
    t."invoiceCode" ILIKE input_identifier
    OR (
      input_identifier ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND t.id = input_identifier::uuid
    );
$$;


-- ============================================
-- SECTION 4: SECURITY & PERFORMANCE
-- ============================================

-- ============================================
-- SECURITY & PERFORMANCE ENHANCEMENTS
-- Database Optimizations untuk Production
-- ============================================

-- 1. VALIDASI INPUT DI RPC FUNCTIONS
-- Perbarui function update_transaction_status dengan validasi ketat

CREATE OR REPLACE FUNCTION public.update_transaction_status_safe(
  transaction_id_input text,
  new_payment_status text DEFAULT NULL,
  new_order_status text DEFAULT NULL,
  caller uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_role text;
  transaction_store_id text;
BEGIN
  -- Validasi: Cek apakah user sudah login
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not authenticated';
  END IF;

  -- Ambil role user
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = caller;

  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not found';
  END IF;

  -- Validasi input untuk mencegah SQL injection dan invalid data
  IF new_payment_status IS NOT NULL 
     AND new_payment_status NOT IN ('Lunas', 'Belum Lunas', 'DP') THEN
    RAISE EXCEPTION 'Invalid payment status: %', new_payment_status;
  END IF;
  
  IF new_order_status IS NOT NULL 
     AND new_order_status NOT IN ('Pending', 'Sedang Diproses', 'Siap Diambil', 'Selesai', 'Dibatalkan') THEN
    RAISE EXCEPTION 'Invalid order status: %', new_order_status;
  END IF;

  -- Ambil store_id dari transaksi
  SELECT "storeId" INTO transaction_store_id
  FROM public.transactions
  WHERE id = transaction_id_input;

  IF transaction_store_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found: %', transaction_id_input;
  END IF;

  -- Role-based access control
  IF current_user_role != 'SuperAdmin' THEN
    -- Non-SuperAdmin hanya bisa update transaksi dari store mereka
    DECLARE
      user_store_id text;
    BEGIN
      SELECT store_id INTO user_store_id
      FROM public.profiles
      WHERE id = caller;

      IF user_store_id IS NULL OR user_store_id != transaction_store_id THEN
        RAISE EXCEPTION 'Forbidden: Cannot update transaction from different store';
      END IF;
    END;
  END IF;

  -- Update transaksi (updatedAt akan di-set otomatis oleh trigger)
  IF new_payment_status IS NOT NULL THEN
    UPDATE public.transactions
    SET "paymentStatus" = new_payment_status
    WHERE id = transaction_id_input;
  END IF;

  IF new_order_status IS NOT NULL THEN
    UPDATE public.transactions
    SET "orderStatus" = new_order_status
    WHERE id = transaction_id_input;
  END IF;

  -- Log audit
  INSERT INTO public.audit_logs ("timestamp", "user", "action", "storeId")
  VALUES (
    NOW(),
    (SELECT name FROM public.profiles WHERE id = caller),
    format('Updated transaction %s status', transaction_id_input),
    transaction_store_id
  );
END;
$$;

-- 2. PERFORMANCE INDEXES
-- Index untuk optimasi query yang sering digunakan

-- Index untuk transactions (compound index untuk filter umum)
CREATE INDEX IF NOT EXISTS idx_transactions_store_date 
  ON public.transactions("storeId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_date 
  ON public.transactions("customerId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_status 
  ON public.transactions("paymentStatus", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_order_status 
  ON public.transactions("orderStatus", "createdAt" DESC);

-- Index untuk composite queries (multi-column filtering)
CREATE INDEX IF NOT EXISTS idx_transactions_composite 
  ON public.transactions("storeId", "paymentStatus", "orderStatus", "createdAt" DESC);

-- Index untuk audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_store_timestamp 
  ON public.audit_logs("storeId", "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
  ON public.audit_logs("timestamp" DESC);

-- Index untuk customers search
CREATE INDEX IF NOT EXISTS idx_customers_name_gin 
  ON public.customers USING gin(to_tsvector('indonesian', name));

CREATE INDEX IF NOT EXISTS idx_customers_phone 
  ON public.customers(phone);

-- Index untuk inventory
CREATE INDEX IF NOT EXISTS idx_inventory_store 
  ON public.inventory_items("storeId", name);

-- Index untuk assets
CREATE INDEX IF NOT EXISTS idx_assets_store_status 
  ON public.assets("storeId", "status");

-- Index untuk expenses (filtering dan sorting)
CREATE INDEX IF NOT EXISTS idx_expenses_store_category 
  ON public.expenses("storeId", "category");

CREATE INDEX IF NOT EXISTS idx_expenses_date 
  ON public.expenses("date" DESC);

-- Index untuk services (filtering)
CREATE INDEX IF NOT EXISTS idx_services_category 
  ON public.services("category");

CREATE INDEX IF NOT EXISTS idx_services_wash_type 
  ON public.services("wash_type");

-- Index untuk scheduled_maintenances
CREATE INDEX IF NOT EXISTS idx_scheduled_maintenances_next_due 
  ON public.scheduled_maintenances("nextDueDate");

CREATE INDEX IF NOT EXISTS idx_scheduled_maintenances_status 
  ON public.scheduled_maintenances("status");

-- 3. ROW LEVEL SECURITY (RLS) ENHANCEMENTS
-- Pastikan RLS enabled untuk semua tabel sensitif

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk transactions (sudah ada, tapi dipastikan)
DROP POLICY IF EXISTS "Users can view their store transactions" ON public.transactions;
CREATE POLICY "Users can view their store transactions"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role = 'Super Admin'
    )
    OR
    "storeId" = (
      SELECT store_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their store transactions" ON public.transactions;
CREATE POLICY "Users can insert their store transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    "storeId" = (
      SELECT store_id FROM public.profiles 
      WHERE id = auth.uid()
    )
    OR
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role = 'Super Admin'
    )
  );

DROP POLICY IF EXISTS "Users can update their store transactions" ON public.transactions;
CREATE POLICY "Users can update their store transactions"
  ON public.transactions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE role = 'Super Admin'
    )
    OR
    "storeId" = (
      SELECT store_id FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- 4. FUNCTION UNTUK CLEANUP OLD DATA
-- Function untuk archive/delete data lama (jalankan periodic via cron)

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Hanya SuperAdmin yang bisa jalankan
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'Super Admin'
  ) THEN
    RAISE EXCEPTION 'Only SuperAdmin can cleanup audit logs';
  END IF;

  -- Delete audit logs older than specified days
  DELETE FROM public.audit_logs
  WHERE "timestamp" < NOW() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 5. TRIGGER UNTUK AUTO UPDATE updatedAt
-- Pastikan setiap update record otomatis update timestamp

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger ke tabel yang punya updatedAt
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory_items;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. GRANT PERMISSIONS
-- Pastikan permissions benar untuk security definer functions

GRANT EXECUTE ON FUNCTION public.update_transaction_status_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs TO authenticated;

-- ============================================
-- CATATAN DEPLOYMENT:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Monitor query performance dengan pg_stat_statements
-- 3. Vacuum analyze setelah create index: VACUUM ANALYZE;
-- 4. Setup cron job untuk cleanup_old_audit_logs (monthly)
-- ============================================


-- ============================================
-- SECTION 5: TRIGGERS & AUTOMATION
-- ============================================

-- ---------------------------------------------
-- 5.1 Auto-update updatedAt Column
-- ---------------------------------------------

-- Trigger untuk auto-update updatedAt pada transactions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- ---------------------------------------------
-- 5.2 Additional Features Configuration
-- ---------------------------------------------

-- Maintenance Mode
ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS "isMaintenanceMode" boolean DEFAULT FALSE;

ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS "maintenanceMessage" text;

COMMENT ON COLUMN public.settings."isMaintenanceMode" IS 
  'Flag untuk mengaktifkan mode pemeliharaan sistem. Hanya Super Admin yang dapat akses saat aktif.';
COMMENT ON COLUMN public.settings."maintenanceMessage" IS 
  'Pesan custom yang ditampilkan saat sistem dalam mode pemeliharaan.';


-- WhatsApp Custom Footer
ALTER TABLE public.settings 
  ADD COLUMN IF NOT EXISTS "whatsappFooter" text;

COMMENT ON COLUMN public.settings."whatsappFooter" IS 
  'Footer custom untuk pesan WhatsApp (tracking link & feedback form). Jika kosong, akan menggunakan default.';


-- ---------------------------------------------
-- 5.3 Verifikasi Final
-- ---------------------------------------------

-- Verifikasi semua tables, functions, dan features
DO $$
DECLARE
  table_count INTEGER;
  function_count INTEGER;
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public';
  
  SELECT COUNT(*) INTO function_count 
  FROM information_schema.routines 
  WHERE routine_schema = 'public';
  
  SELECT COUNT(*) INTO trigger_count 
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public';
  
  RAISE NOTICE '=== Database Setup Complete ===';
  RAISE NOTICE 'Tables: %', table_count;
  RAISE NOTICE 'Functions: %', function_count;
  RAISE NOTICE 'Triggers: %', trigger_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run seed_data.sql untuk sample data';
END $$;


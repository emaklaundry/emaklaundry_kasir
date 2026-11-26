-- ============================================
-- LAUNDRY MANAGEMENT SYSTEM - DATABASE SETUP
-- Complete Schema & Functions Setup
-- Version: 3.5.0
-- Date: November 26, 2026
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
-- 6. HRM LITE TABLES (Employees, Attendance, Advances, Payroll)
-- 7. INVENTORY RECIPES, STOCK OPNAME, & SOP
-- 8. RECURRING MONTHLY EXPENSES (Listrik, Air, Wi-Fi)
-- 9. EMPLOYEE PROFILE & PIN LOGIN
-- 10. KUNCI AKSES FUNGSI SECURITY DEFINER
-- 11. PIN SUPERVISOR (otorisasi Kasir oleh Admin)
-- 12. KARYAWAN: PROFIL, JADWAL & KOMPENSASI
--
-- File ini adalah sumber utama skema database. Setiap perubahan skema baru
-- ditulis di sini, lalu dijalankan ke database live sebagai SQL terpisah.
-- Setelah setup, deploy edge function employee-login & manage-employee-login.
-- 
-- Untuk data sample/testing, jalankan 1.seed_data_awal.sql setelah ini
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
  "isActive" boolean DEFAULT true
);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  notes text,
  "createdAt" timestamp WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" timestamp WITH TIME ZONE DEFAULT NOW(),
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
  "updatedAt" timestamp WITH TIME ZONE DEFAULT NOW(),
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

-- Add updatedAt column if missing (for existing tables)
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS "updatedAt" timestamp WITH TIME ZONE DEFAULT NOW();

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
  "lastCompletedDate" date,
  "estimatedCost" numeric DEFAULT 0
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
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin', 'Kasir')
      AND "storeId" = public.get_my_store_id()
    )
  );
CREATE POLICY "Allow UPDATE/DELETE for Admins" ON public.customers
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.customers
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: services ---
CREATE POLICY "Allow SELECT for store users" ON public.services
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for Admins" ON public.services
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() = 'Admin'
      AND "storeId" = public.get_my_store_id()
    )
  );
CREATE POLICY "Allow UPDATE/DELETE for Admins" ON public.services
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.services
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: inventory_items ---
CREATE POLICY "Allow SELECT for store users" ON public.inventory_items
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for store users" ON public.inventory_items
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin', 'Kasir')
      AND "storeId" = public.get_my_store_id()
    )
  );
CREATE POLICY "Allow UPDATE for Admins" ON public.inventory_items
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.inventory_items
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: assets ---
CREATE POLICY "Allow SELECT for store users" ON public.assets
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for Admins" ON public.assets
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() = 'Admin'
      AND "storeId" = public.get_my_store_id()
    )
  );
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
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin', 'Kasir')
      AND "storeId" = public.get_my_store_id()
    )
  );
CREATE POLICY "Allow UPDATE for Admins" ON public.expenses
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.expenses
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: transactions ---
CREATE POLICY "Allow SELECT for store users" ON public.transactions
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR "storeId" = public.get_my_store_id());
CREATE POLICY "Allow INSERT for store users" ON public.transactions
  FOR INSERT WITH CHECK (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin', 'Kasir')
      AND "storeId" = public.get_my_store_id()
    )
  );

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
DROP FUNCTION IF EXISTS public.get_public_services(uuid);
CREATE OR REPLACE FUNCTION public.get_public_services(
  store_id_input uuid
)
RETURNS TABLE (
  service_name text,
  category text,
  wash_type text,
  duration_days integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.name AS service_name,
    s.category::text AS category,
    s.wash_type,
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

-- Hak akses fungsi diatur lengkap di SECTION 10 (Kunci akses fungsi).
-- cleanup_old_audit_logs sengaja TIDAK diberikan ke authenticated.

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
-- (Function update_updated_at_column already defined above)

-- (Trigger update_transactions_updated_at already defined above)


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


-- ============================================
-- SECTION 6: BACKFILL INVOICE CODES
-- ============================================
-- Function to generate invoice codes for existing transactions
-- This ensures all transactions have proper invoice codes

CREATE OR REPLACE FUNCTION public.backfill_invoice_codes()
RETURNS TABLE (
  transaction_id uuid,
  old_invoice_code text,
  new_invoice_code text,
  success boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tx_record RECORD;
  store_prefix text;
  new_code text;
  attempt int;
  max_attempts int := 10;
  updated_count int := 0;
BEGIN
  -- Loop throughall transactions without invoiceCode
  FOR tx_record IN
    SELECT t.id, t."storeId", t."invoiceCode"
    FROM public.transactions t
    WHERE t."invoiceCode" IS NULL OR t."invoiceCode" = ''
    ORDER BY t."createdAt" ASC
  LOOP
    -- Get store prefix
    IF tx_record."storeId" IS NOT NULL THEN
      SELECT upper(substr(regexp_replace(name, '[^a-zA-Z]', '', 'g'), 1, 3))
      INTO store_prefix
      FROM public.stores
      WHERE id = tx_record."storeId";
      
      IF store_prefix IS NULL OR length(store_prefix) = 0 THEN
        store_prefix := 'EM';
      END IF;
    ELSE
      store_prefix := 'EM';
    END IF;

    -- Generate unique code
    attempt := 0;
    WHILE attempt < max_attempts LOOP
      new_code := store_prefix || '-' || public.generate_invoice_code(6);
      
      -- Check if code already exists
      IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE "invoiceCode" = new_code) THEN
        -- Update the transaction
        UPDATE public.transactions
        SET "invoiceCode" = new_code
        WHERE id = tx_record.id;
        
        updated_count := updated_count + 1;
        
        -- Return result for this transaction
        RETURN QUERY SELECT 
          tx_record.id,
          tx_record."invoiceCode",
          new_code,
          true;
        
        EXIT; -- Break the while loop
      END IF;
      
      attempt := attempt + 1;
    END LOOP;
    
    -- If failed to generate unique code
    IF attempt >= max_attempts THEN
      RETURN QUERY SELECT 
        tx_record.id,
        tx_record."invoiceCode",
        NULL::text,
        false;
    END IF;
  END LOOP;
  
  -- Log the result
  RAISE NOTICE 'Backfill complete: % transactions updated', updated_count;
END;
$$;

-- Note: The backfill function is now available but not automatically executed
-- To run it, execute: SELECT * FROM public.backfill_invoice_codes();
-- This gives you control over when to backfill existing data

-- ============================================
-- AUTO-EXECUTE BACKFILL ON SETUP
-- ============================================
-- Automatically backfill invoice codes for existing transactions

SELECT * FROM public.backfill_invoice_codes();

-- ============================================
-- END OF COMPLETE SETUP
-- ============================================
-- ============================================
-- POPULATE MISSING INVOICE CODES (ONE-TIME FIX)
-- ============================================

-- ============================================
-- POPULATE MISSING INVOICE CODES
-- ============================================
DO $$
DECLARE
  rec RECORD;
  new_code TEXT;
  store_prefix TEXT;
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  max_attempts INT := 10;
  attempt INT;
  i INT;
  updated_count INT := 0;
BEGIN
  FOR rec IN 
    SELECT id, "storeId" FROM public.transactions WHERE "invoiceCode" IS NULL
  LOOP
    store_prefix := 'EM';
    IF rec."storeId" IS NOT NULL THEN
      SELECT upper(substr(regexp_replace(name, '[^a-zA-Z]', '', 'g'), 1, 3))
      INTO store_prefix FROM public.stores WHERE id = rec."storeId";
      IF store_prefix IS NULL OR length(store_prefix) = 0 THEN
        store_prefix := 'EM';
      END IF;
    END IF;
    attempt := 0;
    WHILE attempt < max_attempts LOOP
      new_code := store_prefix || '-';
      FOR i IN 1..6 LOOP
        new_code := new_code || substr(chars, floor(random() * length(chars))::int + 1, 1);
      END LOOP;
      IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE "invoiceCode" = new_code) THEN
        UPDATE public.transactions SET "invoiceCode" = new_code WHERE id = rec.id;
        updated_count := updated_count + 1;
        EXIT;
      END IF;
      attempt := attempt + 1;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Populated % missing invoice codes', updated_count;
END $$;

-- ============================================
-- SECTION 6: HRM LITE TABLES
-- ============================================
-- Fitur HRM Lite: Karyawan, Absensi, Kasbon, Payroll

-- 1. Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'operator', -- operator, kasir, admin
  base_salary NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0, -- percentage per kg
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Attendance table (clock-in/out)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- 3. Advances table (kasbon)
CREATE TABLE IF NOT EXISTS advances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  is_deducted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Payroll table
CREATE TABLE IF NOT EXISTS payroll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary NUMERIC NOT NULL DEFAULT 0,
  commission_total NUMERIC NOT NULL DEFAULT 0,
  deductions NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HRM Row Level Security (RLS) Policies
-- ============================================

-- Model akses (halaman Karyawan & Absensi hanya untuk Admin):
--   * Super Admin : semua cabang
--   * Admin       : karyawan di cabangnya sendiri
--   * Kasir / anon: tidak ada akses
-- Edge function (employee-login, manage-employee-login) memakai service role.

-- Helper: apakah user saat ini Admin/Super Admin yang boleh mengelola cabang ini?
CREATE OR REPLACE FUNCTION public.can_manage_store(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT public.get_my_role() = 'Super Admin'
      OR (public.get_my_role() = 'Admin' AND p_store_id = public.get_my_store_id());
$$;

-- Helper: pemeriksaan yang sama, lewat cabang milik karyawan.
CREATE OR REPLACE FUNCTION public.can_manage_employee(p_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    WHERE e.id = p_employee_id
      AND public.can_manage_store(e.store_id)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_manage_store(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_employee(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_store(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_employee(uuid) TO authenticated;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage employees in their store" ON public.employees;
CREATE POLICY "Admins manage employees in their store"
  ON public.employees FOR ALL TO authenticated
  USING ((SELECT public.can_manage_store(store_id)))
  WITH CHECK ((SELECT public.can_manage_store(store_id)));

DROP POLICY IF EXISTS "Admins manage attendance in their store" ON public.attendance;
CREATE POLICY "Admins manage attendance in their store"
  ON public.attendance FOR ALL TO authenticated
  USING (public.can_manage_employee(employee_id))
  WITH CHECK (public.can_manage_employee(employee_id));

DROP POLICY IF EXISTS "Admins manage advances in their store" ON public.advances;
CREATE POLICY "Admins manage advances in their store"
  ON public.advances FOR ALL TO authenticated
  USING (public.can_manage_employee(employee_id))
  WITH CHECK (public.can_manage_employee(employee_id));

DROP POLICY IF EXISTS "Admins manage payroll in their store" ON public.payroll;
CREATE POLICY "Admins manage payroll in their store"
  ON public.payroll FOR ALL TO authenticated
  USING (public.can_manage_employee(employee_id))
  WITH CHECK (public.can_manage_employee(employee_id));

-- ============================================
-- HRM Indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_store_id ON employees(store_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_advances_employee_id ON advances(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);

-- ============================================
-- END OF HRM LITE TABLES
-- ============================================


-- ============================================
-- SECTION 7: INVENTORY RECIPES, STOCK OPNAME, & SOP (Added Jan 2026)
-- ============================================

-- 1. Inventory Recipes
CREATE TABLE IF NOT EXISTS public.inventory_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    usage_per_kg NUMERIC NOT NULL DEFAULT 0,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(inventory_item_id, store_id)
);

-- 2. Stock Opname
CREATE TABLE IF NOT EXISTS public.stock_opname (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    virtual_stock NUMERIC NOT NULL,
    physical_stock NUMERIC NOT NULL,
    discrepancy NUMERIC, -- Will be calculated in application or trigger
    notes TEXT,
    recorded_by TEXT,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE
);

-- 3. Inventory Usage Log
CREATE TABLE IF NOT EXISTS public.inventory_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_item_id UUID REFERENCES public.inventory_items(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    quantity_used NUMERIC NOT NULL,
    total_kg NUMERIC DEFAULT 0,
    usage_per_kg NUMERIC DEFAULT 0,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Standard Operating Procedures (SOP)
CREATE TABLE IF NOT EXISTS public.standard_operating_procedures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Umum',
    content TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.inventory_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_opname ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_operating_procedures ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_recipes' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON public.inventory_recipes FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stock_opname' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON public.stock_opname FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'inventory_usage_log' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON public.inventory_usage_log FOR ALL USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'standard_operating_procedures' AND policyname = 'Enable all for authenticated users') THEN
        CREATE POLICY "Enable all for authenticated users" ON public.standard_operating_procedures FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;



-- ============================================
-- SECTION 8: RECURRING MONTHLY EXPENSES (Added Nov 2026)
-- ============================================
-- Template biaya bulanan per cabang (Listrik, Air, Wi-Fi) dan
-- penanda periode di tabel expenses agar tidak tercatat dua kali.
-- Sumber: supabase/migrations/20261125042146_recurring_monthly_expenses.sql

CREATE TABLE public.monthly_expense_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 80),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, store_id)
);

CREATE UNIQUE INDEX monthly_expense_templates_store_name_idx
  ON public.monthly_expense_templates (store_id, lower(name));
CREATE INDEX monthly_expense_templates_active_store_idx
  ON public.monthly_expense_templates (store_id, sort_order)
  WHERE is_active;

ALTER TABLE public.monthly_expense_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users can read monthly expense templates"
  ON public.monthly_expense_templates
  FOR SELECT
  TO authenticated
  USING (
    store_id = (SELECT public.get_my_store_id())
    OR (SELECT public.get_my_role()) = 'Super Admin'
  );

CREATE POLICY "Admins can manage monthly expense templates"
  ON public.monthly_expense_templates
  FOR ALL
  TO authenticated
  USING (
    (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR store_id = (SELECT public.get_my_store_id())
    )
  )
  WITH CHECK (
    (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR store_id = (SELECT public.get_my_store_id())
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.monthly_expense_templates TO authenticated;
GRANT ALL ON public.monthly_expense_templates TO service_role;

ALTER TABLE public.expenses
  ADD COLUMN "recurringTemplateId" uuid,
  ADD COLUMN "recurringPeriod" date,
  ADD CONSTRAINT expenses_recurring_template_store_fkey
    FOREIGN KEY ("recurringTemplateId", "storeId")
    REFERENCES public.monthly_expense_templates (id, store_id),
  ADD CONSTRAINT expenses_recurring_fields_check
    CHECK (
      ("recurringTemplateId" IS NULL AND "recurringPeriod" IS NULL)
      OR (
        "recurringTemplateId" IS NOT NULL
        AND "recurringPeriod" IS NOT NULL
        AND "storeId" IS NOT NULL
        AND "recurringPeriod" = date_trunc('month', "recurringPeriod"::timestamp)::date
      )
    );

CREATE UNIQUE INDEX expenses_monthly_template_period_idx
  ON public.expenses ("storeId", "recurringTemplateId", "recurringPeriod");

INSERT INTO public.monthly_expense_templates (store_id, name, category, sort_order)
SELECT stores.id, defaults.name, defaults.category, defaults.sort_order
FROM public.stores AS stores
CROSS JOIN (
  VALUES
    ('Listrik', 'Listrik', 1),
    ('Air', 'Air', 2),
    ('Wi-Fi', 'Operasional', 3)
) AS defaults(name, category, sort_order)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.seed_monthly_expense_templates_for_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.monthly_expense_templates (store_id, name, category, sort_order)
  VALUES
    (NEW.id, 'Listrik', 'Listrik', 1),
    (NEW.id, 'Air', 'Air', 2),
    (NEW.id, 'Wi-Fi', 'Operasional', 3)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_monthly_expense_templates_after_store_insert
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_monthly_expense_templates_for_store();

REVOKE EXECUTE ON FUNCTION public.seed_monthly_expense_templates_for_store()
  FROM PUBLIC, anon, authenticated;

-- ============================================
-- SECTION 9: EMPLOYEE PROFILE & PIN LOGIN (Added Nov 2026)
-- ============================================
-- Foto profil karyawan, login karyawan dengan PIN 6 digit,
-- pembatasan percobaan login, dan bucket storage employee-photos.
-- Dipakai oleh edge function employee-login & manage-employee-login.
-- Sumber: supabase/migrations/20261125043507_employee_profile_pin_login.sql

ALTER TABLE public.employees
  ADD COLUMN photo_url text,
  ADD COLUMN photo_path text,
  ADD COLUMN login_enabled boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT employees_login_profile_check CHECK (
    NOT login_enabled
    OR is_active
  );

ALTER TABLE public.profiles
  ADD COLUMN employee_id uuid UNIQUE REFERENCES public.employees(id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.guard_employee_auth_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF CURRENT_USER <> 'service_role' AND OLD.employee_id IS NOT NULL THEN
      RAISE EXCEPTION 'Employee login profiles can only be managed by the service'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF CURRENT_USER <> 'service_role' THEN
    IF TG_OP = 'INSERT' AND NEW.employee_id IS NOT NULL THEN
      RAISE EXCEPTION 'Employee login profiles can only be managed by the service'
        USING ERRCODE = '42501';
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.employee_id IS NOT NULL OR NEW.employee_id IS NOT NULL THEN
        RAISE EXCEPTION 'Employee login profiles can only be managed by the service'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_employee_auth_profile
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_employee_auth_profile();

REVOKE EXECUTE ON FUNCTION public.guard_employee_auth_profile()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_employee_auth_profile()
  TO service_role;

CREATE OR REPLACE FUNCTION public.guard_employee_login_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  caller_role text;
  login_fields_changed boolean;
BEGIN
  IF TG_OP = 'UPDATE' AND NOT NEW.is_active THEN
    NEW.login_enabled := false;
  END IF;

  IF TG_OP = 'INSERT' THEN
    login_fields_changed :=
      NEW.photo_url IS NOT NULL
      OR NEW.photo_path IS NOT NULL
      OR NEW.login_enabled;
  ELSE
    login_fields_changed :=
      NEW.photo_url IS DISTINCT FROM OLD.photo_url
      OR NEW.photo_path IS DISTINCT FROM OLD.photo_path
      OR NEW.login_enabled IS DISTINCT FROM OLD.login_enabled;
  END IF;

  IF NOT login_fields_changed OR CURRENT_USER = 'service_role' THEN
    RETURN NEW;
  END IF;

  caller_role := public.get_my_role();
  IF caller_role NOT IN ('Admin', 'Super Admin') THEN
    RAISE EXCEPTION 'Only admins can modify employee login profiles'
      USING ERRCODE = '42501';
  END IF;

  IF caller_role = 'Admin' THEN
    IF NEW.store_id IS DISTINCT FROM public.get_my_store_id() THEN
      RAISE EXCEPTION 'Admins can only modify profiles in their own store'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      IF OLD.store_id IS DISTINCT FROM public.get_my_store_id() THEN
        RAISE EXCEPTION 'Admins can only modify profiles in their own store'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_employee_login_profile_fields
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_employee_login_profile_fields();

REVOKE EXECUTE ON FUNCTION public.guard_employee_login_profile_fields()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_employee_login_profile_fields()
  TO service_role;

CREATE TABLE public.employee_auth_accounts (
  employee_id uuid PRIMARY KEY REFERENCES public.employees(id) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  login_email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_login_attempts (
  employee_id uuid PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  locked_until timestamptz
);

ALTER TABLE public.employee_auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_login_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.employee_auth_accounts, public.employee_login_attempts
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.employee_auth_accounts, public.employee_login_attempts
  TO service_role;

CREATE FUNCTION public.consume_employee_login_attempt(
  p_employee_id uuid,
  p_success boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  current_attempt_count integer;
  current_locked_until timestamptz;
BEGIN
  IF p_success THEN
    DELETE FROM public.employee_login_attempts
    WHERE employee_id = p_employee_id;
    RETURN true;
  END IF;

  INSERT INTO public.employee_login_attempts (
    employee_id,
    window_started_at,
    attempt_count
  )
  VALUES (p_employee_id, now(), 1)
  ON CONFLICT (employee_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.employee_login_attempts.locked_until > now()
        THEN public.employee_login_attempts.window_started_at
      WHEN public.employee_login_attempts.locked_until IS NOT NULL
        OR public.employee_login_attempts.window_started_at <= now() - interval '15 minutes'
        THEN now()
      ELSE public.employee_login_attempts.window_started_at
    END,
    attempt_count = CASE
      WHEN public.employee_login_attempts.locked_until > now()
        THEN public.employee_login_attempts.attempt_count
      WHEN public.employee_login_attempts.locked_until IS NOT NULL
        OR public.employee_login_attempts.window_started_at <= now() - interval '15 minutes'
        THEN 1
      ELSE public.employee_login_attempts.attempt_count + 1
    END,
    locked_until = CASE
      WHEN public.employee_login_attempts.locked_until > now()
        THEN public.employee_login_attempts.locked_until
      WHEN public.employee_login_attempts.locked_until IS NOT NULL
        OR public.employee_login_attempts.window_started_at <= now() - interval '15 minutes'
        THEN NULL
      WHEN public.employee_login_attempts.attempt_count + 1 > 5
        THEN now() + interval '15 minutes'
      ELSE NULL
    END
  RETURNING attempt_count, locked_until
  INTO current_attempt_count, current_locked_until;

  RETURN current_attempt_count <= 5 AND current_locked_until IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_employee_login_attempt(uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_employee_login_attempt(uuid, boolean)
  TO service_role;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'employee-photos',
  'employee-photos',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can read employee photos" ON storage.objects;
CREATE POLICY "Admins can read employee photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  );

DROP POLICY IF EXISTS "Admins can upload employee photos" ON storage.objects;
CREATE POLICY "Admins can upload employee photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  );

DROP POLICY IF EXISTS "Admins can update employee photos" ON storage.objects;
CREATE POLICY "Admins can update employee photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  )
  WITH CHECK (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  );

DROP POLICY IF EXISTS "Admins can delete employee photos" ON storage.objects;
CREATE POLICY "Admins can delete employee photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  );

-- ============================================
-- SECTION 10: KUNCI AKSES FUNGSI SECURITY DEFINER (Added Nov 2026)
-- ============================================
-- Postgres memberi EXECUTE ke PUBLIC secara default, sehingga fungsi
-- SECURITY DEFINER bisa dipanggil siapa saja lewat /rest/v1/rpc/*.
-- Fungsi admin/maintenance/trigger dicabut aksesnya dari client; hanya
-- yang dipakai aplikasi yang diberikan kembali.
--
-- Sengaja tetap publik: get_laundry_status, get_public_services,
-- get_my_role, get_my_store_id (dipakai RLS; NULL untuk anon).
-- Semua overload ditangani otomatis.

DO $$
DECLARE
  r record;
BEGIN
  -- 1. Admin / maintenance / trigger: tanpa akses client
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'cleanup_old_audit_logs', 'backfill_invoice_codes', 'generate_invoice_code',
        'bulk_update_order_status', 'complete_scheduled_maintenance',
        'handle_new_user', 'handle_new_user_trigger',
        'prevent_immutable_transaction_update', 'set_invoice_code',
        'update_updated_at_column'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.sig);
  END LOOP;

  -- 2. Dipakai staf yang login saja
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('update_transaction_progress', 'update_transaction_status_safe')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.sig);
  END LOOP;
END;
$$;

-- handle_new_user(uuid, ...) tetap bisa dipakai service_role
GRANT EXECUTE ON FUNCTION public.handle_new_user(uuid, text, text, uuid) TO service_role;

-- ============================================
-- SECTION 11: PIN SUPERVISOR (Added Nov 2026)
-- ============================================
-- Aksi sensitif oleh Kasir wajib disetujui PIN supervisor (Admin cabang yang
-- sama atau Super Admin):
--   * edit_paid          : mengubah pembayaran transaksi yang sudah Lunas
--   * cancel_transaction : (disiapkan untuk tahap berikutnya)
--
-- Alur: Kasir -> request_supervisor_approval(aksi, PIN) -> izin sekali pakai
-- (berlaku 2 menit) -> dikirim di kolom transactions."supervisorApprovalId" ->
-- trigger enforce_supervisor_approval memeriksa & menandai izin terpakai.
-- Semua pemeriksaan di database, jadi tidak bisa dilewati dari browser.
-- Admin dan Super Admin tidak perlu PIN.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. PIN supervisor (hash bcrypt) ---------------------------------------------
CREATE TABLE public.supervisor_pins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supervisor_pins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_pins FROM PUBLIC, anon, authenticated;

-- 2. Pembatas percobaan PIN salah (per kasir) ---------------------------------
CREATE TABLE public.supervisor_pin_attempts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  failed_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);
ALTER TABLE public.supervisor_pin_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_pin_attempts FROM PUBLIC, anon, authenticated;

-- 3. Izin sekali pakai ----------------------------------------------------------
CREATE TABLE public.supervisor_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('edit_paid', 'cancel_transaction')),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approved_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Diisi saat izin terpakai (tanpa FK: baris transaksi belum ada saat INSERT).
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 minutes',
  used_at timestamptz
);
CREATE INDEX supervisor_approvals_requested_by_idx ON public.supervisor_approvals (requested_by, created_at DESC);
CREATE INDEX supervisor_approvals_store_idx ON public.supervisor_approvals (store_id, created_at DESC);
CREATE INDEX supervisor_approvals_approved_by_idx ON public.supervisor_approvals (approved_by);
ALTER TABLE public.supervisor_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_approvals FROM PUBLIC, anon, authenticated;

-- Admin bisa melihat riwayat persetujuan di cabangnya (untuk laporan nanti).
CREATE POLICY "Admins read supervisor approvals in their store"
  ON public.supervisor_approvals FOR SELECT TO authenticated
  USING ((SELECT public.can_manage_store(store_id)));
GRANT SELECT ON public.supervisor_approvals TO authenticated;

-- 4. Kolom penanda di transaksi -------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS "supervisorApprovalId" uuid;
COMMENT ON COLUMN public.transactions."supervisorApprovalId" IS
  'Izin PIN supervisor terakhir yang dipakai untuk aksi sensitif Kasir pada transaksi ini.';

-- 5. Admin mengatur PIN miliknya sendiri ----------------------------------------
CREATE OR REPLACE FUNCTION public.set_my_supervisor_pin(p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_store uuid;
BEGIN
  SELECT p.role, p.store_id INTO v_role, v_store FROM public.profiles p WHERE p.id = v_uid;
  IF v_role IS NULL OR v_role NOT IN ('Admin', 'Super Admin') THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat memiliki PIN supervisor' USING ERRCODE = '42501';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN harus 6 angka' USING ERRCODE = '22023';
  END IF;
  IF p_pin ~ '^([0-9])\1{5}$'
     OR p_pin IN ('012345', '123456', '234567', '345678', '456789', '987654', '876543', '765432', '654321', '543210') THEN
    RAISE EXCEPTION 'PIN terlalu mudah ditebak. Pilih PIN lain.' USING ERRCODE = '22023';
  END IF;
  -- PIN tidak boleh sama dengan PIN supervisor lain di lingkup yang sama,
  -- supaya setiap persetujuan tercatat atas nama orang yang benar.
  IF EXISTS (
    SELECT 1
    FROM public.supervisor_pins sp
    JOIN public.profiles p ON p.id = sp.user_id
    WHERE sp.user_id <> v_uid
      AND (p.role = 'Super Admin' OR v_role = 'Super Admin' OR p.store_id = v_store)
      AND sp.pin_hash = extensions.crypt(p_pin, sp.pin_hash)
  ) THEN
    RAISE EXCEPTION 'PIN ini tidak dapat dipakai. Pilih PIN lain.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.supervisor_pins (user_id, pin_hash, updated_at)
  VALUES (v_uid, extensions.crypt(p_pin, extensions.gen_salt('bf', 8)), now())
  ON CONFLICT (user_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = now();

  INSERT INTO public.audit_logs ("user", action, "storeId")
  VALUES ((SELECT p.name FROM public.profiles p WHERE p.id = v_uid), 'Mengatur PIN supervisor.', v_store);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_my_supervisor_pin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.supervisor_pins WHERE user_id = auth.uid());
$$;

-- 6. Kasir meminta persetujuan dengan PIN supervisor ----------------------------
-- Hasil: {"approval_id": uuid, "approver_name": text} bila PIN benar,
--        {"approval_id": null, "remaining_attempts": n} bila PIN salah.
CREATE OR REPLACE FUNCTION public.request_supervisor_approval(
  p_action text,
  p_pin text,
  p_transaction_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_max_failures constant integer := 5;
  c_window constant interval := interval '15 minutes';
  v_uid uuid := auth.uid();
  v_role text;
  v_store uuid;
  v_attempt public.supervisor_pin_attempts%ROWTYPE;
  v_approver uuid;
  v_approver_name text;
  v_id uuid;
BEGIN
  SELECT p.role, p.store_id INTO v_role, v_store FROM public.profiles p WHERE p.id = v_uid;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Sesi tidak valid. Silakan login ulang.' USING ERRCODE = '42501';
  END IF;
  IF v_store IS NULL THEN
    RAISE EXCEPTION 'Akun Anda belum terhubung ke cabang.' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('edit_paid', 'cancel_transaction') THEN
    RAISE EXCEPTION 'Aksi tidak dikenal' USING ERRCODE = '22023';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN harus 6 angka' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.supervisor_pin_attempts (user_id) VALUES (v_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_attempt FROM public.supervisor_pin_attempts WHERE user_id = v_uid FOR UPDATE;

  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
    RAISE EXCEPTION 'Terlalu banyak PIN salah. Coba lagi dalam % menit.',
      ceil(extract(epoch FROM v_attempt.locked_until - now()) / 60)::integer
      USING ERRCODE = 'P0001';
  END IF;

  SELECT p.id, p.name INTO v_approver, v_approver_name
  FROM public.supervisor_pins sp
  JOIN public.profiles p ON p.id = sp.user_id
  WHERE p.id <> v_uid
    AND coalesce(p."isActive", true)
    AND (p.role = 'Super Admin' OR (p.role = 'Admin' AND p.store_id = v_store))
    AND sp.pin_hash = extensions.crypt(p_pin, sp.pin_hash)
  LIMIT 1;

  IF v_approver IS NULL THEN
    -- Catat kegagalan (tanpa RAISE, supaya hitungan tidak ikut dibatalkan).
    IF v_attempt.window_started_at < now() - c_window THEN
      v_attempt.failed_count := 1;
      v_attempt.window_started_at := now();
    ELSE
      v_attempt.failed_count := v_attempt.failed_count + 1;
    END IF;
    IF v_attempt.failed_count >= c_max_failures THEN
      v_attempt.locked_until := now() + c_window;
    END IF;
    UPDATE public.supervisor_pin_attempts
    SET failed_count = v_attempt.failed_count,
        window_started_at = v_attempt.window_started_at,
        locked_until = v_attempt.locked_until
    WHERE user_id = v_uid;

    IF v_attempt.failed_count >= c_max_failures THEN
      INSERT INTO public.audit_logs ("user", action, "storeId")
      VALUES ((SELECT p.name FROM public.profiles p WHERE p.id = v_uid),
              'PIN supervisor salah 5 kali. Permintaan persetujuan dikunci 15 menit.', v_store);
    END IF;

    RETURN jsonb_build_object(
      'approval_id', NULL,
      'remaining_attempts', greatest(c_max_failures - v_attempt.failed_count, 0)
    );
  END IF;

  UPDATE public.supervisor_pin_attempts
  SET failed_count = 0, window_started_at = now(), locked_until = NULL
  WHERE user_id = v_uid;

  INSERT INTO public.supervisor_approvals (action, store_id, requested_by, approved_by, transaction_id)
  VALUES (p_action, v_store, v_uid, v_approver, p_transaction_id)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('approval_id', v_id, 'approver_name', v_approver_name);
END;
$$;

-- 7. Penjaga di tabel transaksi -------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_supervisor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text := public.get_my_role();
  v_needed text;
  v_approval public.supervisor_approvals%ROWTYPE;
BEGIN
  -- Admin, Super Admin, dan proses server (service role / SQL) tidak perlu PIN.
  IF v_role IS DISTINCT FROM 'Kasir' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD."paymentStatus" = 'Lunas' AND (
       NEW."paymentStatus" IS DISTINCT FROM OLD."paymentStatus"
    OR NEW."paymentMethod" IS DISTINCT FROM OLD."paymentMethod"
    OR NEW."amountPaid" IS DISTINCT FROM OLD."amountPaid"
    OR NEW."change" IS DISTINCT FROM OLD."change"
  ) THEN
    v_needed := 'edit_paid';
  END IF;

  IF v_needed IS NULL THEN
    -- Kasir tidak boleh mengisi/mengubah penanda izin sendiri.
    IF TG_OP = 'INSERT' THEN
      NEW."supervisorApprovalId" := NULL;
    ELSE
      NEW."supervisorApprovalId" := OLD."supervisorApprovalId";
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."supervisorApprovalId" IS NULL
     OR NEW."supervisorApprovalId" IS NOT DISTINCT FROM OLD."supervisorApprovalId" THEN
    RAISE EXCEPTION 'Mengubah pembayaran transaksi yang sudah lunas memerlukan PIN supervisor.'
      USING ERRCODE = '42501', HINT = 'SUPERVISOR_APPROVAL_REQUIRED:' || v_needed;
  END IF;

  SELECT * INTO v_approval
  FROM public.supervisor_approvals a
  WHERE a.id = NEW."supervisorApprovalId"
  FOR UPDATE;

  IF NOT FOUND
     OR v_approval.used_at IS NOT NULL
     OR v_approval.expires_at < now()
     OR v_approval.requested_by IS DISTINCT FROM auth.uid()
     OR v_approval.action <> v_needed
     OR v_approval.store_id IS DISTINCT FROM NEW."storeId"
     OR (v_approval.transaction_id IS NOT NULL AND v_approval.transaction_id <> NEW.id) THEN
    RAISE EXCEPTION 'Persetujuan supervisor tidak berlaku atau sudah kedaluwarsa. Minta PIN lagi.'
      USING ERRCODE = '42501', HINT = 'SUPERVISOR_APPROVAL_INVALID';
  END IF;

  UPDATE public.supervisor_approvals
  SET used_at = now(), transaction_id = NEW.id
  WHERE id = v_approval.id;

  INSERT INTO public.audit_logs ("user", action, "storeId")
  VALUES (
    (SELECT p.name FROM public.profiles p WHERE p.id = auth.uid()),
    format('Perubahan pembayaran nota lunas pada transaksi %s disetujui PIN supervisor %s.',
      coalesce(NEW."invoiceCode", NEW.id::text),
      coalesce((SELECT p.name FROM public.profiles p WHERE p.id = v_approval.approved_by), '-')),
    NEW."storeId"
  );

  RETURN NEW;
END;
$$;

-- BELUM AKTIF: trigger ini memblokir Kasir mengubah pembayaran nota Lunas tanpa
-- PIN. Aktifkan setelah UI input PIN untuk Kasir (SupervisorPinModal) dipasang
-- di alur ubah pembayaran. Database live juga belum memasang trigger ini.
-- CREATE TRIGGER enforce_supervisor_approval
--   BEFORE INSERT OR UPDATE ON public.transactions
--   FOR EACH ROW
--   EXECUTE FUNCTION public.enforce_supervisor_approval();

-- 8. Hak akses fungsi -----------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.set_my_supervisor_pin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_supervisor_pin(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_my_supervisor_pin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_my_supervisor_pin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.request_supervisor_approval(text, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_supervisor_approval(text, text, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_supervisor_approval() FROM PUBLIC, anon, authenticated;

-- ============================================
-- SECTION 12: KARYAWAN - PROFIL, JADWAL & KOMPENSASI (Added Nov 2026)
-- ============================================
-- Dipakai halaman Karyawan: alamat, tanggal mulai, shift & hari kerja,
-- toleransi terlambat, dan insentif bulanan. Akses tetap Admin/Super Admin
-- (RLS di Section 9/10).

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS start_date date,
  -- Jadwal kerja: jam shift & hari kerja (1 = Senin ... 7 = Minggu, ISO).
  ADD COLUMN IF NOT EXISTS shift_start time,
  ADD COLUMN IF NOT EXISTS shift_end time,
  ADD COLUMN IF NOT EXISTS work_days smallint[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
  -- Aturan absensi: masuk lewat dari toleransi dihitung terlambat.
  ADD COLUMN IF NOT EXISTS late_tolerance_minutes integer NOT NULL DEFAULT 15,
  -- Insentif tetap per bulan (di luar gaji pokok & komisi).
  ADD COLUMN IF NOT EXISTS monthly_incentive numeric NOT NULL DEFAULT 0;

ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS employees_name_not_blank,
  DROP CONSTRAINT IF EXISTS employees_role_check,
  DROP CONSTRAINT IF EXISTS employees_base_salary_check,
  DROP CONSTRAINT IF EXISTS employees_commission_rate_check,
  DROP CONSTRAINT IF EXISTS employees_monthly_incentive_check,
  DROP CONSTRAINT IF EXISTS employees_late_tolerance_check,
  DROP CONSTRAINT IF EXISTS employees_shift_pair_check,
  DROP CONSTRAINT IF EXISTS employees_work_days_check,
  ADD CONSTRAINT employees_name_not_blank CHECK (btrim(name) <> ''),
  ADD CONSTRAINT employees_role_check CHECK (role IN ('operator', 'kasir', 'admin')),
  ADD CONSTRAINT employees_base_salary_check CHECK (base_salary >= 0),
  ADD CONSTRAINT employees_commission_rate_check CHECK (commission_rate BETWEEN 0 AND 100),
  ADD CONSTRAINT employees_monthly_incentive_check CHECK (monthly_incentive >= 0),
  ADD CONSTRAINT employees_late_tolerance_check CHECK (late_tolerance_minutes BETWEEN 0 AND 240),
  ADD CONSTRAINT employees_shift_pair_check CHECK ((shift_start IS NULL) = (shift_end IS NULL)),
  ADD CONSTRAINT employees_work_days_check CHECK (work_days <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::smallint[]);

COMMENT ON COLUMN public.employees.role IS 'Posisi kerja: operator, kasir, atau admin.';
COMMENT ON COLUMN public.employees.work_days IS 'Hari kerja ISO: 1 = Senin ... 7 = Minggu.';
COMMENT ON COLUMN public.employees.late_tolerance_minutes IS
  'Menit toleransi setelah shift_start sebelum absensi masuk dihitung terlambat.';
COMMENT ON COLUMN public.employees.monthly_incentive IS 'Insentif tetap per bulan (Rp).';

-- Filter umum di halaman Karyawan: per cabang + status.
CREATE INDEX IF NOT EXISTS idx_employees_store_active ON public.employees (store_id, is_active);

-- ============================================
-- END OF SETUP
-- ============================================

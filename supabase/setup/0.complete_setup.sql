-- ============================================
-- LAUNDRY MANAGEMENT SYSTEM - DATABASE SETUP
-- Complete Schema & Functions Setup
-- Version: 3.6.0
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
-- 13. QRIS STATIS TOKO
-- 14. PERAN OPERATOR & HAK AKSES PER PERAN
-- 15. ABSENSI OTOMATIS DARI LOGIN
-- 16. LOGIN EMAIL KHUSUS SUPER ADMIN
-- 17. LOG AUDIT LENGKAP (trigger perubahan data, append-only)
-- 20. GAJI HARIAN OTOMATIS KE PENGELUARAN
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
  -- Nomor HP/WhatsApp cabang, dicetak di header struk.
  phone text CONSTRAINT stores_phone_length CHECK (phone IS NULL OR char_length(phone) <= 30),
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
  "minQuantity" numeric(10,2) NOT NULL DEFAULT 0 CONSTRAINT services_min_quantity_nonnegative CHECK ("minQuantity" >= 0),
  -- Tampilkan layanan ini beserta harganya di landing page (get_public_price_list).
  -- Bawaan tampil; hapus centang untuk harga khusus (mis. harga mitra).
  "showOnWeb" boolean NOT NULL DEFAULT true,
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
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()))
  -- Admin cabang tidak boleh memindahkan pelanggan ke cabang lain.
  WITH CHECK (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
-- Kasir boleh mengubah data pelanggan (nama, nomor HP, alamat, catatan) di cabangnya sendiri.
-- WITH CHECK mencegah Kasir memindahkan pelanggan ke cabang lain. Hapus tetap khusus Admin.
CREATE POLICY "Allow UPDATE for Cashiers in own store" ON public.customers
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_my_role()) = 'Kasir' AND "storeId" = (SELECT public.get_my_store_id()))
  WITH CHECK ((SELECT public.get_my_role()) = 'Kasir' AND "storeId" = (SELECT public.get_my_store_id()));
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
    IF NEW.subtotal IS DISTINCT FROM OLD.subtotal THEN
      RAISE EXCEPTION 'You are not allowed to change subtotal';
    END IF;
    IF NEW.discount IS DISTINCT FROM OLD.discount THEN
      RAISE EXCEPTION 'You are not allowed to change discount';
    END IF;
    IF NEW.tax IS DISTINCT FROM OLD.tax THEN
      RAISE EXCEPTION 'You are not allowed to change tax';
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

-- Operator ikut boleh UPDATE (mis. menandai struk WA terkirim); kolom yang boleh
-- diubah tiap peran dijaga trigger (prevent_immutable_transaction_update,
-- guard_operator_transactions, enforce_supervisor_approval).
DROP POLICY IF EXISTS "Allow UPDATE for Admins" ON public.transactions;
DROP POLICY IF EXISTS "Allow UPDATE for Admins and Kasirs (progress only)" ON public.transactions;
DROP POLICY IF EXISTS "Allow UPDATE for store staff" ON public.transactions;
CREATE POLICY "Allow UPDATE for store staff" ON public.transactions
  FOR UPDATE
  USING (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin','Kasir','Operator')
      AND "storeId" = public.get_my_store_id()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin','Kasir','Operator')
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
-- Satu baris pengaturan berlaku untuk semua cabang: semua pengguna login boleh membaca.
DROP POLICY IF EXISTS "Allow read for store users" ON public.settings;
CREATE POLICY "Allow read for signed-in users" ON public.settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow ALL for Admins" ON public.settings
  FOR ALL TO authenticated
  USING ((SELECT public.get_my_role()) IN ('Super Admin', 'Admin'))
  WITH CHECK ((SELECT public.get_my_role()) IN ('Super Admin', 'Admin'));


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

-- === RPC: get_public_price_list ===
-- Daftar harga untuk landing page: layanan dengan "showOnWeb" = true
-- (bawaan tampil). Hapus centang "Tampilkan di website" di halaman Layanan
-- aplikasi kasir untuk menyembunyikan harga khusus seperti harga mitra.
DROP FUNCTION IF EXISTS public.get_public_price_list(uuid);
CREATE OR REPLACE FUNCTION public.get_public_price_list(
  store_id_input uuid
)
RETURNS TABLE (
  service_name text,
  category text,
  wash_type text,
  price integer,
  unit text,
  duration_days integer,
  min_quantity numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.name,
    s.category::text,
    s.wash_type,
    s.price,
    s.unit,
    s."durationDays",
    s."minQuantity"
  FROM public.services AS s
  WHERE s."storeId" = store_id_input
    AND s."showOnWeb"
  ORDER BY s.category, s.price, s.name;
$$;

REVOKE ALL ON FUNCTION public.get_public_price_list(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_price_list(uuid) TO anon, authenticated, service_role;

-- === RPC: update_transaction_progress ===
-- Atomically update allowed progress fields on a transaction and insert an audit_log entry.
-- Caller must be authenticated. Super Admin can update any transaction; Admin/Kasir can only update transactions in their store.

-- Penyempurnaan: Validasi status akhir transaksi agar tidak bisa Selesai jika belum Lunas, dan tidak bisa mengubah status bayar jadi Belum Lunas jika sudah Selesai
-- p_supervisor_approval_id: izin PIN supervisor sekali pakai (Section 11) untuk
-- Kasir yang mengubah pembayaran nota Lunas. Diperiksa trigger enforce_supervisor_approval.
DROP FUNCTION IF EXISTS public.update_transaction_progress(uuid, numeric, numeric, text, text, text);
CREATE OR REPLACE FUNCTION public.update_transaction_progress(
  transaction_id_input uuid,
  p_amount_paid numeric DEFAULT NULL,
  p_change numeric DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_status text DEFAULT NULL,
  p_order_status text DEFAULT NULL,
  p_supervisor_approval_id uuid DEFAULT NULL
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
    "orderStatus" = COALESCE(p_order_status, "orderStatus"),
    "supervisorApprovalId" = COALESCE(p_supervisor_approval_id, "supervisorApprovalId")
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
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Publik (anon): kode dicocokkan persis (bukan ILIKE, agar "%" tidak
  -- membocorkan semua nota) dan nama pelanggan disamarkan ("Sit*** A.").
  SELECT
    t.id::text,
    t."invoiceCode",
    CASE
      WHEN c.id IS NULL THEN 'Guest/Dihapus'
      WHEN coalesce(btrim(c.name), '') = '' THEN 'Pelanggan'
      ELSE (
        SELECT string_agg(
          CASE
            WHEN w.n = 1 THEN
              CASE WHEN length(w.word) <= 3 THEN w.word ELSE left(w.word, 3) || '***' END
            ELSE upper(left(w.word, 1)) || '.'
          END,
          ' ' ORDER BY w.n
        )
        FROM regexp_split_to_table(btrim(c.name), '\s+') WITH ORDINALITY AS w(word, n)
      )
    END AS "customerName",
    t."createdAt",
    t."estimatedCompletionDate",
    t."orderStatus",
    t."paymentStatus",
    t.total,
    t."amountPaid"
  FROM public.transactions AS t
  LEFT JOIN public.customers AS c ON t."customerId" = c.id
  WHERE
    t."invoiceCode" IN (input_identifier, upper(input_identifier))
    -- CASE menjamin cast ke uuid hanya dijalankan bila formatnya valid.
    OR t.id = CASE
      WHEN input_identifier ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN input_identifier::uuid
    END
  LIMIT 1;
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

-- Policy transactions cukup yang di SECTION 2. Policy lama di bawah dihapus karena
-- mengizinkan semua peran di cabang (termasuk Operator) membuat & mengubah nota;
-- policy permissive digabung OR sehingga policy ketat Admin/Kasir tidak berlaku.
DROP POLICY IF EXISTS "Users can view their store transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their store transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their store transactions" ON public.transactions;

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

-- Struk WhatsApp (sumber: migrations/20261128000000_whatsapp_receipt.sql)
-- * transactions."whatsappSentAt": kapan struk/notifikasi terakhir dikirim via WhatsApp.
-- * settings."businessName" / "trackingUrl": nama usaha & link cek status di pesan WhatsApp.
-- Semua kolom nullable tanpa default: data lama tidak berubah, aplikasi memakai nilai bawaan.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS "whatsappSentAt" timestamptz;

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS "businessName" text,
  ADD COLUMN IF NOT EXISTS "trackingUrl" text;


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

-- Aturan potong stok, stock opname & riwayat stok: lihat SECTION 21.

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
ALTER TABLE public.standard_operating_procedures ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ 
BEGIN
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
-- get_public_price_list (hanya layanan "showOnWeb"), get_my_role, get_my_store_id (dipakai RLS; NULL untuk anon).
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
        -- Tidak dipakai aplikasi; parameter "caller" bisa diisi bebas sehingga
        -- cek cabang bisa dilewati.
        'update_transaction_status_safe',
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
      AND p.proname IN ('update_transaction_progress')
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

-- Aktif di live sejak 26 Nov 2026. Kasir boleh mengubah status pesanan,
-- melunasi nota, dan mengubah catatan tanpa PIN; mengubah pembayaran nota
-- Lunas wajib membawa izin PIN sekali pakai (lewat parameter
-- p_supervisor_approval_id di update_transaction_progress). Admin tanpa PIN.
DROP TRIGGER IF EXISTS enforce_supervisor_approval ON public.transactions;
CREATE TRIGGER enforce_supervisor_approval
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_supervisor_approval();

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
-- SECTION 13: QRIS STATIS TOKO (Added Nov 2026)
-- ============================================
-- Kode QRIS statis dari stiker toko. Dipakai halaman Pengaturan dan untuk
-- membuat QRIS dinamis (nominal otomatis) saat pembayaran QRIS.
-- Nama kolom camelCase mengikuti kolom lain di tabel settings.
-- Validasi lengkap (CRC, statis/dinamis) dilakukan di aplikasi; database
-- hanya menolak isian yang jelas bukan QRIS. Aman dijalankan ulang.

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS "qrisStaticCode" text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'settings_qris_static_code_format'
      AND conrelid = 'public.settings'::regclass
  ) THEN
    ALTER TABLE public.settings
      ADD CONSTRAINT settings_qris_static_code_format CHECK (
        "qrisStaticCode" IS NULL
        OR (left("qrisStaticCode", 6) = '000201' AND length("qrisStaticCode") BETWEEN 30 AND 1024)
      );
  END IF;
END $$;

COMMENT ON COLUMN public.settings."qrisStaticCode" IS
  'Kode QRIS statis toko (EMVCo, diawali 000201). NULL = pembayaran QRIS tanpa QR dinamis.';

-- ============================================
-- SECTION 14: PERAN OPERATOR & HAK AKSES PER PERAN (Added Nov 2026)
-- ============================================
-- Peran akun: Operator < Kasir < Admin < Super Admin.
--   Operator : kerjakan pesanan (ubah progres), update stok, lapor kerusakan.
--              Tidak boleh membuat transaksi atau mengubah pembayaran.
--   Kasir    : + transaksi baru, pembayaran, pelanggan, pengeluaran kecil.
--   Admin    : + kelola cabang (laporan, pengeluaran bulanan, karyawan, dst).
--   Super Admin : semua cabang.
-- Akun login PIN karyawan kini mendapat peran sesuai posisi karyawan
-- (operator/kasir/admin) lewat edge function manage-employee-login.
-- Aman dijalankan ulang.

-- 1. Admin boleh membuat/mengubah akun Operator di cabangnya.
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
    AND role IN ('Admin', 'Kasir', 'Operator')
  );

-- 2. Operator: tidak boleh membuat nota, tidak boleh menyentuh data pembayaran,
--    hanya boleh mengubah kolom progres, dan tidak boleh menandai Selesai
--    (serah terima ke pelanggan dilakukan Kasir).
--    Berlaku juga untuk RPC SECURITY DEFINER (update_transaction_progress,
--    bulk_update_order_status) karena dicek di trigger, bukan di RLS.
CREATE OR REPLACE FUNCTION public.guard_operator_transactions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  -- Kolom yang boleh diubah Operator. supervisorApprovalId diatur ulang oleh
  -- enforce_supervisor_approval, updatedAt oleh trigger updated_at.
  v_allowed text[] := ARRAY[
    'orderStatus', 'notes', 'estimatedCompletionDate', 'whatsappSentAt',
    'updatedAt', 'updatedByUserId', 'supervisorApprovalId'
  ];
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'Operator' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Operator tidak dapat membuat transaksi'
      USING ERRCODE = '42501';
  END IF;

  IF NEW."paymentStatus" IS DISTINCT FROM OLD."paymentStatus"
     OR NEW."paymentMethod" IS DISTINCT FROM OLD."paymentMethod"
     OR NEW."amountPaid" IS DISTINCT FROM OLD."amountPaid"
     OR NEW."change" IS DISTINCT FROM OLD."change"
     OR NEW.total IS DISTINCT FROM OLD.total
     OR NEW.discount IS DISTINCT FROM OLD.discount
  THEN
    RAISE EXCEPTION 'Operator tidak dapat mengubah pembayaran'
      USING ERRCODE = '42501';
  END IF;

  IF (to_jsonb(NEW) - v_allowed) IS DISTINCT FROM (to_jsonb(OLD) - v_allowed) THEN
    RAISE EXCEPTION 'Operator hanya dapat mengubah progres pesanan'
      USING ERRCODE = '42501';
  END IF;

  IF NEW."orderStatus" = 'Selesai' AND OLD."orderStatus" IS DISTINCT FROM 'Selesai' THEN
    RAISE EXCEPTION 'Operator tidak dapat menyelesaikan pesanan. Serah terima dilakukan Kasir.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_operator_transactions()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_operator_transactions ON public.transactions;
CREATE TRIGGER guard_operator_transactions
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.guard_operator_transactions();

-- 3. Selesai harus Lunas, untuk semua jalur (UPDATE langsung, RPC, peran apa pun).
--    Sebelumnya hanya dicek di RPC update_transaction_progress & tombol aplikasi.
CREATE OR REPLACE FUNCTION public.enforce_order_payment_consistency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW."orderStatus" = 'Selesai' AND NEW."paymentStatus" IS DISTINCT FROM 'Lunas' THEN
    RAISE EXCEPTION 'Pesanan tidak boleh berstatus Selesai jika pembayaran belum Lunas.'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE'
     AND OLD."orderStatus" = 'Selesai'
     AND NEW."paymentStatus" IS DISTINCT FROM 'Lunas' THEN
    RAISE EXCEPTION 'Status pembayaran tidak boleh diubah menjadi belum lunas jika pesanan sudah selesai.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_order_payment_consistency()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_order_payment_consistency ON public.transactions;
CREATE TRIGGER enforce_order_payment_consistency
  BEFORE INSERT OR UPDATE OF "orderStatus", "paymentStatus" ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_order_payment_consistency();

COMMENT ON COLUMN public.profiles.role IS
  'Peran akun: Operator, Kasir, Admin, atau Super Admin. Lihat src/config/permissions.ts.';

-- ============================================
-- SECTION 15: ABSENSI OTOMATIS DARI LOGIN
-- Jam masuk  = aktivitas pertama akun PIN karyawan hari itu (WIB).
-- Jam pulang = saat menekan "Keluar"; bila tidak, aktivitas terakhir (last_seen_at).
-- Admin tetap bisa mengoreksi manual (sumber 'manual' tidak ditimpa otomatis).
-- ============================================

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS clock_in_source TEXT,
  ADD COLUMN IF NOT EXISTS clock_out_source TEXT;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_clock_in_source_check;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_clock_in_source_check
  CHECK (clock_in_source IS NULL OR clock_in_source IN ('auto', 'manual'));
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_clock_out_source_check;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_clock_out_source_check
  CHECK (clock_out_source IS NULL OR clock_out_source IN ('logout', 'manual'));

COMMENT ON COLUMN public.attendance.last_seen_at IS
  'Aktivitas terakhir karyawan di aplikasi hari itu; dipakai sebagai jam pulang bila tidak menekan Keluar.';

CREATE OR REPLACE FUNCTION public.record_attendance(p_event TEXT DEFAULT 'activity')
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_employee_id UUID;
  v_now TIMESTAMPTZ := now();
  v_date DATE := (now() AT TIME ZONE 'Asia/Jakarta')::date;
BEGIN
  IF p_event IS NULL OR p_event NOT IN ('activity', 'logout') THEN
    RAISE EXCEPTION 'Invalid attendance event';
  END IF;

  -- Hanya akun login milik karyawan aktif; akun lain diabaikan.
  SELECT p.employee_id INTO v_employee_id
  FROM public.profiles p
  JOIN public.employees e ON e.id = p.employee_id
  WHERE p.id = (SELECT auth.uid())
    AND e.is_active;

  IF v_employee_id IS NULL THEN
    RETURN;
  END IF;

  IF p_event = 'logout' THEN
    UPDATE public.attendance a
    SET clock_out = v_now,
        clock_out_source = 'logout',
        last_seen_at = v_now
    WHERE a.employee_id = v_employee_id
      AND a.date = v_date
      AND a.clock_in IS NOT NULL
      AND a.clock_out_source IS DISTINCT FROM 'manual';
    RETURN;
  END IF;

  INSERT INTO public.attendance AS a (employee_id, date, clock_in, clock_in_source, last_seen_at)
  VALUES (v_employee_id, v_date, v_now, 'auto', v_now)
  ON CONFLICT (employee_id, date) DO UPDATE SET
    clock_in = COALESCE(a.clock_in, EXCLUDED.clock_in),
    clock_in_source = CASE WHEN a.clock_in IS NULL THEN 'auto' ELSE a.clock_in_source END,
    last_seen_at = GREATEST(COALESCE(a.last_seen_at, EXCLUDED.last_seen_at), EXCLUDED.last_seen_at),
    -- Kembali bekerja setelah menekan Keluar: jam pulang dibuka lagi.
    clock_out = CASE WHEN a.clock_out_source = 'logout' THEN NULL ELSE a.clock_out END,
    clock_out_source = CASE WHEN a.clock_out_source = 'logout' THEN NULL ELSE a.clock_out_source END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_attendance(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_attendance(TEXT) TO authenticated;

-- ============================================
-- SECTION 16: LOGIN EMAIL KHUSUS SUPER ADMIN (Added Nov 2026)
-- ============================================
-- Login email & password hanya untuk Super Admin. Admin/Kasir/Operator login
-- lewat profil karyawan + PIN (profil dengan employee_id). Akun email lama
-- dengan peran lain tidak mendapat peran/cabang sama sekali, sehingga semua
-- policy RLS yang memakai fungsi ini menolaknya walau token masih berlaku.
-- Profil sendiri tetap bisa dibaca ("Users can see their own profile") agar
-- aplikasi bisa menampilkan pesan lalu logout.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid()
    AND (role = 'Super Admin' OR employee_id IS NOT NULL)
$$;

CREATE OR REPLACE FUNCTION public.get_my_store_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.profiles
  WHERE id = auth.uid()
    AND (role = 'Super Admin' OR employee_id IS NOT NULL)
$$;

-- ============================================
-- SECTION 17: LOG AUDIT LENGKAP (Added Nov 2026)
-- ============================================
-- Setiap INSERT/UPDATE/DELETE di semua tabel bisnis dicatat otomatis oleh trigger
-- (kategori 'data', beserta kolom yang berubah dan nilai sebelum/sesudah), apa pun
-- asalnya: halaman aplikasi, RPC, maupun edge function. Aplikasi menambah log
-- interaksi (navigasi, klik, isian form tanpa nilai teks, sesi, error) ke tabel
-- yang sama. Nama pengguna diisi server dari auth.uid() agar tidak bisa dipalsukan,
-- dan audit_logs dijadikan append-only (tidak bisa diubah/dihapus dari aplikasi).
-- Kolom rahasia (pin_hash, password, token, secret) disamarkan; perubahan yang
-- hanya menyentuh updatedAt/updated_at/last_seen_at tidak dicatat.
-- Migrasi live: supabase/migrations/20261129000000_audit_log_lengkap.sql

alter table public.audit_logs
  add column if not exists actor_id uuid default auth.uid(),
  add column if not exists category text not null default 'aktivitas',
  add column if not exists table_name text,
  add column if not exists record_id text,
  add column if not exists operation text,
  add column if not exists changed_fields text[],
  add column if not exists old_data jsonb,
  add column if not exists new_data jsonb,
  add column if not exists page text,
  add column if not exists metadata jsonb;

comment on column public.audit_logs.category is
  'data = perubahan data (trigger), aktivitas = aksi bisnis dari aplikasi, navigasi = buka halaman, klik = tombol/tautan, sesi = login/logout/online/offline';

create index if not exists audit_logs_category_timestamp_idx on public.audit_logs (category, "timestamp" desc);
create index if not exists audit_logs_record_idx on public.audit_logs (table_name, record_id);

-- 2. Nama pengguna & actor diisi server untuk insert dari aplikasi ------------
create or replace function public.audit_logs_stamp_actor()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is not null then
    new.actor_id := v_uid;
    select p.name into v_name from public.profiles p where p.id = v_uid;
    if v_name is not null then
      new."user" := v_name;
    end if;
  end if;
  new."timestamp" := coalesce(new."timestamp", now());
  if new."timestamp" > now() + interval '5 minutes' then
    new."timestamp" := now();
  end if;
  return new;
end;
$$;

drop trigger if exists audit_logs_stamp_actor on public.audit_logs;
create trigger audit_logs_stamp_actor
  before insert on public.audit_logs
  for each row execute function public.audit_logs_stamp_actor();

-- 3. Trigger perubahan data generik ------------------------------------------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_user text;
  v_new jsonb;
  v_old jsonb;
  v_row jsonb;
  v_changed text[];
  v_old_diff jsonb;
  v_new_diff jsonb;
  v_store uuid;
  v_label text;
  v_entity text;
  v_verb text;
  v_record_id text;
  -- kolom yang berubah otomatis/terus-menerus dan tidak perlu dicatat sendiri
  v_ignored constant text[] := array['updatedAt', 'updated_at', 'last_seen_at'];
  -- kolom rahasia: nilainya tidak pernah disimpan di log
  v_secret constant text[] := array['pin_hash', 'password', 'password_hash', 'token', 'secret'];
  k text;
begin
  if tg_op in ('INSERT', 'UPDATE') then v_new := to_jsonb(new); end if;
  if tg_op in ('UPDATE', 'DELETE') then v_old := to_jsonb(old); end if;
  v_row := coalesce(v_new, v_old);

  -- sembunyikan kolom rahasia
  foreach k in array v_secret loop
    if v_new ? k then v_new := jsonb_set(v_new, array[k], '"[disembunyikan]"'); end if;
    if v_old ? k then v_old := jsonb_set(v_old, array[k], '"[disembunyikan]"'); end if;
  end loop;

  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key),
           jsonb_object_agg(n.key, v_old -> n.key),
           jsonb_object_agg(n.key, n.value)
      into v_changed, v_old_diff, v_new_diff
      from jsonb_each(v_new) n
     where (v_old -> n.key) is distinct from n.value
       and not (n.key = any (v_ignored));
    if v_changed is null then
      return null; -- tidak ada perubahan berarti (mis. hanya heartbeat last_seen_at)
    end if;
    v_old := v_old_diff;
    v_new := v_new_diff;
  end if;

  -- cabang terkait
  begin
    v_store := coalesce(
      nullif(v_row ->> 'storeId', '')::uuid,
      nullif(v_row ->> 'store_id', '')::uuid,
      case when tg_table_name = 'stores' then (v_row ->> 'id')::uuid end
    );
  exception when others then v_store := null;
  end;
  if v_store is null and v_row ? 'employee_id' then
    select e.store_id into v_store from public.employees e where e.id = (v_row ->> 'employee_id')::uuid;
  end if;
  if v_store is null and v_row ? 'user_id' then
    select p.store_id into v_store from public.profiles p where p.id = (v_row ->> 'user_id')::uuid;
  end if;
  if v_store is null and v_row ? 'assetId' then
    select a."storeId" into v_store from public.assets a where a.id = (v_row ->> 'assetId')::uuid;
  end if;

  v_record_id := coalesce(v_row ->> 'id', v_row ->> 'employee_id', v_row ->> 'user_id');
  v_label := coalesce(
    v_row ->> 'invoiceCode', v_row ->> 'name', v_row ->> 'description',
    v_row ->> 'login_email', v_row ->> 'action', v_row ->> 'date', v_record_id
  );

  v_entity := case tg_table_name
    when 'transactions' then 'transaksi'
    when 'customers' then 'pelanggan'
    when 'services' then 'layanan'
    when 'inventory_items' then 'item inventaris'
    when 'assets' then 'aset'
    when 'scheduled_maintenances' then 'jadwal perawatan'
    when 'expenses' then 'pengeluaran'
    when 'monthly_expense_templates' then 'template pengeluaran bulanan'
    when 'settings' then 'pengaturan'
    when 'stores' then 'cabang'
    when 'profiles' then 'profil pengguna'
    when 'employees' then 'karyawan'
    when 'employee_auth_accounts' then 'akun login karyawan'
    when 'employee_login_attempts' then 'percobaan login karyawan'
    when 'attendance' then 'absensi'
    when 'advances' then 'kasbon'
    when 'payroll' then 'penggajian'
    when 'supervisor_pins' then 'PIN supervisor'
    when 'supervisor_pin_attempts' then 'percobaan PIN supervisor'
    when 'supervisor_approvals' then 'izin supervisor'
    else tg_table_name
  end;
  v_verb := case tg_op when 'INSERT' then 'Menambah' when 'UPDATE' then 'Mengubah' else 'Menghapus' end;

  if v_uid is not null then
    select p.name into v_user from public.profiles p where p.id = v_uid;
  end if;

  insert into public.audit_logs (
    "timestamp", "user", action, "storeId", actor_id, category,
    table_name, record_id, operation, changed_fields, old_data, new_data
  ) values (
    now(),
    coalesce(v_user, case when v_uid is null then 'Sistem' else 'Unknown' end),
    v_verb || ' ' || v_entity
      || case when v_label is not null and v_label <> coalesce(v_record_id, '') then ' "' || left(v_label, 80) || '"' else '' end
      || case when tg_op = 'UPDATE' then ': ' || array_to_string(v_changed, ', ') else '' end,
    v_store, v_uid, 'data',
    tg_table_name, v_record_id, tg_op, v_changed, v_old, v_new
  );

  return null;
end;
$$;

revoke execute on function public.audit_row_change() from public, anon, authenticated;
revoke execute on function public.audit_logs_stamp_actor() from public, anon, authenticated;

-- pasang di semua tabel bisnis
do $$
declare
  t text;
begin
  foreach t in array array[
    'transactions', 'customers', 'services', 'inventory_items', 'assets',
    'scheduled_maintenances', 'expenses', 'monthly_expense_templates', 'settings',
    'stores', 'profiles', 'employees', 'employee_auth_accounts', 'employee_login_attempts',
    'attendance', 'advances', 'payroll', 'supervisor_pins', 'supervisor_pin_attempts',
    'supervisor_approvals'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('drop trigger if exists zz_audit_row_change on public.%I', t);
      execute format(
        'create trigger zz_audit_row_change after insert or update or delete on public.%I
           for each row execute function public.audit_row_change()', t);
    end if;
  end loop;
end;
$$;

-- 4. Append-only -------------------------------------------------------------
revoke update, delete, truncate on public.audit_logs from anon, authenticated;
revoke insert, select on public.audit_logs from anon;

-- ============================================
-- SECTION 18: DAFTAR PELANGGAN + STATISTIK, TOTAL BELANJA RAHASIA (Added Nov 2026)
-- ============================================
-- Sumber: migrations/20261127000000_customers_with_stats.sql &
--         migrations/20261201000000_sembunyikan_total_belanja.sql

-- Total Belanja pelanggan bersifat rahasia: hanya Admin & Super Admin yang
-- boleh melihatnya. Untuk Kasir dan Operator kolom "totalSpent" dikembalikan
-- NULL dari server, jadi angkanya tidak pernah sampai ke browser mereka
-- (bukan sekadar disembunyikan di tampilan).
--
-- Mengurutkan berdasarkan "totalSpent" juga tidak membocorkan urutan, karena
-- untuk peran tersebut semua nilainya NULL.
--
-- View dibuat ulang (drop + create) karena c.* bisa berubah urutan kolomnya
-- jika tabel customers pernah diubah, yang membuat CREATE OR REPLACE gagal.

drop view if exists public.customers_with_stats;

create view public.customers_with_stats
with (security_invoker = on) as
select
  c.*,
  coalesce(s.transaction_count, 0)::integer as "transactionCount",
  case
    when (select public.get_my_role()) in ('Admin', 'Super Admin')
      then coalesce(s.total_spent, 0)::numeric
    else null::numeric
  end as "totalSpent",
  st.name as "storeName"
from public.customers c
left join lateral (
  select count(*) as transaction_count, sum(t.total) as total_spent
  from public.transactions t
  where t."customerId" = c.id
) s on true
left join public.stores st on st.id = c."storeId";

revoke all on public.customers_with_stats from anon;
grant select on public.customers_with_stats to authenticated;

-- ============================================
-- SECTION 19: PERKETAT AKSES BACA PER PERAN (Added Nov 2026)
-- ============================================
-- Sumber: migrations/20261202000000_perketat_akses_baca.sql

-- Perketat akses BACA per peran.
--
-- Sebelumnya semua peran di cabang (termasuk Kasir & Operator) bisa membaca
-- langsung dari database: seluruh pengeluaran, seluruh data pelanggan, dan
-- angka uang di setiap transaksi, walaupun menunya disembunyikan di aplikasi.
--
-- 1. Pengeluaran   : hanya Admin (cabangnya) & Super Admin yang bisa membaca.
--                    Kasir tetap bisa MENCATAT pengeluaran (insert tanpa baca).
-- 2. Transaksi     : Operator tidak lagi membaca tabel transactions. Ia memakai
--                    view transactions_operator: tanpa nominal (harga, total,
--                    bayar, kembalian, metode bayar), hanya pesanan aktif +
--                    yang Selesai dalam 7 hari terakhir, dan hanya nama pelanggan.
-- 3. Pelanggan     : Operator tidak lagi membaca tabel customers (nama pelanggan
--                    sudah ada di transactions_operator).
-- 4. Ubah progres  : Operator mengubah pesanan lewat RPC operator_update_transaction
--                    (hanya orderStatus, notes, estimatedCompletionDate).
--                    update_transaction_progress menolak Operator karena fungsi itu
--                    mengembalikan baris transaksi lengkap beserta nominalnya.
--                    Struk WhatsApp kini hanya dikirim Kasir ke atas.
-- 5. Performa      : get_my_role()/get_my_store_id() di policy dibungkus (select ...)
--                    supaya dihitung sekali per query, bukan per baris.
-- 6. View customers_with_stats hanya diberi izin SELECT.

-- 1. Pengeluaran ---------------------------------------------------------------------
drop policy if exists "Allow SELECT for store users" on public.expenses;
drop policy if exists "Allow SELECT for Admins" on public.expenses;
create policy "Allow SELECT for Admins" on public.expenses
  for select to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  );

drop policy if exists "Allow INSERT for store users" on public.expenses;
create policy "Allow INSERT for store users" on public.expenses
  for insert to authenticated
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) in ('Admin', 'Kasir')
      and "storeId" = (select public.get_my_store_id())
    )
  );

drop policy if exists "Allow UPDATE for Admins" on public.expenses;
create policy "Allow UPDATE for Admins" on public.expenses
  for update to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  )
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  );

drop policy if exists "Allow DELETE for Admins" on public.expenses;
create policy "Allow DELETE for Admins" on public.expenses
  for delete to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  );

-- 2 & 3. Transaksi & pelanggan: Operator tidak membaca tabel langsung -----------------
drop policy if exists "Allow SELECT for store users" on public.transactions;
create policy "Allow SELECT for store users" on public.transactions
  for select to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) in ('Admin', 'Kasir')
      and "storeId" = (select public.get_my_store_id())
    )
  );

drop policy if exists "Allow INSERT for store users" on public.transactions;
create policy "Allow INSERT for store users" on public.transactions
  for insert to authenticated
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) in ('Admin', 'Kasir')
      and "storeId" = (select public.get_my_store_id())
    )
  );

-- Operator dikeluarkan: ia mengubah progres lewat operator_update_transaction.
drop policy if exists "Allow UPDATE for store staff" on public.transactions;
create policy "Allow UPDATE for store staff" on public.transactions
  for update to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) in ('Admin', 'Kasir')
      and "storeId" = (select public.get_my_store_id())
    )
  )
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) in ('Admin', 'Kasir')
      and "storeId" = (select public.get_my_store_id())
    )
  );

drop policy if exists "Allow DELETE for Admins" on public.transactions;
create policy "Allow DELETE for Admins" on public.transactions
  for delete to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  );

drop policy if exists "Allow SELECT for store users" on public.customers;
create policy "Allow SELECT for store users" on public.customers
  for select to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) in ('Admin', 'Kasir')
      and "storeId" = (select public.get_my_store_id())
    )
  );

drop policy if exists "Allow INSERT for store users" on public.customers;
create policy "Allow INSERT for store users" on public.customers
  for insert to authenticated
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) in ('Admin', 'Kasir')
      and "storeId" = (select public.get_my_store_id())
    )
  );

drop policy if exists "Allow UPDATE/DELETE for Admins" on public.customers;
create policy "Allow UPDATE/DELETE for Admins" on public.customers
  for update to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  )
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  );

drop policy if exists "Allow DELETE for Admins" on public.customers;
create policy "Allow DELETE for Admins" on public.customers
  for delete to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  );
-- "Allow UPDATE for Cashiers in own store" sudah memakai (select ...), tidak diubah.

-- 5. Bungkus juga policy stores & profiles -------------------------------------------
drop policy if exists "Allow SELECT for store users" on public.stores;
create policy "Allow SELECT for store users" on public.stores
  for select to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or id = (select public.get_my_store_id())
  );

drop policy if exists "Allow INSERT/UPDATE/DELETE for Super Admins only" on public.stores;
create policy "Allow INSERT/UPDATE/DELETE for Super Admins only" on public.stores
  for all to authenticated
  using ((select public.get_my_role()) = 'Super Admin')
  with check ((select public.get_my_role()) = 'Super Admin');

drop policy if exists "Admins can manage profiles in their store" on public.profiles;
create policy "Admins can manage profiles in their store" on public.profiles
  for all to authenticated
  using (
    (select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id())
  )
  with check (
    (select public.get_my_role()) = 'Admin'
    and store_id = (select public.get_my_store_id())
    and role in ('Admin', 'Kasir', 'Operator')
  );

drop policy if exists "Super Admins can manage all profiles" on public.profiles;
create policy "Super Admins can manage all profiles" on public.profiles
  for all to authenticated
  using ((select public.get_my_role()) = 'Super Admin')
  with check ((select public.get_my_role()) = 'Super Admin');

drop policy if exists "Admins can see profiles in their store" on public.profiles;
create policy "Admins can see profiles in their store" on public.profiles
  for select to authenticated
  using (
    (select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id())
  );

drop policy if exists "Super Admins can see all profiles" on public.profiles;
create policy "Super Admins can see all profiles" on public.profiles
  for select to authenticated
  using ((select public.get_my_role()) = 'Super Admin');

drop policy if exists "Users can see their own profile" on public.profiles;
create policy "Users can see their own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));
-- "Users can update their own profile" tidak diubah (with check-nya mengunci role & cabang).

-- 2. View transaksi khusus Operator ----------------------------------------------------
-- Sengaja BUKAN security_invoker: Operator tidak punya akses baca ke tabel
-- transactions/customers, jadi view ini berjalan dengan hak pemiliknya dan
-- membatasi barisnya sendiri (WHERE) ke Operator di cabangnya. Kolom nominal
-- dikembalikan NULL agar bentuknya sama dengan tabel transactions.
-- security_barrier mencegah filter dari client dievaluasi sebelum WHERE ini.
drop view if exists public.transactions_operator cascade;
create view public.transactions_operator
with (security_barrier = true) as
select
  t.id,
  t."invoiceCode",
  t."customerId",
  case
    when jsonb_typeof(t.items) = 'array' then (
      select coalesce(jsonb_agg(e.item - 'price' - 'subtotal' order by e.ord), '[]'::jsonb)
      from jsonb_array_elements(t.items) with ordinality as e(item, ord)
    )
    else '[]'::jsonb
  end as items,
  null::numeric as subtotal,
  null::numeric as discount,
  null::numeric as tax,
  null::numeric as total,
  t."paymentStatus",
  t."orderStatus",
  t."createdAt",
  t."updatedAt",
  t."estimatedCompletionDate",
  null::numeric as "amountPaid",
  null::numeric as "change",
  null::text as "paymentMethod",
  t."createdByUserId",
  t."updatedByUserId",
  t."storeId",
  t.notes,
  t."whatsappSentAt",
  c.name as "customerName"
from public.transactions t
left join public.customers c on c.id = t."customerId"
where (select public.get_my_role()) = 'Operator'
  and t."storeId" = (select public.get_my_store_id())
  and (t."orderStatus" is distinct from 'Selesai' or t."updatedAt" >= now() - interval '7 days');

revoke all on public.transactions_operator from public, anon, authenticated;
grant select on public.transactions_operator to authenticated;

-- 4. RPC ubah progres untuk Operator ---------------------------------------------------
create or replace function public.operator_update_transaction(
  p_transaction_id uuid,
  p_patch jsonb
)
returns setof public.transactions_operator
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
begin
  if public.get_my_role() is distinct from 'Operator' then
    raise exception 'Fungsi ini khusus Operator' using errcode = '42501';
  end if;

  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'Data perubahan tidak valid' using errcode = '22023';
  end if;

  for v_key in select jsonb_object_keys(p_patch) loop
    if v_key not in ('orderStatus', 'notes', 'estimatedCompletionDate') then
      raise exception 'Operator tidak dapat mengubah %', v_key using errcode = '42501';
    end if;
  end loop;

  -- Hanya transaksi yang memang terlihat oleh Operator ini (cabang & rentang waktu).
  if not exists (select 1 from public.transactions_operator o where o.id = p_transaction_id) then
    raise exception 'Transaksi tidak ditemukan' using errcode = 'P0002';
  end if;

  -- Trigger guard_operator_transactions tetap berjalan (mis. Operator tidak boleh
  -- menandai Selesai).
  update public.transactions t
  set
    "orderStatus" = case when p_patch ? 'orderStatus'
                      then p_patch ->> 'orderStatus' else t."orderStatus" end,
    notes = case when p_patch ? 'notes'
              then p_patch ->> 'notes' else t.notes end,
    "estimatedCompletionDate" = case when p_patch ? 'estimatedCompletionDate'
                                  then (p_patch ->> 'estimatedCompletionDate')::timestamptz
                                  else t."estimatedCompletionDate" end,
    "updatedByUserId" = auth.uid()
  where t.id = p_transaction_id;

  return query select * from public.transactions_operator o where o.id = p_transaction_id;
end;
$$;

revoke execute on function public.operator_update_transaction(uuid, jsonb) from public, anon;
grant execute on function public.operator_update_transaction(uuid, jsonb) to authenticated;

-- update_transaction_progress mengembalikan baris lengkap (termasuk nominal):
-- tolak Operator. Selebihnya sama dengan versi sebelumnya.
create or replace function public.update_transaction_progress(
  transaction_id_input uuid,
  p_amount_paid numeric default null::numeric,
  p_change numeric default null::numeric,
  p_payment_method text default null::text,
  p_payment_status text default null::text,
  p_order_status text default null::text,
  p_supervisor_approval_id uuid default null::uuid
)
returns setof public.transactions
language plpgsql
security definer
set search_path = public
as $function$
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
  SELECT p.role, p.store_id INTO caller_role, caller_store FROM public.profiles p WHERE p.id = caller;
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF caller_role = 'Operator' THEN
    RAISE EXCEPTION 'Operator mengubah progres lewat operator_update_transaction'
      USING ERRCODE = '42501';
  END IF;

  SELECT t."storeId", t."paymentStatus", t."orderStatus"
    INTO tx_store, current_payment_status, current_order_status
    FROM public.transactions t WHERE t.id = transaction_id_input;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'transaction not found';
  END IF;

  IF caller_role <> 'Super Admin' AND tx_store IS DISTINCT FROM caller_store THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  final_payment_status := COALESCE(p_payment_status, current_payment_status);
  final_order_status := COALESCE(p_order_status, current_order_status);

  IF final_order_status = 'Selesai' AND final_payment_status <> 'Lunas' THEN
    RAISE EXCEPTION 'Inkonsistensi: Pesanan tidak boleh berstatus Selesai jika pembayaran belum Lunas.';
  END IF;
  IF current_order_status = 'Selesai' AND final_payment_status <> 'Lunas' THEN
    RAISE EXCEPTION 'Inkonsistensi: Status pembayaran tidak boleh diubah menjadi belum lunas jika pesanan sudah selesai.';
  END IF;

  UPDATE public.transactions
  SET
    "amountPaid" = COALESCE(p_amount_paid, "amountPaid"),
    "change" = COALESCE(p_change, "change"),
    "paymentMethod" = COALESCE(p_payment_method, "paymentMethod"),
    "paymentStatus" = COALESCE(p_payment_status, "paymentStatus"),
    "orderStatus" = COALESCE(p_order_status, "orderStatus"),
    "supervisorApprovalId" = COALESCE(p_supervisor_approval_id, "supervisorApprovalId")
  WHERE id = transaction_id_input;

  INSERT INTO public.audit_logs("user", action, "storeId")
  VALUES ((SELECT p.name FROM public.profiles p WHERE p.id = caller), concat('Update progress ', transaction_id_input), tx_store);

  RETURN QUERY SELECT * FROM public.transactions WHERE id = transaction_id_input;
END;
$function$;

-- 6. View pelanggan: baca saja ----------------------------------------------------------
revoke all on public.customers_with_stats from public, anon, authenticated;
grant select on public.customers_with_stats to authenticated;

-- ============================================
-- SECTION 20: GAJI HARIAN OTOMATIS KE PENGELUARAN (Added Nov 2026)
-- employees.base_salary = gaji per hari. Absen masuk -> 1 pengeluaran "Gaji".
-- Sumber: supabase/migrations/20261205000000_gaji_harian_otomatis.sql
-- ============================================


ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS "attendanceId" uuid;

COMMENT ON COLUMN public.expenses."attendanceId" IS
  'Absensi sumber pengeluaran gaji harian otomatis (NULL = pengeluaran biasa).';

CREATE UNIQUE INDEX IF NOT EXISTS expenses_attendance_id_idx
  ON public.expenses ("attendanceId")
  WHERE "attendanceId" IS NOT NULL;

COMMENT ON COLUMN public.employees.base_salary IS
  'Gaji per hari (Rp). Otomatis dicatat sebagai pengeluaran "Gaji" setiap hari karyawan absen masuk.';

CREATE OR REPLACE FUNCTION public.sync_daily_wage_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_employee record;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Hapus hanya bila absensi dihapus sendiri; saat karyawan dihapus (cascade)
    -- barisnya sudah tidak ada dan riwayat gaji dibiarkan.
    IF EXISTS (SELECT 1 FROM public.employees e WHERE e.id = OLD.employee_id) THEN
      DELETE FROM public.expenses WHERE "attendanceId" = OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.clock_in IS NULL THEN
    DELETE FROM public.expenses WHERE "attendanceId" = NEW.id;
    RETURN NEW;
  END IF;

  SELECT e.name, e.store_id, e.base_salary
  INTO v_employee
  FROM public.employees e
  WHERE e.id = NEW.employee_id;

  IF NOT FOUND OR COALESCE(v_employee.base_salary, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.expenses (date, description, category, amount, "storeId", "attendanceId")
  VALUES (
    NEW.date,
    'Gaji harian - ' || v_employee.name,
    'Gaji',
    v_employee.base_salary,
    v_employee.store_id,
    NEW.id
  )
  ON CONFLICT ("attendanceId") WHERE "attendanceId" IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_daily_wage_expense() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS attendance_daily_wage_expense ON public.attendance;
CREATE TRIGGER attendance_daily_wage_expense
  AFTER INSERT OR DELETE OR UPDATE OF clock_in ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.sync_daily_wage_expense();

-- ============================================
-- SECTION 21: INVENTARIS - POTONG STOK OTOMATIS & RIWAYAT STOK (Added Nov 2026)
-- ============================================
-- Setiap nota memotong stok bahan sesuai aturan inventory_recipes (trigger di
-- transactions); semua perubahan stok tercatat di inventory_movements.
-- Sumber: supabase/migrations/20261204000000_inventaris_potong_stok_otomatis.sql

-- 1. Stok desimal + penanda stok rendah (bisa difilter di server) ---------------
ALTER TABLE public.inventory_items
  ALTER COLUMN stock TYPE numeric(12,3) USING stock::numeric,
  ALTER COLUMN "lowStockThreshold" TYPE numeric(12,3) USING "lowStockThreshold"::numeric;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS is_low_stock boolean
  GENERATED ALWAYS AS ("lowStockThreshold" > 0 AND stock <= "lowStockThreshold") STORED;

CREATE INDEX IF NOT EXISTS idx_inventory_items_store_low
  ON public.inventory_items ("storeId") WHERE is_low_stock;

-- 2. Tabel lama (tidak pernah terpasang di produksi, aman dibuat ulang) ----------
DROP TABLE IF EXISTS public.inventory_usage_log CASCADE;
DROP TABLE IF EXISTS public.stock_opname CASCADE;
DROP TABLE IF EXISTS public.inventory_recipes CASCADE;

-- 3. Aturan potong stok --------------------------------------------------------
CREATE TABLE public.inventory_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  -- NULL = berlaku untuk semua layanan
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  -- per_unit: amount × jumlah (kg/pcs/m) baris nota yang cocok
  -- per_transaksi: amount sekali per nota yang memuat layanan yang cocok
  basis text NOT NULL DEFAULT 'per_unit' CHECK (basis IN ('per_unit', 'per_transaksi')),
  amount numeric(12,3) NOT NULL CHECK (amount > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_recipes_unique UNIQUE NULLS NOT DISTINCT (inventory_item_id, service_id, basis)
);

CREATE INDEX idx_inventory_recipes_store_active
  ON public.inventory_recipes (store_id) WHERE is_active;
CREATE INDEX idx_inventory_recipes_service ON public.inventory_recipes (service_id);

-- Cabang aturan selalu mengikuti cabang item (tidak bisa diakali dari klien)
CREATE OR REPLACE FUNCTION public.inventory_recipes_sync_store()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT "storeId" INTO NEW.store_id FROM public.inventory_items WHERE id = NEW.inventory_item_id;
  IF NEW.store_id IS NULL THEN
    RAISE EXCEPTION 'Item inventaris tidak ditemukan atau belum punya cabang';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inventory_recipes_sync_store
  BEFORE INSERT OR UPDATE ON public.inventory_recipes
  FOR EACH ROW EXECUTE FUNCTION public.inventory_recipes_sync_store();

-- 4. Buku besar mutasi stok ----------------------------------------------------
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  recipe_id uuid REFERENCES public.inventory_recipes(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN (
    'awal', 'restok', 'penyesuaian', 'opname', 'transaksi', 'koreksi_transaksi'
  )),
  quantity numeric(12,3) NOT NULL,          -- + masuk, − keluar
  stock_before numeric(12,3) NOT NULL,
  stock_after numeric(12,3) NOT NULL,
  note text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_item_time
  ON public.inventory_movements (inventory_item_id, created_at DESC);
CREATE INDEX idx_inventory_movements_store_time
  ON public.inventory_movements (store_id, created_at DESC);
CREATE INDEX idx_inventory_movements_transaction
  ON public.inventory_movements (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_inventory_movements_recipe ON public.inventory_movements (recipe_id);
CREATE INDEX idx_inventory_movements_created_by ON public.inventory_movements (created_by);

-- Setiap perubahan stok tercatat. Konteks (jenis, nota, catatan) dikirim lewat
-- setting lokal-transaksi app.inv_* oleh fungsi di bawah; tanpa konteks = penyesuaian manual.
CREATE OR REPLACE FUNCTION public.log_inventory_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before numeric := CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.stock END;
  v_kind text := nullif(current_setting('app.inv_kind', true), '');
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stock IS NOT DISTINCT FROM OLD.stock THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND coalesce(NEW.stock, 0) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.inventory_movements (
    store_id, inventory_item_id, transaction_id, recipe_id, kind,
    quantity, stock_before, stock_after, note, created_by
  ) VALUES (
    NEW."storeId",
    NEW.id,
    nullif(current_setting('app.inv_transaction', true), '')::uuid,
    nullif(current_setting('app.inv_recipe', true), '')::uuid,
    coalesce(v_kind, CASE WHEN TG_OP = 'INSERT' THEN 'awal' ELSE 'penyesuaian' END),
    NEW.stock - v_before,
    v_before,
    NEW.stock,
    nullif(current_setting('app.inv_note', true), ''),
    auth.uid()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER zz_log_inventory_movement
  AFTER INSERT OR UPDATE OF stock ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.log_inventory_movement();

-- Inti perubahan stok: atomik (UPDATE stock = stock + delta) dan selalu tercatat.
CREATE OR REPLACE FUNCTION public.apply_inventory_delta(
  p_item_id uuid,
  p_delta numeric,
  p_kind text,
  p_transaction_id uuid DEFAULT NULL,
  p_recipe_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock numeric;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 THEN
    SELECT stock INTO v_stock FROM public.inventory_items WHERE id = p_item_id;
    RETURN v_stock;
  END IF;

  PERFORM set_config('app.inv_kind', p_kind, true);
  PERFORM set_config('app.inv_transaction', coalesce(p_transaction_id::text, ''), true);
  PERFORM set_config('app.inv_recipe', coalesce(p_recipe_id::text, ''), true);
  PERFORM set_config('app.inv_note', coalesce(p_note, ''), true);

  UPDATE public.inventory_items
     SET stock = stock + p_delta
   WHERE id = p_item_id
  RETURNING stock INTO v_stock;

  PERFORM set_config('app.inv_kind', '', true);
  PERFORM set_config('app.inv_transaction', '', true);
  PERFORM set_config('app.inv_recipe', '', true);
  PERFORM set_config('app.inv_note', '', true);

  RETURN v_stock;
END;
$$;

-- 5. Potong stok otomatis dari nota --------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_transaction(
  p_transaction_id uuid,
  p_store_id uuid,
  p_items jsonb,
  p_invoice text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF p_store_id IS NULL OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN;
  END IF;

  FOR r IN
    WITH lines AS (
      SELECT nullif(li->>'serviceId', '') AS service_id,
             CASE WHEN (li->>'quantity') ~ '^-?[0-9]+(\.[0-9]+)?$'
                  THEN (li->>'quantity')::numeric ELSE 0 END AS qty
        FROM jsonb_array_elements(p_items) li
    )
    SELECT rc.id AS recipe_id,
           rc.inventory_item_id,
           CASE rc.basis
             WHEN 'per_unit' THEN rc.amount * coalesce(sum(l.qty), 0)
             ELSE CASE WHEN count(l.*) > 0 THEN rc.amount ELSE 0 END
           END AS usage
      FROM public.inventory_recipes rc
      JOIN public.inventory_items ii ON ii.id = rc.inventory_item_id AND ii."storeId" = p_store_id
      LEFT JOIN lines l ON rc.service_id IS NULL OR l.service_id = rc.service_id::text
     WHERE rc.store_id = p_store_id AND rc.is_active
     GROUP BY rc.id, rc.inventory_item_id, rc.basis, rc.amount
  LOOP
    IF r.usage > 0 THEN
      PERFORM public.apply_inventory_delta(
        r.inventory_item_id, -r.usage, 'transaksi', p_transaction_id, r.recipe_id,
        'Pemakaian nota ' || coalesce(p_invoice, '')
      );
    END IF;
  END LOOP;
END;
$$;

-- Kembalikan seluruh potongan sebuah nota (dipakai saat item nota diubah / nota dihapus)
CREATE OR REPLACE FUNCTION public.revert_inventory_for_transaction(
  p_transaction_id uuid,
  p_note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT inventory_item_id, sum(quantity) AS net
      FROM public.inventory_movements
     WHERE transaction_id = p_transaction_id
       AND kind IN ('transaksi', 'koreksi_transaksi')
     GROUP BY inventory_item_id
    HAVING sum(quantity) <> 0
  LOOP
    PERFORM public.apply_inventory_delta(
      r.inventory_item_id, -r.net, 'koreksi_transaksi', p_transaction_id, NULL, p_note
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_transaction_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Kegagalan potong stok tidak boleh menggagalkan nota pelanggan.
  BEGIN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.items IS DISTINCT FROM OLD.items OR NEW."storeId" IS DISTINCT FROM OLD."storeId" THEN
        PERFORM public.revert_inventory_for_transaction(OLD.id, 'Item nota ' || coalesce(OLD."invoiceCode", '') || ' diubah');
        PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      PERFORM public.revert_inventory_for_transaction(OLD.id, 'Nota ' || coalesce(OLD."invoiceCode", '') || ' dihapus');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Potong stok otomatis gagal (%): %', TG_OP, SQLERRM;
  END;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER zz_transaction_inventory_insert
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_inventory();

CREATE TRIGGER zz_transaction_inventory_update
  AFTER UPDATE OF items, "storeId" ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_inventory();

-- BEFORE DELETE: harus jalan sebelum FK transaction_id di-NULL-kan.
CREATE TRIGGER zz_transaction_inventory_delete
  BEFORE DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_inventory();

-- 6. Stock opname --------------------------------------------------------------
CREATE TABLE public.stock_opname (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  virtual_stock numeric(12,3) NOT NULL,
  physical_stock numeric(12,3) NOT NULL CHECK (physical_stock >= 0),
  -- positif = barang hilang/terpakai tanpa tercatat
  discrepancy numeric(12,3) GENERATED ALWAYS AS (virtual_stock - physical_stock) STORED,
  notes text,
  recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_opname_store_time ON public.stock_opname (store_id, recorded_at DESC);
CREATE INDEX idx_stock_opname_item ON public.stock_opname (inventory_item_id);
CREATE INDEX idx_stock_opname_recorded_by ON public.stock_opname (recorded_by);

-- 7. RPC untuk staf cabang -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_inventory_item(p_item_id uuid)
RETURNS uuid  -- mengembalikan storeId item bila boleh, NULL bila tidak
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ii."storeId"
    FROM public.inventory_items ii
   WHERE ii.id = p_item_id
     AND (
       public.get_my_role() = 'Super Admin'
       OR (public.get_my_role() IS NOT NULL AND ii."storeId" = public.get_my_store_id())
     );
$$;

-- p_mode: 'tambah' (restok), 'kurang' (pemakaian/rusak), 'set' (atur jadi angka tertentu)
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_item_id uuid,
  p_mode text,
  p_value numeric,
  p_note text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current numeric;
  v_delta numeric;
BEGIN
  IF public.can_manage_inventory_item(p_item_id) IS NULL THEN
    RAISE EXCEPTION 'Anda tidak punya akses ke item inventaris ini' USING ERRCODE = '42501';
  END IF;
  IF p_value IS NULL OR p_value < 0 THEN
    RAISE EXCEPTION 'Jumlah harus 0 atau lebih';
  END IF;

  SELECT stock INTO v_current FROM public.inventory_items WHERE id = p_item_id FOR UPDATE;

  v_delta := CASE p_mode
    WHEN 'tambah' THEN p_value
    WHEN 'kurang' THEN -p_value
    WHEN 'set' THEN p_value - v_current
    ELSE NULL
  END;
  IF v_delta IS NULL THEN
    RAISE EXCEPTION 'Mode penyesuaian tidak dikenal: %', p_mode;
  END IF;

  RETURN public.apply_inventory_delta(
    p_item_id, v_delta,
    CASE WHEN p_mode = 'tambah' THEN 'restok' ELSE 'penyesuaian' END,
    NULL, NULL, nullif(trim(p_note), '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_stock_opname(
  p_item_id uuid,
  p_physical_stock numeric,
  p_notes text DEFAULT NULL
)
RETURNS public.stock_opname
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store uuid;
  v_current numeric;
  v_row public.stock_opname;
BEGIN
  v_store := public.can_manage_inventory_item(p_item_id);
  IF v_store IS NULL THEN
    RAISE EXCEPTION 'Anda tidak punya akses ke item inventaris ini' USING ERRCODE = '42501';
  END IF;
  IF p_physical_stock IS NULL OR p_physical_stock < 0 THEN
    RAISE EXCEPTION 'Stok fisik harus 0 atau lebih';
  END IF;

  SELECT stock INTO v_current FROM public.inventory_items WHERE id = p_item_id FOR UPDATE;

  INSERT INTO public.stock_opname (store_id, inventory_item_id, virtual_stock, physical_stock, notes, recorded_by)
  VALUES (v_store, p_item_id, v_current, p_physical_stock, nullif(trim(p_notes), ''), auth.uid())
  RETURNING * INTO v_row;

  PERFORM public.apply_inventory_delta(
    p_item_id, p_physical_stock - v_current, 'opname', NULL, NULL,
    coalesce('Stock opname: ' || nullif(trim(p_notes), ''), 'Stock opname')
  );

  RETURN v_row;
END;
$$;

-- Fungsi internal tidak boleh dipanggil langsung lewat API
REVOKE ALL ON FUNCTION public.apply_inventory_delta(uuid, numeric, text, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_inventory_for_transaction(uuid, uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revert_inventory_for_transaction(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_transaction_inventory() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_inventory_movement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inventory_recipes_sync_store() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_inventory_item(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.adjust_inventory_stock(uuid, text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_stock_opname(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(uuid, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_stock_opname(uuid, numeric, text) TO authenticated;

-- 8. RLS -----------------------------------------------------------------------
ALTER TABLE public.inventory_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_opname ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Baca aturan stok cabang" ON public.inventory_recipes
  FOR SELECT TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin' OR store_id = (SELECT public.get_my_store_id()));
CREATE POLICY "Admin kelola aturan stok" ON public.inventory_recipes
  FOR ALL TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  )
  WITH CHECK (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  );

-- Buku besar & opname hanya ditulis lewat fungsi SECURITY DEFINER (tanpa policy tulis).
CREATE POLICY "Baca mutasi stok cabang" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin' OR store_id = (SELECT public.get_my_store_id()));
CREATE POLICY "Baca opname cabang" ON public.stock_opname
  FOR SELECT TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin' OR store_id = (SELECT public.get_my_store_id()));

-- ============================================
-- SECTION 22: LAPORAN KEUANGAN - RIWAYAT PEMBAYARAN & RPC LAPORAN (Added Nov 2026)
-- ============================================
-- 1. Tabel transaction_payments: setiap kenaikan/penurunan uang yang diterima
--    sebuah nota dicatat sebagai satu baris dengan TANGGAL BAYAR-nya.
--    Diisi otomatis oleh trigger di transactions (semua jalur: kasir, pelunasan,
--    RPC, sinkron offline, restore backup), jadi aplikasi tidak perlu diubah.
--    Uang diterima per nota = total bila Lunas, selain itu min(amountPaid, total)
--    (sama dengan Dashboard; kembalian tidak dihitung).
--    Data lama di-backfill dengan tanggal bayar = tanggal nota dibuat (riwayat
--    pelunasan sebelum tabel ini ada memang tidak tersimpan).
-- 2. report_expense_lines(): pengeluaran + pembelian & perawatan aset dari tabel
--    assets yang belum tercatat di expenses (deskripsi & tanggal sama persis).
-- 3. get_financial_report(): seluruh agregasi halaman Laporan dihitung di
--    database sehingga browser hanya menerima angka akhirnya.
--    SECURITY INVOKER → RLS tetap berlaku; hanya Admin & Super Admin.
-- Aman dijalankan ulang.
-- ============================================================================

-- ---------- 1. Riwayat pembayaran ----------
CREATE TABLE IF NOT EXISTS public.transaction_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionId" uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  "storeId" uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  "paymentMethod" text,
  "paidAt" timestamptz NOT NULL DEFAULT now(),
  "recordedByUserId" uuid,
  source text NOT NULL DEFAULT 'pembayaran'
    CHECK (source IN ('pembayaran', 'koreksi', 'backfill'))
);

COMMENT ON TABLE public.transaction_payments IS
  'Riwayat uang diterima per nota (otomatis dari trigger transactions). amount negatif = koreksi.';

CREATE INDEX IF NOT EXISTS idx_transaction_payments_store_paid
  ON public.transaction_payments ("storeId", "paidAt");
CREATE INDEX IF NOT EXISTS idx_transaction_payments_paid
  ON public.transaction_payments ("paidAt");
CREATE INDEX IF NOT EXISTS idx_transaction_payments_tx
  ON public.transaction_payments ("transactionId");
CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON public.transactions ("createdAt");

ALTER TABLE public.transaction_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow SELECT for Admins" ON public.transaction_payments;
CREATE POLICY "Allow SELECT for Admins" ON public.transaction_payments
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin'
        AND "storeId" = (SELECT public.get_my_store_id()))
  );
-- Tidak ada policy INSERT/UPDATE/DELETE: hanya trigger yang menulis.
REVOKE ALL ON public.transaction_payments FROM anon, authenticated;
GRANT SELECT ON public.transaction_payments TO authenticated;

CREATE OR REPLACE FUNCTION public.transaction_collected_amount(
  p_status text, p_total numeric, p_amount_paid numeric
) RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_status = 'Lunas' THEN GREATEST(COALESCE(p_total, 0), 0)
    ELSE GREATEST(0, LEAST(COALESCE(p_amount_paid, 0), COALESCE(p_total, 0)))
  END;
$$;

-- Backfill sekali untuk nota yang belum punya riwayat
INSERT INTO public.transaction_payments
  ("transactionId", "storeId", amount, "paymentMethod", "paidAt", source)
SELECT t.id, t."storeId",
       public.transaction_collected_amount(t."paymentStatus", t.total, t."amountPaid"),
       t."paymentMethod", t."createdAt", 'backfill'
FROM public.transactions t
WHERE public.transaction_collected_amount(t."paymentStatus", t.total, t."amountPaid") > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.transaction_payments p WHERE p."transactionId" = t.id
  );

CREATE OR REPLACE FUNCTION public.record_transaction_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new numeric;
  v_old numeric := 0;
  v_delta numeric;
BEGIN
  v_new := public.transaction_collected_amount(NEW."paymentStatus", NEW.total, NEW."amountPaid");
  IF TG_OP = 'UPDATE' THEN
    v_old := public.transaction_collected_amount(OLD."paymentStatus", OLD.total, OLD."amountPaid");
  END IF;
  v_delta := v_new - v_old;

  IF abs(v_delta) < 0.5 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.transaction_payments
    ("transactionId", "storeId", amount, "paymentMethod", "paidAt", "recordedByUserId", source)
  VALUES (
    NEW.id,
    NEW."storeId",
    v_delta,
    NEW."paymentMethod",
    -- Nota baru (termasuk sinkron offline): dibayar saat nota dibuat.
    CASE WHEN TG_OP = 'INSERT' THEN COALESCE(NEW."createdAt", now()) ELSE now() END,
    auth.uid(),
    CASE WHEN v_delta < 0 THEN 'koreksi' ELSE 'pembayaran' END
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_transaction_payment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS transactions_record_payment ON public.transactions;
CREATE TRIGGER transactions_record_payment
  AFTER INSERT OR UPDATE OF "amountPaid", total, "paymentStatus" ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.record_transaction_payment();

-- ---------- 2. Baris pengeluaran (termasuk aset) ----------
CREATE OR REPLACE FUNCTION public.report_safe_numeric(p jsonb)
RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p IS NULL THEN 0
    WHEN jsonb_typeof(p) = 'number' THEN (p #>> '{}')::numeric
    WHEN jsonb_typeof(p) = 'string' AND (p #>> '{}') ~ '^\s*-?[0-9]+(\.[0-9]+)?\s*$'
      THEN trim(p #>> '{}')::numeric
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.report_safe_date(p text, p_tz text)
RETURNS date
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p::date
    WHEN p ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}' THEN (p::timestamptz AT TIME ZONE p_tz)::date
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.report_expense_lines(
  p_store_id uuid, p_start date, p_end date, p_tz text DEFAULT 'Asia/Jakarta'
) RETURNS TABLE (
  id text, date date, description text, category text, amount numeric, "storeId" uuid
)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  WITH ex AS (
    SELECT e.id::text AS id, e.date, e.description, e.category,
           COALESCE(e.amount, 0) AS amount, e."storeId"
    FROM public.expenses e
    WHERE e.date BETWEEN p_start AND p_end
      AND (p_store_id IS NULL OR e."storeId" = p_store_id)
  ),
  asset_rows AS (
    SELECT 'asset-purchase-' || a.id::text AS id,
           a."purchaseDate" AS date,
           'Pembelian Aset: ' || a.name AS description,
           NULL::text AS alt_description,
           'Pembelian Aset'::text AS category,
           COALESCE(a."purchaseCost", 0) AS amount,
           a."storeId"
    FROM public.assets a
    WHERE a."purchaseDate" BETWEEN p_start AND p_end
      AND COALESCE(a."purchaseCost", 0) > 0
      AND (p_store_id IS NULL OR a."storeId" = p_store_id)
    UNION ALL
    SELECT 'asset-maint-' || a.id::text || '-' || l.ord::text,
           public.report_safe_date(l.log ->> 'date', p_tz),
           'Perawatan Aset: ' || a.name || ' (' || COALESCE(l.log ->> 'description', '') || ')',
           'Quick Maintenance: ' || a.name || ' (' || COALESCE(l.log ->> 'description', '') || ')',
           'Pemeliharaan Aset',
           public.report_safe_numeric(l.log -> 'cost'),
           a."storeId"
    FROM public.assets a
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(a."maintenanceHistory") = 'array' THEN a."maintenanceHistory"
           ELSE '[]'::jsonb END
    ) WITH ORDINALITY AS l(log, ord)
    WHERE (p_store_id IS NULL OR a."storeId" = p_store_id)
  )
  SELECT ex.id, ex.date, ex.description, ex.category, ex.amount, ex."storeId" FROM ex
  UNION ALL
  SELECT r.id, r.date, r.description, r.category, r.amount, r."storeId"
  FROM asset_rows r
  WHERE r.date BETWEEN p_start AND p_end
    AND r.amount > 0
    -- Sudah dicatat manual di expenses (format lama / Quick Maintenance) → jangan dobel.
    AND NOT EXISTS (
      SELECT 1 FROM ex
      WHERE ex.date = r.date
        AND (ex.description = r.description OR ex.description = r.alt_description)
    );
$$;

-- ---------- 3. Ringkasan & laporan lengkap ----------
CREATE OR REPLACE FUNCTION public.financial_report_summary(
  p_store_id uuid, p_start date, p_end date, p_tz text DEFAULT 'Asia/Jakarta'
) RETURNS jsonb
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  WITH b AS (
    SELECT (p_start::timestamp AT TIME ZONE p_tz) AS s,
           ((p_end + 1)::timestamp AT TIME ZONE p_tz) AS e
  ),
  tx AS (
    SELECT t.total, t.discount,
           public.transaction_collected_amount(t."paymentStatus", t.total, t."amountPaid") AS collected
    FROM public.transactions t, b
    WHERE t."createdAt" >= b.s AND t."createdAt" < b.e
      AND (p_store_id IS NULL OR t."storeId" = p_store_id)
  ),
  pay AS (
    SELECT COALESCE(sum(p.amount), 0) AS amt
    FROM public.transaction_payments p, b
    WHERE p."paidAt" >= b.s AND p."paidAt" < b.e
      AND (p_store_id IS NULL OR p."storeId" = p_store_id)
  ),
  ex AS (
    SELECT COALESCE(sum(l.amount), 0) AS amt, count(*) AS n
    FROM public.report_expense_lines(p_store_id, p_start, p_end, p_tz) l
  )
  SELECT jsonb_build_object(
    'gross', (SELECT COALESCE(sum(total), 0) FROM tx),
    'discount', (SELECT COALESCE(sum(discount), 0) FROM tx),
    'count', (SELECT count(*) FROM tx),
    'receivable', (SELECT COALESCE(sum(GREATEST(total - collected, 0)), 0) FROM tx),
    'unpaidCount', (SELECT count(*) FROM tx WHERE total - collected > 0.5),
    'collected', (SELECT amt FROM pay),
    'expenses', (SELECT amt FROM ex),
    'expenseCount', (SELECT n FROM ex)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_financial_report(
  p_store_id uuid,
  p_start date,
  p_end date,
  p_prev_start date DEFAULT NULL,
  p_prev_end date DEFAULT NULL,
  p_tz text DEFAULT 'Asia/Jakarta'
) RETURNS jsonb
LANGUAGE plpgsql STABLE
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF COALESCE(public.get_my_role(), '') NOT IN ('Super Admin', 'Admin') THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat melihat laporan keuangan' USING ERRCODE = '42501';
  END IF;
  IF p_start IS NULL OR p_end IS NULL OR p_start > p_end THEN
    RAISE EXCEPTION 'Rentang tanggal tidak valid' USING ERRCODE = '22023';
  END IF;

  WITH b AS (
    SELECT (p_start::timestamp AT TIME ZONE p_tz) AS s,
           ((p_end + 1)::timestamp AT TIME ZONE p_tz) AS e
  ),
  tx AS (
    SELECT t.*,
           public.transaction_collected_amount(t."paymentStatus", t.total, t."amountPaid") AS collected,
           (t."createdAt" AT TIME ZONE p_tz)::date AS day
    FROM public.transactions t, b
    WHERE t."createdAt" >= b.s AND t."createdAt" < b.e
      AND (p_store_id IS NULL OR t."storeId" = p_store_id)
  ),
  pay AS (
    SELECT p.*, (p."paidAt" AT TIME ZONE p_tz)::date AS day
    FROM public.transaction_payments p, b
    WHERE p."paidAt" >= b.s AND p."paidAt" < b.e
      AND (p_store_id IS NULL OR p."storeId" = p_store_id)
  ),
  ex AS (
    SELECT * FROM public.report_expense_lines(p_store_id, p_start, p_end, p_tz)
  ),
  items AS (
    SELECT i ->> 'serviceId' AS sid,
           i ->> 'serviceName' AS sname,
           i ->> 'unit' AS unit,
           public.report_safe_numeric(i -> 'subtotal') AS subtotal,
           public.report_safe_numeric(i -> 'quantity') AS qty
    FROM tx
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(tx.items) = 'array' THEN tx.items ELSE '[]'::jsonb END
    ) AS i
  ),
  svc AS (
    SELECT it.sid,
           COALESCE(max(s.name), max(it.sname), 'Layanan Dihapus') AS name,
           COALESCE(max(s.category::text), '-') AS category,
           COALESCE(max(s.unit), max(it.unit), 'unit') AS unit,
           COALESCE(max(s.category::text),
             CASE WHEN max(it.unit) = 'kg' THEN 'Kiloan'
                  WHEN max(it.unit) = 'm2' THEN 'Karpet'
                  ELSE 'Lainnya' END) AS group_category,
           sum(it.qty) AS quantity,
           sum(it.subtotal) AS revenue
    FROM items it
    LEFT JOIN public.services s ON s.id::text = it.sid
    GROUP BY it.sid
  ),
  tx_d AS (SELECT day, sum(total) AS gross, count(*) AS n FROM tx GROUP BY day),
  pay_d AS (SELECT day, sum(amount) AS revenue FROM pay GROUP BY day),
  ex_d AS (SELECT date AS day, sum(amount) AS expenses FROM ex GROUP BY date),
  daily AS (
    SELECT COALESCE(t.day, p.day, e.day) AS day,
           COALESCE(p.revenue, 0) AS revenue,
           COALESCE(e.expenses, 0) AS expenses,
           COALESCE(t.gross, 0) AS gross,
           COALESCE(t.n, 0) AS n
    FROM tx_d t
    FULL JOIN pay_d p ON p.day = t.day
    FULL JOIN ex_d e ON e.day = COALESCE(t.day, p.day)
  )
  SELECT jsonb_build_object(
    'summary', public.financial_report_summary(p_store_id, p_start, p_end, p_tz),
    'previous', CASE WHEN p_prev_start IS NOT NULL AND p_prev_end IS NOT NULL
                       AND p_prev_start <= p_prev_end
                     THEN public.financial_report_summary(p_store_id, p_prev_start, p_prev_end, p_tz)
                END,
    'daily', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'date', d.day, 'revenue', d.revenue, 'expenses', d.expenses,
               'gross', d.gross, 'count', d.n
             ) ORDER BY d.day)
      FROM daily d WHERE d.day IS NOT NULL), '[]'::jsonb),
    'services', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'serviceId', sid, 'name', name, 'category', category, 'unit', unit,
               'quantity', round(quantity, 2), 'revenue', revenue
             ) ORDER BY revenue DESC, name)
      FROM svc), '[]'::jsonb),
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('category', group_category, 'revenue', revenue)
                       ORDER BY revenue DESC)
      FROM (SELECT group_category, sum(revenue) AS revenue FROM svc
            GROUP BY group_category HAVING sum(revenue) > 0) c), '[]'::jsonb),
    'paymentMethods', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('method', method, 'count', n, 'amount', amount)
                       ORDER BY amount DESC)
      FROM (SELECT COALESCE(pay."paymentMethod", 'Tidak Tercatat') AS method,
                   count(DISTINCT pay."transactionId") AS n,
                   sum(pay.amount) AS amount
            FROM pay GROUP BY 1 HAVING abs(sum(pay.amount)) >= 0.5) m), '[]'::jsonb),
    'cashiers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'userId', uid, 'name', name, 'transactionCount', n, 'totalRevenue', amount
             ) ORDER BY amount DESC)
      FROM (SELECT COALESCE(tx."createdByUserId"::text, '__none__') AS uid,
                   COALESCE(max(pr.name),
                     CASE WHEN tx."createdByUserId" IS NULL THEN 'Tanpa Kasir'
                          ELSE 'Pengguna Tidak Dikenal' END) AS name,
                   count(*) AS n, sum(tx.total) AS amount
            FROM tx LEFT JOIN public.profiles pr ON pr.id = tx."createdByUserId"
            GROUP BY tx."createdByUserId") c), '[]'::jsonb),
    'customers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'customerId', cid, 'name', name, 'count', n, 'total', amount
             ) ORDER BY amount DESC)
      FROM (SELECT COALESCE(tx."customerId"::text, '__umum__') AS cid,
                   COALESCE(max(cu.name),
                     CASE WHEN tx."customerId" IS NULL THEN 'Umum'
                          ELSE 'Pelanggan Terhapus' END) AS name,
                   count(*) AS n, sum(tx.total) AS amount
            FROM tx LEFT JOIN public.customers cu ON cu.id = tx."customerId"
            GROUP BY tx."customerId"
            ORDER BY sum(tx.total) DESC
            LIMIT 5) c), '[]'::jsonb),
    'stores', CASE WHEN p_store_id IS NULL THEN COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'storeId', sid, 'name', name, 'count', n, 'gross', gross,
               'collected', collected, 'expenses', expenses,
               'net', collected - expenses
             ) ORDER BY collected DESC)
      FROM (
        SELECT k.sid,
               COALESCE(st.name, 'Tanpa Cabang') AS name,
               COALESCE((SELECT count(*) FROM tx WHERE tx."storeId" IS NOT DISTINCT FROM k.sid), 0) AS n,
               COALESCE((SELECT sum(total) FROM tx WHERE tx."storeId" IS NOT DISTINCT FROM k.sid), 0) AS gross,
               COALESCE((SELECT sum(amount) FROM pay WHERE pay."storeId" IS NOT DISTINCT FROM k.sid), 0) AS collected,
               COALESCE((SELECT sum(amount) FROM ex WHERE ex."storeId" IS NOT DISTINCT FROM k.sid), 0) AS expenses
        FROM (SELECT "storeId" AS sid FROM tx UNION SELECT "storeId" FROM pay
              UNION SELECT "storeId" FROM ex) k
        LEFT JOIN public.stores st ON st.id = k.sid
      ) s), '[]'::jsonb) END,
    'receivables', COALESCE((
      SELECT jsonb_agg(r ORDER BY r ->> 'createdAt')
      FROM (
        SELECT jsonb_build_object(
                 'id', tx.id, 'invoiceCode', tx."invoiceCode",
                 'customerName', COALESCE(cu.name, CASE WHEN tx."customerId" IS NULL THEN 'Umum' ELSE 'Pelanggan Terhapus' END),
                 'total', tx.total, 'paid', tx.collected,
                 'outstanding', tx.total - tx.collected,
                 'createdAt', tx."createdAt",
                 'ageDays', ((now() AT TIME ZONE p_tz)::date - tx.day),
                 'orderStatus', tx."orderStatus"
               ) AS r
        FROM tx LEFT JOIN public.customers cu ON cu.id = tx."customerId"
        WHERE tx.total - tx.collected > 0.5
        ORDER BY tx."createdAt"
        LIMIT 200
      ) x), '[]'::jsonb),
    'expenses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', ex.id, 'date', ex.date, 'description', ex.description,
               'category', ex.category, 'amount', ex.amount, 'storeId', ex."storeId"
             ) ORDER BY ex.date DESC, ex.description)
      FROM ex), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_financial_report(uuid, date, date, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_financial_report(uuid, date, date, date, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.financial_report_summary(uuid, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.financial_report_summary(uuid, date, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.report_expense_lines(uuid, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_expense_lines(uuid, date, date, text) TO authenticated;

-- ============================================
-- Pengaturan pop-up pengeluaran bulanan: saklar, tanggal muncul, nominal default,
-- dan hapus tagihan (riwayat tetap dilindungi FK).
-- Sumber: supabase/migrations/20261208000000_pengaturan_pengingat_tagihan_bulanan.sql

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS "monthlyExpenseReminderEnabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "monthlyExpenseReminderDay" smallint NOT NULL DEFAULT 1
    CONSTRAINT settings_monthly_expense_reminder_day_check
    CHECK ("monthlyExpenseReminderDay" BETWEEN 1 AND 28);

ALTER TABLE public.monthly_expense_templates
  ADD COLUMN IF NOT EXISTS default_amount numeric(14, 2)
    CONSTRAINT monthly_expense_templates_default_amount_check
    CHECK (default_amount IS NULL OR default_amount >= 0);

GRANT DELETE ON public.monthly_expense_templates TO authenticated;

-- ============================================
-- Pengaturan potong stok otomatis per cabang: saklar utama, waktu potong
-- (dibuat / Siap Diambil / Selesai), dan aturan bila stok bahan kurang.
-- Sumber: supabase/migrations/20261210000000_pengaturan_potong_stok.sql

-- 1. Tabel pengaturan -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_store_settings (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  auto_deduct_enabled boolean NOT NULL DEFAULT true,
  deduct_at text NOT NULL DEFAULT 'dibuat'
    CHECK (deduct_at IN ('dibuat', 'siap_diambil', 'selesai')),
  stock_guard text NOT NULL DEFAULT 'peringatan'
    CHECK (stock_guard IN ('bebas', 'peringatan', 'tahan')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_store_settings_updated_by
  ON public.inventory_store_settings (updated_by);

CREATE OR REPLACE FUNCTION public.inventory_store_settings_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_store_settings_touch ON public.inventory_store_settings;
CREATE TRIGGER trg_inventory_store_settings_touch
  BEFORE INSERT OR UPDATE ON public.inventory_store_settings
  FOR EACH ROW EXECUTE FUNCTION public.inventory_store_settings_touch();

ALTER TABLE public.inventory_store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Baca pengaturan stok cabang" ON public.inventory_store_settings;
DROP POLICY IF EXISTS "Admin tambah pengaturan stok" ON public.inventory_store_settings;
DROP POLICY IF EXISTS "Admin ubah pengaturan stok" ON public.inventory_store_settings;

CREATE POLICY "Baca pengaturan stok cabang" ON public.inventory_store_settings
  FOR SELECT TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin' OR store_id = (SELECT public.get_my_store_id()));
CREATE POLICY "Admin tambah pengaturan stok" ON public.inventory_store_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  );
CREATE POLICY "Admin ubah pengaturan stok" ON public.inventory_store_settings
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  )
  WITH CHECK (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  );

GRANT SELECT, INSERT, UPDATE ON public.inventory_store_settings TO authenticated;

-- 2. Helper ---------------------------------------------------------------------
-- Pengaturan efektif cabang (nilai bawaan bila belum pernah diatur).
CREATE OR REPLACE FUNCTION public.get_inventory_settings(p_store_id uuid)
RETURNS TABLE (auto_deduct_enabled boolean, deduct_at text, stock_guard text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(s.auto_deduct_enabled, true),
         coalesce(s.deduct_at, 'dibuat'),
         coalesce(s.stock_guard, 'peringatan')
    FROM (SELECT 1) AS d
    LEFT JOIN public.inventory_store_settings s ON s.store_id = p_store_id;
$$;

-- Urutan status nota: Diproses (1) → Siap Diambil (2) → Selesai (3).
CREATE OR REPLACE FUNCTION public.inventory_status_rank(p_status text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_status WHEN 'Siap Diambil' THEN 2 WHEN 'Selesai' THEN 3 ELSE 1 END;
$$;

CREATE OR REPLACE FUNCTION public.inventory_deduct_rank(p_deduct_at text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_deduct_at WHEN 'siap_diambil' THEN 2 WHEN 'selesai' THEN 3 ELSE 1 END;
$$;

-- Pemakaian bahan untuk sekumpulan baris nota (satu baris per aturan yang terpakai).
CREATE OR REPLACE FUNCTION public.compute_inventory_usage(p_store_id uuid, p_items jsonb)
RETURNS TABLE (recipe_id uuid, inventory_item_id uuid, usage numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lines AS (
    SELECT nullif(li->>'serviceId', '') AS service_id,
           CASE WHEN (li->>'quantity') ~ '^-?[0-9]+(\.[0-9]+)?$'
                THEN (li->>'quantity')::numeric ELSE 0 END AS qty
      FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(p_items) = 'array' THEN p_items ELSE '[]'::jsonb END
           ) li
  ), per_rule AS (
    SELECT rc.id AS recipe_id,
           rc.inventory_item_id,
           CASE rc.basis
             WHEN 'per_unit' THEN rc.amount * coalesce(sum(l.qty), 0)
             ELSE CASE WHEN count(l.*) > 0 THEN rc.amount ELSE 0 END
           END AS usage
      FROM public.inventory_recipes rc
      JOIN public.inventory_items ii ON ii.id = rc.inventory_item_id AND ii."storeId" = p_store_id
      LEFT JOIN lines l ON rc.service_id IS NULL OR l.service_id = rc.service_id::text
     WHERE rc.store_id = p_store_id AND rc.is_active
     GROUP BY rc.id, rc.inventory_item_id, rc.basis, rc.amount
  )
  SELECT recipe_id, inventory_item_id, usage FROM per_rule WHERE usage > 0;
$$;

-- Bahan yang stoknya tidak cukup untuk baris nota tersebut.
CREATE OR REPLACE FUNCTION public.inventory_shortages(p_store_id uuid, p_items jsonb)
RETURNS TABLE (inventory_item_id uuid, item_name text, unit text, needed numeric, available numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ii.id, ii.name, ii.unit, u.needed, ii.stock
    FROM (
      SELECT cu.inventory_item_id, sum(cu.usage) AS needed
        FROM public.compute_inventory_usage(p_store_id, p_items) cu
       GROUP BY cu.inventory_item_id
    ) u
    JOIN public.inventory_items ii ON ii.id = u.inventory_item_id
   WHERE ii.stock < u.needed
   ORDER BY ii.name;
$$;

-- 3. RPC cek stok sebelum nota disimpan ------------------------------------------
CREATE OR REPLACE FUNCTION public.check_transaction_stock(p_store_id uuid, p_items jsonb)
RETURNS TABLE (inventory_item_id uuid, item_name text, unit text, needed numeric, available numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.get_my_role() = 'Super Admin'
    OR (public.get_my_role() IS NOT NULL AND p_store_id = public.get_my_store_id())
  ) THEN
    RAISE EXCEPTION 'Anda tidak punya akses ke cabang ini' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.inventory_shortages(p_store_id, p_items);
END;
$$;

-- 4. Potong stok dari nota (menghormati stock_guard) -------------------------------
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_transaction(
  p_transaction_id uuid,
  p_store_id uuid,
  p_items jsonb,
  p_invoice text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_guard text;
  v_short text;
BEGIN
  IF p_store_id IS NULL OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN;
  END IF;

  SELECT s.stock_guard INTO v_guard FROM public.get_inventory_settings(p_store_id) s;

  IF v_guard = 'tahan' THEN
    -- Kunci item agar dua nota bersamaan tidak sama-sama lolos lalu membuat stok minus.
    PERFORM 1
       FROM public.inventory_items ii
      WHERE ii.id IN (SELECT cu.inventory_item_id FROM public.compute_inventory_usage(p_store_id, p_items) cu)
      ORDER BY ii.id
        FOR UPDATE;

    SELECT string_agg(
             format('%s (butuh %s %s, sisa %s)',
                    sh.item_name, trim_scale(round(sh.needed, 3)), sh.unit, trim_scale(round(sh.available, 3))),
             ', ' ORDER BY sh.item_name)
      INTO v_short
      FROM public.inventory_shortages(p_store_id, p_items) sh;

    IF v_short IS NOT NULL THEN
      RAISE EXCEPTION 'Stok bahan tidak cukup: %', v_short
        USING ERRCODE = 'SK001',
              HINT = 'Tambah stok bahan dulu, atau ubah pengaturan "Bila stok kurang" di Inventaris → Potong Otomatis.';
    END IF;
  END IF;

  FOR r IN SELECT * FROM public.compute_inventory_usage(p_store_id, p_items) LOOP
    PERFORM public.apply_inventory_delta(
      r.inventory_item_id, -r.usage, 'transaksi', p_transaction_id, r.recipe_id,
      'Pemakaian nota ' || coalesce(p_invoice, '')
    );
  END LOOP;
END;
$$;

-- 5. Trigger nota -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_transaction_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg record;
  v_threshold integer;
  v_old_rank integer;
  v_new_rank integer;
  v_items_changed boolean;
  v_deducted boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    BEGIN
      PERFORM public.revert_inventory_for_transaction(OLD.id, 'Nota ' || coalesce(OLD."invoiceCode", '') || ' dihapus');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Pengembalian stok gagal (DELETE): %', SQLERRM;
    END;
    RETURN OLD;
  END IF;

  SELECT * INTO v_cfg FROM public.get_inventory_settings(NEW."storeId");
  v_threshold := public.inventory_deduct_rank(v_cfg.deduct_at);
  v_new_rank := public.inventory_status_rank(NEW."orderStatus");

  -- Kegagalan potong stok tidak boleh menggagalkan nota, kecuali mode "tahan" (SK001).
  BEGIN
    IF TG_OP = 'INSERT' THEN
      IF v_cfg.auto_deduct_enabled AND v_new_rank >= v_threshold THEN
        PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
      END IF;
    ELSE
      v_old_rank := public.inventory_status_rank(OLD."orderStatus");
      v_items_changed := NEW.items IS DISTINCT FROM OLD.items OR NEW."storeId" IS DISTINCT FROM OLD."storeId";
      v_deducted := EXISTS (
        SELECT 1
          FROM public.inventory_movements m
         WHERE m.transaction_id = OLD.id
           AND m.kind IN ('transaksi', 'koreksi_transaksi')
         GROUP BY m.inventory_item_id
        HAVING sum(m.quantity) <> 0
      );

      IF NOT v_cfg.auto_deduct_enabled THEN
        NULL; -- Saklar mati: stok tidak disentuh.
      ELSIF v_deducted THEN
        IF v_new_rank < v_old_rank AND v_new_rank < v_threshold THEN
          -- Status nota dimundurkan ke sebelum titik potong.
          PERFORM public.revert_inventory_for_transaction(
            OLD.id, 'Status nota ' || coalesce(OLD."invoiceCode", '') || ' dikembalikan ke ' || coalesce(NEW."orderStatus", '-'));
        ELSIF v_items_changed THEN
          PERFORM public.revert_inventory_for_transaction(OLD.id, 'Item nota ' || coalesce(OLD."invoiceCode", '') || ' diubah');
          PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
        END IF;
      ELSIF v_new_rank >= v_threshold AND (v_old_rank < v_threshold OR v_items_changed) THEN
        -- Nota baru mencapai titik potong (atau itemnya diubah setelah melewatinya).
        PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
      END IF;
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'SK001' THEN
      RAISE;
    WHEN OTHERS THEN
      RAISE WARNING 'Potong stok otomatis gagal (%): %', TG_OP, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_transaction_inventory_update ON public.transactions;
CREATE TRIGGER zz_transaction_inventory_update
  AFTER UPDATE OF items, "storeId", "orderStatus" ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_inventory();

-- 6. Hak akses ------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.inventory_store_settings_touch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_inventory_settings(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_inventory_usage(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inventory_shortages(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_inventory_for_transaction(uuid, uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_transaction_inventory() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_transaction_stock(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_transaction_stock(uuid, jsonb) TO authenticated;

-- ============================================
-- END OF SETUP
-- ============================================

-- ...existing code...
-- === 1. MEMBUAT TABEL ===
-- Skema tabel inti Anda sudah sangat baik.
-- Perubahan kecil: Menambahkan ON DELETE SET NULL untuk stabilitas data.

CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  "isActive" boolean DEFAULT true,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

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
  price integer NOT NULL,
  unit text NOT NULL,
  "durationDays" integer NOT NULL,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

-- User credentials table for local auth (if needed)
CREATE TABLE IF NOT EXISTS public.user_credentials (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

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
  "customerId" uuid REFERENCES customers(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  discount numeric NOT NULL,
  tax numeric NOT NULL,
  total numeric NOT NULL,
  "paymentStatus" text NOT NULL,
  "orderStatus" text NOT NULL,
  "createdAt" timestamp WITH TIME ZONE DEFAULT NOW(),
  "estimatedCompletionDate" date,
  "amountPaid" numeric NOT NULL,
  change numeric NOT NULL,
  "paymentMethod" text,
  "createdByUserId" uuid REFERENCES profiles(id) ON DELETE SET NULL, -- DITAMBAHKAN: ON DELETE SET NULL
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL,
  notes text
);

CREATE TABLE public.audit_logs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  timestamp timestamp WITH TIME ZONE DEFAULT NOW(),
  "user" text,
  action text,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE public.settings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "receiptMessage" text,
  "taxRate" numeric,
  "discountRate" numeric
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
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;


-- === 3. HELPER FUNCTIONS UNTUK RLS ===
-- Menambahkan fungsi ini membuat RLS lebih bersih dan lebih cepat

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER -- DIPERLUKAN: Menjalankan fungsi sebagai pembuat (bukan pemanggil) untuk bypass RLS
SET search_path = public -- DIPERLUKAN: Mencegah pembajakan search path
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

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
DROP POLICY IF EXISTS "Users can see their own profile" ON public.profiles;
CREATE POLICY "Users can see their own profile (if active)" ON public.profiles
  FOR SELECT USING (id = auth.uid() AND "isActive" = true);
CREATE POLICY "Admins can see profiles in their store" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'Admin' AND store_id = public.get_my_store_id());
CREATE POLICY "Super Admins can see all profiles" ON public.profiles
  FOR SELECT USING (public.get_my_role() = 'Super Admin');
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can manage profiles in their store" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'Admin' AND store_id = public.get_my_store_id())
  WITH CHECK (public.get_my_role() = 'Admin' AND store_id = public.get_my_store_id());
CREATE POLICY "Super Admins can manage all profiles" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'Super Admin');

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
CREATE POLICY "Allow UPDATE for Admins" ON public.transactions
  FOR UPDATE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
CREATE POLICY "Allow DELETE for Admins" ON public.transactions
  FOR DELETE USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));

-- --- Tabel: audit_logs ---
CREATE POLICY "Allow SELECT for Admins" ON public.audit_logs
  FOR SELECT USING (public.get_my_role() = 'Super Admin' OR (public.get_my_role() = 'Admin' AND "storeId" = public.get_my_store_id()));
DROP POLICY IF EXISTS "Allow INSERT for all users" ON public.audit_logs;
CREATE POLICY "Allow INSERT for all logged-in users" ON public.audit_logs
  FOR INSERT
    TO public
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- --- Tabel: settings ---
CREATE POLICY "Allow all read access" ON public.settings
  FOR SELECT USING (true);
CREATE POLICY "Allow ALL for Super Admin only" ON public.settings
  FOR ALL USING (public.get_my_role() = 'Super Admin')
  WITH CHECK (public.get_my_role() = 'Super Admin');


-- === 5. DATA CONTOH (SAMPLE DATA) ===

-- user dengan id ini ada di auth.users
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('11c86333-295c-4bd9-9302-a69fda4811c0', 'Super Admin', 'Super Admin', NULL);

-- cabang: Kota Banjar
-- UUID: 9b7e1c2a-1234-4bcd-8e9f-abcdef123456
INSERT INTO public.stores (id, name, address, "isActive")
VALUES ('9b7e1c2a-1234-4bcd-8e9f-abcdef123456', 'Cabang Kota Banjar', 'Kota Banjar', true);

-- admin: admin_banjar (cabang Kota Banjar)
-- nama: yopi, password: 12345678 (diasumsikan dibuat di Supabase Auth)
-- role: Admin
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('e0efe954-3fcc-4688-a78d-45640228df47', 'YOPI', 'Admin', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');

-- kasir: ani (cabang Kota Banjar)
-- nama: ani, password: 12345678 (diasumsikan dibuat di Supabase Auth)
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('2c093716-8e1e-4237-92a2-04cd5ef2658b', 'ani', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');

-- kasir: didi (cabang Kota Banjar)
-- nama: didi, password: 12345678 (diasumsikan dibuat di Supabase Auth)
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('8cbdd6f3-ee72-4500-b2c8-b6401ed6c053', 'didi', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');

-- kasir: lilis (cabang Kota Banjar)
-- nama: lilis, password: 12345678 (diasumsikan dibuat di Supabase Auth)
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('7b13d493-23ea-49a0-99cf-133ed7ecf05e', 'lilis', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');

-- === 6. FUNCTIONS (Stubs) ===
-- (Sama seperti skrip Anda)


-- (Audit log trigger removed; handled by frontend or implement if needed)


-- === 7. PENGATURAN AWAL (Initial Settings) ===

INSERT INTO public.settings ("receiptMessage", "taxRate", "discountRate") VALUES ('Terima kasih telah laundry di tempat kami!', 0, 0);
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
-- RLS Policy dasar untuk user_credentials
CREATE POLICY "Allow owner to SELECT/UPDATE/DELETE their credentials" ON public.user_credentials
  FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "Allow INSERT for authenticated users" ON public.user_credentials
  FOR INSERT WITH CHECK (profile_id = auth.uid());

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
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins can manage profiles in their store" ON public.profiles
  FOR ALL USING (public.get_my_role() = 'Admin' AND store_id = public.get_my_store_id())
  WITH CHECK (public.get_my_role() = 'Admin' AND store_id = public.get_my_store_id());
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
-- Allow Admins and Kasirs to update only progress-related fields (payment/order progress)
-- while preventing changes to immutable/sensitive fields (total, items, customerId, storeId, createdByUserId).
-- Implementation: USING applies to the existing row (so it ensures the actor is in the same store),
-- and WITH CHECK compares new values against the current row (via subselects) to ensure immutable
-- columns are unchanged. Super Admin bypasses these restrictions.
DROP POLICY IF EXISTS "Allow UPDATE for Admins" ON public.transactions;
CREATE POLICY "Allow UPDATE for Admins and Kasirs (progress only)" ON public.transactions
  FOR UPDATE
  USING (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin','Kasir')
      AND "storeId" = public.get_my_store_id()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'Super Admin'
    OR (
      public.get_my_role() IN ('Admin','Kasir')
      AND "storeId" = public.get_my_store_id()
      -- Immutable/sensitive columns must remain equal to the current row
      AND total = (SELECT total FROM public.transactions t WHERE t.id = transactions.id)
      AND items = (SELECT items FROM public.transactions t WHERE t.id = transactions.id)
      AND "customerId" = (SELECT "customerId" FROM public.transactions t WHERE t.id = transactions.id)
      AND "createdByUserId" = (SELECT "createdByUserId" FROM public.transactions t WHERE t.id = transactions.id)
      AND "storeId" = (SELECT "storeId" FROM public.transactions t WHERE t.id = transactions.id)
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
CREATE POLICY "Allow all read access" ON public.settings
  FOR SELECT USING (true);
CREATE POLICY "Allow ALL for Admins" ON public.settings
  FOR ALL USING (public.get_my_role() IN ('Super Admin', 'Admin'))
  WITH CHECK (public.get_my_role() IN ('Super Admin', 'Admin'));


-- === 5. DATA CONTOH (SAMPLE DATA) ===

-- user dengan id ini ada di auth.users
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('11c86333-295c-4bd9-9302-a69fda4811c0', 'Super Admin', 'Super Admin', NULL);

-- cabang: Kota Banjar
-- UUID: 9b7e1c2a-1234-4bcd-8e9f-abcdef123456
INSERT INTO public.stores (id, name, address, "isActive")
VALUES ('9b7e1c2a-1234-4bcd-8e9f-abcdef123456', 'Cabang Kota Banjar', 'Kota Banjar', true);

-- admin: admin_banjar (cabang Kota Banjar)
-- nama: emaklaundry, 
-- role: Admin
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('0bbe08f0-2cbc-40d9-b2ec-5a2d3ba99c0e', 'emaklaundry', 'Admin', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');

-- kasir: yopi (cabang Kota Banjar)
-- nama: yopi, password: 12345678 (diasumsikan dibuat di Supabase Auth)
INSERT INTO public.profiles (id, name, role, store_id)
VALUES ('e0efe954-3fcc-4688-a78d-45640228df47', 'YOPI', 'Kasir', '9b7e1c2a-1234-4bcd-8e9f-abcdef123456');

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



-- === RPC: get_laundry_status ===
-- Return a safe projection of a transaction for public/customer-facing views
CREATE OR REPLACE FUNCTION public.get_laundry_status(
  transaction_id_input uuid
)
RETURNS TABLE (
  id text,
  "customerName" text,
  "createdAt" timestamp with time zone,
  "estimatedCompletionDate" date,
  "orderStatus" text,
  "paymentStatus" text,
  total numeric,
  "amountPaid" numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    t.id::text,
    c.name AS "customerName",
    t."createdAt",
    t."estimatedCompletionDate",
    t."orderStatus",
    t."paymentStatus",
    t.total,
    t."amountPaid"
  FROM
    public.transactions AS t
  JOIN
    public.customers AS c ON t."customerId" = c.id
  WHERE
    t.id = transaction_id_input;
$$;

-- Note: SECURITY DEFINER allows this function to run with the function owner's privileges
-- so it can read rows even when restrictive RLS policies exist. Keep the function
-- body minimal and review ownership/permissions after deployment.

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
  tx_payment_status text; -- DITAMBAHKAN: Variabel untuk status bayar saat ini
BEGIN
  -- Load caller profile
  SELECT role, store_id INTO caller_role, caller_store FROM public.profiles WHERE id = caller;
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Ensure transaction exists and get its store dan payment status
  SELECT "storeId", "paymentStatus" INTO tx_store, tx_payment_status FROM public.transactions WHERE id = transaction_id_input;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'transaction not found';
  END IF;

  -- Permission check: Super Admin bypasses store check
  IF caller_role <> 'Super Admin' AND tx_store IS DISTINCT FROM caller_store THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- DITAMBAHKAN: Pengecekan Logika Bisnis
  -- Pesanan tidak boleh 'Selesai' jika status bayar (baik yang baru diinput atau yang sudah ada) BUKAN 'Lunas'.
  IF p_order_status = 'Selesai' AND COALESCE(p_payment_status, tx_payment_status) <> 'Lunas' THEN
    RAISE EXCEPTION 'Pesanan tidak dapat diselesaikan karena belum lunas.';
  END IF;
  -- AKHIR TAMBAHAN

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


-- === 7. PENGATURAN AWAL (Initial Settings) ===

INSERT INTO public.settings ("receiptMessage", "taxRate", "discountRate") VALUES ('Terima kasih telah laundry di tempat kami!', 0, 0);
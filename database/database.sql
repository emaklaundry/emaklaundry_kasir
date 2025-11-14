
-- === RPC: complete_scheduled_maintenance ===
-- Tandai perawatan terjadwal selesai dan update log asset secara atomik
-- (Function moved to end of file to ensure all tables exist)
-- === RPC: bulk_update_order_status ===
-- Update status banyak transaksi sekaligus secara atomik
CREATE OR REPLACE FUNCTION public.bulk_update_order_status(
  p_transaction_ids uuid[],
  p_new_status public.order_status,
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Update semua transaksi dalam satu transaksi database
  UPDATE public.transactions
  SET "orderStatus" = p_new_status,
      "updatedAt" = now(),
      "updatedByUserId" = p_user_id
  WHERE id = ANY(p_transaction_ids);
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- === ENUM DEFINITIONS (PASTIKAN INI DI PALING ATAS) ===
-- DROP TYPE IF EXISTS public.order_status; -- Dihapus/disable agar tidak error jika ada fungsi yang tergantung
-- DROP TYPE IF EXISTS public.payment_method; -- Dihapus/disable agar tidak error jika ada fungsi yang tergantung
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'service_category') THEN
    CREATE TYPE public.service_category AS ENUM ('Kiloan','Satuan','Sepatu','Karpet');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('Super Admin','Admin','Kasir');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('Lunas','Belum Lunas','Bayar Sebagian');
  END IF;
END$$;

DO $$
BEGIN
  -- DROP TYPE IF EXISTS public.order_status; -- Uncomment jika ingin drop lama (hati-hati data!)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('Diproses','Siap Diambil','Selesai');
  END IF;
END$$;

DO $$
BEGIN
  -- DROP TYPE IF EXISTS public.payment_method; -- Uncomment jika ingin drop lama (hati-hati data!)
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('Tunai','QRIS','Transfer Bank');
  END IF;
END$$;
-- === 1. MEMBUAT TABEL ===
-- Skema tabel inti Anda sudah sangat baik.
-- Perubahan kecil: Menambahkan ON DELETE SET NULL untuk stabilitas data.

CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  "isActive" boolean DEFAULT true,
  created_at timestamp WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role public.user_role NOT NULL, -- DIUBAH DARI TEXT
  store_id uuid REFERENCES stores(id) ON DELETE SET NULL, -- DITAMBAHKAN: ON DELETE SET NULL
  created_at timestamp WITH TIME ZONE DEFAULT NOW(),
  "isActive" boolean DEFAULT true,
  "canGiveDiscount" boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  address text,
  notes text,
  "defaultDiscount" integer DEFAULT 0,
  "createdAt" timestamp WITH TIME ZONE DEFAULT NOW(),
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.services (
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

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  stock integer NOT NULL,
  "lowStockThreshold" integer NOT NULL,
  unit text NOT NULL,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "serialNumber" text,
  "purchaseDate" date,
  "purchaseCost" numeric,
  status text NOT NULL,
  "maintenanceHistory" jsonb,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.scheduled_maintenances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "assetId" uuid REFERENCES assets(id) ON DELETE CASCADE,
  description text NOT NULL,
  "frequencyValue" integer NOT NULL,
  "frequencyUnit" text NOT NULL,
  "nextDueDate" date NOT NULL,
  "lastCompletedDate" date
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid REFERENCES customers(id) ON DELETE SET NULL,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  discount numeric NOT NULL,
  tax numeric NOT NULL,
  total numeric NOT NULL,
"paymentStatus" public.payment_status NOT NULL, -- DIUBAH DARI TEXT
"orderStatus" public.order_status NOT NULL, -- DIUBAH DARI TEXT
  "createdAt" timestamp WITH TIME ZONE DEFAULT NOW(),
  "estimatedCompletionDate" date,
  "amountPaid" numeric NOT NULL,
  change numeric NOT NULL,
"paymentMethod" public.payment_method, -- DIUBAH DARI TEXT
"createdByUserId" uuid REFERENCES profiles(id) ON DELETE SET NULL, -- DITAMBAHKAN: ON DELETE SET NULL
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL,
  notes text
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  timestamp timestamp WITH TIME ZONE DEFAULT NOW(),
  "user" text,
  action text,
  "storeId" uuid REFERENCES stores(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.settings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "receiptMessage" text,
  "taxRate" numeric,
  "discountRate" numeric
);

-- Tambahkan index pada kolom penting
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions ("createdAt" DESC);

-- === RPC: create_new_transaction ===
-- Fungsi ini menerima input minimal dari klien, melakukan kalkulasi harga, diskon, pajak, dan total di server,
-- lalu menyisipkan transaksi ke tabel transactions secara aman.
CREATE OR REPLACE FUNCTION public.create_new_transaction(
  p_customer_id uuid,
  p_items jsonb,
  p_created_by_user_id uuid,
  p_store_id uuid,
  p_notes text DEFAULT NULL,
  p_payment_method public.payment_method DEFAULT NULL,
  p_is_paying_now boolean DEFAULT false,
  p_discount_type text DEFAULT 'percent',
  p_discount_value numeric DEFAULT 0
)
RETURNS SETOF public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subtotal numeric := 0;
  v_discount_amount numeric := 0;
  v_tax_amount numeric := 0;
  v_grand_total numeric := 0;
  v_items public.transactions.items%TYPE;
  v_payment_status public.payment_status := 'Belum Lunas';
  v_order_status public.order_status := 'Diproses';
  v_amount_paid numeric := 0;
  v_change numeric := 0;
  v_estimated_completion_date date := NULL;
  v_tax_rate numeric := 0;
  v_discount_rate numeric := 0;
  v_settings_row public.settings%ROWTYPE;
  v_item jsonb;
  v_service_row public.services%ROWTYPE;
  v_service_duration integer := 1;
  v_max_duration integer := 1;
BEGIN
  -- Ambil settings (tax & discount)
  SELECT * INTO v_settings_row FROM public.settings ORDER BY id DESC LIMIT 1;
  v_tax_rate := COALESCE(v_settings_row."taxRate", 0);
  v_discount_rate := COALESCE(v_settings_row."discountRate", 0);

  -- Validasi items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Items tidak boleh kosong';
  END IF;

  -- Hitung subtotal dan estimasi durasi
  v_items := '[]'::jsonb;
  v_max_duration := 1;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_service_row FROM public.services WHERE id = (v_item->>'serviceId')::uuid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Service id % tidak ditemukan', v_item->>'serviceId';
    END IF;
    v_service_duration := v_service_row."durationDays";
    IF v_service_duration > v_max_duration THEN
      v_max_duration := v_service_duration;
    END IF;
    v_subtotal := v_subtotal + (v_service_row.price * (v_item->>'quantity')::numeric);
    -- Update item dengan harga dan subtotal yang benar
    v_items := v_items || jsonb_build_array(
      jsonb_set(
        jsonb_set(
          v_item, '{price}', to_jsonb(v_service_row.price)
        ), '{subtotal}', to_jsonb(v_service_row.price * (v_item->>'quantity')::numeric)
      )
    );
  END LOOP;

  -- Hitung diskon
  IF p_discount_type = 'percent' THEN
    v_discount_amount := v_subtotal * (COALESCE(p_discount_value, v_discount_rate) / 100);
  ELSE
    v_discount_amount := LEAST(COALESCE(p_discount_value, 0), v_subtotal);
  END IF;

  -- Hitung pajak
  v_tax_amount := (v_subtotal - v_discount_amount) * (v_tax_rate / 100);

  -- Hitung grand total
  v_grand_total := v_subtotal - v_discount_amount + v_tax_amount;

  -- Status pembayaran
  IF p_is_paying_now AND v_grand_total > 0 THEN
    v_amount_paid := v_grand_total;
    v_payment_status := 'Lunas';
  ELSE
    v_amount_paid := 0;
    v_payment_status := 'Belum Lunas';
  END IF;
  v_change := 0;

  -- Estimasi tanggal selesai
  v_estimated_completion_date := (now() + (v_max_duration || ' days')::interval)::date;

  -- Insert transaksi
  INSERT INTO public.transactions (
    "customerId", items, subtotal, discount, tax, total, "paymentStatus", "orderStatus",
    "createdAt", "estimatedCompletionDate", "amountPaid", change, "paymentMethod",
    "createdByUserId", "storeId", notes
  ) VALUES (
    p_customer_id, v_items, v_subtotal, v_discount_amount, v_tax_amount, v_grand_total, v_payment_status, v_order_status,
    now(), v_estimated_completion_date, v_amount_paid, v_change, p_payment_method,
    p_created_by_user_id, p_store_id, p_notes
  ) RETURNING *;
END;
$$;

-- === 1. MEMBUAT TABEL ===
-- Skema tabel inti Anda sudah sangat baik.
-- Perubahan kecil: Menambahkan ON DELETE SET NULL untuk stabilitas data.


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


-- === 7. PENGATURAN AWAL (Initial Settings) ===

INSERT INTO public.settings ("receiptMessage", "taxRate", "discountRate") VALUES ('Terima kasih telah laundry di tempat kami!', 0, 0);


-- === RPC: complete_scheduled_maintenance ===
-- Tandai perawatan terjadwal selesai dan update log asset secara atomik
CREATE OR REPLACE FUNCTION public.complete_scheduled_maintenance(
  p_schedule_id uuid,
  p_asset_id uuid,
  p_log_description text,
  p_frequency_value integer,
  p_frequency_unit text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_asset_row public.assets%ROWTYPE;
  v_new_log jsonb;
  v_next_due_date date;
BEGIN
  -- Ambil data asset
  SELECT * INTO v_asset_row FROM public.assets WHERE id = p_asset_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset tidak ditemukan';
  END IF;
  -- Buat log baru
  v_new_log := jsonb_build_object(
    'id', 'LOG_' || gen_random_uuid(),
    'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'description', p_log_description,
    'cost', 0
  );
  -- Update maintenanceHistory asset
  UPDATE public.assets
  SET "maintenanceHistory" = COALESCE("maintenanceHistory", '[]'::jsonb) || v_new_log
  WHERE id = p_asset_id;
  -- Hitung nextDueDate
  v_next_due_date := (now() + (p_frequency_value || ' ' || p_frequency_unit)::interval)::date;
  -- Update scheduled_maintenances
  UPDATE public.scheduled_maintenances
  SET "lastCompletedDate" = now(), "nextDueDate" = v_next_due_date
  WHERE id = p_schedule_id;
END;
$$;
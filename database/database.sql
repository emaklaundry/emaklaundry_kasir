
-- 1. Membuat tabel 'stores' dengan ID sebagai 'uuid' DAN "isActive"
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
  role text NOT NULL, -- 'Super Admin', 'Admin Cabang', 'Kasir'
  store_id uuid REFERENCES stores(id),
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

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
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

-- 7. Membuat tabel 'scheduled_maintenances'
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
  "createdByUserId" uuid REFERENCES profiles(id),
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

-- 11. Membuat tabel 'settings'
CREATE TABLE public.settings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "receiptMessage" text,
  "taxRate" numeric,
  "discountRate" numeric
);

-- === MASUKKAN DATA AWAL (SEEDING) ===

-- Memasukkan Super Admin Profile
INSERT INTO public.profiles (id, name, role, store_id)
VALUES (
  '11c86333-295c-4bd9-9302-a69fda4811c0',
  'Super Admin',
  'Super Admin',
  NULL
);

-- Contoh seeding baru, gunakan uuid_generate_v4() atau gen_random_uuid() untuk id
INSERT INTO public.stores (id, name, address, "isActive")
VALUES
  (gen_random_uuid(), 'Jakarta Pusat', 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan', true),
  (gen_random_uuid(), 'Bandung', 'Jl. Asia Afrika No.1, Bandung', true);

-- Memasukkan Services (Layanan)
INSERT INTO public.services (name, category, price, unit, "durationDays", "storeId")
VALUES
  ('Cuci Kering Lipat', 'Kiloan', 8000, 'kg', 2, 'STORE1'),
  ('Cuci Setrika', 'Kiloan', 10000, 'kg', 3, 'STORE1'),
  ('Setrika Saja', 'Kiloan', 6000, 'kg', 1, 'STORE1'),
  ('Kemeja', 'Satuan', 15000, 'pcs', 2, 'STORE1'),
  ('Jas', 'Satuan', 50000, 'pcs', 4, 'STORE1'),
  ('Selimut', 'Satuan', 25000, 'pcs', 3, 'STORE1'),
  ('Cuci Sepatu', 'Sepatu', 40000, 'pasang', 5, 'STORE1'),
  ('Karpet Tipis', 'Karpet', 15000, 'm²', 5, 'STORE1');

INSERT INTO public.settings ("receiptMessage", "taxRate", "discountRate")
VALUES (
  'Terima kasih telah menggunakan jasa kami! Silakan simpan struk ini sebagai bukti transaksi.',
  0,
  0
);

-- Aktifkan RLS untuk tabel settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- === TERAKHIR: AKTIFKAN RLS ===
-- (Anda bisa menjalankan ini sekarang atau nanti, tapi ini penting untuk keamanan)

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

-- Policy: User bisa melihat profil mereka sendiri
CREATE POLICY "Users can see their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Policy: Super Admin bisa melihat SEMUA data
CREATE POLICY "Super Admins can see all data"
  ON public.stores FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');
  
CREATE POLICY "Super Admins can see all data"
  ON public.customers FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');
  
CREATE POLICY "Super Admins can see all data"
  ON public.services FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');
  
CREATE POLICY "Super Admins can see all data"
  ON public.inventory_items FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');
  
CREATE POLICY "Super Admins can see all data"
  ON public.assets FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');
  
CREATE POLICY "Super Admins can see all data"
  ON public.scheduled_maintenances FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');
  
CREATE POLICY "Super Admins can see all data"
  ON public.expenses FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');
  
CREATE POLICY "Super Admins can see all data"
  ON public.transactions FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');
  
CREATE POLICY "Super Admins can see all data"
  ON public.audit_logs FOR SELECT
  USING ((select role from profiles where id = auth.uid()) = 'Super Admin');

-- Policy: User non-admin hanya bisa melihat data cabang mereka sendiri
CREATE POLICY "Users can see their own store data"
  ON public.stores FOR SELECT
  USING (id = (select store_id from profiles where id = auth.uid()));

CREATE POLICY "Users can see their own store data"
  ON public.customers FOR SELECT
  USING ( "storeId" = (select store_id from profiles where id = auth.uid()) );

CREATE POLICY "Users can see their own store data"
  ON public.services FOR SELECT
  USING ( "storeId" = (select store_id from profiles where id = auth.uid()) );

CREATE POLICY "Users can see their own store data"
  ON public.inventory_items FOR SELECT
  USING ( "storeId" = (select store_id from profiles where id = auth.uid()) );

CREATE POLICY "Users can see their own store data"
  ON public.assets FOR SELECT
  USING ( "storeId" = (select store_id from profiles where id = auth.uid()) );

CREATE POLICY "Users can see their own store data"
  ON public.scheduled_maintenances FOR SELECT
  USING ( "assetId" IN (SELECT id FROM assets WHERE "storeId" = (select store_id from profiles where id = auth.uid())) );

CREATE POLICY "Users can see their own store data"
  ON public.expenses FOR SELECT
  USING ( "storeId" = (select store_id from profiles where id = auth.uid()) );

CREATE POLICY "Users can see their own store data"
  ON public.transactions FOR SELECT
  USING ( "storeId" = (select store_id from profiles where id = auth.uid()) );

CREATE POLICY "Users can see their own store data"
  ON public.audit_logs FOR SELECT
  USING ( "storeId" = (select store_id from profiles where id = auth.uid()) );

-- Policy: Pengguna yang terautentikasi bisa membaca Settings
CREATE POLICY "Allow authenticated read access"
  ON public.settings FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- Policy: SEMUA pengguna yang terautentikasi bisa INSERT data (RLS di atas akan memfilter SELECT)
-- Anda bisa memperketat ini jika diperlukan
CREATE POLICY "Allow insert for authenticated users"
  ON public.customers FOR INSERT
  WITH CHECK ( "storeId" = (select store_id from profiles where id = auth.uid()) OR (select role from profiles where id = auth.uid()) = 'Super Admin' );

CREATE POLICY "Allow insert for authenticated users"
  ON public.transactions FOR INSERT
  WITH CHECK ( "storeId" = (select store_id from profiles where id = auth.uid()) OR (select role from profiles where id = auth.uid()) = 'Super Admin' );

CREATE POLICY "Allow insert for authenticated users"
  ON public.expenses FOR INSERT
  WITH CHECK ( "storeId" = (select store_id from profiles where id = auth.uid()) OR (select role from profiles where id = auth.uid()) = 'Super Admin' );

-- (Tambahkan policy INSERT/UPDATE/DELETE lain sesuai kebutuhan)
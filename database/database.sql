-- Contoh: Aktifkan RLS pada tabel transactions
-- alter table transactions enable row level security;
--
-- Policy Super Admin bisa akses semua data:
-- create policy "Super Admins can see all transactions." on transactions for select using ((select role from profiles where id = auth.uid()) = 'Super Admin');
--
-- Policy user hanya bisa akses data cabang sendiri:
-- create policy "Users can see transactions from their own store." on transactions for select using (store_id = (select store_id from profiles where id = auth.uid()));

create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  created_at timestamp with time zone default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null, -- 'Super Admin', 'Admin Cabang', 'Kasir'
  store_id uuid references stores(id),
  created_at timestamp with time zone default now()
);

-- Tabel customers (Pelanggan)
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  store_id uuid references stores(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Tabel services (Layanan)
create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  price integer not null,
  store_id uuid references stores(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Tabel inventory_items (Inventaris)
create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity integer not null,
  unit text,
  store_id uuid references stores(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Tabel assets (Aset)
create table assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null,
  purchase_date date,
  store_id uuid references stores(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Tabel maintenance_logs (Riwayat Pemeliharaan)
create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  description text,
  date date,
  cost integer,
  created_at timestamp with time zone default now()
);

-- Tabel scheduled_maintenances (Jadwal Pemeliharaan)
create table scheduled_maintenances (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid references assets(id) on delete cascade,
  scheduled_date date,
  description text,
  created_at timestamp with time zone default now()
);

-- Tabel expenses (Pengeluaran)
create table expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount integer not null,
  date date,
  store_id uuid references stores(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Tabel transactions (Transaksi)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  store_id uuid references stores(id) on delete set null,
  total integer not null,
  payment_status text,
  order_status text,
  payment_method text,
  created_at timestamp with time zone default now()
);

-- Tabel transaction_items (Item Transaksi)
create table transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) on delete cascade,
  service_id uuid references services(id) on delete set null,
  quantity integer not null,
  price integer not null,
  notes text,
  created_at timestamp with time zone default now()
);

-- Aktifkan Row Level Security (RLS) pada semua tabel utama
alter table stores enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table services enable row level security;
alter table inventory_items enable row level security;
alter table assets enable row level security;
alter table maintenance_logs enable row level security;
alter table scheduled_maintenances enable row level security;
alter table expenses enable row level security;
alter table transactions enable row level security;
alter table transaction_items enable row level security;

-- Policy: hanya user yang sesuai dengan store_id di profiles yang bisa akses data cabangnya
create policy "Users can access their own store's data" on stores
  for select using (id = (select store_id from profiles where id = auth.uid()));

create policy "Users can access their own store's data" on customers
  for select using (store_id = (select store_id from profiles where id = auth.uid()));

create policy "Users can access their own store's data" on services
  for select using (store_id = (select store_id from profiles where id = auth.uid()));

create policy "Users can access their own store's data" on inventory_items
  for select using (store_id = (select store_id from profiles where id = auth.uid()));

create policy "Users can access their own store's data" on assets
  for select using (store_id = (select store_id from profiles where id = auth.uid()));

create policy "Users can access their own store's data" on expenses
  for select using (store_id = (select store_id from profiles where id = auth.uid()));

create policy "Users can access their own store's data" on transactions
  for select using (store_id = (select store_id from profiles where id = auth.uid()));

create policy "Users can access their own store's data" on transaction_items
  for select using (
    transaction_id in (
      select id from transactions where store_id = (select store_id from profiles where id = auth.uid())
    )
  );


-- Policy minimal untuk tabel maintenance_logs
create policy "Users can access maintenance logs of their store's assets" on maintenance_logs
  for select using (
    asset_id in (
      select id from assets where store_id = (select store_id from profiles where id = auth.uid())
    )
  );

-- Policy minimal untuk tabel scheduled_maintenances
create policy "Users can access scheduled maintenances of their store's assets" on scheduled_maintenances
  for select using (
    asset_id in (
      select id from assets where store_id = (select store_id from profiles where id = auth.uid())
    )
  );

-- Policy minimal untuk tabel profiles (user hanya bisa akses profil sendiri)
create policy "Users can access their own profile" on profiles
  for select using (id = auth.uid());
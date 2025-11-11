-- Tabel stores (Cabang)
create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
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
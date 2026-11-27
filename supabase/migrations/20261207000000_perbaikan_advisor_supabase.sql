-- ============================================================================
-- Perbaikan temuan Supabase Advisor (keamanan & performa). Hak akses TIDAK berubah.
-- ============================================================================
-- 1. Security Definer View (transactions_operator)
--    View sekarang security_invoker. Barisnya diambil dari fungsi SECURITY DEFINER
--    private.operator_transactions_rows() yang berisi filter yang sama persis
--    (hanya Operator, cabangnya sendiri, pesanan aktif + Selesai 7 hari, tanpa
--    nominal). Schema private tidak diekspos PostgREST, jadi fungsi tidak bisa
--    dipanggil langsung lewat /rpc. Kolom view tetap sama → client tidak berubah,
--    operator_update_transaction (returns setof transactions_operator) tetap jalan.
-- 2. Auth RLS Initialization Plan: auth.uid()/get_my_role() dibungkus (select ...).
-- 3. Multiple Permissive Policies: policy FOR ALL + FOR SELECT digabung menjadi
--    satu policy per aksi (OR dari kondisi lama = semantik identik).
-- Aman dijalankan ulang.
-- ============================================================================

-- ---------- 1. View transaksi Operator ----------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.operator_transactions_rows()
returns table (
  id uuid,
  "invoiceCode" text,
  "customerId" uuid,
  items jsonb,
  subtotal numeric,
  discount numeric,
  tax numeric,
  total numeric,
  "paymentStatus" text,
  "orderStatus" text,
  "createdAt" timestamptz,
  "updatedAt" timestamptz,
  "estimatedCompletionDate" timestamptz,
  "amountPaid" numeric,
  "change" numeric,
  "paymentMethod" text,
  "createdByUserId" uuid,
  "updatedByUserId" uuid,
  "storeId" uuid,
  notes text,
  "whatsappSentAt" timestamptz,
  "customerName" text
)
language sql
stable
security definer
set search_path = ''
as $$
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
    end,
    null::numeric,
    null::numeric,
    null::numeric,
    null::numeric,
    t."paymentStatus",
    t."orderStatus",
    t."createdAt",
    t."updatedAt",
    t."estimatedCompletionDate",
    null::numeric,
    null::numeric,
    null::text,
    t."createdByUserId",
    t."updatedByUserId",
    t."storeId",
    t.notes,
    t."whatsappSentAt",
    c.name
  from public.transactions t
  left join public.customers c on c.id = t."customerId"
  where (select public.get_my_role()) = 'Operator'
    and t."storeId" = (select public.get_my_store_id())
    and (t."orderStatus" is distinct from 'Selesai' or t."updatedAt" >= now() - interval '7 days');
$$;

revoke execute on function private.operator_transactions_rows() from public, anon;
grant execute on function private.operator_transactions_rows() to authenticated;

-- Kolom (nama, tipe, urutan) sama dengan view lama → boleh CREATE OR REPLACE.
create or replace view public.transactions_operator
with (security_invoker = true, security_barrier = true) as
select * from private.operator_transactions_rows();

revoke all on public.transactions_operator from public, anon, authenticated;
grant select on public.transactions_operator to authenticated;

-- ---------- 2 & 3. profiles ----------
drop policy if exists "Admins can manage profiles in their store" on public.profiles;
drop policy if exists "Super Admins can manage all profiles" on public.profiles;
drop policy if exists "Admins can see profiles in their store" on public.profiles;
drop policy if exists "Super Admins can see all profiles" on public.profiles;
drop policy if exists "Users can see their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
    or id = (select auth.uid())
  );

create policy "profiles_insert" on public.profiles
  for insert to authenticated
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) = 'Admin'
      and store_id = (select public.get_my_store_id())
      and role in ('Admin', 'Kasir', 'Operator')
    )
  );

-- Pengguna biasa hanya boleh mengubah profilnya sendiri tanpa mengganti peran/cabang.
create policy "profiles_update" on public.profiles
  for update to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
    or id = (select auth.uid())
  )
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or (
      (select public.get_my_role()) = 'Admin'
      and store_id = (select public.get_my_store_id())
      and role in ('Admin', 'Kasir', 'Operator')
    )
    or (
      id = (select auth.uid())
      and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
      and store_id is not distinct from (select p.store_id from public.profiles p where p.id = (select auth.uid()))
    )
  );

create policy "profiles_delete" on public.profiles
  for delete to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  );

-- ---------- 2. audit_logs ----------
drop policy if exists "Allow INSERT for all logged-in users" on public.audit_logs;
create policy "Allow INSERT for all logged-in users" on public.audit_logs
  for insert to authenticated
  with check ((select auth.uid()) is not null);

drop policy if exists "Allow SELECT for Admins" on public.audit_logs;
create policy "Allow SELECT for Admins" on public.audit_logs
  for select to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and "storeId" = (select public.get_my_store_id()))
  );

-- ---------- 3. customers (UPDATE) ----------
drop policy if exists "Allow UPDATE for Cashiers in own store" on public.customers;
drop policy if exists "Allow UPDATE/DELETE for Admins" on public.customers;
drop policy if exists "Allow UPDATE for store staff" on public.customers;
create policy "Allow UPDATE for store staff" on public.customers
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

-- ---------- 3. monthly_expense_templates ----------
drop policy if exists "Admins can manage monthly expense templates" on public.monthly_expense_templates;
drop policy if exists "Admins can insert monthly expense templates" on public.monthly_expense_templates;
drop policy if exists "Admins can update monthly expense templates" on public.monthly_expense_templates;
drop policy if exists "Admins can delete monthly expense templates" on public.monthly_expense_templates;
-- "Store users can read monthly expense templates" tetap (sudah mencakup Admin & Super Admin).

create policy "Admins can insert monthly expense templates" on public.monthly_expense_templates
  for insert to authenticated
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  );
create policy "Admins can update monthly expense templates" on public.monthly_expense_templates
  for update to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  )
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  );
create policy "Admins can delete monthly expense templates" on public.monthly_expense_templates
  for delete to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  );

-- ---------- 3. inventory_recipes ----------
drop policy if exists "Admin kelola aturan stok" on public.inventory_recipes;
drop policy if exists "Admin tambah aturan stok" on public.inventory_recipes;
drop policy if exists "Admin ubah aturan stok" on public.inventory_recipes;
drop policy if exists "Admin hapus aturan stok" on public.inventory_recipes;
-- "Baca aturan stok cabang" tetap (sudah mencakup Admin & Super Admin).

create policy "Admin tambah aturan stok" on public.inventory_recipes
  for insert to authenticated
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  );
create policy "Admin ubah aturan stok" on public.inventory_recipes
  for update to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  )
  with check (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  );
create policy "Admin hapus aturan stok" on public.inventory_recipes
  for delete to authenticated
  using (
    (select public.get_my_role()) = 'Super Admin'
    or ((select public.get_my_role()) = 'Admin' and store_id = (select public.get_my_store_id()))
  );

-- ---------- 3. settings ----------
drop policy if exists "Allow ALL for Admins" on public.settings;
drop policy if exists "Allow INSERT for Admins" on public.settings;
drop policy if exists "Allow UPDATE for Admins" on public.settings;
drop policy if exists "Allow DELETE for Admins" on public.settings;
-- "Allow read for signed-in users" tetap.

create policy "Allow INSERT for Admins" on public.settings
  for insert to authenticated
  with check ((select public.get_my_role()) in ('Super Admin', 'Admin'));
create policy "Allow UPDATE for Admins" on public.settings
  for update to authenticated
  using ((select public.get_my_role()) in ('Super Admin', 'Admin'))
  with check ((select public.get_my_role()) in ('Super Admin', 'Admin'));
create policy "Allow DELETE for Admins" on public.settings
  for delete to authenticated
  using ((select public.get_my_role()) in ('Super Admin', 'Admin'));

-- ---------- 3. stores ----------
drop policy if exists "Allow INSERT/UPDATE/DELETE for Super Admins only" on public.stores;
drop policy if exists "Allow INSERT for Super Admins" on public.stores;
drop policy if exists "Allow UPDATE for Super Admins" on public.stores;
drop policy if exists "Allow DELETE for Super Admins" on public.stores;
-- "Allow SELECT for store users" tetap (sudah mencakup Super Admin).

create policy "Allow INSERT for Super Admins" on public.stores
  for insert to authenticated
  with check ((select public.get_my_role()) = 'Super Admin');
create policy "Allow UPDATE for Super Admins" on public.stores
  for update to authenticated
  using ((select public.get_my_role()) = 'Super Admin')
  with check ((select public.get_my_role()) = 'Super Admin');
create policy "Allow DELETE for Super Admins" on public.stores
  for delete to authenticated
  using ((select public.get_my_role()) = 'Super Admin');

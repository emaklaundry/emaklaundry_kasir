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

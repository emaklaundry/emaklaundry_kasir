-- Perketat hak akses tabel transactions.
--
-- 1. Hapus policy RLS ganda ("Users can ... their store transactions") yang mengizinkan
--    SEMUA peran di cabang (termasuk Operator) membuat & mengubah nota. Karena policy
--    permissive digabung dengan OR, policy ketat Admin/Kasir jadi tidak berlaku.
--    Policy UPDATE disatukan: Admin, Kasir, dan Operator (Operator butuh UPDATE langsung
--    untuk menandai struk WhatsApp terkirim). Kolom yang boleh diubah tiap peran dijaga trigger.
-- 2. Aturan "Selesai harus Lunas" dipindah ke trigger, berlaku untuk semua jalur
--    (sebelumnya hanya dicek di RPC update_transaction_progress & tombol aplikasi).
-- 3. discount, subtotal, tax ikut dikunci seperti total (selain Super Admin).
-- 4. Operator hanya boleh mengubah progres (Diproses -> Siap Diambil), catatan, estimasi
--    selesai, dan penanda struk WA. Tidak boleh menandai Selesai (serah terima = Kasir).
-- 5. Cabut akses client ke update_transaction_status_safe: tidak dipakai aplikasi dan
--    parameter "caller"-nya bisa diisi bebas sehingga cek cabang bisa dilewati.

-- 1. Policy RLS ------------------------------------------------------------------
drop policy if exists "Users can view their store transactions" on public.transactions;
drop policy if exists "Users can insert their store transactions" on public.transactions;
drop policy if exists "Users can update their store transactions" on public.transactions;

drop policy if exists "Allow UPDATE for Admins and Kasirs (progress only)" on public.transactions;
drop policy if exists "Allow UPDATE for store staff" on public.transactions;
create policy "Allow UPDATE for store staff" on public.transactions
  for update
  using (
    public.get_my_role() = 'Super Admin'
    or (
      public.get_my_role() in ('Admin', 'Kasir', 'Operator')
      and "storeId" = public.get_my_store_id()
    )
  )
  with check (
    public.get_my_role() = 'Super Admin'
    or (
      public.get_my_role() in ('Admin', 'Kasir', 'Operator')
      and "storeId" = public.get_my_store_id()
    )
  );

-- 2. Selesai harus Lunas ------------------------------------------------------------
create or replace function public.enforce_order_payment_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new."orderStatus" = 'Selesai' and new."paymentStatus" is distinct from 'Lunas' then
    raise exception 'Pesanan tidak boleh berstatus Selesai jika pembayaran belum Lunas.'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE'
     and old."orderStatus" = 'Selesai'
     and new."paymentStatus" is distinct from 'Lunas' then
    raise exception 'Status pembayaran tidak boleh diubah menjadi belum lunas jika pesanan sudah selesai.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_order_payment_consistency() from public, anon, authenticated;

drop trigger if exists enforce_order_payment_consistency on public.transactions;
create trigger enforce_order_payment_consistency
  before insert or update of "orderStatus", "paymentStatus" on public.transactions
  for each row execute function public.enforce_order_payment_consistency();

-- 3. Kunci nominal nota -------------------------------------------------------------
create or replace function public.prevent_immutable_transaction_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_role text;
begin
  select role into current_user_role from public.profiles where id = auth.uid();
  if current_user_role is null then
    raise exception 'unauthorized';
  end if;
  if current_user_role <> 'Super Admin' then
    if new.total is distinct from old.total then
      raise exception 'You are not allowed to change total';
    end if;
    if new.subtotal is distinct from old.subtotal then
      raise exception 'You are not allowed to change subtotal';
    end if;
    if new.discount is distinct from old.discount then
      raise exception 'You are not allowed to change discount';
    end if;
    if new.tax is distinct from old.tax then
      raise exception 'You are not allowed to change tax';
    end if;
    if new.items is distinct from old.items then
      raise exception 'You are not allowed to change items';
    end if;
    if new."customerId" is distinct from old."customerId" then
      raise exception 'You are not allowed to change customerId';
    end if;
    if new."createdByUserId" is distinct from old."createdByUserId" then
      raise exception 'You are not allowed to change createdByUserId';
    end if;
    if new."storeId" is distinct from old."storeId" then
      raise exception 'You are not allowed to change storeId';
    end if;
  end if;
  return new;
end;
$$;

-- 4. Operator: hanya kolom progres -------------------------------------------------
create or replace function public.guard_operator_transactions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  -- Kolom yang boleh diubah Operator. supervisorApprovalId diatur ulang oleh
  -- enforce_supervisor_approval, updatedAt oleh trigger updated_at.
  v_allowed text[] := array[
    'orderStatus', 'notes', 'estimatedCompletionDate', 'whatsappSentAt',
    'updatedAt', 'updatedByUserId', 'supervisorApprovalId'
  ];
begin
  if public.get_my_role() is distinct from 'Operator' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Operator tidak dapat membuat transaksi'
      using errcode = '42501';
  end if;

  if new."paymentStatus" is distinct from old."paymentStatus"
     or new."paymentMethod" is distinct from old."paymentMethod"
     or new."amountPaid" is distinct from old."amountPaid"
     or new."change" is distinct from old."change"
     or new.total is distinct from old.total
     or new.discount is distinct from old.discount
  then
    raise exception 'Operator tidak dapat mengubah pembayaran'
      using errcode = '42501';
  end if;

  if (to_jsonb(new) - v_allowed) is distinct from (to_jsonb(old) - v_allowed) then
    raise exception 'Operator hanya dapat mengubah progres pesanan'
      using errcode = '42501';
  end if;

  if new."orderStatus" = 'Selesai' and old."orderStatus" is distinct from 'Selesai' then
    raise exception 'Operator tidak dapat menyelesaikan pesanan. Serah terima dilakukan Kasir.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.guard_operator_transactions() from public, anon, authenticated;

-- 5. RPC lama yang tidak dipakai ---------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'update_transaction_status_safe'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
  end loop;
end;
$$;

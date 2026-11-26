-- Log audit lengkap.
--
-- Sebelumnya log hanya ditulis manual dari frontend (addAuditLog), sehingga perubahan lewat
-- RPC, bulk update, absensi, payroll, dsb. tidak tercatat. Migrasi ini:
--   1. Menambah kolom terstruktur di audit_logs (kategori, tabel, operasi, data lama/baru, halaman).
--   2. Memasang trigger di SEMUA tabel bisnis: setiap INSERT/UPDATE/DELETE tercatat otomatis
--      siapa pun dan dari mana pun asalnya.
--   3. Menjadikan audit_logs append-only (tidak bisa diubah/dihapus dari aplikasi) dan
--      mengisi nama pengguna dari server agar tidak bisa dipalsukan.
--   4. Index untuk halaman log yang kini memakai paginasi di server.

-- 1. Kolom baru -------------------------------------------------------------
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

create index if not exists audit_logs_timestamp_idx on public.audit_logs ("timestamp" desc);
create index if not exists audit_logs_store_timestamp_idx on public.audit_logs ("storeId", "timestamp" desc);
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

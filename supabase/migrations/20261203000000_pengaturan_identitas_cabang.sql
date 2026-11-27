-- Pengaturan aplikasi & identitas cabang.
--
-- 1. stores.phone : nomor HP/WhatsApp cabang. Dicetak di header struk bersama
--                   nama usaha, nama cabang, dan alamat cabang.
-- 2. settings     : satu baris pengaturan berlaku untuk SEMUA cabang. Sebelumnya
--                   hanya cabang pemilik baris ("storeId") dan Super Admin yang bisa
--                   membacanya, sehingga user cabang lain tidak mendapat QRIS, pesan
--                   struk, footer WhatsApp, dan mode maintenance. Isinya bukan
--                   rahasia (kode QRIS statis sama dengan stiker di kasir), jadi
--                   cukup dibatasi ke pengguna yang sudah login.
--                   Hak ubah tidak berubah: Admin & Super Admin.

-- 1. Nomor HP cabang ------------------------------------------------------------------
alter table public.stores add column if not exists phone text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'stores_phone_length' and conrelid = 'public.stores'::regclass
  ) then
    alter table public.stores
      add constraint stores_phone_length check (phone is null or char_length(phone) <= 30);
  end if;
end;
$$;

comment on column public.stores.phone is
  'Nomor HP/WhatsApp cabang, dicetak di header struk.';

-- 2. Pengaturan terbaca semua cabang ---------------------------------------------------
drop policy if exists "Allow read access for own store" on public.settings;
drop policy if exists "Allow read for signed-in users" on public.settings;
create policy "Allow read for signed-in users" on public.settings
  for select to authenticated
  using (true);

drop policy if exists "Allow ALL for Admins" on public.settings;
create policy "Allow ALL for Admins" on public.settings
  for all to authenticated
  using ((select public.get_my_role()) in ('Super Admin', 'Admin'))
  with check ((select public.get_my_role()) in ('Super Admin', 'Admin'));

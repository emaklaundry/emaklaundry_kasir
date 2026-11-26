-- Daftar pelanggan + statistik transaksi, supaya halaman Pelanggan bisa
-- mengurutkan & memfilter (aktif/tidak aktif) SELURUH data di server,
-- bukan hanya baris di halaman yang sedang tampil.
--
-- security_invoker = on: RLS tabel customers, transactions, dan stores
-- tetap berlaku untuk pengguna yang memanggil view ini.
create or replace view public.customers_with_stats
with (security_invoker = on) as
select
  c.*,
  coalesce(s.transaction_count, 0)::integer as "transactionCount",
  coalesce(s.total_spent, 0)::numeric as "totalSpent",
  st.name as "storeName"
from public.customers c
left join lateral (
  select count(*) as transaction_count, sum(t.total) as total_spent
  from public.transactions t
  where t."customerId" = c.id
) s on true
left join public.stores st on st.id = c."storeId";

revoke all on public.customers_with_stats from anon;
grant select on public.customers_with_stats to authenticated;

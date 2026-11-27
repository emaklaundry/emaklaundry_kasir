-- Total Belanja pelanggan bersifat rahasia: hanya Admin & Super Admin yang
-- boleh melihatnya. Untuk Kasir dan Operator kolom "totalSpent" dikembalikan
-- NULL dari server, jadi angkanya tidak pernah sampai ke browser mereka
-- (bukan sekadar disembunyikan di tampilan).
--
-- Mengurutkan berdasarkan "totalSpent" juga tidak membocorkan urutan, karena
-- untuk peran tersebut semua nilainya NULL.
--
-- View dibuat ulang (drop + create) karena c.* bisa berubah urutan kolomnya
-- jika tabel customers pernah diubah, yang membuat CREATE OR REPLACE gagal.

drop view if exists public.customers_with_stats;

create view public.customers_with_stats
with (security_invoker = on) as
select
  c.*,
  coalesce(s.transaction_count, 0)::integer as "transactionCount",
  case
    when (select public.get_my_role()) in ('Admin', 'Super Admin')
      then coalesce(s.total_spent, 0)::numeric
    else null::numeric
  end as "totalSpent",
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

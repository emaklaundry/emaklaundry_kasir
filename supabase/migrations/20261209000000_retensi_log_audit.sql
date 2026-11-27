-- Retensi log audit
-- Log interaksi (klik, navigasi, sesi, error) dihapus otomatis setelah 90 hari
-- supaya database tetap di bawah batas 500 MB paket gratis Supabase.
-- Log 'data' (perubahan baris) dan 'aktivitas' (aksi bisnis) disimpan permanen.

create extension if not exists pg_cron;

create or replace function public.hapus_log_audit_lama(retensi_hari integer default 90)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  jumlah integer;
begin
  delete from public.audit_logs
  where category in ('klik', 'navigasi', 'sesi', 'error')
    and "timestamp" < now() - make_interval(days => retensi_hari);
  get diagnostics jumlah = row_count;
  return jumlah;
end;
$$;

-- Hanya dijalankan oleh pg_cron / postgres, tidak bisa dipanggil dari aplikasi.
revoke execute on function public.hapus_log_audit_lama(integer) from public, anon, authenticated;

-- Jalan tiap hari pukul 03:00 WIB (20:00 UTC).
select cron.unschedule('hapus-log-audit-lama')
where exists (select 1 from cron.job where jobname = 'hapus-log-audit-lama');

select cron.schedule(
  'hapus-log-audit-lama',
  '0 20 * * *',
  $$select public.hapus_log_audit_lama(90);$$
);

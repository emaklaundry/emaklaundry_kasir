-- Skrip uji khusus psql (BUKAN pgTAP, tidak dijalankan oleh `supabase test db`):
-- Rencana vs Realisasi (business_targets, target_cost_line, get_target_vs_actual).
-- Jalankan HANYA pada database percobaan sekali pakai (mis. container Docker), bukan produksi:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/scripts/test_rencana_vs_realisasi.sql
-- Seluruh data dibuat dalam transaksi dan di-ROLLBACK di akhir.
BEGIN;

-- ---------- Data uji ----------
-- (trigger auth.users bisa membuat profil otomatis, jadi profil di-upsert di bawah)
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000a3');

INSERT INTO public.stores (id, name) VALUES
  ('00000000-0000-0000-0000-000000000b01', 'Cabang Uji A'),
  ('00000000-0000-0000-0000-000000000b02', 'Cabang Uji B');

-- get_my_role()/get_my_store_id() hanya mengenali Admin yang tertaut ke data karyawan.
INSERT INTO public.employees (id, store_id, name) VALUES
  ('00000000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-000000000b01', 'Admin A'),
  ('00000000-0000-0000-0000-000000000e02', '00000000-0000-0000-0000-000000000b02', 'Admin B');

-- Profil bertaut karyawan hanya boleh diubah service_role (trigger guard_employee_auth_profile).
SET LOCAL ROLE service_role;
INSERT INTO public.profiles (id, name, role, store_id, employee_id) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'SA Uji',  'Super Admin', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000a2', 'Admin A', 'Admin', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e01'),
  ('00000000-0000-0000-0000-0000000000a3', 'Admin B', 'Admin', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e02')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role,
  store_id = EXCLUDED.store_id, employee_id = EXCLUDED.employee_id;
RESET ROLE;

INSERT INTO public.services (id, name, category, price, unit, "durationDays", "storeId") VALUES
  ('00000000-0000-0000-0000-000000000c01', 'Cuci Kiloan', 'Kiloan', 9000, 'kg',  2, '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-000000000c02', 'Karpet m2',   'Karpet', 20000, 'm2', 3, '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-000000000c03', 'Keset',       'Karpet', 15000, 'pcs', 3, '00000000-0000-0000-0000-000000000b01');

-- Nota 1: 5 kg @9000, 30 Nov 23:30 WIB (masih November)
INSERT INTO public.transactions
  (id, "invoiceCode", items, subtotal, discount, tax, total, "paymentStatus", "orderStatus",
   "createdAt", "amountPaid", change, "storeId")
VALUES ('00000000-0000-0000-0000-000000000d01', 'T-RVR-1',
  '[{"serviceId":"00000000-0000-0000-0000-000000000c01","serviceName":"Cuci Kiloan","unit":"kg","quantity":5,"subtotal":45000}]',
  45000, 0, 0, 45000, 'Lunas', 'Selesai', '2026-11-30 23:30:00+07', 45000, 0,
  '00000000-0000-0000-0000-000000000b01');

-- Nota 2: 2 m2 karpet + 1 Keset, 1 Des 00:10 WIB (sudah Desember)
INSERT INTO public.transactions
  (id, "invoiceCode", items, subtotal, discount, tax, total, "paymentStatus", "orderStatus",
   "createdAt", "amountPaid", change, "storeId")
VALUES ('00000000-0000-0000-0000-000000000d02', 'T-RVR-2',
  '[{"serviceId":"00000000-0000-0000-0000-000000000c02","serviceName":"Karpet m2","unit":"m2","quantity":2,"subtotal":40000},
    {"serviceId":"00000000-0000-0000-0000-000000000c03","serviceName":"Keset","unit":"pcs","quantity":1,"subtotal":15000}]',
  55000, 0, 0, 55000, 'Lunas', 'Selesai', '2026-12-01 00:10:00+07', 55000, 0,
  '00000000-0000-0000-0000-000000000b01');

-- Nota 3 (Okt, belum dibayar): satuan tidak baku. 'meter' dan ' M2 ' dihitung sebagai m2 karpet;
-- layanan Kiloan dengan satuan 'pcs' dihitung di omzet Kiloan tetapi bukan di kg.
INSERT INTO public.transactions
  (id, "invoiceCode", items, subtotal, discount, tax, total, "paymentStatus", "orderStatus",
   "createdAt", "amountPaid", change, "storeId")
VALUES ('00000000-0000-0000-0000-000000000d03', 'T-RVR-3',
  '[{"serviceId":"00000000-0000-0000-0000-000000000c02","serviceName":"Karpet m2","unit":"meter","quantity":3,"subtotal":60000},
    {"serviceId":"00000000-0000-0000-0000-000000000c02","serviceName":"Karpet m2","unit":" M2 ","quantity":1,"subtotal":20000},
    {"serviceId":"00000000-0000-0000-0000-000000000c01","serviceName":"Cuci Kiloan","unit":"pcs","quantity":4,"subtotal":36000}]',
  116000, 0, 0, 116000, 'Belum Lunas', 'Diproses', '2026-10-15 10:00:00+07', 0, 0,
  '00000000-0000-0000-0000-000000000b01');

-- Nota 4 (Sep): layanan sudah dihapus (id tidak ada di services); satuan tidak baku 'Meter' dan ' KG '
-- harus tetap dikelompokkan Karpet / Kiloan di get_financial_report.
INSERT INTO public.transactions
  (id, "invoiceCode", items, subtotal, discount, tax, total, "paymentStatus", "orderStatus",
   "createdAt", "amountPaid", change, "storeId")
VALUES ('00000000-0000-0000-0000-000000000d04', 'T-RVR-4',
  '[{"serviceId":"00000000-0000-0000-0000-000000000cff","serviceName":"Layanan Lama A","unit":"Meter","quantity":2,"subtotal":30000},
    {"serviceId":"00000000-0000-0000-0000-000000000cfe","serviceName":"Layanan Lama B","unit":" KG ","quantity":3,"subtotal":27000},
    {"serviceId":"00000000-0000-0000-0000-000000000cfd","serviceName":"Layanan Lama C","unit":"pcs","quantity":1,"subtotal":5000}]',
  62000, 0, 0, 62000, 'Belum Lunas', 'Diproses', '2026-09-10 10:00:00+07', 0, 0,
  '00000000-0000-0000-0000-000000000b01');

INSERT INTO public.expenses (date, description, category, amount, "storeId") VALUES
  ('2026-11-10', 'Deterjen',   'Perlengkapan',      100000,  '00000000-0000-0000-0000-000000000b01'),
  ('2026-11-11', 'Internet',   'Wi-Fi',              50000,  '00000000-0000-0000-0000-000000000b01'),
  ('2026-11-12', 'Mesin cuci', 'Aset / Inventaris', 1000000, '00000000-0000-0000-0000-000000000b01');

-- ---------- Tes fungsi (sesi superuser, klaim JWT = Super Admin) ----------
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
DO $$
DECLARE
  sid constant uuid := '00000000-0000-0000-0000-000000000b01';
  nov jsonb; des jsonb; fin jsonb; fut jsonb; okt jsonb;
BEGIN
  -- target_cost_line
  ASSERT public.target_cost_line('Perlengkapan') = 'hpp', 'Perlengkapan -> hpp';
  ASSERT public.target_cost_line('Wi-Fi') = 'other', 'Wi-Fi -> other';
  ASSERT public.target_cost_line(NULL) = 'other', 'NULL -> other';
  ASSERT public.target_cost_line('Pembelian Aset') = 'capex', 'Pembelian Aset -> capex';
  ASSERT public.target_cost_line('Gaji') = 'salary', 'Gaji';
  ASSERT public.target_cost_line('Air') = 'utilities', 'Air';
  ASSERT public.target_cost_line('Pemeliharaan Aset') = 'marketing', 'Pemeliharaan Aset';
  ASSERT public.target_cost_line('Perawatan Aset') = 'marketing', 'Perawatan Aset (Quick Maintenance) -> marketing';

  -- Satuan dinormalisasi lower(btrim()): 'meter' dan ' M2 ' = m2; Kiloan non-kg bukan kg
  okt := public.get_target_vs_actual(sid, '2026-10-01', '2026-10-31');
  ASSERT (okt #>> '{actual,volume,carpetM2}')::numeric = 4, 'Okt carpetM2 = 4 (meter + M2)';
  ASSERT (okt #>> '{actual,volume,kiloanKg}')::numeric = 0, 'Okt kiloanKg = 0 (satuan pcs bukan kg)';
  ASSERT (okt #>> '{actual,revenue,kiloan}')::numeric = 36000, 'Okt revenue.kiloan = 36000 (tetap dihitung)';
  ASSERT (okt #>> '{actual,revenue,carpet}')::numeric = 80000, 'Okt revenue.carpet = 80000';

  -- Laporan: layanan terhapus dikelompokkan dengan satuan yang dinormalisasi
  fin := public.get_financial_report(sid, '2026-09-01', '2026-09-30');
  ASSERT (SELECT (c ->> 'revenue')::numeric FROM jsonb_array_elements(fin -> 'categories') c
          WHERE c ->> 'category' = 'Karpet') = 30000, 'Laporan: Meter (layanan terhapus) -> Karpet';
  ASSERT (SELECT (c ->> 'revenue')::numeric FROM jsonb_array_elements(fin -> 'categories') c
          WHERE c ->> 'category' = 'Kiloan') = 27000, 'Laporan: " KG " (layanan terhapus) -> Kiloan';
  ASSERT (SELECT (c ->> 'revenue')::numeric FROM jsonb_array_elements(fin -> 'categories') c
          WHERE c ->> 'category' = 'Lainnya') = 5000, 'Laporan: pcs -> Lainnya';

  -- Volume & omzet: batas bulan mengikuti zona waktu
  nov := public.get_target_vs_actual(sid, '2026-11-01', '2026-11-30');
  ASSERT (nov #>> '{actual,volume,kiloanKg}')::numeric = 5, 'Nov kiloanKg = 5';
  ASSERT (nov #>> '{actual,volume,carpetM2}')::numeric = 0, 'Nov carpetM2 = 0';
  ASSERT (nov #>> '{actual,revenue,total}')::numeric = 45000, 'Nov revenue.total = 45000';
  ASSERT nov ->> 'month' = '2026-11-01' AND nov ->> 'asOf' = '2026-11-30', 'month/asOf';
  ASSERT jsonb_array_length(nov -> 'daily') = 30, 'daily Nov = 30 hari';
  ASSERT nov -> 'daily' -> 0 = '{"date":"2026-11-01","gross":0,"collected":0}'::jsonb, 'daily[0] nol';
  ASSERT nov -> 'daily' -> 29 = '{"date":"2026-11-30","gross":45000,"collected":45000}'::jsonb, 'daily[29] = nota 1';

  des := public.get_target_vs_actual(sid, '2026-12-01', '2026-12-31');
  ASSERT (des #>> '{actual,volume,carpetM2}')::numeric = 2, 'Des carpetM2 = 2 (Keset pcs tidak dihitung)';
  ASSERT (des #>> '{actual,revenue,carpet}')::numeric = 55000, 'Des revenue.carpet = 55000';

  -- Pengeluaran
  ASSERT (nov #>> '{actual,costs,hpp}')::numeric = 100000, 'costs.hpp';
  ASSERT (nov #>> '{actual,costs,other}')::numeric = 50000, 'costs.other';
  ASSERT (nov #>> '{actual,capex}')::numeric = 1000000, 'capex';
  fin := public.get_financial_report(sid, '2026-11-01', '2026-11-30');
  ASSERT (nov #>> '{actual,costs,total}')::numeric + (nov #>> '{actual,capex}')::numeric
         = (fin #>> '{summary,expenses}')::numeric, 'costs.total + capex = summary.expenses';
  ASSERT (nov #>> '{actual,collected}')::numeric = (fin #>> '{summary,collected}')::numeric,
         'collected = summary.collected';

  -- Bulan belum berjalan: semua nol
  fut := public.get_target_vs_actual(sid, '2026-11-01', '2026-10-15');
  ASSERT (fut #>> '{actual,revenue,total}')::numeric = 0 AND (fut #>> '{actual,collected}')::numeric = 0
     AND (fut #>> '{actual,capex}')::numeric = 0 AND (fut #>> '{actual,costs,total}')::numeric = 0
     AND (fut #>> '{actual,volume,kiloanKg}')::numeric = 0, 'as_of < month -> nol';
  ASSERT fut -> 'daily' = '[]'::jsonb, 'as_of < month -> daily kosong';

  -- Tanpa target: targets kosong
  ASSERT nov -> 'targets' = '[]'::jsonb, 'cabang tanpa target tidak muncul';

  -- Target default + khusus Desember
  PERFORM public.upsert_business_target(sid, NULL, '{"kiloan_kg_per_day": 30, "kiloan_price": 9000, "start_date": "2026-01-01"}');
  PERFORM public.upsert_business_target(sid, '2026-12-01', '{"kiloan_kg_per_day": 40}');
  -- upsert kedua pada baris sama harus meng-update, bukan menambah
  PERFORM public.upsert_business_target(sid, NULL, '{"cost_salary": 1000}');
  ASSERT (SELECT count(*) FROM public.business_targets WHERE store_id = sid) = 2, 'upsert idempoten per (store, period)';
  ASSERT (SELECT kiloan_kg_per_day FROM public.business_targets WHERE store_id = sid AND period IS NULL) = 30,
         'kunci yang tidak dikirim dipertahankan';
  ASSERT (SELECT cost_salary FROM public.business_targets WHERE store_id = sid AND period IS NULL) = 1000, 'cost_salary diupdate';

  nov := public.get_target_vs_actual(sid, '2026-11-01', '2026-11-30');
  des := public.get_target_vs_actual(sid, '2026-12-01', '2026-12-31');
  ASSERT (nov #>> '{targets,0,isDefault}')::boolean = true, 'Nov memakai default';
  ASSERT (des #>> '{targets,0,isDefault}')::boolean = false, 'Des memakai target khusus';
  ASSERT (des #>> '{targets,0,row,kiloan_kg_per_day}')::numeric = 40, 'Des row = target khusus';

  -- Sejak start_date (as_of 30 Nov): uang masuk 45000 - biaya non-capex 150000
  ASSERT nov #>> '{sinceStart,startDate}' = '2026-01-01', 'sinceStart.startDate';
  ASSERT (nov #>> '{sinceStart,operatingProfit}')::numeric = 45000 - 150000, 'sinceStart.operatingProfit';
  ASSERT (nov #>> '{sinceStart,capex}')::numeric = 1000000, 'sinceStart.capex';
  -- Desember memakai target khusus tanpa start_date -> start_date jatuh ke target default
  ASSERT des #>> '{sinceStart,startDate}' = '2026-01-01', 'sinceStart.startDate fallback ke default';
  ASSERT public.get_target_vs_actual(NULL, '2026-11-01', '2026-11-30') -> 'sinceStart' = 'null'::jsonb,
         'semua cabang -> sinceStart null';
END $$;

-- ---------- RLS: Admin cabang lain ----------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';

DO $$
DECLARE ok boolean := false; x jsonb;
BEGIN
  ASSERT public.get_my_role() = 'Admin', 'jwt claim terbaca sebagai Admin B';
  ASSERT (SELECT count(*) FROM public.business_targets
          WHERE store_id = '00000000-0000-0000-0000-000000000b01') = 0, 'Admin B tidak melihat target cabang A';
  BEGIN
    INSERT INTO public.business_targets (store_id, period) VALUES ('00000000-0000-0000-0000-000000000b02', '2026-11-01');
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  ASSERT ok, 'Admin tidak boleh INSERT business_targets';
  x := public.get_target_vs_actual('00000000-0000-0000-0000-000000000b01', '2026-11-01', '2026-11-30');
  ASSERT (x #>> '{actual,revenue,total}')::numeric = 0 AND (x #>> '{actual,collected}')::numeric = 0
     AND (x #>> '{actual,costs,total}')::numeric = 0 AND x -> 'targets' = '[]'::jsonb,
     'Admin B tidak melihat angka/target cabang A';
  ok := false;
  BEGIN
    PERFORM public.upsert_business_target('00000000-0000-0000-0000-000000000b02', NULL, '{"cost_rent": 1}');
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  ASSERT ok, 'Admin tidak boleh upsert_business_target';
END $$;

-- Admin cabang A melihat target cabangnya sendiri
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';
DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.business_targets) = 2, 'Admin A melihat 2 target cabangnya';
END $$;

-- Super Admin boleh menyimpan
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';
DO $$
DECLARE r public.business_targets;
BEGIN
  r := public.upsert_business_target('00000000-0000-0000-0000-000000000b02', '2026-11-15', '{"cost_rent": 5}');
  ASSERT r.period = '2026-11-01' AND r.cost_rent = 5 AND r.updated_by = '00000000-0000-0000-0000-0000000000a1',
         'Super Admin upsert; period dinormalisasi, updated_by terisi';
END $$;

RESET ROLE;
\echo 'rencana_vs_realisasi: SEMUA TES LULUS'
ROLLBACK;

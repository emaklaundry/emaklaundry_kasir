-- Skrip uji khusus psql (BUKAN pgTAP, tidak dijalankan oleh `supabase test db`):
-- Restok = Pengeluaran Bahan Baku + harga rata-rata (avg_cost / unit_cost) + penjaga pengeluaran.
-- psql-only, DB percobaan: jalankan HANYA pada database sekali pakai (mis. container Docker), bukan produksi:
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/scripts/test_restok_pengeluaran_hpp.sql
-- Seluruh data dibuat dalam transaksi dan di-ROLLBACK di akhir.
BEGIN;

-- ---------- Data uji ----------
-- a1 Super Admin, a2 Admin cabang A, a3 Admin cabang B, a4 Kasir cabang A
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000a2'),
  ('00000000-0000-0000-0000-0000000000a3'),
  ('00000000-0000-0000-0000-0000000000a4');

INSERT INTO public.stores (id, name) VALUES
  ('00000000-0000-0000-0000-000000000b01', 'Cabang Uji A'),
  ('00000000-0000-0000-0000-000000000b02', 'Cabang Uji B');

-- get_my_role()/get_my_store_id() hanya mengenali staf yang tertaut ke data karyawan.
INSERT INTO public.employees (id, store_id, name) VALUES
  ('00000000-0000-0000-0000-000000000e01', '00000000-0000-0000-0000-000000000b01', 'Admin A'),
  ('00000000-0000-0000-0000-000000000e02', '00000000-0000-0000-0000-000000000b02', 'Admin B'),
  ('00000000-0000-0000-0000-000000000e04', '00000000-0000-0000-0000-000000000b01', 'Kasir A');

-- Profil bertaut karyawan hanya boleh diubah service_role (trigger guard_employee_auth_profile).
SET LOCAL ROLE service_role;
INSERT INTO public.profiles (id, name, role, store_id, employee_id) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'SA Uji',  'Super Admin', NULL, NULL),
  ('00000000-0000-0000-0000-0000000000a2', 'Admin A', 'Admin', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e01'),
  ('00000000-0000-0000-0000-0000000000a3', 'Admin B', 'Admin', '00000000-0000-0000-0000-000000000b02', '00000000-0000-0000-0000-000000000e02'),
  ('00000000-0000-0000-0000-0000000000a4', 'Kasir A', 'Kasir', '00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000e04')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role,
  store_id = EXCLUDED.store_id, employee_id = EXCLUDED.employee_id;
RESET ROLE;

-- Item cabang A:
--   f01 Deterjen  stok 2, belum ada harga
--   f02 Pewangi   stok 2 @20000
--   f03 Plastik   stok -1 @10000 (stok minus)
--   f04 Softener  stok 10 @20000 (dipotong nota lewat resep)
--   f05 Hanger    stok 3 @15000 (stok masuk tanpa biaya)
--   f06 Pelembut  stok 4, belum ada harga (hak akses)
INSERT INTO public.inventory_items (id, name, stock, "lowStockThreshold", unit, "storeId") VALUES
  ('00000000-0000-0000-0000-000000000f01', 'Deterjen', 2, 0, 'liter', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-000000000f02', 'Pewangi',  2, 0, 'liter', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-000000000f03', 'Plastik', -1, 0, 'pak',   '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-000000000f04', 'Softener', 10, 0, 'liter', '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-000000000f05', 'Hanger',   3, 0, 'pcs',   '00000000-0000-0000-0000-000000000b01'),
  ('00000000-0000-0000-0000-000000000f06', 'Pelembut', 4, 0, 'liter', '00000000-0000-0000-0000-000000000b01');
UPDATE public.inventory_items SET avg_cost = 20000 WHERE id IN ('00000000-0000-0000-0000-000000000f02', '00000000-0000-0000-0000-000000000f04');
UPDATE public.inventory_items SET avg_cost = 10000 WHERE id = '00000000-0000-0000-0000-000000000f03';
UPDATE public.inventory_items SET avg_cost = 15000 WHERE id = '00000000-0000-0000-0000-000000000f05';

INSERT INTO public.services (id, name, category, price, unit, "durationDays", "storeId") VALUES
  ('00000000-0000-0000-0000-000000000c01', 'Cuci Kiloan', 'Kiloan', 9000, 'kg', 2, '00000000-0000-0000-0000-000000000b01');
INSERT INTO public.inventory_recipes (store_id, inventory_item_id, service_id, basis, amount) VALUES
  ('00000000-0000-0000-0000-000000000b01', '00000000-0000-0000-0000-000000000f04',
   '00000000-0000-0000-0000-000000000c01', 'per_unit', 0.5);

-- ---------- Admin cabang A (role authenticated) ----------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a2';

DO $$
DECLARE
  sid constant uuid := '00000000-0000-0000-0000-000000000b01';
  i1 constant uuid := '00000000-0000-0000-0000-000000000f01';
  i2 constant uuid := '00000000-0000-0000-0000-000000000f02';
  i3 constant uuid := '00000000-0000-0000-0000-000000000f03';
  i5 constant uuid := '00000000-0000-0000-0000-000000000f05';
  r jsonb; r2 jsonb; ok boolean; msg text;
  v_exp uuid; v_mov uuid; e record; m record; it record;
BEGIN
  ASSERT public.get_my_role() = 'Admin', 'jwt claim terbaca sebagai Admin A';
  ASSERT NOT EXISTS (SELECT 1 FROM public.inventory_store_settings WHERE store_id = sid AND costing_start IS NOT NULL),
         'costing_start belum terisi';

  -- 1. Stok 2 tanpa harga + beli 3 total 75000 → avg 25000
  r := public.record_stock_purchase(i1, 3, 75000, '2026-11-20', 'Beli di toko');
  ASSERT (r ->> 'avgCost')::numeric = 25000, format('i1 avgCost = 25000, dapat %s', r ->> 'avgCost');
  ASSERT (r ->> 'stock')::numeric = 5, 'i1 stok 5';
  v_exp := (r ->> 'expenseId')::uuid;
  v_mov := (r ->> 'movementId')::uuid;
  SELECT * INTO e FROM public.expenses WHERE id = v_exp;
  ASSERT e.category = 'Bahan Baku' AND e.amount = 75000 AND e.date = '2026-11-20'
     AND e."storeId" = sid AND e."inventoryMovementId" = v_mov, 'pengeluaran Bahan Baku 75000 bertaut';
  ASSERT e.description = 'Restok: Deterjen (3 liter)', format('deskripsi: %s', e.description);
  ASSERT (SELECT count(*) FROM public.expenses WHERE "inventoryMovementId" IN
           (SELECT id FROM public.inventory_movements WHERE inventory_item_id = i1)) = 1, 'tepat satu pengeluaran';
  SELECT * INTO m FROM public.inventory_movements WHERE id = v_mov;
  ASSERT m.kind = 'restok' AND m.quantity = 3 AND m.unit_cost = 25000 AND m.inventory_item_id = i1,
         'mutasi restok unit_cost 25000';
  ASSERT (SELECT avg_cost FROM public.inventory_items WHERE id = i1) = 25000, 'avg_cost item tersimpan';
  ASSERT (SELECT costing_start FROM public.inventory_store_settings WHERE store_id = sid)
         = (now() AT TIME ZONE 'Asia/Jakarta')::date, 'costing_start cabang terisi hari ini (WIB)';

  -- 2. Stok 2 @20000 + beli 3 total 75000 → avg 23000; restok unit_cost = harga beli 25000
  r := public.record_stock_purchase(i2, 3, 75000, '2026-11-21');
  ASSERT (r ->> 'avgCost')::numeric = 23000, format('i2 avgCost = 23000, dapat %s', r ->> 'avgCost');
  ASSERT (SELECT unit_cost FROM public.inventory_movements WHERE id = (r ->> 'movementId')::uuid) = 25000,
         'restok unit_cost = harga beli';

  -- 3. Stok -1 + beli 2 total 50000 → avg 25000 (stok minus dianggap 0)
  r := public.record_stock_purchase(i3, 2, 50000, '2026-11-21');
  ASSERT (r ->> 'avgCost')::numeric = 25000, format('i3 avgCost = 25000, dapat %s', r ->> 'avgCost');
  ASSERT (r ->> 'stock')::numeric = 1, 'i3 stok 1';

  -- 4. Tanpa pengeluaran: avg tetap, unit_cost = avg lama, total diabaikan
  r := public.record_stock_purchase(i5, 2, 999, '2026-11-21', 'Hadiah supplier', false);
  ASSERT r -> 'expenseId' = 'null'::jsonb, 'tanpa pengeluaran → expenseId null';
  ASSERT (r ->> 'avgCost')::numeric = 15000 AND (r ->> 'stock')::numeric = 5, 'avg tetap 15000, stok 5';
  ASSERT (SELECT unit_cost FROM public.inventory_movements WHERE id = (r ->> 'movementId')::uuid) = 15000,
         'unit_cost = avg lama';
  ASSERT NOT EXISTS (SELECT 1 FROM public.expenses WHERE "inventoryMovementId" = (r ->> 'movementId')::uuid),
         'tidak ada pengeluaran';

  -- 5. Validasi
  ok := false;
  BEGIN
    PERFORM public.record_stock_purchase(i1, 1, 0, '2026-11-21');
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%Total harga beli harus lebih dari 0%';
  END;
  ASSERT ok, 'total 0 dengan pengeluaran ditolak';
  ok := false;
  BEGIN
    PERFORM public.record_stock_purchase(i1, 0, 1000, '2026-11-21');
  EXCEPTION WHEN OTHERS THEN ok := true;
  END;
  ASSERT ok, 'jumlah 0 ditolak';

  -- 6. Penjaga: UPDATE/DELETE langsung pengeluaran tertaut ditolak
  ok := false;
  BEGIN
    UPDATE public.expenses SET amount = 1 WHERE id = v_exp;
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM; ok := SQLERRM LIKE '%terhubung ke restok%';
  END;
  ASSERT ok, 'UPDATE langsung ditolak';
  ASSERT msg = 'Pengeluaran ini terhubung ke restok Deterjen. Ubah lewat Inventaris atau tombol Ubah pembelian.',
         format('pesan penjaga: %s', msg);
  ok := false;
  BEGIN
    DELETE FROM public.expenses WHERE id = v_exp;
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%terhubung ke restok%';
  END;
  ASSERT ok, 'DELETE langsung ditolak';
  ASSERT (SELECT amount FROM public.expenses WHERE id = v_exp) = 75000, 'pengeluaran tidak berubah';

  -- 7. Batal pembelian: stok 5 @23000 batal 3/75000 → stok 2, avg 20000
  SELECT id INTO v_exp FROM public.expenses
   WHERE "inventoryMovementId" IN (SELECT id FROM public.inventory_movements WHERE inventory_item_id = i2);
  r := public.cancel_stock_purchase(v_exp);
  SELECT stock, avg_cost INTO it FROM public.inventory_items WHERE id = i2;
  ASSERT it.stock = 2 AND it.avg_cost = 20000, format('batal → stok 2 avg 20000, dapat %s @%s', it.stock, it.avg_cost);
  ASSERT (r ->> 'stock')::numeric = 2 AND (r ->> 'avgCost')::numeric = 20000, 'hasil cancel';
  ASSERT NOT EXISTS (SELECT 1 FROM public.expenses WHERE id = v_exp), 'pengeluaran dihapus';
  SELECT * INTO m FROM public.inventory_movements WHERE inventory_item_id = i2 AND kind = 'batal_beli';
  ASSERT m.quantity = -3 AND m.unit_cost = 25000, 'mutasi batal_beli −3 @25000';

  -- 8. Catat lagi lalu ubah total 75000 → 90000: satu pengeluaran 90000, avg (2×20000+90000)/5 = 26000
  r := public.record_stock_purchase(i2, 3, 75000, '2026-11-22');
  ASSERT (r ->> 'avgCost')::numeric = 23000, 'catat ulang avg 23000';
  r2 := public.update_stock_purchase((r ->> 'expenseId')::uuid, 3, 90000, '2026-11-23', 'Harga salah');
  ASSERT (r2 ->> 'avgCost')::numeric = 26000, format('update avg 26000, dapat %s', r2 ->> 'avgCost');
  ASSERT (r2 ->> 'stock')::numeric = 5, 'update stok 5';
  ASSERT NOT EXISTS (SELECT 1 FROM public.expenses WHERE id = (r ->> 'expenseId')::uuid), 'pengeluaran lama hilang';
  ASSERT (SELECT count(*) FROM public.expenses e2
            JOIN public.inventory_movements mm ON mm.id = e2."inventoryMovementId"
           WHERE mm.inventory_item_id = i2) = 1, 'tepat satu pengeluaran tertaut i2';
  SELECT * INTO e FROM public.expenses WHERE id = (r2 ->> 'expenseId')::uuid;
  ASSERT e.amount = 90000 AND e.date = '2026-11-23' AND e.category = 'Bahan Baku', 'pengeluaran baru 90000';

  -- 9. Sebagian sudah terpakai → batal ditolak, tidak ada yang berubah
  PERFORM public.adjust_inventory_stock(i2, 'kurang', 4);
  ok := false;
  BEGIN
    PERFORM public.cancel_stock_purchase(e.id);
  EXCEPTION WHEN OTHERS THEN msg := SQLERRM; ok := SQLERRM LIKE '%sudah terpakai%';
  END;
  ASSERT ok, 'batal saat stok < jumlah ditolak';
  ASSERT msg = 'Sebagian stok dari pembelian ini sudah terpakai (sisa 1 liter). Lakukan stock opname untuk mengoreksi.',
         format('pesan: %s', msg);
  SELECT stock, avg_cost INTO it FROM public.inventory_items WHERE id = i2;
  ASSERT it.stock = 1 AND it.avg_cost = 26000, 'stok & avg tidak berubah';
  ASSERT EXISTS (SELECT 1 FROM public.expenses WHERE id = e.id), 'pengeluaran tetap ada';
  ok := false;
  BEGIN
    PERFORM public.update_stock_purchase(e.id, 3, 60000, '2026-11-23');
  EXCEPTION WHEN OTHERS THEN ok := SQLERRM LIKE '%sudah terpakai%';
  END;
  ASSERT ok, 'ubah pembelian yang sudah terpakai juga ditolak';

  -- 10. Kompatibilitas: adjust_inventory_stock tambah masih jalan (mutasi restok @avg)
  ASSERT public.adjust_inventory_stock(i2, 'tambah', 1) = 2, 'adjust tambah 1 → stok 2';
  ASSERT (SELECT unit_cost FROM public.inventory_movements
           WHERE inventory_item_id = i2 AND kind = 'restok' AND quantity = 1) = 26000, 'restok manual @avg';

  -- 11. Harga manual
  ASSERT public.set_inventory_avg_cost('00000000-0000-0000-0000-000000000f06', 12500) = 12500, 'set avg manual';
  ok := false;
  BEGIN
    PERFORM public.set_inventory_avg_cost('00000000-0000-0000-0000-000000000f06', -1);
  EXCEPTION WHEN OTHERS THEN ok := true;
  END;
  ASSERT ok, 'avg negatif ditolak';
END $$;

-- ---------- Nota: potong stok lewat resep, lalu harga berubah, nota diubah & dihapus ----------
RESET ROLE;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a1';

INSERT INTO public.transactions
  (id, "invoiceCode", items, subtotal, discount, tax, total, "paymentStatus", "orderStatus",
   "createdAt", "amountPaid", change, "storeId")
VALUES ('00000000-0000-0000-0000-000000000d01', 'T-HPP-1',
  '[{"serviceId":"00000000-0000-0000-0000-000000000c01","serviceName":"Cuci Kiloan","unit":"kg","quantity":4,"subtotal":36000}]',
  36000, 0, 0, 36000, 'Lunas', 'Diproses', now(), 36000, 0,
  '00000000-0000-0000-0000-000000000b01');

DO $$
DECLARE
  i4 constant uuid := '00000000-0000-0000-0000-000000000f04';
  tx constant uuid := '00000000-0000-0000-0000-000000000d01';
  m record; r jsonb;
BEGIN
  SELECT * INTO m FROM public.inventory_movements WHERE transaction_id = tx AND kind = 'transaksi';
  ASSERT m.quantity = -2 AND m.unit_cost = 20000, format('transaksi −2 @20000, dapat %s @%s', m.quantity, m.unit_cost);

  -- Harga rata-rata naik: 8 @20000 + 2/60000 → 22000
  r := public.record_stock_purchase(i4, 2, 60000, (now() AT TIME ZONE 'Asia/Jakarta')::date);
  ASSERT (r ->> 'avgCost')::numeric = 22000, format('i4 avg 22000, dapat %s', r ->> 'avgCost');

  -- Edit nota 4 kg → 6 kg: koreksi +2 memakai harga asli 20000, pemakaian baru −3 @22000
  UPDATE public.transactions
     SET items = '[{"serviceId":"00000000-0000-0000-0000-000000000c01","serviceName":"Cuci Kiloan","unit":"kg","quantity":6,"subtotal":54000}]',
         subtotal = 54000, total = 54000, "amountPaid" = 54000
   WHERE id = tx;
  SELECT * INTO m FROM public.inventory_movements WHERE transaction_id = tx AND kind = 'koreksi_transaksi';
  ASSERT m.quantity = 2 AND m.unit_cost = 20000, format('koreksi +2 @20000, dapat %s @%s', m.quantity, m.unit_cost);
  ASSERT (SELECT unit_cost FROM public.inventory_movements
           WHERE transaction_id = tx AND kind = 'transaksi' AND quantity = -3) = 22000, 'pemakaian baru @22000';

  -- Harga berubah lagi: 9 @22000 + 1/33000 → 23100
  r := public.record_stock_purchase(i4, 1, 33000, (now() AT TIME ZONE 'Asia/Jakarta')::date);
  ASSERT (r ->> 'avgCost')::numeric = 23100, format('i4 avg 23100, dapat %s', r ->> 'avgCost');
END $$;

DELETE FROM public.transactions WHERE id = '00000000-0000-0000-0000-000000000d01';

DO $$
DECLARE
  i4 constant uuid := '00000000-0000-0000-0000-000000000f04';
  v_sum numeric; v_qty numeric;
BEGIN
  ASSERT (SELECT unit_cost FROM public.inventory_movements
           WHERE inventory_item_id = i4 AND kind = 'koreksi_transaksi' AND quantity = 3) = 22000,
         'koreksi hapus nota +3 memakai harga pemakaian asli 22000';
  SELECT sum(-quantity * unit_cost), sum(quantity) INTO v_sum, v_qty
    FROM public.inventory_movements
   WHERE inventory_item_id = i4 AND kind IN ('transaksi', 'koreksi_transaksi');
  ASSERT v_qty = 0, 'stok nota kembali penuh';
  ASSERT v_sum = 0, format('Σ(−qty×unit_cost) nota = 0, dapat %s', v_sum);
  ASSERT (SELECT stock FROM public.inventory_items WHERE id = i4) = 13, 'stok i4 = 10 + 2 + 1';
END $$;

-- ---------- Kasir cabang A ----------
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a4","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a4';

DO $$
DECLARE
  i6 constant uuid := '00000000-0000-0000-0000-000000000f06';
  r jsonb; ok boolean;
BEGIN
  ASSERT public.get_my_role() = 'Kasir', 'jwt claim terbaca sebagai Kasir A';
  r := public.record_stock_purchase(i6, 1, 20000, '2026-11-24');
  ASSERT r ->> 'expenseId' IS NOT NULL, 'Kasir boleh mencatat pembelian';
  ASSERT (r ->> 'avgCost')::numeric = 14000, format('i6 (4×12500+20000)/5 = 14000, dapat %s', r ->> 'avgCost');
  ok := false;
  BEGIN
    PERFORM public.cancel_stock_purchase((r ->> 'expenseId')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  ASSERT ok, 'Kasir tidak boleh batal pembelian';
  ok := false;
  BEGIN
    PERFORM public.update_stock_purchase((r ->> 'expenseId')::uuid, 1, 10000, '2026-11-24');
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  ASSERT ok, 'Kasir tidak boleh ubah pembelian';
  ok := false;
  BEGIN
    PERFORM public.set_inventory_avg_cost(i6, 1);
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  ASSERT ok, 'Kasir tidak boleh set harga manual';
END $$;

-- ---------- Admin cabang B (cabang lain) ----------
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}';
SET LOCAL request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000a3';

DO $$
DECLARE
  i6 constant uuid := '00000000-0000-0000-0000-000000000f06';
  v_exp uuid; ok boolean;
BEGIN
  ASSERT public.get_my_role() = 'Admin', 'jwt claim terbaca sebagai Admin B';
  ok := false;
  BEGIN
    PERFORM public.record_stock_purchase(i6, 1, 20000, '2026-11-24');
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  ASSERT ok, 'Admin cabang lain tidak boleh mencatat pembelian';
  ok := false;
  BEGIN
    PERFORM public.set_inventory_avg_cost(i6, 1);
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  ASSERT ok, 'Admin cabang lain tidak boleh set harga';
END $$;

-- Admin B tidak bisa membaca pengeluaran cabang A, jadi ambil id sebagai superuser lalu uji batal.
RESET ROLE;
DO $$
BEGIN
  PERFORM set_config('test.kasir_exp', e.id::text, true)
     FROM public.expenses e
     JOIN public.inventory_movements mm ON mm.id = e."inventoryMovementId"
    WHERE mm.inventory_item_id = '00000000-0000-0000-0000-000000000f06';
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE ok boolean := false;
BEGIN
  BEGIN
    PERFORM public.cancel_stock_purchase(current_setting('test.kasir_exp')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN ok := true;
  END;
  ASSERT ok, 'Admin cabang lain tidak boleh batal pembelian';
END $$;

-- ---------- Hak eksekusi ----------
RESET ROLE;
DO $$
BEGIN
  ASSERT NOT has_function_privilege('anon', 'public.record_stock_purchase(uuid, numeric, numeric, date, text, boolean)', 'EXECUTE'), 'anon tidak boleh record';
  ASSERT has_function_privilege('authenticated', 'public.record_stock_purchase(uuid, numeric, numeric, date, text, boolean)', 'EXECUTE'), 'authenticated boleh record';
  ASSERT has_function_privilege('authenticated', 'public.cancel_stock_purchase(uuid)', 'EXECUTE'), 'authenticated boleh cancel';
  ASSERT has_function_privilege('authenticated', 'public.update_stock_purchase(uuid, numeric, numeric, date, text)', 'EXECUTE'), 'authenticated boleh update';
  ASSERT has_function_privilege('authenticated', 'public.set_inventory_avg_cost(uuid, numeric)', 'EXECUTE'), 'authenticated boleh set avg';
  ASSERT NOT has_function_privilege('anon', 'public.set_inventory_avg_cost(uuid, numeric)', 'EXECUTE'), 'anon tidak boleh set avg';
  ASSERT NOT has_function_privilege('authenticated', 'public.apply_inventory_delta(uuid, numeric, text, uuid, uuid, text, numeric)', 'EXECUTE'), 'apply_inventory_delta internal';
END $$;

\echo 'restok_pengeluaran_hpp: SEMUA TES LULUS'
ROLLBACK;

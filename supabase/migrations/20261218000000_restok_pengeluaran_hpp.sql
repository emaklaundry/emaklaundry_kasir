-- ============================================
-- Restok = Pengeluaran Bahan Baku + harga beli rata-rata (dasar HPP dari pemakaian)
-- ============================================
-- 1. inventory_items.avg_cost       : harga beli rata-rata tertimbang per satuan item (NULL = belum diisi).
-- 2. inventory_movements.unit_cost  : salinan harga saat mutasi terjadi (restok = harga beli pembelian itu),
--                                     agar HPP bulan lalu tidak berubah ketika harga rata-rata berubah.
--    Jenis mutasi baru 'batal_beli' (pembalikan pembelian; bukan susut, tidak masuk HPP).
-- 3. expenses."inventoryMovementId" : tautan pengeluaran ↔ mutasi restok (satu-satu).
-- 4. inventory_store_settings.costing_start : tanggal (WIB) cabang pertama kali punya harga beli.
-- 5. log_inventory_movement / apply_inventory_delta / revert_inventory_for_transaction menyimpan unit_cost.
-- 6. RPC: record_stock_purchase, cancel_stock_purchase, update_stock_purchase, set_inventory_avg_cost.
-- 7. Trigger expenses_guard_stock_purchase: pengeluaran tertaut hanya bisa diubah lewat RPC di atas.
-- Aman dijalankan ulang.

-- ---------- 1-4. Kolom ----------
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS avg_cost numeric(14,4)
    CONSTRAINT inventory_items_avg_cost_check CHECK (avg_cost >= 0);

COMMENT ON COLUMN public.inventory_items.avg_cost IS
  'Harga beli rata-rata tertimbang per satuan item (Rp). NULL = harga belum diisi.';

ALTER TABLE public.inventory_movements
  ADD COLUMN IF NOT EXISTS unit_cost numeric(14,4);

COMMENT ON COLUMN public.inventory_movements.unit_cost IS
  'Harga per satuan saat mutasi terjadi (restok = harga beli; lainnya = avg_cost item sebelum mutasi).';

ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_kind_check;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_kind_check CHECK (kind IN (
  'awal', 'restok', 'penyesuaian', 'opname', 'transaksi', 'koreksi_transaksi', 'batal_beli'
));

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS "inventoryMovementId" uuid
    CONSTRAINT expenses_inventory_movement_id_key UNIQUE
    CONSTRAINT expenses_inventory_movement_id_fkey
      REFERENCES public.inventory_movements(id) ON DELETE RESTRICT;

COMMENT ON COLUMN public.expenses."inventoryMovementId" IS
  'Mutasi restok sumber pengeluaran pembelian stok (NULL = pengeluaran biasa). Ubah lewat RPC pembelian.';

ALTER TABLE public.inventory_store_settings
  ADD COLUMN IF NOT EXISTS costing_start date;

COMMENT ON COLUMN public.inventory_store_settings.costing_start IS
  'Tanggal (WIB) item cabang ini pertama kali mendapat harga beli. Bulan sejak tanggal ini memakai HPP dari pemakaian.';

-- ---------- 5. Buku besar mutasi menyimpan unit_cost ----------
-- app.inv_unit_cost: harga mutasi (kosong = avg_cost item sebelum perubahan).
-- app.inv_last_movement: diisi id mutasi yang baru dibuat.
CREATE OR REPLACE FUNCTION public.log_inventory_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before numeric := CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.stock END;
  v_kind text := nullif(current_setting('app.inv_kind', true), '');
  v_unit_cost numeric := nullif(current_setting('app.inv_unit_cost', true), '')::numeric;
  v_id uuid;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stock IS NOT DISTINCT FROM OLD.stock THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND coalesce(NEW.stock, 0) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.inventory_movements (
    store_id, inventory_item_id, transaction_id, recipe_id, kind,
    quantity, stock_before, stock_after, note, created_by, unit_cost
  ) VALUES (
    NEW."storeId",
    NEW.id,
    nullif(current_setting('app.inv_transaction', true), '')::uuid,
    nullif(current_setting('app.inv_recipe', true), '')::uuid,
    coalesce(v_kind, CASE WHEN TG_OP = 'INSERT' THEN 'awal' ELSE 'penyesuaian' END),
    NEW.stock - v_before,
    v_before,
    NEW.stock,
    nullif(current_setting('app.inv_note', true), ''),
    auth.uid(),
    coalesce(v_unit_cost, CASE WHEN TG_OP = 'INSERT' THEN NEW.avg_cost ELSE OLD.avg_cost END)
  )
  RETURNING id INTO v_id;

  PERFORM set_config('app.inv_last_movement', v_id::text, true);
  RETURN NEW;
END;
$$;

-- Versi baru dengan harga mutasi. Parameter ketujuh sengaja TANPA default: bila diberi
-- default, panggilan 6 argumen lama menjadi ambigu ("function is not unique").
CREATE OR REPLACE FUNCTION public.apply_inventory_delta(
  p_item_id uuid,
  p_delta numeric,
  p_kind text,
  p_transaction_id uuid,
  p_recipe_id uuid,
  p_note text,
  p_unit_cost numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock numeric;
BEGIN
  PERFORM set_config('app.inv_last_movement', '', true);

  IF p_delta IS NULL OR p_delta = 0 THEN
    SELECT stock INTO v_stock FROM public.inventory_items WHERE id = p_item_id;
    RETURN v_stock;
  END IF;

  PERFORM set_config('app.inv_kind', p_kind, true);
  PERFORM set_config('app.inv_transaction', coalesce(p_transaction_id::text, ''), true);
  PERFORM set_config('app.inv_recipe', coalesce(p_recipe_id::text, ''), true);
  PERFORM set_config('app.inv_note', coalesce(p_note, ''), true);
  PERFORM set_config('app.inv_unit_cost', coalesce(p_unit_cost::text, ''), true);

  UPDATE public.inventory_items
     SET stock = stock + p_delta
   WHERE id = p_item_id
  RETURNING stock INTO v_stock;

  PERFORM set_config('app.inv_kind', '', true);
  PERFORM set_config('app.inv_transaction', '', true);
  PERFORM set_config('app.inv_recipe', '', true);
  PERFORM set_config('app.inv_note', '', true);
  PERFORM set_config('app.inv_unit_cost', '', true);

  RETURN v_stock;
END;
$$;

-- Tanda tangan lama tetap ada (pemanggil lama tidak berubah); harga = avg_cost item.
CREATE OR REPLACE FUNCTION public.apply_inventory_delta(
  p_item_id uuid,
  p_delta numeric,
  p_kind text,
  p_transaction_id uuid DEFAULT NULL,
  p_recipe_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.apply_inventory_delta(p_item_id, p_delta, p_kind, p_transaction_id, p_recipe_id, p_note, NULL::numeric);
$$;

-- Koreksi nota memakai harga mutasi asli nota itu (bukan avg_cost sekarang) agar HPP netral.
-- Harga = Σ(qty×harga)/Σ(qty) mutasi berharga nota itu (harga sisa potongan bersih, tepat juga
-- setelah nota diubah berkali-kali); cadangan: rata-rata tertimbang |qty|; NULL bila semua NULL.
CREATE OR REPLACE FUNCTION public.revert_inventory_for_transaction(
  p_transaction_id uuid,
  p_note text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_unit_cost numeric;
BEGIN
  FOR r IN
    SELECT inventory_item_id,
           sum(quantity) AS net,
           sum(quantity * unit_cost) FILTER (WHERE unit_cost IS NOT NULL) AS cost_net,
           sum(quantity) FILTER (WHERE unit_cost IS NOT NULL) AS qty_net,
           sum(abs(quantity) * unit_cost) FILTER (WHERE unit_cost IS NOT NULL) AS cost_abs,
           sum(abs(quantity)) FILTER (WHERE unit_cost IS NOT NULL) AS qty_abs
      FROM public.inventory_movements
     WHERE transaction_id = p_transaction_id
       AND kind IN ('transaksi', 'koreksi_transaksi')
     GROUP BY inventory_item_id
    HAVING sum(quantity) <> 0
  LOOP
    v_unit_cost := CASE
      WHEN r.qty_net <> 0 AND r.cost_net / r.qty_net >= 0 THEN r.cost_net / r.qty_net
      WHEN r.qty_abs > 0 THEN r.cost_abs / r.qty_abs
      ELSE NULL
    END;

    PERFORM public.apply_inventory_delta(
      r.inventory_item_id, -r.net, 'koreksi_transaksi', p_transaction_id, NULL, p_note, v_unit_cost
    );

    -- Harga kosong berarti "pakai avg_cost" di trigger; untuk koreksi harus tetap NULL.
    IF v_unit_cost IS NULL THEN
      UPDATE public.inventory_movements
         SET unit_cost = NULL
       WHERE id = nullif(current_setting('app.inv_last_movement', true), '')::uuid;
    END IF;
  END LOOP;
END;
$$;

-- ---------- 6. RPC pembelian stok ----------
-- Isi costing_start cabang (sekali) saat item cabang itu pertama kali mendapat harga.
CREATE OR REPLACE FUNCTION public.mark_inventory_costing_start(p_store_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.inventory_store_settings AS s (store_id, costing_start)
  VALUES (p_store_id, (now() AT TIME ZONE 'Asia/Jakarta')::date)
  ON CONFLICT (store_id) DO UPDATE
    SET costing_start = EXCLUDED.costing_start
    WHERE s.costing_start IS NULL;
$$;

CREATE OR REPLACE FUNCTION public.record_stock_purchase(
  p_item_id uuid,
  p_quantity numeric,
  p_total_cost numeric,
  p_date date,
  p_note text DEFAULT NULL,
  p_with_expense boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store uuid;
  v_role text := public.get_my_role();
  v_item record;
  v_with_expense boolean := coalesce(p_with_expense, true);
  v_unit_cost numeric;
  v_avg numeric;
  v_base numeric;
  v_stock numeric;
  v_movement uuid;
  v_expense uuid;
BEGIN
  v_store := public.can_manage_inventory_item(p_item_id);
  -- Sama dengan policy INSERT expenses: Super Admin, atau Admin/Kasir cabang itu.
  IF v_store IS NULL
     OR NOT (v_role = 'Super Admin' OR (v_role IN ('Admin', 'Kasir') AND v_store = public.get_my_store_id())) THEN
    RAISE EXCEPTION 'Anda tidak punya akses mencatat pembelian stok di cabang ini' USING ERRCODE = '42501';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Jumlah pembelian harus lebih dari 0';
  END IF;
  IF v_with_expense AND (p_total_cost IS NULL OR p_total_cost <= 0) THEN
    RAISE EXCEPTION 'Total harga beli harus lebih dari 0';
  END IF;

  SELECT id, name, unit, stock, avg_cost
    INTO v_item
    FROM public.inventory_items
   WHERE id = p_item_id
     FOR UPDATE;

  IF v_with_expense THEN
    v_unit_cost := p_total_cost / p_quantity;
    v_base := greatest(v_item.stock, 0);
    v_avg := CASE
      WHEN v_item.avg_cost IS NOT NULL AND v_base > 0
        THEN (v_base * v_item.avg_cost + p_total_cost) / (v_base + p_quantity)
      ELSE p_total_cost / p_quantity
    END;
  ELSE
    v_unit_cost := v_item.avg_cost;
    v_avg := v_item.avg_cost;
  END IF;

  v_stock := public.apply_inventory_delta(
    p_item_id, p_quantity, 'restok', NULL, NULL, nullif(trim(p_note), ''), v_unit_cost
  );
  v_movement := nullif(current_setting('app.inv_last_movement', true), '')::uuid;

  IF v_with_expense THEN
    UPDATE public.inventory_items SET avg_cost = v_avg WHERE id = p_item_id
    RETURNING avg_cost INTO v_avg;
    PERFORM public.mark_inventory_costing_start(v_store);

    INSERT INTO public.expenses (date, description, category, amount, "storeId", "inventoryMovementId")
    VALUES (
      coalesce(p_date, (now() AT TIME ZONE 'Asia/Jakarta')::date),
      format('Restok: %s (%s %s)', v_item.name, trim_scale(p_quantity), v_item.unit),
      'Bahan Baku',
      p_total_cost,
      v_store,
      v_movement
    )
    RETURNING id INTO v_expense;
  END IF;

  RETURN jsonb_build_object(
    'movementId', v_movement,
    'expenseId', v_expense,
    'stock', v_stock,
    'avgCost', v_avg
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_stock_purchase(p_expense_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := public.get_my_role();
  v_expense record;
  v_mov record;
  v_item record;
  v_avg numeric;
  v_candidate numeric;
  v_stock numeric;
BEGIN
  SELECT id, amount, "inventoryMovementId" AS movement_id
    INTO v_expense
    FROM public.expenses
   WHERE id = p_expense_id
     FOR UPDATE;
  IF NOT FOUND OR v_expense.movement_id IS NULL THEN
    RAISE EXCEPTION 'Pengeluaran ini bukan pembelian stok';
  END IF;

  SELECT inventory_item_id, quantity, unit_cost
    INTO v_mov
    FROM public.inventory_movements
   WHERE id = v_expense.movement_id;

  SELECT id, name, unit, stock, avg_cost, "storeId" AS store_id
    INTO v_item
    FROM public.inventory_items
   WHERE id = v_mov.inventory_item_id
     FOR UPDATE;

  IF NOT (v_role = 'Super Admin'
          OR (v_role = 'Admin' AND v_item.store_id IS NOT NULL AND v_item.store_id = public.get_my_store_id())) THEN
    RAISE EXCEPTION 'Hanya Admin cabang atau Super Admin yang boleh mengubah/membatalkan pembelian stok'
      USING ERRCODE = '42501';
  END IF;

  IF v_item.stock < v_mov.quantity THEN
    RAISE EXCEPTION 'Sebagian stok dari pembelian ini sudah terpakai (sisa % %). Lakukan stock opname untuk mengoreksi.',
      trim_scale(v_item.stock), v_item.unit;
  END IF;

  v_avg := v_item.avg_cost;
  IF v_avg IS NOT NULL AND v_item.stock - v_mov.quantity > 0 THEN
    v_candidate := (v_item.stock * v_avg - v_expense.amount) / (v_item.stock - v_mov.quantity);
    IF v_candidate >= 0 THEN
      v_avg := v_candidate;
    END IF;
  END IF;

  v_stock := public.apply_inventory_delta(
    v_item.id, -v_mov.quantity, 'batal_beli', NULL, NULL, 'Batal pembelian stok', v_mov.unit_cost
  );

  UPDATE public.inventory_items SET avg_cost = v_avg WHERE id = v_item.id
  RETURNING avg_cost INTO v_avg;

  PERFORM set_config('app.stock_purchase_bypass', 'on', true);
  DELETE FROM public.expenses WHERE id = p_expense_id;
  PERFORM set_config('app.stock_purchase_bypass', '', true);

  RETURN jsonb_build_object(
    'itemId', v_item.id,
    'movementId', nullif(current_setting('app.inv_last_movement', true), '')::uuid,
    'stock', v_stock,
    'avgCost', v_avg
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_stock_purchase(
  p_expense_id uuid,
  p_quantity numeric,
  p_total_cost numeric,
  p_date date,
  p_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item_id uuid;
BEGIN
  SELECT m.inventory_item_id
    INTO v_item_id
    FROM public.expenses e
    JOIN public.inventory_movements m ON m.id = e."inventoryMovementId"
   WHERE e.id = p_expense_id;
  IF v_item_id IS NULL THEN
    RAISE EXCEPTION 'Pengeluaran ini bukan pembelian stok';
  END IF;

  -- Validasi dulu agar pembatalan tidak terjadi sia-sia (semuanya tetap satu transaksi).
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Jumlah pembelian harus lebih dari 0';
  END IF;
  IF p_total_cost IS NULL OR p_total_cost <= 0 THEN
    RAISE EXCEPTION 'Total harga beli harus lebih dari 0';
  END IF;

  PERFORM public.cancel_stock_purchase(p_expense_id);  -- memeriksa hak Admin/Super Admin
  RETURN public.record_stock_purchase(v_item_id, p_quantity, p_total_cost, p_date, p_note, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_inventory_avg_cost(p_item_id uuid, p_avg_cost numeric)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := public.get_my_role();
  v_store uuid;
  v_avg numeric;
BEGIN
  SELECT "storeId" INTO v_store FROM public.inventory_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND
     OR NOT (v_role = 'Super Admin' OR (v_role = 'Admin' AND v_store IS NOT NULL AND v_store = public.get_my_store_id())) THEN
    RAISE EXCEPTION 'Hanya Admin cabang atau Super Admin yang boleh mengisi harga beli' USING ERRCODE = '42501';
  END IF;
  IF p_avg_cost IS NULL OR p_avg_cost < 0 THEN
    RAISE EXCEPTION 'Harga beli harus 0 atau lebih';
  END IF;

  UPDATE public.inventory_items SET avg_cost = p_avg_cost WHERE id = p_item_id
  RETURNING avg_cost INTO v_avg;
  IF v_store IS NOT NULL THEN
    PERFORM public.mark_inventory_costing_start(v_store);
  END IF;
  RETURN v_avg;
END;
$$;

-- ---------- 7. Penjaga pengeluaran tertaut ----------
CREATE OR REPLACE FUNCTION public.expenses_guard_stock_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF OLD."inventoryMovementId" IS NOT NULL
     AND coalesce(current_setting('app.stock_purchase_bypass', true), '') <> 'on' THEN
    SELECT ii.name INTO v_name
      FROM public.inventory_movements m
      JOIN public.inventory_items ii ON ii.id = m.inventory_item_id
     WHERE m.id = OLD."inventoryMovementId";
    RAISE EXCEPTION 'Pengeluaran ini terhubung ke restok %. Ubah lewat Inventaris atau tombol Ubah pembelian.',
      coalesce(v_name, 'stok');
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS expenses_guard_stock_purchase ON public.expenses;
CREATE TRIGGER expenses_guard_stock_purchase
  BEFORE UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.expenses_guard_stock_purchase();

-- ---------- Hak akses ----------
REVOKE ALL ON FUNCTION public.apply_inventory_delta(uuid, numeric, text, uuid, uuid, text, numeric) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_inventory_delta(uuid, numeric, text, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revert_inventory_for_transaction(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_inventory_movement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_inventory_costing_start(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expenses_guard_stock_purchase() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_stock_purchase(uuid, numeric, numeric, date, text, boolean) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_stock_purchase(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_stock_purchase(uuid, numeric, numeric, date, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_inventory_avg_cost(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_stock_purchase(uuid, numeric, numeric, date, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_stock_purchase(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_stock_purchase(uuid, numeric, numeric, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_inventory_avg_cost(uuid, numeric) TO authenticated;

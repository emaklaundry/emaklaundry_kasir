-- ============================================================================
-- Inventaris: potong stok otomatis per transaksi + buku besar mutasi stok
-- ============================================================================
-- Masalah sebelumnya:
--   * Tabel inventory_recipes / stock_opname / inventory_usage_log tidak pernah
--     terpasang di database produksi → tombol Resep & Opname selalu gagal.
--   * Potong stok dijalankan dari browser dan menebak item lewat nama "sabun".
--     Kasir tidak punya hak UPDATE inventory_items (RLS), jadi potongan gagal diam-diam.
--   * Update stok cepat oleh Kasir/Operator juga gagal diam-diam karena RLS yang sama.
--
-- Solusi:
--   1. Stok boleh desimal (mis. 0,5 sachet per kg).
--   2. inventory_recipes = aturan potong stok per item: per unit (kg/pcs/m) atau
--      per nota, untuk semua layanan atau layanan tertentu.
--   3. Trigger di tabel transactions memotong stok otomatis saat nota dibuat,
--      menyesuaikan ulang bila item nota diubah, dan mengembalikan stok bila nota dihapus.
--   4. inventory_movements = buku besar setiap perubahan stok (otomatis lewat trigger).
--   5. RPC adjust_inventory_stock & record_stock_opname (SECURITY DEFINER) untuk
--      staf cabang tanpa perlu hak UPDATE langsung.
-- ============================================================================

-- 1. Stok desimal + penanda stok rendah (bisa difilter di server) ---------------
ALTER TABLE public.inventory_items
  ALTER COLUMN stock TYPE numeric(12,3) USING stock::numeric,
  ALTER COLUMN "lowStockThreshold" TYPE numeric(12,3) USING "lowStockThreshold"::numeric;

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS is_low_stock boolean
  GENERATED ALWAYS AS ("lowStockThreshold" > 0 AND stock <= "lowStockThreshold") STORED;

CREATE INDEX IF NOT EXISTS idx_inventory_items_store_low
  ON public.inventory_items ("storeId") WHERE is_low_stock;

-- 2. Tabel lama (tidak pernah terpasang di produksi, aman dibuat ulang) ----------
DROP TABLE IF EXISTS public.inventory_usage_log CASCADE;
DROP TABLE IF EXISTS public.stock_opname CASCADE;
DROP TABLE IF EXISTS public.inventory_recipes CASCADE;

-- 3. Aturan potong stok --------------------------------------------------------
CREATE TABLE public.inventory_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  -- NULL = berlaku untuk semua layanan
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  -- per_unit: amount × jumlah (kg/pcs/m) baris nota yang cocok
  -- per_transaksi: amount sekali per nota yang memuat layanan yang cocok
  basis text NOT NULL DEFAULT 'per_unit' CHECK (basis IN ('per_unit', 'per_transaksi')),
  amount numeric(12,3) NOT NULL CHECK (amount > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_recipes_unique UNIQUE NULLS NOT DISTINCT (inventory_item_id, service_id, basis)
);

CREATE INDEX idx_inventory_recipes_store_active
  ON public.inventory_recipes (store_id) WHERE is_active;
CREATE INDEX idx_inventory_recipes_service ON public.inventory_recipes (service_id);

-- Cabang aturan selalu mengikuti cabang item (tidak bisa diakali dari klien)
CREATE OR REPLACE FUNCTION public.inventory_recipes_sync_store()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT "storeId" INTO NEW.store_id FROM public.inventory_items WHERE id = NEW.inventory_item_id;
  IF NEW.store_id IS NULL THEN
    RAISE EXCEPTION 'Item inventaris tidak ditemukan atau belum punya cabang';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_inventory_recipes_sync_store
  BEFORE INSERT OR UPDATE ON public.inventory_recipes
  FOR EACH ROW EXECUTE FUNCTION public.inventory_recipes_sync_store();

-- 4. Buku besar mutasi stok ----------------------------------------------------
CREATE TABLE public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  recipe_id uuid REFERENCES public.inventory_recipes(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN (
    'awal', 'restok', 'penyesuaian', 'opname', 'transaksi', 'koreksi_transaksi'
  )),
  quantity numeric(12,3) NOT NULL,          -- + masuk, − keluar
  stock_before numeric(12,3) NOT NULL,
  stock_after numeric(12,3) NOT NULL,
  note text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inventory_movements_item_time
  ON public.inventory_movements (inventory_item_id, created_at DESC);
CREATE INDEX idx_inventory_movements_store_time
  ON public.inventory_movements (store_id, created_at DESC);
CREATE INDEX idx_inventory_movements_transaction
  ON public.inventory_movements (transaction_id) WHERE transaction_id IS NOT NULL;
CREATE INDEX idx_inventory_movements_recipe ON public.inventory_movements (recipe_id);
CREATE INDEX idx_inventory_movements_created_by ON public.inventory_movements (created_by);

-- Setiap perubahan stok tercatat. Konteks (jenis, nota, catatan) dikirim lewat
-- setting lokal-transaksi app.inv_* oleh fungsi di bawah; tanpa konteks = penyesuaian manual.
CREATE OR REPLACE FUNCTION public.log_inventory_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_before numeric := CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.stock END;
  v_kind text := nullif(current_setting('app.inv_kind', true), '');
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.stock IS NOT DISTINCT FROM OLD.stock THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND coalesce(NEW.stock, 0) = 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.inventory_movements (
    store_id, inventory_item_id, transaction_id, recipe_id, kind,
    quantity, stock_before, stock_after, note, created_by
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
    auth.uid()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER zz_log_inventory_movement
  AFTER INSERT OR UPDATE OF stock ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.log_inventory_movement();

-- Inti perubahan stok: atomik (UPDATE stock = stock + delta) dan selalu tercatat.
CREATE OR REPLACE FUNCTION public.apply_inventory_delta(
  p_item_id uuid,
  p_delta numeric,
  p_kind text,
  p_transaction_id uuid DEFAULT NULL,
  p_recipe_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock numeric;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 THEN
    SELECT stock INTO v_stock FROM public.inventory_items WHERE id = p_item_id;
    RETURN v_stock;
  END IF;

  PERFORM set_config('app.inv_kind', p_kind, true);
  PERFORM set_config('app.inv_transaction', coalesce(p_transaction_id::text, ''), true);
  PERFORM set_config('app.inv_recipe', coalesce(p_recipe_id::text, ''), true);
  PERFORM set_config('app.inv_note', coalesce(p_note, ''), true);

  UPDATE public.inventory_items
     SET stock = stock + p_delta
   WHERE id = p_item_id
  RETURNING stock INTO v_stock;

  PERFORM set_config('app.inv_kind', '', true);
  PERFORM set_config('app.inv_transaction', '', true);
  PERFORM set_config('app.inv_recipe', '', true);
  PERFORM set_config('app.inv_note', '', true);

  RETURN v_stock;
END;
$$;

-- 5. Potong stok otomatis dari nota --------------------------------------------
CREATE OR REPLACE FUNCTION public.deduct_inventory_for_transaction(
  p_transaction_id uuid,
  p_store_id uuid,
  p_items jsonb,
  p_invoice text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  IF p_store_id IS NULL OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN;
  END IF;

  FOR r IN
    WITH lines AS (
      SELECT nullif(li->>'serviceId', '') AS service_id,
             CASE WHEN (li->>'quantity') ~ '^-?[0-9]+(\.[0-9]+)?$'
                  THEN (li->>'quantity')::numeric ELSE 0 END AS qty
        FROM jsonb_array_elements(p_items) li
    )
    SELECT rc.id AS recipe_id,
           rc.inventory_item_id,
           CASE rc.basis
             WHEN 'per_unit' THEN rc.amount * coalesce(sum(l.qty), 0)
             ELSE CASE WHEN count(l.*) > 0 THEN rc.amount ELSE 0 END
           END AS usage
      FROM public.inventory_recipes rc
      JOIN public.inventory_items ii ON ii.id = rc.inventory_item_id AND ii."storeId" = p_store_id
      LEFT JOIN lines l ON rc.service_id IS NULL OR l.service_id = rc.service_id::text
     WHERE rc.store_id = p_store_id AND rc.is_active
     GROUP BY rc.id, rc.inventory_item_id, rc.basis, rc.amount
  LOOP
    IF r.usage > 0 THEN
      PERFORM public.apply_inventory_delta(
        r.inventory_item_id, -r.usage, 'transaksi', p_transaction_id, r.recipe_id,
        'Pemakaian nota ' || coalesce(p_invoice, '')
      );
    END IF;
  END LOOP;
END;
$$;

-- Kembalikan seluruh potongan sebuah nota (dipakai saat item nota diubah / nota dihapus)
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
BEGIN
  FOR r IN
    SELECT inventory_item_id, sum(quantity) AS net
      FROM public.inventory_movements
     WHERE transaction_id = p_transaction_id
       AND kind IN ('transaksi', 'koreksi_transaksi')
     GROUP BY inventory_item_id
    HAVING sum(quantity) <> 0
  LOOP
    PERFORM public.apply_inventory_delta(
      r.inventory_item_id, -r.net, 'koreksi_transaksi', p_transaction_id, NULL, p_note
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_transaction_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Kegagalan potong stok tidak boleh menggagalkan nota pelanggan.
  BEGIN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
    ELSIF TG_OP = 'UPDATE' THEN
      IF NEW.items IS DISTINCT FROM OLD.items OR NEW."storeId" IS DISTINCT FROM OLD."storeId" THEN
        PERFORM public.revert_inventory_for_transaction(OLD.id, 'Item nota ' || coalesce(OLD."invoiceCode", '') || ' diubah');
        PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
      END IF;
    ELSIF TG_OP = 'DELETE' THEN
      PERFORM public.revert_inventory_for_transaction(OLD.id, 'Nota ' || coalesce(OLD."invoiceCode", '') || ' dihapus');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Potong stok otomatis gagal (%): %', TG_OP, SQLERRM;
  END;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER zz_transaction_inventory_insert
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_inventory();

CREATE TRIGGER zz_transaction_inventory_update
  AFTER UPDATE OF items, "storeId" ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_inventory();

-- BEFORE DELETE: harus jalan sebelum FK transaction_id di-NULL-kan.
CREATE TRIGGER zz_transaction_inventory_delete
  BEFORE DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_inventory();

-- 6. Stock opname --------------------------------------------------------------
CREATE TABLE public.stock_opname (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL,
  virtual_stock numeric(12,3) NOT NULL,
  physical_stock numeric(12,3) NOT NULL CHECK (physical_stock >= 0),
  -- positif = barang hilang/terpakai tanpa tercatat
  discrepancy numeric(12,3) GENERATED ALWAYS AS (virtual_stock - physical_stock) STORED,
  notes text,
  recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_opname_store_time ON public.stock_opname (store_id, recorded_at DESC);
CREATE INDEX idx_stock_opname_item ON public.stock_opname (inventory_item_id);
CREATE INDEX idx_stock_opname_recorded_by ON public.stock_opname (recorded_by);

-- 7. RPC untuk staf cabang -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.can_manage_inventory_item(p_item_id uuid)
RETURNS uuid  -- mengembalikan storeId item bila boleh, NULL bila tidak
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ii."storeId"
    FROM public.inventory_items ii
   WHERE ii.id = p_item_id
     AND (
       public.get_my_role() = 'Super Admin'
       OR (public.get_my_role() IS NOT NULL AND ii."storeId" = public.get_my_store_id())
     );
$$;

-- p_mode: 'tambah' (restok), 'kurang' (pemakaian/rusak), 'set' (atur jadi angka tertentu)
CREATE OR REPLACE FUNCTION public.adjust_inventory_stock(
  p_item_id uuid,
  p_mode text,
  p_value numeric,
  p_note text DEFAULT NULL
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current numeric;
  v_delta numeric;
BEGIN
  IF public.can_manage_inventory_item(p_item_id) IS NULL THEN
    RAISE EXCEPTION 'Anda tidak punya akses ke item inventaris ini' USING ERRCODE = '42501';
  END IF;
  IF p_value IS NULL OR p_value < 0 THEN
    RAISE EXCEPTION 'Jumlah harus 0 atau lebih';
  END IF;

  SELECT stock INTO v_current FROM public.inventory_items WHERE id = p_item_id FOR UPDATE;

  v_delta := CASE p_mode
    WHEN 'tambah' THEN p_value
    WHEN 'kurang' THEN -p_value
    WHEN 'set' THEN p_value - v_current
    ELSE NULL
  END;
  IF v_delta IS NULL THEN
    RAISE EXCEPTION 'Mode penyesuaian tidak dikenal: %', p_mode;
  END IF;

  RETURN public.apply_inventory_delta(
    p_item_id, v_delta,
    CASE WHEN p_mode = 'tambah' THEN 'restok' ELSE 'penyesuaian' END,
    NULL, NULL, nullif(trim(p_note), '')
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_stock_opname(
  p_item_id uuid,
  p_physical_stock numeric,
  p_notes text DEFAULT NULL
)
RETURNS public.stock_opname
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store uuid;
  v_current numeric;
  v_row public.stock_opname;
BEGIN
  v_store := public.can_manage_inventory_item(p_item_id);
  IF v_store IS NULL THEN
    RAISE EXCEPTION 'Anda tidak punya akses ke item inventaris ini' USING ERRCODE = '42501';
  END IF;
  IF p_physical_stock IS NULL OR p_physical_stock < 0 THEN
    RAISE EXCEPTION 'Stok fisik harus 0 atau lebih';
  END IF;

  SELECT stock INTO v_current FROM public.inventory_items WHERE id = p_item_id FOR UPDATE;

  INSERT INTO public.stock_opname (store_id, inventory_item_id, virtual_stock, physical_stock, notes, recorded_by)
  VALUES (v_store, p_item_id, v_current, p_physical_stock, nullif(trim(p_notes), ''), auth.uid())
  RETURNING * INTO v_row;

  PERFORM public.apply_inventory_delta(
    p_item_id, p_physical_stock - v_current, 'opname', NULL, NULL,
    coalesce('Stock opname: ' || nullif(trim(p_notes), ''), 'Stock opname')
  );

  RETURN v_row;
END;
$$;

-- Fungsi internal tidak boleh dipanggil langsung lewat API
REVOKE ALL ON FUNCTION public.apply_inventory_delta(uuid, numeric, text, uuid, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_inventory_for_transaction(uuid, uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revert_inventory_for_transaction(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_transaction_inventory() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_inventory_movement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inventory_recipes_sync_store() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.can_manage_inventory_item(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.adjust_inventory_stock(uuid, text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_stock_opname(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_inventory_stock(uuid, text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_stock_opname(uuid, numeric, text) TO authenticated;

-- 8. RLS -----------------------------------------------------------------------
ALTER TABLE public.inventory_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_opname ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Baca aturan stok cabang" ON public.inventory_recipes
  FOR SELECT TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin' OR store_id = (SELECT public.get_my_store_id()));
CREATE POLICY "Admin kelola aturan stok" ON public.inventory_recipes
  FOR ALL TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  )
  WITH CHECK (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  );

-- Buku besar & opname hanya ditulis lewat fungsi SECURITY DEFINER (tanpa policy tulis).
CREATE POLICY "Baca mutasi stok cabang" ON public.inventory_movements
  FOR SELECT TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin' OR store_id = (SELECT public.get_my_store_id()));
CREATE POLICY "Baca opname cabang" ON public.stock_opname
  FOR SELECT TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin' OR store_id = (SELECT public.get_my_store_id()));

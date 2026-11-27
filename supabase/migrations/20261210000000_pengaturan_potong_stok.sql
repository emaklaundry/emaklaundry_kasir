-- ============================================================================
-- Pengaturan potong stok otomatis per cabang
-- ============================================================================
-- 1. inventory_store_settings (1 baris per cabang; tanpa baris = nilai bawaan):
--    * auto_deduct_enabled : saklar utama. Mati = nota tidak memotong stok.
--      Potongan yang sudah terjadi dibiarkan; nota yang dihapus tetap
--      mengembalikan potongannya.
--    * deduct_at           : kapan stok dipotong:
--        'dibuat'       → saat nota dibuat (status awal "Diproses")  [bawaan]
--        'siap_diambil' → saat nota mencapai "Siap Diambil"
--        'selesai'      → saat nota mencapai "Selesai"
--    * stock_guard         : bila stok bahan tidak cukup:
--        'bebas'      → tetap dipotong, stok boleh minus
--        'peringatan' → kasir diberi peringatan, nota tetap boleh disimpan [bawaan]
--        'tahan'      → database menolak nota / perubahan status yang memotong stok
-- 2. compute_inventory_usage(): satu sumber hitungan pemakaian bahan.
-- 3. check_transaction_stock(): RPC cek kekurangan stok sebelum nota disimpan.
-- 4. Trigger nota ikut memperhatikan status nota & pengaturan cabang.
-- Aman dijalankan ulang.
-- ============================================================================

-- 1. Tabel pengaturan -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inventory_store_settings (
  store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
  auto_deduct_enabled boolean NOT NULL DEFAULT true,
  deduct_at text NOT NULL DEFAULT 'dibuat'
    CHECK (deduct_at IN ('dibuat', 'siap_diambil', 'selesai')),
  stock_guard text NOT NULL DEFAULT 'peringatan'
    CHECK (stock_guard IN ('bebas', 'peringatan', 'tahan')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_store_settings_updated_by
  ON public.inventory_store_settings (updated_by);

CREATE OR REPLACE FUNCTION public.inventory_store_settings_touch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inventory_store_settings_touch ON public.inventory_store_settings;
CREATE TRIGGER trg_inventory_store_settings_touch
  BEFORE INSERT OR UPDATE ON public.inventory_store_settings
  FOR EACH ROW EXECUTE FUNCTION public.inventory_store_settings_touch();

ALTER TABLE public.inventory_store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Baca pengaturan stok cabang" ON public.inventory_store_settings;
DROP POLICY IF EXISTS "Admin tambah pengaturan stok" ON public.inventory_store_settings;
DROP POLICY IF EXISTS "Admin ubah pengaturan stok" ON public.inventory_store_settings;

CREATE POLICY "Baca pengaturan stok cabang" ON public.inventory_store_settings
  FOR SELECT TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin' OR store_id = (SELECT public.get_my_store_id()));
CREATE POLICY "Admin tambah pengaturan stok" ON public.inventory_store_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  );
CREATE POLICY "Admin ubah pengaturan stok" ON public.inventory_store_settings
  FOR UPDATE TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  )
  WITH CHECK (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin' AND store_id = (SELECT public.get_my_store_id()))
  );

GRANT SELECT, INSERT, UPDATE ON public.inventory_store_settings TO authenticated;

-- 2. Helper ---------------------------------------------------------------------
-- Pengaturan efektif cabang (nilai bawaan bila belum pernah diatur).
CREATE OR REPLACE FUNCTION public.get_inventory_settings(p_store_id uuid)
RETURNS TABLE (auto_deduct_enabled boolean, deduct_at text, stock_guard text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(s.auto_deduct_enabled, true),
         coalesce(s.deduct_at, 'dibuat'),
         coalesce(s.stock_guard, 'peringatan')
    FROM (SELECT 1) AS d
    LEFT JOIN public.inventory_store_settings s ON s.store_id = p_store_id;
$$;

-- Urutan status nota: Diproses (1) → Siap Diambil (2) → Selesai (3).
CREATE OR REPLACE FUNCTION public.inventory_status_rank(p_status text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_status WHEN 'Siap Diambil' THEN 2 WHEN 'Selesai' THEN 3 ELSE 1 END;
$$;

CREATE OR REPLACE FUNCTION public.inventory_deduct_rank(p_deduct_at text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_deduct_at WHEN 'siap_diambil' THEN 2 WHEN 'selesai' THEN 3 ELSE 1 END;
$$;

-- Pemakaian bahan untuk sekumpulan baris nota (satu baris per aturan yang terpakai).
CREATE OR REPLACE FUNCTION public.compute_inventory_usage(p_store_id uuid, p_items jsonb)
RETURNS TABLE (recipe_id uuid, inventory_item_id uuid, usage numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH lines AS (
    SELECT nullif(li->>'serviceId', '') AS service_id,
           CASE WHEN (li->>'quantity') ~ '^-?[0-9]+(\.[0-9]+)?$'
                THEN (li->>'quantity')::numeric ELSE 0 END AS qty
      FROM jsonb_array_elements(
             CASE WHEN jsonb_typeof(p_items) = 'array' THEN p_items ELSE '[]'::jsonb END
           ) li
  ), per_rule AS (
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
  )
  SELECT recipe_id, inventory_item_id, usage FROM per_rule WHERE usage > 0;
$$;

-- Bahan yang stoknya tidak cukup untuk baris nota tersebut.
CREATE OR REPLACE FUNCTION public.inventory_shortages(p_store_id uuid, p_items jsonb)
RETURNS TABLE (inventory_item_id uuid, item_name text, unit text, needed numeric, available numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ii.id, ii.name, ii.unit, u.needed, ii.stock
    FROM (
      SELECT cu.inventory_item_id, sum(cu.usage) AS needed
        FROM public.compute_inventory_usage(p_store_id, p_items) cu
       GROUP BY cu.inventory_item_id
    ) u
    JOIN public.inventory_items ii ON ii.id = u.inventory_item_id
   WHERE ii.stock < u.needed
   ORDER BY ii.name;
$$;

-- 3. RPC cek stok sebelum nota disimpan ------------------------------------------
CREATE OR REPLACE FUNCTION public.check_transaction_stock(p_store_id uuid, p_items jsonb)
RETURNS TABLE (inventory_item_id uuid, item_name text, unit text, needed numeric, available numeric)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.get_my_role() = 'Super Admin'
    OR (public.get_my_role() IS NOT NULL AND p_store_id = public.get_my_store_id())
  ) THEN
    RAISE EXCEPTION 'Anda tidak punya akses ke cabang ini' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT * FROM public.inventory_shortages(p_store_id, p_items);
END;
$$;

-- 4. Potong stok dari nota (menghormati stock_guard) -------------------------------
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
  v_guard text;
  v_short text;
BEGIN
  IF p_store_id IS NULL OR p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN;
  END IF;

  SELECT s.stock_guard INTO v_guard FROM public.get_inventory_settings(p_store_id) s;

  IF v_guard = 'tahan' THEN
    -- Kunci item agar dua nota bersamaan tidak sama-sama lolos lalu membuat stok minus.
    PERFORM 1
       FROM public.inventory_items ii
      WHERE ii.id IN (SELECT cu.inventory_item_id FROM public.compute_inventory_usage(p_store_id, p_items) cu)
      ORDER BY ii.id
        FOR UPDATE;

    SELECT string_agg(
             format('%s (butuh %s %s, sisa %s)',
                    sh.item_name, trim_scale(round(sh.needed, 3)), sh.unit, trim_scale(round(sh.available, 3))),
             ', ' ORDER BY sh.item_name)
      INTO v_short
      FROM public.inventory_shortages(p_store_id, p_items) sh;

    IF v_short IS NOT NULL THEN
      RAISE EXCEPTION 'Stok bahan tidak cukup: %', v_short
        USING ERRCODE = 'SK001',
              HINT = 'Tambah stok bahan dulu, atau ubah pengaturan "Bila stok kurang" di Inventaris → Potong Otomatis.';
    END IF;
  END IF;

  FOR r IN SELECT * FROM public.compute_inventory_usage(p_store_id, p_items) LOOP
    PERFORM public.apply_inventory_delta(
      r.inventory_item_id, -r.usage, 'transaksi', p_transaction_id, r.recipe_id,
      'Pemakaian nota ' || coalesce(p_invoice, '')
    );
  END LOOP;
END;
$$;

-- 5. Trigger nota -------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_transaction_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg record;
  v_threshold integer;
  v_old_rank integer;
  v_new_rank integer;
  v_items_changed boolean;
  v_deducted boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    BEGIN
      PERFORM public.revert_inventory_for_transaction(OLD.id, 'Nota ' || coalesce(OLD."invoiceCode", '') || ' dihapus');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Pengembalian stok gagal (DELETE): %', SQLERRM;
    END;
    RETURN OLD;
  END IF;

  SELECT * INTO v_cfg FROM public.get_inventory_settings(NEW."storeId");
  v_threshold := public.inventory_deduct_rank(v_cfg.deduct_at);
  v_new_rank := public.inventory_status_rank(NEW."orderStatus");

  -- Kegagalan potong stok tidak boleh menggagalkan nota, kecuali mode "tahan" (SK001).
  BEGIN
    IF TG_OP = 'INSERT' THEN
      IF v_cfg.auto_deduct_enabled AND v_new_rank >= v_threshold THEN
        PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
      END IF;
    ELSE
      v_old_rank := public.inventory_status_rank(OLD."orderStatus");
      v_items_changed := NEW.items IS DISTINCT FROM OLD.items OR NEW."storeId" IS DISTINCT FROM OLD."storeId";
      v_deducted := EXISTS (
        SELECT 1
          FROM public.inventory_movements m
         WHERE m.transaction_id = OLD.id
           AND m.kind IN ('transaksi', 'koreksi_transaksi')
         GROUP BY m.inventory_item_id
        HAVING sum(m.quantity) <> 0
      );

      IF NOT v_cfg.auto_deduct_enabled THEN
        NULL; -- Saklar mati: stok tidak disentuh.
      ELSIF v_deducted THEN
        IF v_new_rank < v_old_rank AND v_new_rank < v_threshold THEN
          -- Status nota dimundurkan ke sebelum titik potong.
          PERFORM public.revert_inventory_for_transaction(
            OLD.id, 'Status nota ' || coalesce(OLD."invoiceCode", '') || ' dikembalikan ke ' || coalesce(NEW."orderStatus", '-'));
        ELSIF v_items_changed THEN
          PERFORM public.revert_inventory_for_transaction(OLD.id, 'Item nota ' || coalesce(OLD."invoiceCode", '') || ' diubah');
          PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
        END IF;
      ELSIF v_new_rank >= v_threshold AND (v_old_rank < v_threshold OR v_items_changed) THEN
        -- Nota baru mencapai titik potong (atau itemnya diubah setelah melewatinya).
        PERFORM public.deduct_inventory_for_transaction(NEW.id, NEW."storeId", NEW.items, NEW."invoiceCode");
      END IF;
    END IF;
  EXCEPTION
    WHEN SQLSTATE 'SK001' THEN
      RAISE;
    WHEN OTHERS THEN
      RAISE WARNING 'Potong stok otomatis gagal (%): %', TG_OP, SQLERRM;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS zz_transaction_inventory_update ON public.transactions;
CREATE TRIGGER zz_transaction_inventory_update
  AFTER UPDATE OF items, "storeId", "orderStatus" ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_inventory();

-- 6. Hak akses ------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.inventory_store_settings_touch() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_inventory_settings(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.compute_inventory_usage(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inventory_shortages(uuid, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.deduct_inventory_for_transaction(uuid, uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_transaction_inventory() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_transaction_stock(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_transaction_stock(uuid, jsonb) TO authenticated;

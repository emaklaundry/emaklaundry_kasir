-- ============================================================================
-- SALDO DISKON PELANGGAN
-- ----------------------------------------------------------------------------
-- Aturan bisnis:
--   * Pembayaran TUNAI dibulatkan ke ATAS ke kelipatan Rp500. Kelebihannya
--     (maks Rp499) masuk ke saldo diskon pelanggan  -> kolom "roundingCredit".
--   * Saldo dipakai otomatis sebagai potongan di transaksi berikutnya,
--     maksimal 10% dari subtotal                     -> kolom "discountBalanceUsed".
--   * Admin / Super Admin boleh menyesuaikan saldo secara manual.
--
-- Semua perubahan saldo terjadi di database (trigger + fungsi SECURITY DEFINER)
-- dalam transaksi yang sama dengan perubahan transaksi, sehingga saldo tidak
-- bisa dobel, hilang, atau minus walau dua kasir bekerja bersamaan. Setiap
-- perubahan dicatat di public.customer_discount_ledger.
-- ============================================================================

-- 1. Kolom saldo di customers: wajib terisi, tidak boleh negatif ---------------
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS "defaultDiscount" integer DEFAULT 0;

UPDATE public.customers
SET "defaultDiscount" = 0
WHERE "defaultDiscount" IS NULL OR "defaultDiscount" < 0;

ALTER TABLE public.customers
  ALTER COLUMN "defaultDiscount" SET DEFAULT 0,
  ALTER COLUMN "defaultDiscount" SET NOT NULL,
  ADD CONSTRAINT customers_default_discount_nonnegative
    CHECK ("defaultDiscount" >= 0);

COMMENT ON COLUMN public.customers."defaultDiscount" IS
  'Saldo diskon pelanggan (Rupiah). Hanya berubah lewat trigger saldo atau penyesuaian Admin.';

-- 2. Kolom saldo di transactions ---------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS "discountBalanceUsed" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "roundingCredit" integer NOT NULL DEFAULT 0;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_discount_balance_used_check
    CHECK ("discountBalanceUsed" >= 0),
  ADD CONSTRAINT transactions_rounding_credit_check
    CHECK ("roundingCredit" BETWEEN 0 AND 499);

COMMENT ON COLUMN public.transactions."discountBalanceUsed" IS
  'Bagian dari kolom discount yang diambil dari saldo diskon pelanggan (Rupiah).';
COMMENT ON COLUMN public.transactions."roundingCredit" IS
  'Kelebihan pembulatan tunai ke atas (kelipatan Rp500) yang masuk ke saldo pelanggan.';

-- 3. Buku catatan saldo --------------------------------------------------------
CREATE TABLE public.customer_discount_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('use', 'rounding', 'manual', 'reversal')),
  amount integer NOT NULL CHECK (amount <> 0),
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  note text CHECK (note IS NULL OR char_length(note) <= 200),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.customer_discount_ledger IS
  'Riwayat setiap perubahan saldo diskon pelanggan. Hanya ditulis oleh fungsi database.';

-- Satu transaksi hanya boleh memakai / menambah saldo sekali.
CREATE UNIQUE INDEX customer_discount_ledger_transaction_kind_idx
  ON public.customer_discount_ledger (transaction_id, kind)
  WHERE transaction_id IS NOT NULL AND kind IN ('use', 'rounding');
CREATE INDEX customer_discount_ledger_customer_idx
  ON public.customer_discount_ledger (customer_id, created_at DESC);
CREATE INDEX customer_discount_ledger_store_idx
  ON public.customer_discount_ledger (store_id);

ALTER TABLE public.customer_discount_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users can read discount ledger"
  ON public.customer_discount_ledger
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR store_id = (SELECT public.get_my_store_id())
  );

-- Saldo yang sudah ada sebelum buku catatan dibuat dicatat sebagai saldo awal,
-- supaya jumlah ledger per pelanggan selalu sama dengan saldonya.
INSERT INTO public.customer_discount_ledger (
  customer_id, store_id, kind, amount, balance_after, note, created_by
)
SELECT id, "storeId", 'manual', "defaultDiscount", "defaultDiscount",
  'Saldo awal saat buku catatan saldo diaktifkan', NULL
FROM public.customers
WHERE "defaultDiscount" > 0;

REVOKE ALL ON public.customer_discount_ledger FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.customer_discount_ledger TO authenticated;
GRANT ALL ON public.customer_discount_ledger TO service_role;

-- 4. Fungsi inti: ubah saldo secara atomik + catat -----------------------------
CREATE OR REPLACE FUNCTION public.change_customer_discount_balance(
  p_customer_id uuid,
  p_delta integer,
  p_kind text,
  p_transaction_id uuid,
  p_note text,
  p_clamp_at_zero boolean DEFAULT false
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_balance integer;
  v_store_id uuid;
  v_new_balance integer;
  v_applied integer;
BEGIN
  SELECT c."defaultDiscount", c."storeId"
  INTO v_balance, v_store_id
  FROM public.customers AS c
  WHERE c.id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pelanggan tidak ditemukan untuk saldo diskon'
      USING ERRCODE = 'P0002';
  END IF;

  v_new_balance := v_balance + p_delta;
  IF v_new_balance < 0 THEN
    IF p_clamp_at_zero THEN
      v_new_balance := 0;
    ELSE
      RAISE EXCEPTION 'Saldo diskon pelanggan tidak cukup (sisa Rp%, dibutuhkan Rp%)',
        v_balance, -p_delta
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  v_applied := v_new_balance - v_balance;
  IF v_applied = 0 THEN
    RETURN v_balance;
  END IF;

  -- Tanda untuk trigger penjaga: perubahan ini sah dan dicatat di bawah.
  PERFORM set_config('app.discount_balance_internal', 'on', true);
  UPDATE public.customers
  SET "defaultDiscount" = v_new_balance
  WHERE id = p_customer_id;
  PERFORM set_config('app.discount_balance_internal', 'off', true);

  INSERT INTO public.customer_discount_ledger (
    customer_id, store_id, transaction_id, kind, amount, balance_after, note
  )
  VALUES (
    p_customer_id, v_store_id, p_transaction_id, p_kind, v_applied, v_new_balance,
    left(p_note, 200)
  );

  RETURN v_new_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.change_customer_discount_balance(uuid, integer, text, uuid, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.change_customer_discount_balance(uuid, integer, text, uuid, text, boolean)
  TO service_role;

-- 5. Trigger transaksi: pakai saldo, tambah pembulatan, kembalikan saat dihapus -
CREATE OR REPLACE FUNCTION public.apply_transaction_discount_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_label text;
  v_max_use integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."customerId" IS NOT NULL THEN
      v_label := coalesce(OLD."invoiceCode", OLD.id::text);
      IF OLD."discountBalanceUsed" > 0 THEN
        PERFORM public.change_customer_discount_balance(
          OLD."customerId", OLD."discountBalanceUsed", 'reversal', NULL,
          'Transaksi ' || v_label || ' dihapus: saldo yang dipakai dikembalikan'
        );
      END IF;
      IF OLD."roundingCredit" > 0 THEN
        PERFORM public.change_customer_discount_balance(
          OLD."customerId", -OLD."roundingCredit", 'reversal', NULL,
          'Transaksi ' || v_label || ' dihapus: saldo pembulatan dibatalkan',
          true
        );
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  v_label := coalesce(NEW."invoiceCode", NEW.id::text);

  IF TG_OP = 'UPDATE' THEN
    IF NEW."discountBalanceUsed" IS DISTINCT FROM OLD."discountBalanceUsed" THEN
      RAISE EXCEPTION 'Pemakaian saldo diskon tidak dapat diubah setelah transaksi dibuat'
        USING ERRCODE = '42501';
    END IF;
    -- NULL diperbolehkan: terjadi otomatis saat pelanggan dihapus (ON DELETE SET NULL).
    IF NEW."customerId" IS DISTINCT FROM OLD."customerId"
      AND NEW."customerId" IS NOT NULL
      AND (OLD."discountBalanceUsed" > 0 OR OLD."roundingCredit" > 0) THEN
      RAISE EXCEPTION 'Pelanggan tidak dapat diganti pada transaksi yang memakai saldo diskon'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Pemakaian saldo (hanya saat transaksi dibuat)
  IF TG_OP = 'INSERT' AND NEW."discountBalanceUsed" > 0 THEN
    IF NEW."customerId" IS NULL THEN
      RAISE EXCEPTION 'Saldo diskon hanya bisa dipakai untuk pelanggan terdaftar'
        USING ERRCODE = '22023';
    END IF;
    v_max_use := floor(NEW.subtotal * 0.10)::integer;
    IF NEW."discountBalanceUsed" > v_max_use THEN
      RAISE EXCEPTION 'Pemakaian saldo diskon Rp% melebihi batas 10%% subtotal (Rp%)',
        NEW."discountBalanceUsed", v_max_use
        USING ERRCODE = '22023';
    END IF;
    IF NEW."discountBalanceUsed" > NEW.discount THEN
      RAISE EXCEPTION 'Pemakaian saldo diskon harus termasuk dalam kolom diskon'
        USING ERRCODE = '22023';
    END IF;

    PERFORM public.change_customer_discount_balance(
      NEW."customerId", -NEW."discountBalanceUsed", 'use', NEW.id,
      'Dipakai di transaksi ' || v_label
    );
  END IF;

  -- Kelebihan pembulatan tunai (sekali per transaksi, saat lunas)
  IF NEW."roundingCredit" > 0
    AND (TG_OP = 'INSERT' OR NEW."roundingCredit" IS DISTINCT FROM OLD."roundingCredit") THEN
    IF TG_OP = 'UPDATE' AND OLD."roundingCredit" <> 0 THEN
      RAISE EXCEPTION 'Saldo pembulatan transaksi ini sudah tercatat'
        USING ERRCODE = '42501';
    END IF;
    IF NEW."customerId" IS NULL THEN
      RAISE EXCEPTION 'Saldo pembulatan hanya bisa untuk pelanggan terdaftar'
        USING ERRCODE = '22023';
    END IF;
    IF NEW."paymentMethod" IS DISTINCT FROM 'Tunai' OR NEW."paymentStatus" IS DISTINCT FROM 'Lunas' THEN
      RAISE EXCEPTION 'Saldo pembulatan hanya untuk pembayaran tunai yang sudah lunas'
        USING ERRCODE = '22023';
    END IF;
    IF mod(NEW.total + NEW."roundingCredit", 500) <> 0 THEN
      RAISE EXCEPTION 'Saldo pembulatan Rp% tidak sesuai dengan total Rp%',
        NEW."roundingCredit", NEW.total
        USING ERRCODE = '22023';
    END IF;

    PERFORM public.change_customer_discount_balance(
      NEW."customerId", NEW."roundingCredit", 'rounding', NEW.id,
      'Pembulatan tunai transaksi ' || v_label
    );
  ELSIF TG_OP = 'UPDATE' AND NEW."roundingCredit" IS DISTINCT FROM OLD."roundingCredit" THEN
    RAISE EXCEPTION 'Saldo pembulatan transaksi ini sudah tercatat'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_transaction_discount_balance()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER apply_transaction_discount_balance
  AFTER INSERT OR UPDATE OF "discountBalanceUsed", "roundingCredit", "customerId" OR DELETE
  ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.apply_transaction_discount_balance();

-- 6. Penjaga kolom saldo di customers ------------------------------------------
-- Kasir tidak boleh mengubah saldo langsung. Perubahan langsung oleh Admin
-- (form, impor Excel, restore) dicatat otomatis sebagai 'manual'.
CREATE OR REPLACE FUNCTION public.normalize_customer_discount_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW."defaultDiscount" := greatest(coalesce(NEW."defaultDiscount", 0), 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER normalize_customer_discount_balance
  BEFORE INSERT OR UPDATE OF "defaultDiscount" ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_customer_discount_balance();

CREATE OR REPLACE FUNCTION public.guard_customer_discount_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_old integer;
  v_note text;
BEGIN
  -- Perubahan dari change_customer_discount_balance() sudah dicatat di sana.
  IF current_setting('app.discount_balance_internal', true) = 'on' THEN
    RETURN NULL;
  END IF;

  v_old := CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD."defaultDiscount" END;
  IF NEW."defaultDiscount" = v_old THEN
    RETURN NULL;
  END IF;

  IF auth.uid() IS NULL THEN
    -- Koneksi database langsung / service role (SQL Editor, edge function).
    v_note := 'Diubah langsung di database';
  ELSIF coalesce(public.get_my_role(), '') IN ('Admin', 'Super Admin') THEN
    v_note := CASE WHEN TG_OP = 'INSERT' THEN 'Saldo awal pelanggan' ELSE 'Diubah langsung oleh Admin' END;
  ELSE
    RAISE EXCEPTION 'Hanya Admin yang dapat mengubah saldo diskon pelanggan'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.customer_discount_ledger (
    customer_id, store_id, transaction_id, kind, amount, balance_after, note
  )
  VALUES (
    NEW.id, NEW."storeId", NULL, 'manual',
    NEW."defaultDiscount" - v_old, NEW."defaultDiscount", v_note
  );
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.guard_customer_discount_balance()
  FROM PUBLIC, anon, authenticated;

CREATE TRIGGER guard_customer_discount_balance
  AFTER INSERT OR UPDATE OF "defaultDiscount" ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_customer_discount_balance();

-- 7. RPC untuk Admin: setel saldo dengan pengecekan nilai lama -----------------
-- p_expected_balance mencegah menimpa perubahan yang terjadi saat form terbuka.
CREATE OR REPLACE FUNCTION public.set_customer_discount_balance(
  p_customer_id uuid,
  p_expected_balance integer,
  p_new_balance integer,
  p_note text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text := public.get_my_role();
  v_store_id uuid;
  v_balance integer;
BEGIN
  IF coalesce(v_role, '') NOT IN ('Admin', 'Super Admin') THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat mengubah saldo diskon pelanggan'
      USING ERRCODE = '42501';
  END IF;
  IF p_new_balance IS NULL OR p_new_balance < 0 THEN
    RAISE EXCEPTION 'Saldo diskon tidak boleh negatif' USING ERRCODE = '22023';
  END IF;

  SELECT c."storeId", c."defaultDiscount"
  INTO v_store_id, v_balance
  FROM public.customers AS c
  WHERE c.id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pelanggan tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;
  IF v_role = 'Admin' AND v_store_id IS DISTINCT FROM public.get_my_store_id() THEN
    RAISE EXCEPTION 'Admin hanya dapat mengubah pelanggan di cabangnya sendiri'
      USING ERRCODE = '42501';
  END IF;
  IF p_expected_balance IS DISTINCT FROM v_balance THEN
    RAISE EXCEPTION 'Saldo pelanggan sudah berubah menjadi Rp%. Muat ulang lalu coba lagi.', v_balance
      USING ERRCODE = '40001';
  END IF;

  RETURN public.change_customer_discount_balance(
    p_customer_id,
    p_new_balance - v_balance,
    'manual',
    NULL,
    coalesce(nullif(btrim(p_note), ''), 'Penyesuaian saldo oleh Admin')
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_customer_discount_balance(uuid, integer, integer, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_customer_discount_balance(uuid, integer, integer, text)
  TO authenticated;

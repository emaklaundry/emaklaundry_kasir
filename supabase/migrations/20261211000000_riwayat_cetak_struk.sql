-- ============================================================================
-- Riwayat cetak struk (penanda "CETAK ULANG")
-- ============================================================================
-- receipt_prints mencatat setiap kali struk sebuah nota dicetak. Struk cetakan
-- ke-2 dan seterusnya diberi tanda "CETAK ULANG ke-n" agar nota salinan tidak
-- bisa disalahgunakan sebagai nota asli.
--
-- Kasir tidak bisa membaca audit_logs (hanya Admin), jadi hitungan disimpan di
-- tabel sendiri dan dicatat lewat RPC record_receipt_print() yang atomik:
-- catat cetakan + kembalikan nomor cetakan dalam satu panggilan.
-- Aman dijalankan ulang.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.receipt_prints (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  printed_at timestamptz NOT NULL DEFAULT now(),
  printed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_receipt_prints_transaction
  ON public.receipt_prints (transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipt_prints_store
  ON public.receipt_prints (store_id);
CREATE INDEX IF NOT EXISTS idx_receipt_prints_printed_by
  ON public.receipt_prints (printed_by);

ALTER TABLE public.receipt_prints ENABLE ROW LEVEL SECURITY;

-- Hanya baca (untuk laporan/admin). Penulisan wajib lewat RPC di bawah.
DROP POLICY IF EXISTS "Baca riwayat cetak struk cabang" ON public.receipt_prints;
CREATE POLICY "Baca riwayat cetak struk cabang" ON public.receipt_prints
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR store_id = (SELECT public.get_my_store_id())
  );

REVOKE ALL ON public.receipt_prints FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.receipt_prints FROM authenticated;
GRANT SELECT ON public.receipt_prints TO authenticated;

-- Catat satu cetakan & kembalikan nomornya (1 = cetakan pertama/asli).
CREATE OR REPLACE FUNCTION public.record_receipt_print(p_transaction_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store uuid;
  v_role text := public.get_my_role();
  v_count integer;
BEGIN
  SELECT t."storeId" INTO v_store
    FROM public.transactions t
   WHERE t.id = p_transaction_id
     FOR UPDATE; -- serialisasi dua cetakan bersamaan untuk nota yang sama

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nota tidak ditemukan' USING ERRCODE = 'P0002';
  END IF;

  IF v_role IS NULL OR NOT (v_role = 'Super Admin' OR v_store = public.get_my_store_id()) THEN
    RAISE EXCEPTION 'Anda tidak punya akses ke nota ini' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.receipt_prints (transaction_id, store_id, printed_by)
  VALUES (p_transaction_id, v_store, auth.uid());

  SELECT count(*)::integer INTO v_count
    FROM public.receipt_prints
   WHERE transaction_id = p_transaction_id;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.record_receipt_print(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_receipt_print(uuid) TO authenticated;

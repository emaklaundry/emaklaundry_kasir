-- ============================================================================
-- PIN SUPERVISOR (otorisasi berjenjang)
-- ----------------------------------------------------------------------------
-- Aksi sensitif oleh Kasir wajib disetujui PIN supervisor (Admin cabang yang
-- sama atau Super Admin):
--   * manual_discount : diskon melebihi diskon otomatis dari Pengaturan
--   * edit_paid       : mengubah pembayaran transaksi yang sudah Lunas
--   * cancel_transaction : (disiapkan untuk tahap berikutnya)
--
-- Alur: Kasir -> request_supervisor_approval(aksi, PIN) -> izin sekali pakai
-- (berlaku 2 menit) -> dikirim di kolom transactions."supervisorApprovalId" ->
-- trigger enforce_supervisor_approval memeriksa & menandai izin terpakai.
-- Semua pemeriksaan di database, jadi tidak bisa dilewati dari browser.
-- Admin dan Super Admin tidak perlu PIN.
-- ============================================================================

-- 1. PIN supervisor (hash bcrypt) ---------------------------------------------
CREATE TABLE public.supervisor_pins (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  pin_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.supervisor_pins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_pins FROM PUBLIC, anon, authenticated;

-- 2. Pembatas percobaan PIN salah (per kasir) ---------------------------------
CREATE TABLE public.supervisor_pin_attempts (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  failed_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz
);
ALTER TABLE public.supervisor_pin_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_pin_attempts FROM PUBLIC, anon, authenticated;

-- 3. Izin sekali pakai ----------------------------------------------------------
CREATE TABLE public.supervisor_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('manual_discount', 'edit_paid', 'cancel_transaction')),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  approved_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- Batas diskon manual yang disetujui (Rupiah). NULL = tanpa batas jumlah.
  max_amount numeric CHECK (max_amount IS NULL OR max_amount >= 0),
  -- Diisi saat izin terpakai (tanpa FK: baris transaksi belum ada saat INSERT).
  transaction_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 minutes',
  used_at timestamptz
);
CREATE INDEX supervisor_approvals_requested_by_idx ON public.supervisor_approvals (requested_by, created_at DESC);
CREATE INDEX supervisor_approvals_store_idx ON public.supervisor_approvals (store_id, created_at DESC);
CREATE INDEX supervisor_approvals_approved_by_idx ON public.supervisor_approvals (approved_by);
ALTER TABLE public.supervisor_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supervisor_approvals FROM PUBLIC, anon, authenticated;

-- Admin bisa melihat riwayat persetujuan di cabangnya (untuk laporan nanti).
CREATE POLICY "Admins read supervisor approvals in their store"
  ON public.supervisor_approvals FOR SELECT TO authenticated
  USING ((SELECT public.can_manage_store(store_id)));
GRANT SELECT ON public.supervisor_approvals TO authenticated;

-- 4. Kolom penanda di transaksi -------------------------------------------------
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS "supervisorApprovalId" uuid;
COMMENT ON COLUMN public.transactions."supervisorApprovalId" IS
  'Izin PIN supervisor terakhir yang dipakai untuk aksi sensitif Kasir pada transaksi ini.';

-- 5. Admin mengatur PIN miliknya sendiri ----------------------------------------
CREATE OR REPLACE FUNCTION public.set_my_supervisor_pin(p_pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_store uuid;
BEGIN
  SELECT p.role, p.store_id INTO v_role, v_store FROM public.profiles p WHERE p.id = v_uid;
  IF v_role IS NULL OR v_role NOT IN ('Admin', 'Super Admin') THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat memiliki PIN supervisor' USING ERRCODE = '42501';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN harus 6 angka' USING ERRCODE = '22023';
  END IF;
  IF p_pin ~ '^([0-9])\1{5}$'
     OR p_pin IN ('012345', '123456', '234567', '345678', '456789', '987654', '876543', '765432', '654321', '543210') THEN
    RAISE EXCEPTION 'PIN terlalu mudah ditebak. Pilih PIN lain.' USING ERRCODE = '22023';
  END IF;
  -- PIN tidak boleh sama dengan PIN supervisor lain di lingkup yang sama,
  -- supaya setiap persetujuan tercatat atas nama orang yang benar.
  IF EXISTS (
    SELECT 1
    FROM public.supervisor_pins sp
    JOIN public.profiles p ON p.id = sp.user_id
    WHERE sp.user_id <> v_uid
      AND (p.role = 'Super Admin' OR v_role = 'Super Admin' OR p.store_id = v_store)
      AND sp.pin_hash = extensions.crypt(p_pin, sp.pin_hash)
  ) THEN
    RAISE EXCEPTION 'PIN ini tidak dapat dipakai. Pilih PIN lain.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.supervisor_pins (user_id, pin_hash, updated_at)
  VALUES (v_uid, extensions.crypt(p_pin, extensions.gen_salt('bf', 8)), now())
  ON CONFLICT (user_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = now();

  INSERT INTO public.audit_logs ("user", action, "storeId")
  VALUES ((SELECT p.name FROM public.profiles p WHERE p.id = v_uid), 'Mengatur PIN supervisor.', v_store);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_my_supervisor_pin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.supervisor_pins WHERE user_id = auth.uid());
$$;

-- 6. Kasir meminta persetujuan dengan PIN supervisor ----------------------------
-- Hasil: {"approval_id": uuid, "approver_name": text} bila PIN benar,
--        {"approval_id": null, "remaining_attempts": n} bila PIN salah.
CREATE OR REPLACE FUNCTION public.request_supervisor_approval(
  p_action text,
  p_pin text,
  p_max_amount numeric DEFAULT NULL,
  p_transaction_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c_max_failures constant integer := 5;
  c_window constant interval := interval '15 minutes';
  v_uid uuid := auth.uid();
  v_role text;
  v_store uuid;
  v_attempt public.supervisor_pin_attempts%ROWTYPE;
  v_approver uuid;
  v_approver_name text;
  v_id uuid;
BEGIN
  SELECT p.role, p.store_id INTO v_role, v_store FROM public.profiles p WHERE p.id = v_uid;
  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Sesi tidak valid. Silakan login ulang.' USING ERRCODE = '42501';
  END IF;
  IF v_store IS NULL THEN
    RAISE EXCEPTION 'Akun Anda belum terhubung ke cabang.' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('manual_discount', 'edit_paid', 'cancel_transaction') THEN
    RAISE EXCEPTION 'Aksi tidak dikenal' USING ERRCODE = '22023';
  END IF;
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'PIN harus 6 angka' USING ERRCODE = '22023';
  END IF;
  IF p_max_amount IS NOT NULL AND p_max_amount < 0 THEN
    RAISE EXCEPTION 'Jumlah tidak valid' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.supervisor_pin_attempts (user_id) VALUES (v_uid) ON CONFLICT (user_id) DO NOTHING;
  SELECT * INTO v_attempt FROM public.supervisor_pin_attempts WHERE user_id = v_uid FOR UPDATE;

  IF v_attempt.locked_until IS NOT NULL AND v_attempt.locked_until > now() THEN
    RAISE EXCEPTION 'Terlalu banyak PIN salah. Coba lagi dalam % menit.',
      ceil(extract(epoch FROM v_attempt.locked_until - now()) / 60)::integer
      USING ERRCODE = 'P0001';
  END IF;

  SELECT p.id, p.name INTO v_approver, v_approver_name
  FROM public.supervisor_pins sp
  JOIN public.profiles p ON p.id = sp.user_id
  WHERE p.id <> v_uid
    AND coalesce(p."isActive", true)
    AND (p.role = 'Super Admin' OR (p.role = 'Admin' AND p.store_id = v_store))
    AND sp.pin_hash = extensions.crypt(p_pin, sp.pin_hash)
  LIMIT 1;

  IF v_approver IS NULL THEN
    -- Catat kegagalan (tanpa RAISE, supaya hitungan tidak ikut dibatalkan).
    IF v_attempt.window_started_at < now() - c_window THEN
      v_attempt.failed_count := 1;
      v_attempt.window_started_at := now();
    ELSE
      v_attempt.failed_count := v_attempt.failed_count + 1;
    END IF;
    IF v_attempt.failed_count >= c_max_failures THEN
      v_attempt.locked_until := now() + c_window;
    END IF;
    UPDATE public.supervisor_pin_attempts
    SET failed_count = v_attempt.failed_count,
        window_started_at = v_attempt.window_started_at,
        locked_until = v_attempt.locked_until
    WHERE user_id = v_uid;

    IF v_attempt.failed_count >= c_max_failures THEN
      INSERT INTO public.audit_logs ("user", action, "storeId")
      VALUES ((SELECT p.name FROM public.profiles p WHERE p.id = v_uid),
              'PIN supervisor salah 5 kali. Permintaan persetujuan dikunci 15 menit.', v_store);
    END IF;

    RETURN jsonb_build_object(
      'approval_id', NULL,
      'remaining_attempts', greatest(c_max_failures - v_attempt.failed_count, 0)
    );
  END IF;

  UPDATE public.supervisor_pin_attempts
  SET failed_count = 0, window_started_at = now(), locked_until = NULL
  WHERE user_id = v_uid;

  INSERT INTO public.supervisor_approvals (action, store_id, requested_by, approved_by, max_amount, transaction_id)
  VALUES (p_action, v_store, v_uid, v_approver, p_max_amount, p_transaction_id)
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('approval_id', v_id, 'approver_name', v_approver_name);
END;
$$;

-- 7. Penjaga di tabel transaksi -------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_supervisor_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role text := public.get_my_role();
  v_needed text;
  v_rate numeric;
  v_auto numeric;
  v_manual numeric;
  v_approval public.supervisor_approvals%ROWTYPE;
  v_label text;
BEGIN
  -- Admin, Super Admin, dan proses server (service role / SQL) tidak perlu PIN.
  IF v_role IS DISTINCT FROM 'Kasir' THEN
    RETURN NEW;
  END IF;

  v_manual := coalesce(NEW.discount, 0) - coalesce(NEW."discountBalanceUsed", 0);

  -- Kirim ulang transaksi yang sama (retry jaringan): biarkan unique index
  -- "idempotencyKey" yang menolaknya, supaya browser mengenalinya sebagai duplikat.
  IF TG_OP = 'INSERT' AND NEW."idempotencyKey" IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.transactions t WHERE t."idempotencyKey" = NEW."idempotencyKey"
  ) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT coalesce(s."discountRate", 0) INTO v_rate
    FROM public.settings s
    WHERE s."storeId" = NEW."storeId" OR s."storeId" IS NULL
    ORDER BY s."storeId" NULLS LAST
    LIMIT 1;
    v_auto := round(coalesce(NEW.subtotal, 0) * coalesce(v_rate, 0) / 100);
    -- Toleransi Rp1 untuk pembulatan di browser.
    IF v_manual > v_auto + 1 THEN
      v_needed := 'manual_discount';
    END IF;
  ELSE
    IF NEW.discount IS DISTINCT FROM OLD.discount THEN
      v_needed := 'manual_discount';
    END IF;
    IF OLD."paymentStatus" = 'Lunas' AND (
         NEW."paymentStatus" IS DISTINCT FROM OLD."paymentStatus"
      OR NEW."paymentMethod" IS DISTINCT FROM OLD."paymentMethod"
      OR NEW."amountPaid" IS DISTINCT FROM OLD."amountPaid"
      OR NEW."change" IS DISTINCT FROM OLD."change"
    ) THEN
      IF v_needed IS NOT NULL THEN
        RAISE EXCEPTION 'Ubah diskon dan pembayaran secara terpisah, masing-masing dengan PIN supervisor.'
          USING ERRCODE = '42501';
      END IF;
      v_needed := 'edit_paid';
    END IF;
  END IF;

  IF v_needed IS NULL THEN
    -- Kasir tidak boleh mengisi/mengubah penanda izin sendiri.
    IF TG_OP = 'INSERT' THEN
      NEW."supervisorApprovalId" := NULL;
    ELSE
      NEW."supervisorApprovalId" := OLD."supervisorApprovalId";
    END IF;
    RETURN NEW;
  END IF;

  IF NEW."supervisorApprovalId" IS NULL
     OR (TG_OP = 'UPDATE' AND NEW."supervisorApprovalId" IS NOT DISTINCT FROM OLD."supervisorApprovalId") THEN
    RAISE EXCEPTION '%',
      CASE v_needed
        WHEN 'manual_discount' THEN 'Diskon manual memerlukan PIN supervisor.'
        ELSE 'Mengubah pembayaran transaksi yang sudah lunas memerlukan PIN supervisor.'
      END
      USING ERRCODE = '42501', HINT = 'SUPERVISOR_APPROVAL_REQUIRED:' || v_needed;
  END IF;

  SELECT * INTO v_approval
  FROM public.supervisor_approvals a
  WHERE a.id = NEW."supervisorApprovalId"
  FOR UPDATE;

  IF NOT FOUND
     OR v_approval.used_at IS NOT NULL
     OR v_approval.expires_at < now()
     OR v_approval.requested_by IS DISTINCT FROM auth.uid()
     OR v_approval.action <> v_needed
     OR v_approval.store_id IS DISTINCT FROM NEW."storeId"
     OR (v_approval.transaction_id IS NOT NULL AND v_approval.transaction_id <> NEW.id) THEN
    RAISE EXCEPTION 'Persetujuan supervisor tidak berlaku atau sudah kedaluwarsa. Minta PIN lagi.'
      USING ERRCODE = '42501', HINT = 'SUPERVISOR_APPROVAL_INVALID';
  END IF;

  IF v_needed = 'manual_discount' AND v_approval.max_amount IS NOT NULL
     AND v_manual > v_approval.max_amount + 1 THEN
    RAISE EXCEPTION 'Diskon Rp% melebihi jumlah yang disetujui supervisor (Rp%).',
      v_manual, v_approval.max_amount
      USING ERRCODE = '42501', HINT = 'SUPERVISOR_APPROVAL_INVALID';
  END IF;

  UPDATE public.supervisor_approvals
  SET used_at = now(), transaction_id = NEW.id
  WHERE id = v_approval.id;

  v_label := CASE v_needed
    WHEN 'manual_discount' THEN format('Diskon manual Rp%s', to_char(v_manual, 'FM999G999G999'))
    ELSE 'Perubahan pembayaran nota lunas'
  END;

  INSERT INTO public.audit_logs ("user", action, "storeId")
  VALUES (
    (SELECT p.name FROM public.profiles p WHERE p.id = auth.uid()),
    format('%s pada transaksi %s disetujui PIN supervisor %s.',
      v_label,
      coalesce(NEW."invoiceCode", NEW.id::text),
      coalesce((SELECT p.name FROM public.profiles p WHERE p.id = v_approval.approved_by), '-')),
    NEW."storeId"
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_supervisor_approval
  BEFORE INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_supervisor_approval();

-- 8. Hak akses fungsi -----------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.set_my_supervisor_pin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_supervisor_pin(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_my_supervisor_pin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_my_supervisor_pin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.request_supervisor_approval(text, text, numeric, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.request_supervisor_approval(text, text, numeric, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_supervisor_approval() FROM PUBLIC, anon, authenticated;

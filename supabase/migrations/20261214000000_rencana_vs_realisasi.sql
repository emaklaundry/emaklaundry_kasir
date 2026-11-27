-- ============================================================================
-- Rencana vs Realisasi: target bisnis per cabang & RPC perbandingan dengan data nyata
-- ============================================================================
-- 1. Tabel business_targets: asumsi rencana per cabang (volume, harga, biaya
--    tetap, % HPP, modal). period NULL = target default (berlaku untuk semua
--    bulan); period = hari pertama bulan = target khusus bulan itu.
--    Hanya Super Admin yang boleh menulis; Admin cabang hanya membaca.
-- 2. target_cost_line(): memetakan kategori pengeluaran ke baris biaya target.
-- 3. upsert_business_target(): simpan target (SECURITY INVOKER -> RLS berlaku).
-- 4. get_target_vs_actual(): angka nyata bulan berjalan (volume, omzet, uang
--    masuk, biaya, belanja aset) + harian + akumulasi sejak start_date.
--    Memakai report_expense_lines() dari laporan keuangan.
-- Aman dijalankan ulang.
-- ============================================================================

-- ---------- 1. Tabel target ----------
CREATE TABLE IF NOT EXISTS public.business_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  period date,
  start_date date,
  investment numeric NOT NULL DEFAULT 0 CHECK (investment >= 0),
  kiloan_kg_per_day numeric NOT NULL DEFAULT 0 CHECK (kiloan_kg_per_day >= 0),
  kiloan_price numeric NOT NULL DEFAULT 0 CHECK (kiloan_price >= 0),
  satuan_pcs_per_day numeric NOT NULL DEFAULT 0 CHECK (satuan_pcs_per_day >= 0),
  satuan_price numeric NOT NULL DEFAULT 0 CHECK (satuan_price >= 0),
  sepatu_pairs_per_day numeric NOT NULL DEFAULT 0 CHECK (sepatu_pairs_per_day >= 0),
  sepatu_price numeric NOT NULL DEFAULT 0 CHECK (sepatu_price >= 0),
  karpet_m2_per_month numeric NOT NULL DEFAULT 0 CHECK (karpet_m2_per_month >= 0),
  karpet_price numeric NOT NULL DEFAULT 0 CHECK (karpet_price >= 0),
  cost_salary numeric NOT NULL DEFAULT 0 CHECK (cost_salary >= 0),
  cost_rent numeric NOT NULL DEFAULT 0 CHECK (cost_rent >= 0),
  cost_utilities numeric NOT NULL DEFAULT 0 CHECK (cost_utilities >= 0),
  cost_marketing numeric NOT NULL DEFAULT 0 CHECK (cost_marketing >= 0),
  cost_other numeric NOT NULL DEFAULT 0 CHECK (cost_other >= 0),
  hpp_kiloan_pct numeric NOT NULL DEFAULT 0 CHECK (hpp_kiloan_pct >= 0),
  hpp_satuan_pct numeric NOT NULL DEFAULT 0 CHECK (hpp_satuan_pct >= 0),
  hpp_sepatu_pct numeric NOT NULL DEFAULT 0 CHECK (hpp_sepatu_pct >= 0),
  hpp_karpet_pct numeric NOT NULL DEFAULT 0 CHECK (hpp_karpet_pct >= 0),
  notes text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT business_targets_period_first_day
    CHECK (period IS NULL OR extract(day FROM period) = 1),
  CONSTRAINT business_targets_store_period_key
    UNIQUE NULLS NOT DISTINCT (store_id, period)
);

COMMENT ON TABLE public.business_targets IS
  'Target/rencana bisnis per cabang. period NULL = default; period = tgl 1 bulan = target khusus bulan itu.';

ALTER TABLE public.business_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Baca target bisnis" ON public.business_targets;
CREATE POLICY "Baca target bisnis" ON public.business_targets
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin'
        AND store_id = (SELECT public.get_my_store_id()))
  );

DROP POLICY IF EXISTS "Super Admin tambah target bisnis" ON public.business_targets;
CREATE POLICY "Super Admin tambah target bisnis" ON public.business_targets
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.get_my_role()) = 'Super Admin');

DROP POLICY IF EXISTS "Super Admin ubah target bisnis" ON public.business_targets;
CREATE POLICY "Super Admin ubah target bisnis" ON public.business_targets
  FOR UPDATE TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin')
  WITH CHECK ((SELECT public.get_my_role()) = 'Super Admin');

DROP POLICY IF EXISTS "Super Admin hapus target bisnis" ON public.business_targets;
CREATE POLICY "Super Admin hapus target bisnis" ON public.business_targets
  FOR DELETE TO authenticated
  USING ((SELECT public.get_my_role()) = 'Super Admin');

REVOKE ALL ON public.business_targets FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_targets TO authenticated;

-- ---------- 2. Pemetaan kategori pengeluaran -> baris biaya target ----------
CREATE OR REPLACE FUNCTION public.target_cost_line(p_category text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE p_category
    WHEN 'Bahan Baku' THEN 'hpp'
    WHEN 'Perlengkapan' THEN 'hpp'
    WHEN 'Gaji' THEN 'salary'
    WHEN 'Sewa Tempat' THEN 'rent'
    WHEN 'Listrik' THEN 'utilities'
    WHEN 'Air' THEN 'utilities'
    WHEN 'Marketing & Promosi' THEN 'marketing'
    WHEN 'Pemeliharaan' THEN 'marketing'
    WHEN 'Pemeliharaan Aset' THEN 'marketing'
    WHEN 'Perawatan Aset' THEN 'marketing'
    WHEN 'Aset / Inventaris' THEN 'capex'
    WHEN 'Pembelian Aset' THEN 'capex'
    ELSE 'other'
  END;
$$;

-- ---------- 3. Simpan target ----------
-- p_data berkunci nama kolom; kunci yang tidak dikirim mempertahankan nilai lama
-- (atau 0 untuk baris baru). id/store_id/period/updated_* selalu diisi server.
CREATE OR REPLACE FUNCTION public.upsert_business_target(
  p_store_id uuid, p_period date, p_data jsonb
) RETURNS public.business_targets
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  v_period date := CASE WHEN p_period IS NULL THEN NULL
                        ELSE date_trunc('month', p_period)::date END;
  v_old jsonb;
  r public.business_targets;
  v_row public.business_targets;
BEGIN
  SELECT to_jsonb(b) INTO v_old
  FROM public.business_targets b
  WHERE b.store_id = p_store_id AND b.period IS NOT DISTINCT FROM v_period;

  r := jsonb_populate_record(
    NULL::public.business_targets,
    COALESCE(v_old, '{}'::jsonb) || COALESCE(p_data, '{}'::jsonb)
  );

  INSERT INTO public.business_targets AS t (
    store_id, period, start_date, investment,
    kiloan_kg_per_day, kiloan_price, satuan_pcs_per_day, satuan_price,
    sepatu_pairs_per_day, sepatu_price, karpet_m2_per_month, karpet_price,
    cost_salary, cost_rent, cost_utilities, cost_marketing, cost_other,
    hpp_kiloan_pct, hpp_satuan_pct, hpp_sepatu_pct, hpp_karpet_pct,
    notes, updated_at, updated_by
  ) VALUES (
    p_store_id, v_period, r.start_date, COALESCE(r.investment, 0),
    COALESCE(r.kiloan_kg_per_day, 0), COALESCE(r.kiloan_price, 0),
    COALESCE(r.satuan_pcs_per_day, 0), COALESCE(r.satuan_price, 0),
    COALESCE(r.sepatu_pairs_per_day, 0), COALESCE(r.sepatu_price, 0),
    COALESCE(r.karpet_m2_per_month, 0), COALESCE(r.karpet_price, 0),
    COALESCE(r.cost_salary, 0), COALESCE(r.cost_rent, 0),
    COALESCE(r.cost_utilities, 0), COALESCE(r.cost_marketing, 0),
    COALESCE(r.cost_other, 0),
    COALESCE(r.hpp_kiloan_pct, 0), COALESCE(r.hpp_satuan_pct, 0),
    COALESCE(r.hpp_sepatu_pct, 0), COALESCE(r.hpp_karpet_pct, 0),
    r.notes, now(), auth.uid()
  )
  ON CONFLICT (store_id, period) DO UPDATE SET
    start_date = EXCLUDED.start_date,
    investment = EXCLUDED.investment,
    kiloan_kg_per_day = EXCLUDED.kiloan_kg_per_day,
    kiloan_price = EXCLUDED.kiloan_price,
    satuan_pcs_per_day = EXCLUDED.satuan_pcs_per_day,
    satuan_price = EXCLUDED.satuan_price,
    sepatu_pairs_per_day = EXCLUDED.sepatu_pairs_per_day,
    sepatu_price = EXCLUDED.sepatu_price,
    karpet_m2_per_month = EXCLUDED.karpet_m2_per_month,
    karpet_price = EXCLUDED.karpet_price,
    cost_salary = EXCLUDED.cost_salary,
    cost_rent = EXCLUDED.cost_rent,
    cost_utilities = EXCLUDED.cost_utilities,
    cost_marketing = EXCLUDED.cost_marketing,
    cost_other = EXCLUDED.cost_other,
    hpp_kiloan_pct = EXCLUDED.hpp_kiloan_pct,
    hpp_satuan_pct = EXCLUDED.hpp_satuan_pct,
    hpp_sepatu_pct = EXCLUDED.hpp_sepatu_pct,
    hpp_karpet_pct = EXCLUDED.hpp_karpet_pct,
    notes = EXCLUDED.notes,
    updated_at = now(),
    updated_by = auth.uid()
  RETURNING t.* INTO v_row;

  RETURN v_row;
END;
$$;

-- ---------- 4. Target vs nyata ----------
CREATE OR REPLACE FUNCTION public.get_target_vs_actual(
  p_store_id uuid,
  p_month date,
  p_as_of date,
  p_tz text DEFAULT 'Asia/Jakarta'
) RETURNS jsonb
LANGUAGE plpgsql STABLE
SET search_path = ''
AS $$
DECLARE
  v_start date;
  v_month_end date;
  v_as_of date;
  v_end date;
  v_targets jsonb;
  v_daily jsonb := '[]'::jsonb;
  v_since jsonb := NULL;
  v_start_date date;
  v_s timestamptz;
  v_e timestamptz;
  v_kg numeric := 0; v_pcs numeric := 0; v_pairs numeric := 0; v_m2 numeric := 0;
  v_rev_kiloan numeric := 0; v_rev_satuan numeric := 0; v_rev_shoes numeric := 0;
  v_rev_carpet numeric := 0; v_rev_other numeric := 0;
  v_collected numeric := 0;
  v_hpp numeric := 0; v_salary numeric := 0; v_rent numeric := 0;
  v_util numeric := 0; v_mkt numeric := 0; v_other numeric := 0; v_capex numeric := 0;
  v_since_collected numeric;
  v_since_costs numeric;
  v_since_capex numeric;
BEGIN
  IF COALESCE(public.get_my_role(), '') NOT IN ('Super Admin', 'Admin') THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat melihat target vs realisasi' USING ERRCODE = '42501';
  END IF;
  IF p_month IS NULL THEN
    RAISE EXCEPTION 'Bulan tidak valid' USING ERRCODE = '22023';
  END IF;

  v_start := date_trunc('month', p_month)::date;
  v_month_end := (v_start + interval '1 month' - interval '1 day')::date;
  v_as_of := COALESCE(p_as_of, v_month_end);
  v_end := LEAST(v_as_of, v_month_end);

  -- Target efektif per cabang: baris bulan itu bila ada, selain itu default.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'storeId', x.store_id, 'isDefault', x.period IS NULL, 'row', x.j
         ) ORDER BY x.store_id), '[]'::jsonb)
  INTO v_targets
  FROM (
    SELECT DISTINCT ON (bt.store_id) bt.store_id, bt.period, to_jsonb(bt) AS j
    FROM public.business_targets bt
    WHERE (p_store_id IS NULL OR bt.store_id = p_store_id)
      AND (bt.period = v_start OR bt.period IS NULL)
    ORDER BY bt.store_id, bt.period NULLS LAST
  ) x;

  IF v_end >= v_start THEN
    v_s := v_start::timestamp AT TIME ZONE p_tz;
    v_e := (v_end + 1)::timestamp AT TIME ZONE p_tz;

    WITH tx AS (
      SELECT t.items
      FROM public.transactions t
      WHERE t."createdAt" >= v_s AND t."createdAt" < v_e
        AND (p_store_id IS NULL OR t."storeId" = p_store_id)
    ),
    it AS (
      SELECT COALESCE(s.category::text,
               CASE WHEN lower(btrim(COALESCE(i ->> 'unit', ''))) = 'kg' THEN 'Kiloan'
                    WHEN lower(btrim(COALESCE(i ->> 'unit', ''))) IN ('m2', 'm²', 'meter') THEN 'Karpet'
                    ELSE 'Lainnya' END) AS cat,
             lower(btrim(COALESCE(i ->> 'unit', s.unit))) AS unit,
             public.report_safe_numeric(i -> 'subtotal') AS subtotal,
             public.report_safe_numeric(i -> 'quantity') AS qty
      FROM tx
      CROSS JOIN LATERAL jsonb_array_elements(
        CASE WHEN jsonb_typeof(tx.items) = 'array' THEN tx.items ELSE '[]'::jsonb END
      ) AS i
      LEFT JOIN public.services s ON s.id::text = i ->> 'serviceId'
    )
    SELECT
      COALESCE(sum(qty) FILTER (WHERE cat = 'Kiloan' AND unit = 'kg'), 0),
      COALESCE(sum(qty) FILTER (WHERE cat = 'Satuan'), 0),
      COALESCE(sum(qty) FILTER (WHERE cat = 'Sepatu'), 0),
      COALESCE(sum(qty) FILTER (WHERE cat = 'Karpet' AND unit IN ('m2', 'm²', 'meter')), 0),
      COALESCE(sum(subtotal) FILTER (WHERE cat = 'Kiloan'), 0),
      COALESCE(sum(subtotal) FILTER (WHERE cat = 'Satuan'), 0),
      COALESCE(sum(subtotal) FILTER (WHERE cat = 'Sepatu'), 0),
      COALESCE(sum(subtotal) FILTER (WHERE cat = 'Karpet'), 0),
      COALESCE(sum(subtotal) FILTER (WHERE cat NOT IN ('Kiloan', 'Satuan', 'Sepatu', 'Karpet')), 0)
    INTO v_kg, v_pcs, v_pairs, v_m2,
         v_rev_kiloan, v_rev_satuan, v_rev_shoes, v_rev_carpet, v_rev_other
    FROM it;

    SELECT COALESCE(sum(p.amount), 0) INTO v_collected
    FROM public.transaction_payments p
    WHERE p."paidAt" >= v_s AND p."paidAt" < v_e
      AND (p_store_id IS NULL OR p."storeId" = p_store_id);

    SELECT
      COALESCE(sum(c.amount) FILTER (WHERE c.line = 'hpp'), 0),
      COALESCE(sum(c.amount) FILTER (WHERE c.line = 'salary'), 0),
      COALESCE(sum(c.amount) FILTER (WHERE c.line = 'rent'), 0),
      COALESCE(sum(c.amount) FILTER (WHERE c.line = 'utilities'), 0),
      COALESCE(sum(c.amount) FILTER (WHERE c.line = 'marketing'), 0),
      COALESCE(sum(c.amount) FILTER (WHERE c.line = 'other'), 0),
      COALESCE(sum(c.amount) FILTER (WHERE c.line = 'capex'), 0)
    INTO v_hpp, v_salary, v_rent, v_util, v_mkt, v_other, v_capex
    FROM (SELECT l.amount, public.target_cost_line(l.category) AS line
          FROM public.report_expense_lines(p_store_id, v_start, v_end, p_tz) l) c;

    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'date', d.day, 'gross', COALESCE(g.gross, 0), 'collected', COALESCE(c.collected, 0)
           ) ORDER BY d.day), '[]'::jsonb)
    INTO v_daily
    FROM (SELECT gs::date AS day
          FROM generate_series(v_start::timestamp, v_end::timestamp, interval '1 day') AS gs) d
    LEFT JOIN (
      SELECT (t."createdAt" AT TIME ZONE p_tz)::date AS day, sum(t.total) AS gross
      FROM public.transactions t
      WHERE t."createdAt" >= v_s AND t."createdAt" < v_e
        AND (p_store_id IS NULL OR t."storeId" = p_store_id)
      GROUP BY 1
    ) g ON g.day = d.day
    LEFT JOIN (
      SELECT (p."paidAt" AT TIME ZONE p_tz)::date AS day, sum(p.amount) AS collected
      FROM public.transaction_payments p
      WHERE p."paidAt" >= v_s AND p."paidAt" < v_e
        AND (p_store_id IS NULL OR p."storeId" = p_store_id)
      GROUP BY 1
    ) c ON c.day = d.day;
  END IF;

  -- Akumulasi sejak tanggal mulai usaha (hanya untuk satu cabang).
  IF p_store_id IS NOT NULL THEN
    v_start_date := (v_targets -> 0 -> 'row' ->> 'start_date')::date;
    -- Target bulanan (override) tanpa start_date: pakai start_date dari target default.
    IF v_start_date IS NULL THEN
      SELECT bt.start_date INTO v_start_date
      FROM public.business_targets bt
      WHERE bt.store_id = p_store_id AND bt.period IS NULL;
    END IF;
    IF v_start_date IS NOT NULL THEN
      IF v_start_date > v_as_of THEN
        v_since_collected := 0; v_since_costs := 0; v_since_capex := 0;
      ELSE
        SELECT COALESCE(sum(p.amount), 0) INTO v_since_collected
        FROM public.transaction_payments p
        WHERE p."paidAt" >= (v_start_date::timestamp AT TIME ZONE p_tz)
          AND p."paidAt" < ((v_as_of + 1)::timestamp AT TIME ZONE p_tz)
          AND p."storeId" = p_store_id;

        SELECT COALESCE(sum(c.amount) FILTER (WHERE c.line <> 'capex'), 0),
               COALESCE(sum(c.amount) FILTER (WHERE c.line = 'capex'), 0)
        INTO v_since_costs, v_since_capex
        FROM (SELECT l.amount, public.target_cost_line(l.category) AS line
              FROM public.report_expense_lines(p_store_id, v_start_date, v_as_of, p_tz) l) c;
      END IF;
      v_since := jsonb_build_object(
        'startDate', v_start_date,
        'operatingProfit', v_since_collected - v_since_costs,
        'capex', v_since_capex
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'month', v_start,
    'asOf', v_as_of,
    'targets', v_targets,
    'actual', jsonb_build_object(
      'volume', jsonb_build_object(
        'kiloanKg', v_kg, 'satuanPcs', v_pcs, 'shoesPairs', v_pairs, 'carpetM2', v_m2),
      'revenue', jsonb_build_object(
        'kiloan', v_rev_kiloan, 'satuan', v_rev_satuan, 'shoes', v_rev_shoes,
        'carpet', v_rev_carpet, 'other', v_rev_other,
        'total', v_rev_kiloan + v_rev_satuan + v_rev_shoes + v_rev_carpet + v_rev_other),
      'collected', v_collected,
      'costs', jsonb_build_object(
        'hpp', v_hpp, 'salary', v_salary, 'rent', v_rent, 'utilities', v_util,
        'marketing', v_mkt, 'other', v_other,
        'total', v_hpp + v_salary + v_rent + v_util + v_mkt + v_other),
      'capex', v_capex
    ),
    'daily', v_daily,
    'sinceStart', v_since
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upsert_business_target(uuid, date, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_business_target(uuid, date, jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.target_cost_line(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.target_cost_line(text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_target_vs_actual(uuid, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_target_vs_actual(uuid, date, date, text) TO authenticated;

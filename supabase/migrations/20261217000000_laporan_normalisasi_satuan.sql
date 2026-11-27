-- Polish Rencana vs Realisasi:
--  1) get_financial_report: pengelompokan layanan terhapus memakai satuan yang dinormalisasi
--     (lower(btrim(unit))), sama seperti get_target_vs_actual.
--  2) upsert_business_target: penggabungan atomik lewat advisory lock per (cabang, periode).
-- Idempoten (CREATE OR REPLACE); hak akses fungsi tidak berubah.

CREATE OR REPLACE FUNCTION public.get_financial_report(
  p_store_id uuid,
  p_start date,
  p_end date,
  p_prev_start date DEFAULT NULL,
  p_prev_end date DEFAULT NULL,
  p_tz text DEFAULT 'Asia/Jakarta'
) RETURNS jsonb
LANGUAGE plpgsql STABLE
SET search_path = ''
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF COALESCE(public.get_my_role(), '') NOT IN ('Super Admin', 'Admin') THEN
    RAISE EXCEPTION 'Hanya Admin yang dapat melihat laporan keuangan' USING ERRCODE = '42501';
  END IF;
  IF p_start IS NULL OR p_end IS NULL OR p_start > p_end THEN
    RAISE EXCEPTION 'Rentang tanggal tidak valid' USING ERRCODE = '22023';
  END IF;

  WITH b AS (
    SELECT (p_start::timestamp AT TIME ZONE p_tz) AS s,
           ((p_end + 1)::timestamp AT TIME ZONE p_tz) AS e
  ),
  tx AS (
    SELECT t.*,
           public.transaction_collected_amount(t."paymentStatus", t.total, t."amountPaid") AS collected,
           (t."createdAt" AT TIME ZONE p_tz)::date AS day
    FROM public.transactions t, b
    WHERE t."createdAt" >= b.s AND t."createdAt" < b.e
      AND (p_store_id IS NULL OR t."storeId" = p_store_id)
  ),
  pay AS (
    SELECT p.*, (p."paidAt" AT TIME ZONE p_tz)::date AS day
    FROM public.transaction_payments p, b
    WHERE p."paidAt" >= b.s AND p."paidAt" < b.e
      AND (p_store_id IS NULL OR p."storeId" = p_store_id)
  ),
  ex AS (
    SELECT * FROM public.report_expense_lines(p_store_id, p_start, p_end, p_tz)
  ),
  items AS (
    SELECT i ->> 'serviceId' AS sid,
           i ->> 'serviceName' AS sname,
           i ->> 'unit' AS unit,
           public.report_safe_numeric(i -> 'subtotal') AS subtotal,
           public.report_safe_numeric(i -> 'quantity') AS qty
    FROM tx
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(tx.items) = 'array' THEN tx.items ELSE '[]'::jsonb END
    ) AS i
  ),
  svc AS (
    SELECT it.sid,
           COALESCE(max(s.name), max(it.sname), 'Layanan Dihapus') AS name,
           COALESCE(max(s.category::text), '-') AS category,
           COALESCE(max(s.unit), max(it.unit), 'unit') AS unit,
           COALESCE(max(s.category::text),
             CASE WHEN lower(btrim(COALESCE(max(it.unit), ''))) = 'kg' THEN 'Kiloan'
                  WHEN lower(btrim(COALESCE(max(it.unit), ''))) IN ('m2', 'm²', 'meter') THEN 'Karpet'
                  ELSE 'Lainnya' END) AS group_category,
           sum(it.qty) AS quantity,
           sum(it.subtotal) AS revenue
    FROM items it
    LEFT JOIN public.services s ON s.id::text = it.sid
    GROUP BY it.sid
  ),
  tx_d AS (SELECT day, sum(total) AS gross, count(*) AS n FROM tx GROUP BY day),
  pay_d AS (SELECT day, sum(amount) AS revenue FROM pay GROUP BY day),
  ex_d AS (SELECT date AS day, sum(amount) AS expenses FROM ex GROUP BY date),
  daily AS (
    SELECT COALESCE(t.day, p.day, e.day) AS day,
           COALESCE(p.revenue, 0) AS revenue,
           COALESCE(e.expenses, 0) AS expenses,
           COALESCE(t.gross, 0) AS gross,
           COALESCE(t.n, 0) AS n
    FROM tx_d t
    FULL JOIN pay_d p ON p.day = t.day
    FULL JOIN ex_d e ON e.day = COALESCE(t.day, p.day)
  )
  SELECT jsonb_build_object(
    'summary', public.financial_report_summary(p_store_id, p_start, p_end, p_tz),
    'previous', CASE WHEN p_prev_start IS NOT NULL AND p_prev_end IS NOT NULL
                       AND p_prev_start <= p_prev_end
                     THEN public.financial_report_summary(p_store_id, p_prev_start, p_prev_end, p_tz)
                END,
    'daily', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'date', d.day, 'revenue', d.revenue, 'expenses', d.expenses,
               'gross', d.gross, 'count', d.n
             ) ORDER BY d.day)
      FROM daily d WHERE d.day IS NOT NULL), '[]'::jsonb),
    'services', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'serviceId', sid, 'name', name, 'category', category, 'unit', unit,
               'quantity', round(quantity, 2), 'revenue', revenue
             ) ORDER BY revenue DESC, name)
      FROM svc), '[]'::jsonb),
    'categories', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('category', group_category, 'revenue', revenue)
                       ORDER BY revenue DESC)
      FROM (SELECT group_category, sum(revenue) AS revenue FROM svc
            GROUP BY group_category HAVING sum(revenue) > 0) c), '[]'::jsonb),
    'paymentMethods', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('method', method, 'count', n, 'amount', amount)
                       ORDER BY amount DESC)
      FROM (SELECT COALESCE(pay."paymentMethod", 'Tidak Tercatat') AS method,
                   count(DISTINCT pay."transactionId") AS n,
                   sum(pay.amount) AS amount
            FROM pay GROUP BY 1 HAVING abs(sum(pay.amount)) >= 0.5) m), '[]'::jsonb),
    'cashiers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'userId', uid, 'name', name, 'transactionCount', n, 'totalRevenue', amount
             ) ORDER BY amount DESC)
      FROM (SELECT COALESCE(tx."createdByUserId"::text, '__none__') AS uid,
                   COALESCE(max(pr.name),
                     CASE WHEN tx."createdByUserId" IS NULL THEN 'Tanpa Kasir'
                          ELSE 'Pengguna Tidak Dikenal' END) AS name,
                   count(*) AS n, sum(tx.total) AS amount
            FROM tx LEFT JOIN public.profiles pr ON pr.id = tx."createdByUserId"
            GROUP BY tx."createdByUserId") c), '[]'::jsonb),
    'customers', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'customerId', cid, 'name', name, 'count', n, 'total', amount
             ) ORDER BY amount DESC)
      FROM (SELECT COALESCE(tx."customerId"::text, '__umum__') AS cid,
                   COALESCE(max(cu.name),
                     CASE WHEN tx."customerId" IS NULL THEN 'Umum'
                          ELSE 'Pelanggan Terhapus' END) AS name,
                   count(*) AS n, sum(tx.total) AS amount
            FROM tx LEFT JOIN public.customers cu ON cu.id = tx."customerId"
            GROUP BY tx."customerId"
            ORDER BY sum(tx.total) DESC
            LIMIT 5) c), '[]'::jsonb),
    'stores', CASE WHEN p_store_id IS NULL THEN COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'storeId', sid, 'name', name, 'count', n, 'gross', gross,
               'collected', collected, 'expenses', expenses,
               'net', collected - expenses
             ) ORDER BY collected DESC)
      FROM (
        SELECT k.sid,
               COALESCE(st.name, 'Tanpa Cabang') AS name,
               COALESCE((SELECT count(*) FROM tx WHERE tx."storeId" IS NOT DISTINCT FROM k.sid), 0) AS n,
               COALESCE((SELECT sum(total) FROM tx WHERE tx."storeId" IS NOT DISTINCT FROM k.sid), 0) AS gross,
               COALESCE((SELECT sum(amount) FROM pay WHERE pay."storeId" IS NOT DISTINCT FROM k.sid), 0) AS collected,
               COALESCE((SELECT sum(amount) FROM ex WHERE ex."storeId" IS NOT DISTINCT FROM k.sid), 0) AS expenses
        FROM (SELECT "storeId" AS sid FROM tx UNION SELECT "storeId" FROM pay
              UNION SELECT "storeId" FROM ex) k
        LEFT JOIN public.stores st ON st.id = k.sid
      ) s), '[]'::jsonb) END,
    'receivables', COALESCE((
      SELECT jsonb_agg(r ORDER BY r ->> 'createdAt')
      FROM (
        SELECT jsonb_build_object(
                 'id', tx.id, 'invoiceCode', tx."invoiceCode",
                 'customerName', COALESCE(cu.name, CASE WHEN tx."customerId" IS NULL THEN 'Umum' ELSE 'Pelanggan Terhapus' END),
                 'total', tx.total, 'paid', tx.collected,
                 'outstanding', tx.total - tx.collected,
                 'createdAt', tx."createdAt",
                 'ageDays', ((now() AT TIME ZONE p_tz)::date - tx.day),
                 'orderStatus', tx."orderStatus"
               ) AS r
        FROM tx LEFT JOIN public.customers cu ON cu.id = tx."customerId"
        WHERE tx.total - tx.collected > 0.5
        ORDER BY tx."createdAt"
        LIMIT 200
      ) x), '[]'::jsonb),
    'expenses', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', ex.id, 'date', ex.date, 'description', ex.description,
               'category', ex.category, 'amount', ex.amount, 'storeId', ex."storeId"
             ) ORDER BY ex.date DESC, ex.description)
      FROM ex), '[]'::jsonb)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

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
  -- Serialkan penyimpan untuk (cabang, periode) yang sama: penggabungan kunci
  -- parsial dengan baris lama harus atomik.
  PERFORM pg_advisory_xact_lock(hashtext(p_store_id::text || COALESCE(v_period::text, 'default')));

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

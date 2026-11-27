-- ============================================================================
-- Laporan keuangan: riwayat pembayaran + RPC laporan di server
-- ============================================================================
-- 1. Tabel transaction_payments: setiap kenaikan/penurunan uang yang diterima
--    sebuah nota dicatat sebagai satu baris dengan TANGGAL BAYAR-nya.
--    Diisi otomatis oleh trigger di transactions (semua jalur: kasir, pelunasan,
--    RPC, sinkron offline, restore backup), jadi aplikasi tidak perlu diubah.
--    Uang diterima per nota = total bila Lunas, selain itu min(amountPaid, total)
--    (sama dengan Dashboard; kembalian tidak dihitung).
--    Data lama di-backfill dengan tanggal bayar = tanggal nota dibuat (riwayat
--    pelunasan sebelum tabel ini ada memang tidak tersimpan).
-- 2. report_expense_lines(): pengeluaran + pembelian & perawatan aset dari tabel
--    assets yang belum tercatat di expenses (deskripsi & tanggal sama persis).
-- 3. get_financial_report(): seluruh agregasi halaman Laporan dihitung di
--    database sehingga browser hanya menerima angka akhirnya.
--    SECURITY INVOKER → RLS tetap berlaku; hanya Admin & Super Admin.
-- Aman dijalankan ulang.
-- ============================================================================

-- ---------- 1. Riwayat pembayaran ----------
CREATE TABLE IF NOT EXISTS public.transaction_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "transactionId" uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  "storeId" uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  "paymentMethod" text,
  "paidAt" timestamptz NOT NULL DEFAULT now(),
  "recordedByUserId" uuid,
  source text NOT NULL DEFAULT 'pembayaran'
    CHECK (source IN ('pembayaran', 'koreksi', 'backfill'))
);

COMMENT ON TABLE public.transaction_payments IS
  'Riwayat uang diterima per nota (otomatis dari trigger transactions). amount negatif = koreksi.';

CREATE INDEX IF NOT EXISTS idx_transaction_payments_store_paid
  ON public.transaction_payments ("storeId", "paidAt");
CREATE INDEX IF NOT EXISTS idx_transaction_payments_paid
  ON public.transaction_payments ("paidAt");
CREATE INDEX IF NOT EXISTS idx_transaction_payments_tx
  ON public.transaction_payments ("transactionId");
CREATE INDEX IF NOT EXISTS idx_transactions_created_at
  ON public.transactions ("createdAt");

ALTER TABLE public.transaction_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow SELECT for Admins" ON public.transaction_payments;
CREATE POLICY "Allow SELECT for Admins" ON public.transaction_payments
  FOR SELECT TO authenticated
  USING (
    (SELECT public.get_my_role()) = 'Super Admin'
    OR ((SELECT public.get_my_role()) = 'Admin'
        AND "storeId" = (SELECT public.get_my_store_id()))
  );
-- Tidak ada policy INSERT/UPDATE/DELETE: hanya trigger yang menulis.
REVOKE ALL ON public.transaction_payments FROM anon, authenticated;
GRANT SELECT ON public.transaction_payments TO authenticated;

CREATE OR REPLACE FUNCTION public.transaction_collected_amount(
  p_status text, p_total numeric, p_amount_paid numeric
) RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_status = 'Lunas' THEN GREATEST(COALESCE(p_total, 0), 0)
    ELSE GREATEST(0, LEAST(COALESCE(p_amount_paid, 0), COALESCE(p_total, 0)))
  END;
$$;

-- Backfill sekali untuk nota yang belum punya riwayat
INSERT INTO public.transaction_payments
  ("transactionId", "storeId", amount, "paymentMethod", "paidAt", source)
SELECT t.id, t."storeId",
       public.transaction_collected_amount(t."paymentStatus", t.total, t."amountPaid"),
       t."paymentMethod", t."createdAt", 'backfill'
FROM public.transactions t
WHERE public.transaction_collected_amount(t."paymentStatus", t.total, t."amountPaid") > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.transaction_payments p WHERE p."transactionId" = t.id
  );

CREATE OR REPLACE FUNCTION public.record_transaction_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new numeric;
  v_old numeric := 0;
  v_delta numeric;
BEGIN
  v_new := public.transaction_collected_amount(NEW."paymentStatus", NEW.total, NEW."amountPaid");
  IF TG_OP = 'UPDATE' THEN
    v_old := public.transaction_collected_amount(OLD."paymentStatus", OLD.total, OLD."amountPaid");
  END IF;
  v_delta := v_new - v_old;

  IF abs(v_delta) < 0.5 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.transaction_payments
    ("transactionId", "storeId", amount, "paymentMethod", "paidAt", "recordedByUserId", source)
  VALUES (
    NEW.id,
    NEW."storeId",
    v_delta,
    NEW."paymentMethod",
    -- Nota baru (termasuk sinkron offline): dibayar saat nota dibuat.
    CASE WHEN TG_OP = 'INSERT' THEN COALESCE(NEW."createdAt", now()) ELSE now() END,
    auth.uid(),
    CASE WHEN v_delta < 0 THEN 'koreksi' ELSE 'pembayaran' END
  );
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_transaction_payment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS transactions_record_payment ON public.transactions;
CREATE TRIGGER transactions_record_payment
  AFTER INSERT OR UPDATE OF "amountPaid", total, "paymentStatus" ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.record_transaction_payment();

-- ---------- 2. Baris pengeluaran (termasuk aset) ----------
CREATE OR REPLACE FUNCTION public.report_safe_numeric(p jsonb)
RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p IS NULL THEN 0
    WHEN jsonb_typeof(p) = 'number' THEN (p #>> '{}')::numeric
    WHEN jsonb_typeof(p) = 'string' AND (p #>> '{}') ~ '^\s*-?[0-9]+(\.[0-9]+)?\s*$'
      THEN trim(p #>> '{}')::numeric
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.report_safe_date(p text, p_tz text)
RETURNS date
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN p::date
    WHEN p ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}[T ][0-9]{2}:[0-9]{2}' THEN (p::timestamptz AT TIME ZONE p_tz)::date
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.report_expense_lines(
  p_store_id uuid, p_start date, p_end date, p_tz text DEFAULT 'Asia/Jakarta'
) RETURNS TABLE (
  id text, date date, description text, category text, amount numeric, "storeId" uuid
)
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  WITH ex AS (
    SELECT e.id::text AS id, e.date, e.description, e.category,
           COALESCE(e.amount, 0) AS amount, e."storeId"
    FROM public.expenses e
    WHERE e.date BETWEEN p_start AND p_end
      AND (p_store_id IS NULL OR e."storeId" = p_store_id)
  ),
  asset_rows AS (
    SELECT 'asset-purchase-' || a.id::text AS id,
           a."purchaseDate" AS date,
           'Pembelian Aset: ' || a.name AS description,
           NULL::text AS alt_description,
           'Pembelian Aset'::text AS category,
           COALESCE(a."purchaseCost", 0) AS amount,
           a."storeId"
    FROM public.assets a
    WHERE a."purchaseDate" BETWEEN p_start AND p_end
      AND COALESCE(a."purchaseCost", 0) > 0
      AND (p_store_id IS NULL OR a."storeId" = p_store_id)
    UNION ALL
    SELECT 'asset-maint-' || a.id::text || '-' || l.ord::text,
           public.report_safe_date(l.log ->> 'date', p_tz),
           'Perawatan Aset: ' || a.name || ' (' || COALESCE(l.log ->> 'description', '') || ')',
           'Quick Maintenance: ' || a.name || ' (' || COALESCE(l.log ->> 'description', '') || ')',
           'Pemeliharaan Aset',
           public.report_safe_numeric(l.log -> 'cost'),
           a."storeId"
    FROM public.assets a
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(a."maintenanceHistory") = 'array' THEN a."maintenanceHistory"
           ELSE '[]'::jsonb END
    ) WITH ORDINALITY AS l(log, ord)
    WHERE (p_store_id IS NULL OR a."storeId" = p_store_id)
  )
  SELECT ex.id, ex.date, ex.description, ex.category, ex.amount, ex."storeId" FROM ex
  UNION ALL
  SELECT r.id, r.date, r.description, r.category, r.amount, r."storeId"
  FROM asset_rows r
  WHERE r.date BETWEEN p_start AND p_end
    AND r.amount > 0
    -- Sudah dicatat manual di expenses (format lama / Quick Maintenance) → jangan dobel.
    AND NOT EXISTS (
      SELECT 1 FROM ex
      WHERE ex.date = r.date
        AND (ex.description = r.description OR ex.description = r.alt_description)
    );
$$;

-- ---------- 3. Ringkasan & laporan lengkap ----------
CREATE OR REPLACE FUNCTION public.financial_report_summary(
  p_store_id uuid, p_start date, p_end date, p_tz text DEFAULT 'Asia/Jakarta'
) RETURNS jsonb
LANGUAGE sql STABLE
SET search_path = ''
AS $$
  WITH b AS (
    SELECT (p_start::timestamp AT TIME ZONE p_tz) AS s,
           ((p_end + 1)::timestamp AT TIME ZONE p_tz) AS e
  ),
  tx AS (
    SELECT t.total, t.discount,
           public.transaction_collected_amount(t."paymentStatus", t.total, t."amountPaid") AS collected
    FROM public.transactions t, b
    WHERE t."createdAt" >= b.s AND t."createdAt" < b.e
      AND (p_store_id IS NULL OR t."storeId" = p_store_id)
  ),
  pay AS (
    SELECT COALESCE(sum(p.amount), 0) AS amt
    FROM public.transaction_payments p, b
    WHERE p."paidAt" >= b.s AND p."paidAt" < b.e
      AND (p_store_id IS NULL OR p."storeId" = p_store_id)
  ),
  ex AS (
    SELECT COALESCE(sum(l.amount), 0) AS amt, count(*) AS n
    FROM public.report_expense_lines(p_store_id, p_start, p_end, p_tz) l
  )
  SELECT jsonb_build_object(
    'gross', (SELECT COALESCE(sum(total), 0) FROM tx),
    'discount', (SELECT COALESCE(sum(discount), 0) FROM tx),
    'count', (SELECT count(*) FROM tx),
    'receivable', (SELECT COALESCE(sum(GREATEST(total - collected, 0)), 0) FROM tx),
    'unpaidCount', (SELECT count(*) FROM tx WHERE total - collected > 0.5),
    'collected', (SELECT amt FROM pay),
    'expenses', (SELECT amt FROM ex),
    'expenseCount', (SELECT n FROM ex)
  );
$$;

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
           COALESCE(max(s.category), '-') AS category,
           COALESCE(max(s.unit), max(it.unit), 'unit') AS unit,
           COALESCE(max(s.category),
             CASE WHEN max(it.unit) = 'kg' THEN 'Kiloan'
                  WHEN max(it.unit) = 'm2' THEN 'Karpet'
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

REVOKE EXECUTE ON FUNCTION public.get_financial_report(uuid, date, date, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_financial_report(uuid, date, date, date, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.financial_report_summary(uuid, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.financial_report_summary(uuid, date, date, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.report_expense_lines(uuid, date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.report_expense_lines(uuid, date, date, text) TO authenticated;

-- ============================================================================
-- Perbaikan get_laundry_status (cek status nota publik)
-- ============================================================================
-- Fungsi ini bisa dipanggil siapa saja dengan anon key. Sebelumnya pencarian
-- memakai ILIKE, sehingga input "%" (wildcard) mengembalikan SEMUA transaksi
-- beserta nama pelanggan lengkap.
--
-- Sekarang:
--   * kode invoice dicocokkan persis (input huruf kecil tetap diterima karena
--     kode dibuat huruf besar); "%" dan "_" tidak lagi berarti wildcard;
--   * nama pelanggan disamarkan seperti edge function check-order:
--     "Siti Aminah" -> "Sit*** A.".
-- Tipe kembalian tidak berubah, jadi hak akses yang ada tetap berlaku.
-- Aman dijalankan ulang.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_laundry_status(
  input_identifier text
)
RETURNS TABLE (
  id text,
  "invoiceCode" text,
  "customerName" text,
  "createdAt" timestamp with time zone,
  "estimatedCompletionDate" timestamp with time zone,
  "orderStatus" text,
  "paymentStatus" text,
  total numeric,
  "amountPaid" numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id::text,
    t."invoiceCode",
    CASE
      WHEN c.id IS NULL THEN 'Guest/Dihapus'
      WHEN coalesce(btrim(c.name), '') = '' THEN 'Pelanggan'
      ELSE (
        SELECT string_agg(
          CASE
            WHEN w.n = 1 THEN
              CASE WHEN length(w.word) <= 3 THEN w.word ELSE left(w.word, 3) || '***' END
            ELSE upper(left(w.word, 1)) || '.'
          END,
          ' ' ORDER BY w.n
        )
        FROM regexp_split_to_table(btrim(c.name), '\s+') WITH ORDINALITY AS w(word, n)
      )
    END AS "customerName",
    t."createdAt",
    t."estimatedCompletionDate",
    t."orderStatus",
    t."paymentStatus",
    t.total,
    t."amountPaid"
  FROM public.transactions AS t
  LEFT JOIN public.customers AS c ON t."customerId" = c.id
  WHERE
    t."invoiceCode" IN (input_identifier, upper(input_identifier))
    -- CASE menjamin cast ke uuid hanya dijalankan bila formatnya valid.
    OR t.id = CASE
      WHEN input_identifier ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      THEN input_identifier::uuid
    END
  LIMIT 1;
$$;

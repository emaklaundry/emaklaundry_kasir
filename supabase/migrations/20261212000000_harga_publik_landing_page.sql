-- ============================================================================
-- Harga layanan untuk landing page (emaklaundry.my.id)
-- ============================================================================
-- 1. services."showOnWeb": centang per layanan di halaman Layanan aplikasi kasir.
--    Bawaan false, jadi harga khusus (mis. harga mitra) tidak pernah tampil
--    di website sebelum sengaja dicentang.
-- 2. get_public_price_list(store_id): daftar layanan yang dicentang beserta
--    harganya. Hanya kolom yang memang untuk publik; tanpa id/storeId.
--    get_public_services (tanpa harga) dibiarkan apa adanya untuk kompatibilitas.
-- Aman dijalankan ulang.
-- ============================================================================

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS "showOnWeb" boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.services."showOnWeb" IS
  'Tampilkan layanan ini beserta harganya di landing page (get_public_price_list).';

DROP FUNCTION IF EXISTS public.get_public_price_list(uuid);
CREATE OR REPLACE FUNCTION public.get_public_price_list(
  store_id_input uuid
)
RETURNS TABLE (
  service_name text,
  category text,
  wash_type text,
  price integer,
  unit text,
  duration_days integer,
  min_quantity numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.name,
    s.category::text,
    s.wash_type,
    s.price,
    s.unit,
    s."durationDays",
    s."minQuantity"
  FROM public.services AS s
  WHERE s."storeId" = store_id_input
    AND s."showOnWeb"
  ORDER BY s.category, s.price, s.name;
$$;

COMMENT ON FUNCTION public.get_public_price_list(uuid) IS
  'Daftar harga publik untuk landing page: hanya layanan dengan "showOnWeb" = true.';

-- Sengaja publik (dipanggil landing page tanpa login).
REVOKE ALL ON FUNCTION public.get_public_price_list(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_price_list(uuid) TO anon, authenticated, service_role;

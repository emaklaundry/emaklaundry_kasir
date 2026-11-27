-- Kode wilayah kelurahan/desa (adm4 Kemendagri, mis. 32.79.01.1002) per cabang,
-- dipakai widget cuaca untuk mengambil prakiraan resmi BMKG.
-- Kosong (NULL) = widget memakai Open-Meteo dari koordinat cabang.
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS "bmkgAdm4" text;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_bmkg_adm4_format;

ALTER TABLE public.stores
  ADD CONSTRAINT stores_bmkg_adm4_format
  CHECK ("bmkgAdm4" IS NULL OR "bmkgAdm4" ~ '^\d{2}\.\d{2}\.\d{2}\.\d{4}$');

-- Cabang bawaan (Cimenyan, Kota Banjar): kelurahan BMKG terdekat adalah Mekarsari.
UPDATE public.stores
SET "bmkgAdm4" = '32.79.01.1002'
WHERE id = '9b7e1c2a-1234-4bcd-8e9f-abcdef123456' AND "bmkgAdm4" IS NULL;

-- Tambahan kolom isActive dan canGiveDiscount ke tabel profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS "isActive" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "canGiveDiscount" boolean DEFAULT false;

-- Set nilai default untuk pengguna yang sudah ada
UPDATE public.profiles
SET "isActive" = true, "canGiveDiscount" = false
WHERE "isActive" IS NULL;
-- LANGKAH 1: PERBAIKI TABEL (Jalankan ini dulu)
-- Menambahkan kolom "isActive" yang hilang ke tabel stores
ALTER TABLE public.stores
ADD COLUMN "isActive" boolean default true;

-- ---
-- LANGKAH 2: SEEDING DATA (Jalankan sisa script ini)

-- Langkah 6.3: Membuat profil untuk Super Admin Anda
INSERT INTO public.profiles (id, name, role, store_id)
VALUES (
  '11c86333-295c-4bd9-9302-a69fda4811c0',
  'Super Admin',
  'Super Admin',
  NULL
);

-- Langkah 7: Mengisi data awal (Seeding) untuk tabel 'stores'
-- (Sekarang ini akan berhasil)
INSERT INTO public.stores (id, name, address, "isActive")
VALUES
  ('STORE1', 'Jakarta Pusat', 'Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan', true),
  ('STORE2', 'Bandung', 'Jl. Asia Afrika No.1, Bandung', true);

-- Langkah 7: Mengisi data awal (Seeding) untuk tabel 'services'
-- Mengaitkan layanan ke STORE1. Anda bisa mengganti 'STORE1' dengan ID cabang lain.
INSERT INTO public.services (name, category, price, unit, "durationDays", "storeId")
VALUES
  ('Cuci Kering Lipat', 'Kiloan', 8000, 'kg', 2, 'STORE1'),
  ('Cuci Setrika', 'Kiloan', 10000, 'kg', 3, 'STORE1'),
  ('Setrika Saja', 'Kiloan', 6000, 'kg', 1, 'STORE1'),
  ('Kemeja', 'Satuan', 15000, 'pcs', 2, 'STORE1'),
  ('Jas', 'Satuan', 50000, 'pcs', 4, 'STORE1'),
  ('Selimut', 'Satuan', 25000, 'pcs', 3, 'STORE1'),
  ('Cuci Sepatu', 'Sepatu', 40000, 'pasang', 5, 'STORE1'),
  ('Karpet Tipis', 'Karpet', 15000, 'm²', 5, 'STORE1');

-- (Opsional) Tambahkan layanan yang sama untuk STORE2 jika perlu
-- INSERT INTO public.services (name, category, price, unit, "durationDays", "storeId")
-- VALUES
--   ('Cuci Kering Lipat', 'Kiloan', 8000, 'kg', 2, 'STORE2'),
--   ('Cuci Setrika', 'Kiloan', 10000, 'kg', 3, 'STORE2');


-- Langkah 7: Mengisi data awal (Seeding) untuk tabel 'settings'
CREATE TABLE IF NOT EXISTS public.settings (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "receiptMessage" text,
  "taxRate" numeric,
  "discountRate" numeric
);

-- Aktifkan RLS untuk settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Beri akses baca (SELECT) ke semua pengguna yang terautentikasi
CREATE POLICY "Allow authenticated read access"
  ON public.settings FOR SELECT
  USING ( auth.role() = 'authenticated' );

-- Hanya Super Admin yang boleh mengubah (UPDATE)
CREATE POLICY "Allow Super Admins to update settings"
  ON public.settings FOR UPDATE
  USING ( (select role from profiles where id = auth.uid()) = 'Super Admin' );


-- Masukkan data pengaturan awal
INSERT INTO public.settings ("receiptMessage", "taxRate", "discountRate")
VALUES (
  'Terima kasih telah menggunakan jasa kami! Silakan simpan struk ini sebagai bukti transaksi.',
  0,
  0
);
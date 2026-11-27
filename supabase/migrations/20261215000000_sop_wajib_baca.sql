-- ============================================================================
-- SOP wajib baca untuk Kasir & Operator
-- ============================================================================
-- Tabel standard_operating_procedures dipakai halaman SOP (/management/sop) dan
-- pop up "SOP wajib baca" yang muncul sekali sehari saat Kasir/Operator masuk.
--
-- Kategori yang ditampilkan di pop up:
--   Kasir    -> 'Umum' + 'Kasir'
--   Operator -> 'Umum' + 'Operator' + 'Produksi'
--
-- Semua pengguna yang login boleh membaca; hanya Admin/Super Admin yang boleh
-- menambah, mengubah, dan menghapus. SOP awal hanya diisi bila tabel masih
-- kosong. Aman dijalankan ulang.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.standard_operating_procedures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Umum',
  content text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sop_category_order
  ON public.standard_operating_procedures (category, display_order);

ALTER TABLE public.standard_operating_procedures ENABLE ROW LEVEL SECURITY;

-- Kebijakan lama (setup awal) memberi semua akses ke semua pengguna login.
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.standard_operating_procedures;

DROP POLICY IF EXISTS "Baca SOP" ON public.standard_operating_procedures;
CREATE POLICY "Baca SOP" ON public.standard_operating_procedures
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admin kelola SOP" ON public.standard_operating_procedures;
CREATE POLICY "Admin kelola SOP" ON public.standard_operating_procedures
  FOR ALL TO authenticated
  USING ((SELECT public.get_my_role()) IN ('Admin', 'Super Admin'))
  WITH CHECK ((SELECT public.get_my_role()) IN ('Admin', 'Super Admin'));

REVOKE ALL ON public.standard_operating_procedures FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.standard_operating_procedures TO authenticated;

-- SOP awal (hanya bila tabel masih kosong). Admin bisa mengubahnya di halaman SOP.
INSERT INTO public.standard_operating_procedures (title, category, content, display_order)
SELECT v.title, v.category, v.content, v.display_order
FROM (VALUES
  ('Sikap & Kebersihan Kerja', 'Umum',
'1. Datang 10 menit sebelum jam buka dan absen.
2. Pakai seragam rapi, rambut terikat, kuku bersih.
3. Sapa pelanggan dengan ramah: "Selamat datang di Emak Laundry".
4. Jaga area kerja tetap bersih dan kering setiap saat.
5. Dilarang memakai, meminjamkan, atau membawa pulang barang pelanggan.
6. Laporkan kerusakan mesin, barang hilang, atau keluhan ke Admin hari itu juga.', 1),

  ('Buka Toko & Kas Awal', 'Kasir',
'1. Nyalakan lampu, komputer/HP kasir, dan printer struk.
2. Hitung uang kas awal dan pastikan sama dengan catatan.
3. Cek pesanan yang jadwal ambilnya hari ini.
4. Pastikan kertas struk dan label tagging cukup.', 1),
  ('Penerimaan Cucian', 'Kasir',
'1. Timbang cucian kiloan di depan pelanggan dan sebutkan beratnya.
2. Periksa saku, noda, sobek, dan luntur. Tunjukkan dan catat di catatan item.
3. Pisahkan pakaian luntur, putih, dan bahan khusus.
4. Input transaksi di aplikasi: nama, nomor WA, layanan, berat/jumlah.
5. Sebutkan total biaya dan perkiraan selesai, lalu cetak dan berikan nota.
6. Pasang label tagging sebelum cucian diserahkan ke Operator.', 2),
  ('Pembayaran & Pengambilan', 'Kasir',
'1. Terima pembayaran sesuai metode (tunai/QRIS/transfer) dan catat di aplikasi.
2. Untuk QRIS/transfer, pastikan dana benar-benar masuk sebelum menandai lunas.
3. Saat pengambilan, cocokkan nota/nama dengan label pesanan.
4. Minta pelanggan mengecek jumlah dan kondisi cucian.
5. Ubah status pesanan menjadi "Diambil" di aplikasi.', 3),
  ('Tutup Kasir', 'Kasir',
'1. Hitung uang tunai dan cocokkan dengan laporan harian di aplikasi.
2. Catat selisih (jika ada) dan laporkan ke Admin.
3. Simpan uang di tempat aman sesuai arahan Admin.
4. Matikan perangkat dan kunci pintu.', 4),

  ('Terima Cucian dari Kasir', 'Operator',
'1. Cek label tagging dan catatan item setiap pesanan.
2. Jangan mencampur cucian antar pesanan.
3. Tanyakan ke Kasir bila ada catatan yang kurang jelas.', 1),
  ('Pencucian & Pengeringan', 'Operator',
'1. Cuci terpisah: putih, warna, luntur, dan bahan khusus.
2. Gunakan takaran deterjen dan pewangi sesuai standar.
3. Jangan melebihi kapasitas mesin.
4. Periksa kembali noda setelah dicuci; ulangi bila perlu.
5. Keringkan sesuai jenis bahan, hindari panas berlebih.', 2),
  ('Setrika, Packing & Update Status', 'Operator',
'1. Setrika sesuai suhu bahan, lipat rapi.
2. Hitung ulang jumlah item sesuai nota sebelum dikemas.
3. Kemas dengan plastik dan tempel label pesanan.
4. Ubah status pesanan di aplikasi sesuai progres (Dicuci, Disetrika, Siap Diambil).', 3),
  ('Perawatan Mesin', 'Operator',
'1. Bersihkan filter mesin cuci dan pengering setiap hari.
2. Lap mesin dan area kerja setelah selesai.
3. Laporkan suara aneh, bocor, atau mesin error lewat menu perawatan aset.', 4)
) AS v(title, category, content, display_order)
WHERE NOT EXISTS (SELECT 1 FROM public.standard_operating_procedures);

-- ============================================
-- FIX: Update wash_type for existing services
-- Memperbaiki jenis cucian yang masih "Pakaian" semua
-- ============================================

-- Update jenis cucian untuk layanan non-pakaian
UPDATE public.services SET wash_type = 'Gorden' WHERE name = 'Gorden';
UPDATE public.services SET wash_type = 'Karpet' WHERE name IN ('Karpet cendol', 'Karpet permadani', 'Karpet tipis', 'Surpet', 'Tikar');
UPDATE public.services SET wash_type = 'Selimut' WHERE name IN ('Kasur busa/lantai', 'Kasur Palembang', 'Sprei (kiloan)');
UPDATE public.services SET wash_type = 'Lainnya' WHERE name = 'Lain-lain';

-- KARPET category
UPDATE public.services SET wash_type = 'Karpet' WHERE name IN ('Karpet tebal (per m)', 'Karpet tipis / masjid (per m)');

-- SATUAN - Selimut
UPDATE public.services SET wash_type = 'Selimut' WHERE name IN (
  'Bantal', 'Bed cover', 'Bed cover jumbo/besar', 'Bedcover', 
  'Guling', 'Guling kecil', 'Selimut', 'Selimut jumbo', 'Sprei satuan'
);

-- SATUAN - Boneka
UPDATE public.services SET wash_type = 'Boneka' WHERE name IN (
  'Boneka/bantal bulu', 'Boneka besar', 'Boneka jumbo', 'Boneka kecil', 'Boneka sedang'
);

-- SATUAN - Karpet
UPDATE public.services SET wash_type = 'Karpet' WHERE name IN ('Keset', 'Keset besar', 'Sajadah tebal');

-- SATUAN - Sepatu
UPDATE public.services SET wash_type = 'Sepatu' WHERE name IN ('Sepatu', 'Sepatu (Kets)');

-- SATUAN - Tas
UPDATE public.services SET wash_type = 'Tas' WHERE name IN ('Tas besar', 'Tas kecil');

-- Verification
SELECT 
  wash_type, 
  COUNT(*) as total,
  string_agg(name, ', ' ORDER BY name) as services
FROM public.services
GROUP BY wash_type
ORDER BY wash_type;

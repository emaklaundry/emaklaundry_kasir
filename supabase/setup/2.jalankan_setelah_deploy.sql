-- ============================================================================
-- JALANKAN SETELAH DEPLOY (sekali saja, di database live)
-- ----------------------------------------------------------------------------
-- Menghapus sisa fitur saldo diskon, Pajak (%), Diskon (%), dan izin
-- "Bisa beri diskon" dari database production.
--
-- Syarat sebelum menjalankan (kalau dilanggar, transaksi/buat akun gagal):
--   1. Frontend versi baru (tanpa fitur diskon) sudah live di Vercel.
--   2. Edge function versi baru sudah di-deploy:
--        supabase functions deploy create-user manage-employee-login
--
-- Aman dijalankan ulang (semua memakai IF EXISTS).
-- Database BARU dari 0.complete_setup.sql tidak perlu file ini.
-- Setelah berhasil dijalankan di live, file ini boleh dihapus.
-- ============================================================================

-- 1. Trigger & fungsi saldo diskon --------------------------------------------
DROP TRIGGER IF EXISTS apply_transaction_discount_balance ON public.transactions;
DROP TRIGGER IF EXISTS guard_customer_discount_balance ON public.customers;
DROP TRIGGER IF EXISTS normalize_customer_discount_balance ON public.customers;

DROP FUNCTION IF EXISTS public.set_customer_discount_balance(uuid, integer, integer, text);
DROP FUNCTION IF EXISTS public.apply_transaction_discount_balance();
DROP FUNCTION IF EXISTS public.guard_customer_discount_balance();
DROP FUNCTION IF EXISTS public.normalize_customer_discount_balance();
DROP FUNCTION IF EXISTS public.change_customer_discount_balance(uuid, integer, text, uuid, text, boolean);

-- 2. Buku catatan saldo --------------------------------------------------------
DROP TABLE IF EXISTS public.customer_discount_ledger;

-- 3. Kolom saldo di transaksi & pelanggan --------------------------------------
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_discount_balance_used_check,
  DROP CONSTRAINT IF EXISTS transactions_rounding_credit_check,
  DROP COLUMN IF EXISTS "discountBalanceUsed",
  DROP COLUMN IF EXISTS "roundingCredit";

ALTER TABLE public.customers
  DROP CONSTRAINT IF EXISTS customers_default_discount_nonnegative,
  DROP COLUMN IF EXISTS "defaultDiscount";

-- 4. Pajak (%) & Diskon (%) di Pengaturan -------------------------------------
ALTER TABLE public.settings
  DROP COLUMN IF EXISTS "taxRate",
  DROP COLUMN IF EXISTS "discountRate";

COMMENT ON COLUMN public.transactions.discount IS
  'Historis. Fitur diskon sudah dihapus; transaksi baru selalu 0.';
COMMENT ON COLUMN public.transactions.tax IS
  'Historis. Fitur pajak sudah dihapus; transaksi baru selalu 0.';

-- 5. Izin "Bisa beri diskon" -------------------------------------------------
ALTER TABLE public.profiles DROP COLUMN IF EXISTS "canGiveDiscount";

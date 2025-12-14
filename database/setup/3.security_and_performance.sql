-- ============================================
-- SECURITY & PERFORMANCE ENHANCEMENTS
-- Database Optimizations untuk Production
-- ============================================

-- 1. VALIDASI INPUT DI RPC FUNCTIONS
-- Perbarui function update_transaction_status dengan validasi ketat

CREATE OR REPLACE FUNCTION public.update_transaction_status_safe(
  transaction_id_input text,
  new_payment_status text DEFAULT NULL,
  new_order_status text DEFAULT NULL,
  caller uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role text;
  transaction_store_id text;
BEGIN
  -- Validasi: Cek apakah user sudah login
  IF caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not authenticated';
  END IF;

  -- Ambil role user
  SELECT role INTO current_user_role
  FROM public.users
  WHERE "userId" = caller;

  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User not found';
  END IF;

  -- Validasi input untuk mencegah SQL injection dan invalid data
  IF new_payment_status IS NOT NULL 
     AND new_payment_status NOT IN ('Lunas', 'Belum Lunas', 'DP') THEN
    RAISE EXCEPTION 'Invalid payment status: %', new_payment_status;
  END IF;
  
  IF new_order_status IS NOT NULL 
     AND new_order_status NOT IN ('Pending', 'Sedang Diproses', 'Siap Diambil', 'Selesai', 'Dibatalkan') THEN
    RAISE EXCEPTION 'Invalid order status: %', new_order_status;
  END IF;

  -- Ambil store_id dari transaksi
  SELECT "storeId" INTO transaction_store_id
  FROM public.transactions
  WHERE id = transaction_id_input;

  IF transaction_store_id IS NULL THEN
    RAISE EXCEPTION 'Transaction not found: %', transaction_id_input;
  END IF;

  -- Role-based access control
  IF current_user_role != 'SuperAdmin' THEN
    -- Non-SuperAdmin hanya bisa update transaksi dari store mereka
    DECLARE
      user_store_id text;
    BEGIN
      SELECT "storeId" INTO user_store_id
      FROM public.users
      WHERE "userId" = caller;

      IF user_store_id IS NULL OR user_store_id != transaction_store_id THEN
        RAISE EXCEPTION 'Forbidden: Cannot update transaction from different store';
      END IF;
    END;
  END IF;

  -- Update transaksi
  IF new_payment_status IS NOT NULL THEN
    UPDATE public.transactions
    SET "paymentStatus" = new_payment_status,
        "updatedAt" = NOW()
    WHERE id = transaction_id_input;
  END IF;

  IF new_order_status IS NOT NULL THEN
    UPDATE public.transactions
    SET "orderStatus" = new_order_status,
        "updatedAt" = NOW()
    WHERE id = transaction_id_input;
  END IF;

  -- Log audit
  INSERT INTO public.audit_logs ("timestamp", "user", "action", "storeId")
  VALUES (
    NOW(),
    (SELECT name FROM public.users WHERE "userId" = caller),
    format('Updated transaction %s status', transaction_id_input),
    transaction_store_id
  );
END;
$$;

-- 2. PERFORMANCE INDEXES
-- Index untuk optimasi query yang sering digunakan

-- Index untuk transactions (compound index untuk filter umum)
CREATE INDEX IF NOT EXISTS idx_transactions_store_date 
  ON public.transactions("storeId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_customer_date 
  ON public.transactions("customerId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_status 
  ON public.transactions("paymentStatus", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_order_status 
  ON public.transactions("orderStatus", "createdAt" DESC);

-- Index untuk composite queries (multi-column filtering)
CREATE INDEX IF NOT EXISTS idx_transactions_composite 
  ON public.transactions("storeId", "paymentStatus", "orderStatus", "createdAt" DESC);

-- Index untuk audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_store_timestamp 
  ON public.audit_logs("storeId", "timestamp" DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp 
  ON public.audit_logs("timestamp" DESC);

-- Index untuk customers search
CREATE INDEX IF NOT EXISTS idx_customers_name_gin 
  ON public.customers USING gin(to_tsvector('indonesian', name));

CREATE INDEX IF NOT EXISTS idx_customers_phone 
  ON public.customers(phone);

-- Index untuk inventory
CREATE INDEX IF NOT EXISTS idx_inventory_store 
  ON public.inventory("storeId", "itemName");

-- Index untuk assets
CREATE INDEX IF NOT EXISTS idx_assets_store_status 
  ON public.assets("storeId", "status");

-- 3. ROW LEVEL SECURITY (RLS) ENHANCEMENTS
-- Pastikan RLS enabled untuk semua tabel sensitif

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy untuk transactions (sudah ada, tapi dipastikan)
DROP POLICY IF EXISTS "Users can view their store transactions" ON public.transactions;
CREATE POLICY "Users can view their store transactions"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() IN (
      SELECT "userId" FROM public.users 
      WHERE role = 'SuperAdmin'
    )
    OR
    "storeId" = (
      SELECT "storeId" FROM public.users 
      WHERE "userId" = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their store transactions" ON public.transactions;
CREATE POLICY "Users can insert their store transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    "storeId" = (
      SELECT "storeId" FROM public.users 
      WHERE "userId" = auth.uid()
    )
    OR
    auth.uid() IN (
      SELECT "userId" FROM public.users 
      WHERE role = 'SuperAdmin'
    )
  );

DROP POLICY IF EXISTS "Users can update their store transactions" ON public.transactions;
CREATE POLICY "Users can update their store transactions"
  ON public.transactions FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT "userId" FROM public.users 
      WHERE role = 'SuperAdmin'
    )
    OR
    "storeId" = (
      SELECT "storeId" FROM public.users 
      WHERE "userId" = auth.uid()
    )
  );

-- 4. FUNCTION UNTUK CLEANUP OLD DATA
-- Function untuk archive/delete data lama (jalankan periodic via cron)

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Hanya SuperAdmin yang bisa jalankan
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE "userId" = auth.uid() AND role = 'SuperAdmin'
  ) THEN
    RAISE EXCEPTION 'Only SuperAdmin can cleanup audit logs';
  END IF;

  -- Delete audit logs older than specified days
  DELETE FROM public.audit_logs
  WHERE "timestamp" < NOW() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- 5. TRIGGER UNTUK AUTO UPDATE updatedAt
-- Pastikan setiap update record otomatis update timestamp

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

-- Apply trigger ke tabel yang punya updatedAt
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_inventory_updated_at ON public.inventory;
CREATE TRIGGER update_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 6. GRANT PERMISSIONS
-- Pastikan permissions benar untuk security definer functions

GRANT EXECUTE ON FUNCTION public.update_transaction_status_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_audit_logs TO authenticated;

-- ============================================
-- CATATAN DEPLOYMENT:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Monitor query performance dengan pg_stat_statements
-- 3. Vacuum analyze setelah create index: VACUUM ANALYZE;
-- 4. Setup cron job untuk cleanup_old_audit_logs (monthly)
-- ============================================

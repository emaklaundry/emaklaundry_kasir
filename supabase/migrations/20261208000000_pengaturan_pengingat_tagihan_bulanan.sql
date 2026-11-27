-- ============================================================================
-- Pengaturan pop-up pengeluaran bulanan (listrik, air, dll).
-- 1. settings: saklar pop-up + tanggal mulai muncul tiap bulan (1-28, berlaku
--    untuk semua cabang). Default = perilaku lama (aktif, tanggal 1).
-- 2. monthly_expense_templates: nominal default yang mengisi pop-up otomatis.
-- 3. Tagihan boleh dihapus. Tagihan yang sudah punya riwayat pengeluaran tetap
--    ditolak oleh FK expenses_recurring_template_store_fkey (riwayat aman);
--    untuk itu pengguna menonaktifkannya saja.
-- Aman dijalankan ulang.
-- ============================================================================

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS "monthlyExpenseReminderEnabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "monthlyExpenseReminderDay" smallint NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'settings_monthly_expense_reminder_day_check'
  ) THEN
    ALTER TABLE public.settings
      ADD CONSTRAINT settings_monthly_expense_reminder_day_check
      CHECK ("monthlyExpenseReminderDay" BETWEEN 1 AND 28);
  END IF;
END;
$$;

ALTER TABLE public.monthly_expense_templates
  ADD COLUMN IF NOT EXISTS default_amount numeric(14, 2);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'monthly_expense_templates_default_amount_check'
  ) THEN
    ALTER TABLE public.monthly_expense_templates
      ADD CONSTRAINT monthly_expense_templates_default_amount_check
      CHECK (default_amount IS NULL OR default_amount >= 0);
  END IF;
END;
$$;

-- Policy "Admins can manage monthly expense templates" (FOR ALL) sudah mencakup DELETE.
GRANT DELETE ON public.monthly_expense_templates TO authenticated;

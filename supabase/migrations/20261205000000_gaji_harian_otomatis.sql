-- ============================================================================
-- Gaji harian otomatis masuk Pengeluaran saat karyawan absen masuk
-- ============================================================================
-- employees.base_salary kini berarti GAJI PER HARI (bukan per bulan).
-- Setiap kali absensi punya jam masuk (otomatis dari login PIN atau dicatat
-- manual oleh Admin), satu baris pengeluaran kategori "Gaji" dibuat:
--   tanggal = tanggal absensi, nominal = gaji harian saat itu, cabang = cabang karyawan.
-- Satu absensi = satu pengeluaran (unik lewat expenses."attendanceId").
-- Jam masuk dihapus / absensi dihapus → pengeluarannya ikut dihapus.
-- Karyawan dihapus → pengeluaran gaji lama tetap disimpan (riwayat keuangan).
-- Gaji 0 tidak membuat pengeluaran. Mengubah gaji tidak mengubah pengeluaran lama.
--
-- "attendanceId" sengaja tanpa foreign key: restore backup memulihkan tabel
-- expenses sebelum attendance, dan riwayat gaji harus tetap ada walau absensi hilang.
-- ============================================================================

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS "attendanceId" uuid;

COMMENT ON COLUMN public.expenses."attendanceId" IS
  'Absensi sumber pengeluaran gaji harian otomatis (NULL = pengeluaran biasa).';

CREATE UNIQUE INDEX IF NOT EXISTS expenses_attendance_id_idx
  ON public.expenses ("attendanceId")
  WHERE "attendanceId" IS NOT NULL;

COMMENT ON COLUMN public.employees.base_salary IS
  'Gaji per hari (Rp). Otomatis dicatat sebagai pengeluaran "Gaji" setiap hari karyawan absen masuk.';

CREATE OR REPLACE FUNCTION public.sync_daily_wage_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_employee record;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Hapus hanya bila absensi dihapus sendiri; saat karyawan dihapus (cascade)
    -- barisnya sudah tidak ada dan riwayat gaji dibiarkan.
    IF EXISTS (SELECT 1 FROM public.employees e WHERE e.id = OLD.employee_id) THEN
      DELETE FROM public.expenses WHERE "attendanceId" = OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.clock_in IS NULL THEN
    DELETE FROM public.expenses WHERE "attendanceId" = NEW.id;
    RETURN NEW;
  END IF;

  SELECT e.name, e.store_id, e.base_salary
  INTO v_employee
  FROM public.employees e
  WHERE e.id = NEW.employee_id;

  IF NOT FOUND OR COALESCE(v_employee.base_salary, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.expenses (date, description, category, amount, "storeId", "attendanceId")
  VALUES (
    NEW.date,
    'Gaji harian - ' || v_employee.name,
    'Gaji',
    v_employee.base_salary,
    v_employee.store_id,
    NEW.id
  )
  ON CONFLICT ("attendanceId") WHERE "attendanceId" IS NOT NULL DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_daily_wage_expense() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS attendance_daily_wage_expense ON public.attendance;
CREATE TRIGGER attendance_daily_wage_expense
  AFTER INSERT OR DELETE OR UPDATE OF clock_in ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.sync_daily_wage_expense();

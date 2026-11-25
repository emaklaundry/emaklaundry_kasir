ALTER TABLE public.employees
  ADD COLUMN photo_url text,
  ADD COLUMN photo_path text,
  ADD COLUMN login_enabled boolean NOT NULL DEFAULT false,
  ADD CONSTRAINT employees_login_profile_check CHECK (
    NOT login_enabled
    OR is_active
  );

ALTER TABLE public.profiles
  ADD COLUMN employee_id uuid UNIQUE REFERENCES public.employees(id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.guard_employee_auth_profile()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF CURRENT_USER <> 'service_role' AND OLD.employee_id IS NOT NULL THEN
      RAISE EXCEPTION 'Employee login profiles can only be managed by the service'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF CURRENT_USER <> 'service_role' THEN
    IF TG_OP = 'INSERT' AND NEW.employee_id IS NOT NULL THEN
      RAISE EXCEPTION 'Employee login profiles can only be managed by the service'
        USING ERRCODE = '42501';
    ELSIF TG_OP = 'UPDATE' THEN
      IF OLD.employee_id IS NOT NULL OR NEW.employee_id IS NOT NULL THEN
        RAISE EXCEPTION 'Employee login profiles can only be managed by the service'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_employee_auth_profile
  BEFORE INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_employee_auth_profile();

REVOKE EXECUTE ON FUNCTION public.guard_employee_auth_profile()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_employee_auth_profile()
  TO service_role;

CREATE OR REPLACE FUNCTION public.guard_employee_login_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  caller_role text;
  login_fields_changed boolean;
BEGIN
  IF TG_OP = 'UPDATE' AND NOT NEW.is_active THEN
    NEW.login_enabled := false;
  END IF;

  IF TG_OP = 'INSERT' THEN
    login_fields_changed :=
      NEW.photo_url IS NOT NULL
      OR NEW.photo_path IS NOT NULL
      OR NEW.login_enabled;
  ELSE
    login_fields_changed :=
      NEW.photo_url IS DISTINCT FROM OLD.photo_url
      OR NEW.photo_path IS DISTINCT FROM OLD.photo_path
      OR NEW.login_enabled IS DISTINCT FROM OLD.login_enabled;
  END IF;

  IF NOT login_fields_changed OR CURRENT_USER = 'service_role' THEN
    RETURN NEW;
  END IF;

  caller_role := public.get_my_role();
  IF caller_role NOT IN ('Admin', 'Super Admin') THEN
    RAISE EXCEPTION 'Only admins can modify employee login profiles'
      USING ERRCODE = '42501';
  END IF;

  IF caller_role = 'Admin' THEN
    IF NEW.store_id IS DISTINCT FROM public.get_my_store_id() THEN
      RAISE EXCEPTION 'Admins can only modify profiles in their own store'
        USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' THEN
      IF OLD.store_id IS DISTINCT FROM public.get_my_store_id() THEN
        RAISE EXCEPTION 'Admins can only modify profiles in their own store'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER guard_employee_login_profile_fields
  BEFORE INSERT OR UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_employee_login_profile_fields();

REVOKE EXECUTE ON FUNCTION public.guard_employee_login_profile_fields()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_employee_login_profile_fields()
  TO service_role;

CREATE TABLE public.employee_auth_accounts (
  employee_id uuid PRIMARY KEY REFERENCES public.employees(id) ON DELETE RESTRICT,
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  login_email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employee_login_attempts (
  employee_id uuid PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  locked_until timestamptz
);

ALTER TABLE public.employee_auth_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_login_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.employee_auth_accounts, public.employee_login_attempts
  FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.employee_auth_accounts, public.employee_login_attempts
  TO service_role;

CREATE FUNCTION public.consume_employee_login_attempt(
  p_employee_id uuid,
  p_success boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  current_attempt_count integer;
  current_locked_until timestamptz;
BEGIN
  IF p_success THEN
    DELETE FROM public.employee_login_attempts
    WHERE employee_id = p_employee_id;
    RETURN true;
  END IF;

  INSERT INTO public.employee_login_attempts (
    employee_id,
    window_started_at,
    attempt_count
  )
  VALUES (p_employee_id, now(), 1)
  ON CONFLICT (employee_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN public.employee_login_attempts.locked_until > now()
        THEN public.employee_login_attempts.window_started_at
      WHEN public.employee_login_attempts.locked_until IS NOT NULL
        OR public.employee_login_attempts.window_started_at <= now() - interval '15 minutes'
        THEN now()
      ELSE public.employee_login_attempts.window_started_at
    END,
    attempt_count = CASE
      WHEN public.employee_login_attempts.locked_until > now()
        THEN public.employee_login_attempts.attempt_count
      WHEN public.employee_login_attempts.locked_until IS NOT NULL
        OR public.employee_login_attempts.window_started_at <= now() - interval '15 minutes'
        THEN 1
      ELSE public.employee_login_attempts.attempt_count + 1
    END,
    locked_until = CASE
      WHEN public.employee_login_attempts.locked_until > now()
        THEN public.employee_login_attempts.locked_until
      WHEN public.employee_login_attempts.locked_until IS NOT NULL
        OR public.employee_login_attempts.window_started_at <= now() - interval '15 minutes'
        THEN NULL
      WHEN public.employee_login_attempts.attempt_count + 1 > 5
        THEN now() + interval '15 minutes'
      ELSE NULL
    END
  RETURNING attempt_count, locked_until
  INTO current_attempt_count, current_locked_until;

  RETURN current_attempt_count <= 5 AND current_locked_until IS NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_employee_login_attempt(uuid, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_employee_login_attempt(uuid, boolean)
  TO service_role;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'employee-photos',
  'employee-photos',
  true,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Admins can read employee photos" ON storage.objects;
CREATE POLICY "Admins can read employee photos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  );

DROP POLICY IF EXISTS "Admins can upload employee photos" ON storage.objects;
CREATE POLICY "Admins can upload employee photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  );

DROP POLICY IF EXISTS "Admins can update employee photos" ON storage.objects;
CREATE POLICY "Admins can update employee photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  )
  WITH CHECK (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  );

DROP POLICY IF EXISTS "Admins can delete employee photos" ON storage.objects;
CREATE POLICY "Admins can delete employee photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'employee-photos'
    AND (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR (storage.foldername(name))[1] = (SELECT public.get_my_store_id())::text
    )
  );
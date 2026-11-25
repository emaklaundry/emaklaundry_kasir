CREATE TABLE public.monthly_expense_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  category text NOT NULL CHECK (char_length(btrim(category)) BETWEEN 1 AND 80),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, store_id)
);

CREATE UNIQUE INDEX monthly_expense_templates_store_name_idx
  ON public.monthly_expense_templates (store_id, lower(name));
CREATE INDEX monthly_expense_templates_active_store_idx
  ON public.monthly_expense_templates (store_id, sort_order)
  WHERE is_active;

ALTER TABLE public.monthly_expense_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store users can read monthly expense templates"
  ON public.monthly_expense_templates
  FOR SELECT
  TO authenticated
  USING (
    store_id = (SELECT public.get_my_store_id())
    OR (SELECT public.get_my_role()) = 'Super Admin'
  );

CREATE POLICY "Admins can manage monthly expense templates"
  ON public.monthly_expense_templates
  FOR ALL
  TO authenticated
  USING (
    (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR store_id = (SELECT public.get_my_store_id())
    )
  )
  WITH CHECK (
    (SELECT public.get_my_role()) IN ('Admin', 'Super Admin')
    AND (
      (SELECT public.get_my_role()) = 'Super Admin'
      OR store_id = (SELECT public.get_my_store_id())
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.monthly_expense_templates TO authenticated;
GRANT ALL ON public.monthly_expense_templates TO service_role;

ALTER TABLE public.expenses
  ADD COLUMN "recurringTemplateId" uuid,
  ADD COLUMN "recurringPeriod" date,
  ADD CONSTRAINT expenses_recurring_template_store_fkey
    FOREIGN KEY ("recurringTemplateId", "storeId")
    REFERENCES public.monthly_expense_templates (id, store_id),
  ADD CONSTRAINT expenses_recurring_fields_check
    CHECK (
      ("recurringTemplateId" IS NULL AND "recurringPeriod" IS NULL)
      OR (
        "recurringTemplateId" IS NOT NULL
        AND "recurringPeriod" IS NOT NULL
        AND "storeId" IS NOT NULL
        AND "recurringPeriod" = date_trunc('month', "recurringPeriod"::timestamp)::date
      )
    );

CREATE UNIQUE INDEX expenses_monthly_template_period_idx
  ON public.expenses ("storeId", "recurringTemplateId", "recurringPeriod");

INSERT INTO public.monthly_expense_templates (store_id, name, category, sort_order)
SELECT stores.id, defaults.name, defaults.category, defaults.sort_order
FROM public.stores AS stores
CROSS JOIN (
  VALUES
    ('Listrik', 'Listrik', 1),
    ('Air', 'Air', 2),
    ('Wi-Fi', 'Operasional', 3)
) AS defaults(name, category, sort_order)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.seed_monthly_expense_templates_for_store()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.monthly_expense_templates (store_id, name, category, sort_order)
  VALUES
    (NEW.id, 'Listrik', 'Listrik', 1),
    (NEW.id, 'Air', 'Air', 2),
    (NEW.id, 'Wi-Fi', 'Operasional', 3)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER seed_monthly_expense_templates_after_store_insert
  AFTER INSERT ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_monthly_expense_templates_for_store();

REVOKE EXECUTE ON FUNCTION public.seed_monthly_expense_templates_for_store()
  FROM PUBLIC, anon, authenticated;
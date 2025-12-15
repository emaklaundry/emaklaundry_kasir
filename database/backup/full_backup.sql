


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."order_status" AS ENUM (
    'Diproses',
    'Siap Diambil',
    'Selesai'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'Tunai',
    'QRIS',
    'Transfer Bank'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'Lunas',
    'Belum Lunas',
    'Bayar Sebagian'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."service_category" AS ENUM (
    'Kiloan',
    'Satuan',
    'Sepatu',
    'Karpet'
);


ALTER TYPE "public"."service_category" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'Super Admin',
    'Admin',
    'Kasir'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_update_order_status"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- TODO: Implement this function
  RETURN;
END;
$$;


ALTER FUNCTION "public"."bulk_update_order_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."bulk_update_order_status"("p_transaction_ids" "uuid"[], "p_new_status" "public"."order_status", "p_user_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_count integer := 0;
BEGIN
  -- Update semua transaksi dalam satu transaksi database
  UPDATE public.transactions
  SET "orderStatus" = p_new_status,
      "updatedAt" = now(),
      "updatedByUserId" = p_user_id
  WHERE id = ANY(p_transaction_ids);
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;


ALTER FUNCTION "public"."bulk_update_order_status"("p_transaction_ids" "uuid"[], "p_new_status" "public"."order_status", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_scheduled_maintenance"() RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- TODO: Implement this function
  RETURN;
END;
$$;


ALTER FUNCTION "public"."complete_scheduled_maintenance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_scheduled_maintenance"("maintenance_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_freq_value int;
  v_freq_unit text;
  v_interval interval;
BEGIN
  -- 1. Ambil frekuensi dari row terkait
  SELECT "frequencyValue", "frequencyUnit"
  INTO v_freq_value, v_freq_unit
  FROM public.scheduled_maintenances
  WHERE id = maintenance_id;

  -- 2. Mapping unit dari frontend ke interval SQL
  CASE v_freq_unit
    WHEN 'days' THEN v_interval := (v_freq_value || ' days')::interval;
    WHEN 'weeks' THEN v_interval := (v_freq_value || ' weeks')::interval;
    WHEN 'months' THEN v_interval := (v_freq_value || ' months')::interval;
    WHEN 'years' THEN v_interval := (v_freq_value || ' years')::interval;
    ELSE v_interval := INTERVAL '30 days'; -- Fallback jika unit tidak dikenali
  END CASE;

  -- 3. Update data
  UPDATE public.scheduled_maintenances
  SET 
    "lastCompletedDate" = CURRENT_DATE, 
    "nextDueDate" = CURRENT_DATE + v_interval
  WHERE id = maintenance_id;
END;
$$;


ALTER FUNCTION "public"."complete_scheduled_maintenance"("maintenance_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_scheduled_maintenance"("p_schedule_id" "uuid", "p_asset_id" "uuid", "p_log_description" "text", "p_frequency_value" integer, "p_frequency_unit" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_asset_row public.assets%ROWTYPE;
  v_new_log jsonb;
  v_next_due_date date;
BEGIN
  -- Ambil data asset
  SELECT * INTO v_asset_row FROM public.assets WHERE id = p_asset_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset tidak ditemukan';
  END IF;
  -- Buat log baru
  v_new_log := jsonb_build_object(
    'id', 'LOG_' || gen_random_uuid(),
    'date', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'description', p_log_description,
    'cost', 0
  );
  -- Update maintenanceHistory asset
  UPDATE public.assets
  SET "maintenanceHistory" = COALESCE("maintenanceHistory", '[]'::jsonb) || v_new_log
  WHERE id = p_asset_id;
  -- Hitung nextDueDate
  v_next_due_date := (now() + (p_frequency_value || ' ' || p_frequency_unit)::interval)::date;
  -- Update scheduled_maintenances
  UPDATE public.scheduled_maintenances
  SET "lastCompletedDate" = now(), "nextDueDate" = v_next_due_date
  WHERE id = p_schedule_id;
END;
$$;


ALTER FUNCTION "public"."complete_scheduled_maintenance"("p_schedule_id" "uuid", "p_asset_id" "uuid", "p_log_description" "text", "p_frequency_value" integer, "p_frequency_unit" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_code"("length" integer DEFAULT 6) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."generate_invoice_code"("length" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_laundry_status"("input_identifier" "text") RETURNS TABLE("id" "text", "invoiceCode" "text", "customerName" "text", "createdAt" timestamp with time zone, "estimatedCompletionDate" timestamp with time zone, "orderStatus" "text", "paymentStatus" "text", "total" numeric, "amountPaid" numeric)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
  SELECT
    t.id::text,
    t."invoiceCode" AS "invoiceCode",
    COALESCE(c.name, 'Guest/Dihapus') AS "customerName",
    t."createdAt",
    t."estimatedCompletionDate",
    t."orderStatus",
    t."paymentStatus",
    t.total,
    t."amountPaid"
  FROM
    public.transactions AS t
  LEFT JOIN
    public.customers AS c ON t."customerId" = c.id
  WHERE
    t."invoiceCode" ILIKE input_identifier
    OR (
      input_identifier ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      AND t.id = input_identifier::uuid
    );
$_$;


ALTER FUNCTION "public"."get_laundry_status"("input_identifier" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_store_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT store_id FROM public.profiles WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."get_my_store_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_public_services"("store_id_input" "uuid") RETURNS TABLE("service_name" "text", "category" "text", "duration_days" integer)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    s.name AS service_name,
    s.category::text AS category,
    s."durationDays"::integer AS duration_days
  FROM
    public.services AS s
  WHERE
    s."storeId" = store_id_input;
$$;


ALTER FUNCTION "public"."get_public_services"("store_id_input" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, store_id)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'name', 'Kasir', NULL);
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"("user_id" "uuid", "user_name" "text", "user_role" "text", "store_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, store_id)
  VALUES (user_id, user_name, user_role, store_id)
  ON CONFLICT (id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"("user_id" "uuid", "user_name" "text", "user_role" "text", "store_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM public.handle_new_user(
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'Admin' THEN 'Kasir'
      WHEN NEW.raw_user_meta_data->>'role' = 'Super Admin' THEN 'Kasir'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'Kasir')
    END,
    NULLIF(NEW.raw_user_meta_data->>'store_id', '')::uuid
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user_trigger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_profiles_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- TODO: Implementasikan logic audit log
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_profiles_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_credentials_audit"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Contoh: INSERT ke tabel audit_logs atau log perubahan ke tabel lain
  -- Saat ini belum diimplementasikan
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_user_credentials_audit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_immutable_transaction_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_user_role text;
BEGIN
  SELECT role INTO current_user_role FROM public.profiles WHERE id = auth.uid();
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  IF current_user_role <> 'Super Admin' THEN
    IF NEW.total IS DISTINCT FROM OLD.total THEN
      RAISE EXCEPTION 'You are not allowed to change total';
    END IF;
    IF NEW.items IS DISTINCT FROM OLD.items THEN
      RAISE EXCEPTION 'You are not allowed to change items';
    END IF;
    IF NEW."customerId" IS DISTINCT FROM OLD."customerId" THEN
      RAISE EXCEPTION 'You are not allowed to change customerId';
    END IF;
    IF NEW."createdByUserId" IS DISTINCT FROM OLD."createdByUserId" THEN
      RAISE EXCEPTION 'You are not allowed to change createdByUserId';
    END IF;
    IF NEW."storeId" IS DISTINCT FROM OLD."storeId" THEN
      RAISE EXCEPTION 'You are not allowed to change storeId';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_immutable_transaction_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_invoice_code"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  new_code text;
  store_prefix text := 'EM';
  max_attempts int := 10;
  attempt int := 0;
BEGIN
  IF NEW."storeId" IS NOT NULL THEN
     SELECT upper(substr(regexp_replace(name, '[^a-zA-Z]', '', 'g'), 1, 3))
     INTO store_prefix
     FROM public.stores
     WHERE id = NEW."storeId";
     IF store_prefix IS NULL OR length(store_prefix) = 0 THEN
        store_prefix := 'EM';
     END IF;
  END IF;

  WHILE attempt < max_attempts LOOP
    new_code := store_prefix || '-' || public.generate_invoice_code(6);
    IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE "invoiceCode" = new_code) THEN
      NEW."invoiceCode" := new_code;
      RETURN NEW;
    END IF;
    attempt := attempt + 1;
  END LOOP;

  RAISE EXCEPTION 'Gagal membuat invoice_code unik setelah % percobaan', max_attempts;
END;
$$;


ALTER FUNCTION "public"."set_invoice_code"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoiceCode" "text",
    "customerId" "uuid",
    "items" "jsonb" NOT NULL,
    "subtotal" numeric NOT NULL,
    "discount" numeric NOT NULL,
    "tax" numeric NOT NULL,
    "total" numeric NOT NULL,
    "paymentStatus" "text" NOT NULL,
    "orderStatus" "text" NOT NULL,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "estimatedCompletionDate" timestamp with time zone,
    "amountPaid" numeric NOT NULL,
    "change" numeric NOT NULL,
    "paymentMethod" "text",
    "createdByUserId" "uuid",
    "storeId" "uuid",
    "notes" "text",
    "idempotencyKey" "uuid"
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_transaction_progress"("transaction_id_input" "uuid", "p_amount_paid" numeric DEFAULT NULL::numeric, "p_change" numeric DEFAULT NULL::numeric, "p_payment_method" "text" DEFAULT NULL::"text", "p_payment_status" "text" DEFAULT NULL::"text", "p_order_status" "text" DEFAULT NULL::"text") RETURNS SETOF "public"."transactions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  caller uuid := auth.uid();
  caller_role text;
  caller_store uuid;
  tx_store uuid;
  current_payment_status text;
  current_order_status text;
  final_payment_status text;
  final_order_status text;
BEGIN
  -- Load caller profile (use table alias to avoid ambiguity)
  SELECT p.role, p.store_id INTO caller_role, caller_store FROM public.profiles p WHERE p.id = caller;
  IF caller_role IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Ambil status Payment DAN Order saat ini dari database
  SELECT t."storeId", t."paymentStatus", t."orderStatus"
    INTO tx_store, current_payment_status, current_order_status
    FROM public.transactions t WHERE t.id = transaction_id_input;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'transaction not found';
  END IF;

  -- Permission check
  IF caller_role <> 'Super Admin' AND tx_store IS DISTINCT FROM caller_store THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Tentukan Status Akhir (Gunakan input baru jika ada, jika tidak pakai yang lama)
  final_payment_status := COALESCE(p_payment_status, current_payment_status);
  final_order_status := COALESCE(p_order_status, current_order_status);

  -- Validasi Menyeluruh
  -- Tidak boleh ada kondisi dimana Order='Selesai' TAPI Payment!='Lunas'
  IF final_order_status = 'Selesai' AND final_payment_status <> 'Lunas' THEN
    RAISE EXCEPTION 'Inkonsistensi: Pesanan tidak boleh berstatus Selesai jika pembayaran belum Lunas.';
  END IF;
  -- Tidak boleh mengubah status bayar jadi Belum Lunas jika order sudah Selesai
  IF current_order_status = 'Selesai' AND final_payment_status <> 'Lunas' THEN
    RAISE EXCEPTION 'Inkonsistensi: Status pembayaran tidak boleh diubah menjadi belum lunas jika pesanan sudah selesai.';
  END IF;

  -- Perform update
  UPDATE public.transactions
  SET
    "amountPaid" = COALESCE(p_amount_paid, "amountPaid"),
    "change" = COALESCE(p_change, "change"),
    "paymentMethod" = COALESCE(p_payment_method, "paymentMethod"),
    "paymentStatus" = COALESCE(p_payment_status, "paymentStatus"),
    "orderStatus" = COALESCE(p_order_status, "orderStatus")
  WHERE id = transaction_id_input;

  -- Audit log (use table alias to avoid ambiguity)
  INSERT INTO public.audit_logs("user", action, "storeId")
  VALUES ((SELECT p.name FROM public.profiles p WHERE p.id = caller), concat('Update progress ', transaction_id_input), tx_store);

  RETURN QUERY SELECT * FROM public.transactions WHERE id = transaction_id_input;
END;
$$;


ALTER FUNCTION "public"."update_transaction_progress"("transaction_id_input" "uuid", "p_amount_paid" numeric, "p_change" numeric, "p_payment_method" "text", "p_payment_status" "text", "p_order_status" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "serialNumber" "text",
    "purchaseDate" "date",
    "purchaseCost" numeric,
    "status" "text" NOT NULL,
    "maintenanceHistory" "jsonb",
    "storeId" "uuid"
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" bigint NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "user" "text",
    "action" "text",
    "storeId" "uuid"
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


ALTER TABLE "public"."audit_logs" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."audit_logs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "phone" "text",
    "address" "text",
    "notes" "text",
    "defaultDiscount" integer DEFAULT 0,
    "createdAt" timestamp with time zone DEFAULT "now"(),
    "storeId" "uuid"
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "category" "text" NOT NULL,
    "amount" numeric NOT NULL,
    "storeId" "uuid"
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "stock" integer NOT NULL,
    "lowStockThreshold" integer NOT NULL,
    "unit" "text" NOT NULL,
    "storeId" "uuid"
);


ALTER TABLE "public"."inventory_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "store_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "isActive" boolean DEFAULT true,
    "canGiveDiscount" boolean DEFAULT false
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_maintenances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "assetId" "uuid",
    "description" "text" NOT NULL,
    "frequencyValue" integer NOT NULL,
    "frequencyUnit" "text" NOT NULL,
    "nextDueDate" "date" NOT NULL,
    "lastCompletedDate" "date"
);


ALTER TABLE "public"."scheduled_maintenances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "public"."service_category" NOT NULL,
    "price" integer NOT NULL,
    "unit" "text" NOT NULL,
    "durationDays" integer NOT NULL,
    "storeId" "uuid"
);


ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" bigint NOT NULL,
    "receiptMessage" "text",
    "taxRate" numeric,
    "discountRate" numeric,
    "storeId" "uuid"
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


ALTER TABLE "public"."settings" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."stores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "isActive" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stores" OWNER TO "postgres";


ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_maintenances"
    ADD CONSTRAINT "scheduled_maintenances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stores"
    ADD CONSTRAINT "stores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_idempotencyKey_key" UNIQUE ("idempotencyKey");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_invoiceCode_key" UNIQUE ("invoiceCode");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_assets_store_id" ON "public"."assets" USING "btree" ("storeId");



CREATE UNIQUE INDEX "idx_customers_phone_store" ON "public"."customers" USING "btree" ("phone", "storeId") WHERE (("phone" IS NOT NULL) AND ("phone" <> ''::"text"));



CREATE INDEX "idx_customers_store_id" ON "public"."customers" USING "btree" ("storeId");



CREATE INDEX "idx_expenses_store_id" ON "public"."expenses" USING "btree" ("storeId");



CREATE INDEX "idx_inventory_store_id" ON "public"."inventory_items" USING "btree" ("storeId");



CREATE INDEX "idx_services_store_id" ON "public"."services" USING "btree" ("storeId");



CREATE INDEX "idx_settings_store_id" ON "public"."settings" USING "btree" ("storeId");



CREATE INDEX "idx_transactions_idempotency_key" ON "public"."transactions" USING "btree" ("idempotencyKey");



CREATE INDEX "idx_transactions_invoice_code" ON "public"."transactions" USING "btree" ("invoiceCode");



CREATE INDEX "idx_transactions_store_id" ON "public"."transactions" USING "btree" ("storeId");



CREATE UNIQUE INDEX "services_name_store_idx" ON "public"."services" USING "btree" ("lower"("name"), "storeId");



CREATE OR REPLACE TRIGGER "before_transaction_insert_set_code" BEFORE INSERT ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."set_invoice_code"();



CREATE OR REPLACE TRIGGER "prevent_immutable_transaction_update" BEFORE UPDATE ON "public"."transactions" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_immutable_transaction_update"();



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_items"
    ADD CONSTRAINT "inventory_items_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scheduled_maintenances"
    ADD CONSTRAINT "scheduled_maintenances_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "public"."assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."services"
    ADD CONSTRAINT "services_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can manage profiles in their store" ON "public"."profiles" USING ((("public"."get_my_role"() = 'Admin'::"text") AND ("store_id" = "public"."get_my_store_id"()))) WITH CHECK ((("public"."get_my_role"() = 'Admin'::"text") AND ("store_id" = "public"."get_my_store_id"()) AND ("role" = ANY (ARRAY['Admin'::"text", 'Kasir'::"text"])) AND ("store_id" = "public"."get_my_store_id"())));



CREATE POLICY "Admins can see profiles in their store" ON "public"."profiles" FOR SELECT USING ((("public"."get_my_role"() = 'Admin'::"text") AND ("store_id" = "public"."get_my_store_id"())));



CREATE POLICY "Allow ALL for Admins" ON "public"."settings" USING (("public"."get_my_role"() = ANY (ARRAY['Super Admin'::"text", 'Admin'::"text"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['Super Admin'::"text", 'Admin'::"text"])));



CREATE POLICY "Allow DELETE for Admins" ON "public"."assets" FOR DELETE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow DELETE for Admins" ON "public"."customers" FOR DELETE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow DELETE for Admins" ON "public"."expenses" FOR DELETE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow DELETE for Admins" ON "public"."inventory_items" FOR DELETE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow DELETE for Admins" ON "public"."scheduled_maintenances" FOR DELETE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("assetId" IN ( SELECT "assets"."id"
   FROM "public"."assets"
  WHERE ("assets"."storeId" = "public"."get_my_store_id"()))))));



CREATE POLICY "Allow DELETE for Admins" ON "public"."services" FOR DELETE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow DELETE for Admins" ON "public"."transactions" FOR DELETE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow INSERT for Admins" ON "public"."assets" FOR INSERT WITH CHECK ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow INSERT for Admins" ON "public"."scheduled_maintenances" FOR INSERT WITH CHECK ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("assetId" IN ( SELECT "assets"."id"
   FROM "public"."assets"
  WHERE ("assets"."storeId" = "public"."get_my_store_id"())))));



CREATE POLICY "Allow INSERT for Admins" ON "public"."services" FOR INSERT WITH CHECK ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow INSERT for all logged-in users" ON "public"."audit_logs" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Allow INSERT for store users" ON "public"."customers" FOR INSERT WITH CHECK ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow INSERT for store users" ON "public"."expenses" FOR INSERT WITH CHECK ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow INSERT for store users" ON "public"."inventory_items" FOR INSERT WITH CHECK ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow INSERT for store users" ON "public"."transactions" FOR INSERT WITH CHECK ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow INSERT/UPDATE/DELETE for Super Admins only" ON "public"."stores" USING (("public"."get_my_role"() = 'Super Admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'Super Admin'::"text"));



CREATE POLICY "Allow SELECT for Admins" ON "public"."audit_logs" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow SELECT for store users" ON "public"."assets" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow SELECT for store users" ON "public"."customers" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow SELECT for store users" ON "public"."expenses" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow SELECT for store users" ON "public"."inventory_items" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow SELECT for store users" ON "public"."scheduled_maintenances" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("assetId" IN ( SELECT "assets"."id"
   FROM "public"."assets"
  WHERE ("assets"."storeId" = "public"."get_my_store_id"())))));



CREATE POLICY "Allow SELECT for store users" ON "public"."services" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow SELECT for store users" ON "public"."stores" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("id" = "public"."get_my_store_id"())));



CREATE POLICY "Allow SELECT for store users" ON "public"."transactions" FOR SELECT USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR ("storeId" = "public"."get_my_store_id"())));



CREATE POLICY "Allow UPDATE for Admins" ON "public"."assets" FOR UPDATE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow UPDATE for Admins" ON "public"."expenses" FOR UPDATE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow UPDATE for Admins" ON "public"."inventory_items" FOR UPDATE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow UPDATE for Admins" ON "public"."scheduled_maintenances" FOR UPDATE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("assetId" IN ( SELECT "assets"."id"
   FROM "public"."assets"
  WHERE ("assets"."storeId" = "public"."get_my_store_id"()))))));



CREATE POLICY "Allow UPDATE for Admins and Kasirs (progress only)" ON "public"."transactions" FOR UPDATE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = ANY (ARRAY['Admin'::"text", 'Kasir'::"text"])) AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow UPDATE/DELETE for Admins" ON "public"."customers" FOR UPDATE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow UPDATE/DELETE for Admins" ON "public"."services" FOR UPDATE USING ((("public"."get_my_role"() = 'Super Admin'::"text") OR (("public"."get_my_role"() = 'Admin'::"text") AND ("storeId" = "public"."get_my_store_id"()))));



CREATE POLICY "Allow read access for own store" ON "public"."settings" FOR SELECT USING ((("storeId" = "public"."get_my_store_id"()) OR ("public"."get_my_role"() = 'Super Admin'::"text")));



CREATE POLICY "Super Admins can manage all profiles" ON "public"."profiles" USING (("public"."get_my_role"() = 'Super Admin'::"text")) WITH CHECK (("public"."get_my_role"() = 'Super Admin'::"text"));



CREATE POLICY "Super Admins can see all profiles" ON "public"."profiles" FOR SELECT USING (("public"."get_my_role"() = 'Super Admin'::"text"));



CREATE POLICY "Users can see their own profile" ON "public"."profiles" FOR SELECT USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK ((("id" = "auth"."uid"()) AND ("role" = ( SELECT "profiles_1"."role"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"()))) AND ("store_id" = ( SELECT "profiles_1"."store_id"
   FROM "public"."profiles" "profiles_1"
  WHERE ("profiles_1"."id" = "auth"."uid"())))));



ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scheduled_maintenances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."transactions";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."bulk_update_order_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_update_order_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_update_order_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."bulk_update_order_status"("p_transaction_ids" "uuid"[], "p_new_status" "public"."order_status", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."bulk_update_order_status"("p_transaction_ids" "uuid"[], "p_new_status" "public"."order_status", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."bulk_update_order_status"("p_transaction_ids" "uuid"[], "p_new_status" "public"."order_status", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"() TO "anon";
GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"("maintenance_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"("maintenance_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"("maintenance_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"("p_schedule_id" "uuid", "p_asset_id" "uuid", "p_log_description" "text", "p_frequency_value" integer, "p_frequency_unit" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"("p_schedule_id" "uuid", "p_asset_id" "uuid", "p_log_description" "text", "p_frequency_value" integer, "p_frequency_unit" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_scheduled_maintenance"("p_schedule_id" "uuid", "p_asset_id" "uuid", "p_log_description" "text", "p_frequency_value" integer, "p_frequency_unit" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_code"("length" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_code"("length" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_code"("length" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_laundry_status"("input_identifier" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_laundry_status"("input_identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_laundry_status"("input_identifier" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_store_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_store_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_store_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_public_services"("store_id_input" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_public_services"("store_id_input" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_public_services"("store_id_input" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."handle_new_user"("user_id" "uuid", "user_name" "text", "user_role" "text", "store_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."handle_new_user"("user_id" "uuid", "user_name" "text", "user_role" "text", "store_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user_trigger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_profiles_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_profiles_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_profiles_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_credentials_audit"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_credentials_audit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_credentials_audit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_immutable_transaction_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_immutable_transaction_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_immutable_transaction_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_invoice_code"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_invoice_code"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_invoice_code"() TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON FUNCTION "public"."update_transaction_progress"("transaction_id_input" "uuid", "p_amount_paid" numeric, "p_change" numeric, "p_payment_method" "text", "p_payment_status" "text", "p_order_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_transaction_progress"("transaction_id_input" "uuid", "p_amount_paid" numeric, "p_change" numeric, "p_payment_method" "text", "p_payment_status" "text", "p_order_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transaction_progress"("transaction_id_input" "uuid", "p_amount_paid" numeric, "p_change" numeric, "p_payment_method" "text", "p_payment_status" "text", "p_order_status" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."audit_logs_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_items" TO "anon";
GRANT ALL ON TABLE "public"."inventory_items" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_items" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_maintenances" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_maintenances" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_maintenances" TO "service_role";



GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."stores" TO "anon";
GRANT ALL ON TABLE "public"."stores" TO "authenticated";
GRANT ALL ON TABLE "public"."stores" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































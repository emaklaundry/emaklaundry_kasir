-- Lock down SECURITY DEFINER functions that anyone (even without login) could call
-- through /rest/v1/rpc/*. Postgres grants EXECUTE to PUBLIC by default, so every
-- function below first loses PUBLIC/anon/authenticated access, then gets back
-- only what the app actually needs.
--
-- Used by the app (checked in src/):
--   get_laundry_status, get_public_services  -> public tracking page (anon OK)
--   update_transaction_progress              -> logged-in staff only
--   get_my_role, get_my_store_id             -> used inside RLS policies; return NULL for anon
-- Everything else is admin/maintenance or trigger-only and is not called from the client.

-- 1. Admin / maintenance functions: no client access (service role, cron & SQL Editor still work)
revoke execute on function public.cleanup_old_audit_logs(integer) from public, anon, authenticated;
revoke execute on function public.backfill_invoice_codes() from public, anon, authenticated;
revoke execute on function public.generate_invoice_code(integer) from public, anon, authenticated;
revoke execute on function public.bulk_update_order_status(uuid[], public.order_status, uuid) from public, anon, authenticated;
revoke execute on function public.bulk_update_order_status(uuid[], text, uuid) from public, anon, authenticated;
revoke execute on function public.complete_scheduled_maintenance(uuid) from public, anon, authenticated;
revoke execute on function public.complete_scheduled_maintenance(uuid, uuid, text, integer, text) from public, anon, authenticated;
revoke execute on function public.handle_new_user(uuid, text, text, uuid) from public, anon, authenticated;

-- 2. Trigger functions: never meant to be called via RPC (triggers keep working)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_new_user_trigger() from public, anon, authenticated;
revoke execute on function public.prevent_immutable_transaction_update() from public, anon, authenticated;
revoke execute on function public.set_invoice_code() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;

-- 3. Staff-only RPCs: logged-in users only
revoke execute on function public.update_transaction_progress(uuid, numeric, numeric, text, text, text) from public, anon;
grant execute on function public.update_transaction_progress(uuid, numeric, numeric, text, text, text) to authenticated;
revoke execute on function public.update_transaction_status_safe(text, text, text, uuid) from public, anon;
grant execute on function public.update_transaction_status_safe(text, text, text, uuid) to authenticated;

-- 4. Fix mutable search_path warnings
alter function public.bulk_update_order_status(uuid[], public.order_status, uuid) set search_path = public;
alter function public.bulk_update_order_status(uuid[], text, uuid) set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.handle_new_user(uuid, text, text, uuid) set search_path = public;
alter function public.complete_scheduled_maintenance(uuid) set search_path = public;
alter function public.complete_scheduled_maintenance(uuid, uuid, text, integer, text) set search_path = public;

-- Intentionally unchanged (public by design):
--   get_laundry_status(text), get_public_services(uuid), get_my_role(), get_my_store_id()

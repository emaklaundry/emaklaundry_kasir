-- Enable RLS on HRM tables that were exposed to anon/authenticated without any protection.
-- Access model (matches the app: Karyawan & Absensi pages are admin-only):
--   * Super Admin : full access to all stores
--   * Admin       : full access to employees of their own store
--   * Kasir / anon: no access
-- Edge functions (employee-login, manage-employee-login) use the service role and bypass RLS.

-- Helper: is the current user an Admin/Super Admin allowed to manage this store?
create or replace function public.can_manage_store(p_store_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select public.get_my_role() = 'Super Admin'
      or (public.get_my_role() = 'Admin' and p_store_id = public.get_my_store_id());
$$;

-- Helper: same check, resolved through an employee's store.
create or replace function public.can_manage_employee(p_employee_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.employees e
    where e.id = p_employee_id
      and public.can_manage_store(e.store_id)
  );
$$;

revoke execute on function public.can_manage_store(uuid) from anon, public;
revoke execute on function public.can_manage_employee(uuid) from anon, public;
grant execute on function public.can_manage_store(uuid) to authenticated;
grant execute on function public.can_manage_employee(uuid) to authenticated;

-- employees
alter table public.employees enable row level security;
drop policy if exists "Admins manage employees in their store" on public.employees;
create policy "Admins manage employees in their store"
  on public.employees for all to authenticated
  using ((select public.can_manage_store(store_id)))
  with check ((select public.can_manage_store(store_id)));

-- attendance
alter table public.attendance enable row level security;
drop policy if exists "Admins manage attendance in their store" on public.attendance;
create policy "Admins manage attendance in their store"
  on public.attendance for all to authenticated
  using (public.can_manage_employee(employee_id))
  with check (public.can_manage_employee(employee_id));

-- advances (kasbon)
alter table public.advances enable row level security;
drop policy if exists "Admins manage advances in their store" on public.advances;
create policy "Admins manage advances in their store"
  on public.advances for all to authenticated
  using (public.can_manage_employee(employee_id))
  with check (public.can_manage_employee(employee_id));

-- payroll
alter table public.payroll enable row level security;
drop policy if exists "Admins manage payroll in their store" on public.payroll;
create policy "Admins manage payroll in their store"
  on public.payroll for all to authenticated
  using (public.can_manage_employee(employee_id))
  with check (public.can_manage_employee(employee_id));

-- Indexes for the FK lookups used by the policies (also flagged by the performance advisor)
create index if not exists idx_employees_store_id on public.employees (store_id);
create index if not exists idx_advances_employee_id on public.advances (employee_id);
create index if not exists idx_payroll_employee_id on public.payroll (employee_id);

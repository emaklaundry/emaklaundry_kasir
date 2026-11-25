import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const getCorsHeaders = (req: Request) => {
  const allowedOrigins = [
    ...(Deno.env.get('ALLOWED_ORIGIN') ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  const origin = req.headers.get('Origin');

  return {
    ...(origin && allowedOrigins.includes(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
};

const jsonResponse = (
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);

  try {
    const authorization = req.headers.get('Authorization');
    const body: unknown = await req.json();
    if (!authorization || !isRecord(body) || !isUuid(body.employeeId)) {
      return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing Supabase environment configuration');
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();
    if (callerError || !caller) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: callerProfile, error: profileError } = await admin
      .from('profiles')
      .select('role, store_id')
      .eq('id', caller.id)
      .maybeSingle();

    if (profileError || !callerProfile || !['Admin', 'Super Admin'].includes(callerProfile.role)) {
      return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
    }

    const { data: employee, error: employeeError } = await admin
      .from('employees')
      .select('id, name, store_id, is_active, photo_url, photo_path')
      .eq('id', body.employeeId)
      .maybeSingle();

    if (employeeError) throw employeeError;
    if (!employee) return jsonResponse({ error: 'Employee not found' }, 404, corsHeaders);
    if (callerProfile.role === 'Admin' && employee.store_id !== callerProfile.store_id) {
      return jsonResponse({ error: 'Forbidden' }, 403, corsHeaders);
    }

    const { data: account, error: accountError } = await admin
      .from('employee_auth_accounts')
      .select('auth_user_id, login_email')
      .eq('employee_id', employee.id)
      .maybeSingle();

    if (accountError) throw accountError;

    if (body.action === 'sync') {
      if (!account) return jsonResponse({ ok: true }, 200, corsHeaders);

      const { error: authError } = await admin.auth.admin.updateUserById(account.auth_user_id, {
        user_metadata: {
          full_name: employee.name,
          role: 'Kasir',
          store_id: employee.store_id,
        },
      });
      if (authError) throw authError;

      const { error: syncError } = await admin.from('profiles').upsert({
        id: account.auth_user_id,
        employee_id: employee.id,
        name: employee.name,
        role: 'Kasir',
        store_id: employee.store_id,
        isActive: employee.is_active,
        canGiveDiscount: false,
      });
      if (syncError) throw syncError;

      if (!employee.is_active) {
        const { error: disableError } = await admin
          .from('employees')
          .update({ login_enabled: false })
          .eq('id', employee.id);
        if (disableError) throw disableError;
      }

      return jsonResponse({ ok: true }, 200, corsHeaders);
    }

    if (body.action === 'delete') {
      const { error: disableError } = await admin
        .from('employees')
        .update({ login_enabled: false })
        .eq('id', employee.id);
      if (disableError) throw disableError;

      if (account) {
        const { error: disableProfileError } = await admin
          .from('profiles')
          .update({ isActive: false })
          .eq('id', account.auth_user_id);
        if (disableProfileError) throw disableProfileError;

        const { error: deleteAuthError } = await admin.auth.admin.deleteUser(account.auth_user_id);
        if (deleteAuthError) throw deleteAuthError;
      }

      return jsonResponse({ ok: true }, 200, corsHeaders);
    }

    if (body.action !== 'set-pin' || typeof body.pin !== 'string' || !/^\d{6}$/.test(body.pin)) {
      return jsonResponse({ error: 'PIN must contain exactly six digits' }, 400, corsHeaders);
    }
    if (!employee.is_active || !employee.store_id || !employee.photo_url || !employee.photo_path) {
      return jsonResponse(
        { error: 'Employee must be active and have a profile photo before login is enabled' },
        400,
        corsHeaders,
      );
    }

    const userMetadata = {
      full_name: employee.name,
      role: 'Kasir',
      store_id: employee.store_id,
    };
    let authUserId = account?.auth_user_id;
    let loginEmail = account?.login_email;
    let createdAuthUserId: string | null = null;

    if (account) {
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(
        account.auth_user_id,
        { password: body.pin, user_metadata: userMetadata },
      );
      if (updateAuthError) throw updateAuthError;
    } else {
      loginEmail = `employee-${employee.id}@staff.laundry.invalid`;
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: loginEmail,
        password: body.pin,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (createError || !created.user) throw createError ?? new Error('User creation failed');
      authUserId = created.user.id;
      createdAuthUserId = created.user.id;
    }

    const cleanupNewUser = async () => {
      if (!createdAuthUserId) return;
      const { error } = await admin.auth.admin.deleteUser(createdAuthUserId);
      if (error) console.error('Failed to remove newly created employee login user');
    };

    if (!authUserId || !loginEmail) throw new Error('Employee login account was not created');

    const { error: saveProfileError } = await admin.from('profiles').upsert({
      id: authUserId,
      employee_id: employee.id,
      name: employee.name,
      role: 'Kasir',
      store_id: employee.store_id,
      isActive: true,
      canGiveDiscount: false,
    });
    if (saveProfileError) {
      await cleanupNewUser();
      throw saveProfileError;
    }

    const { error: saveAccountError } = await admin.from('employee_auth_accounts').insert({
      employee_id: employee.id,
      auth_user_id: authUserId,
      login_email: loginEmail,
    });
    if (saveAccountError) {
      await cleanupNewUser();
      throw saveAccountError;
    }

    const { error: enableError } = await admin
      .from('employees')
      .update({ login_enabled: true })
      .eq('id', employee.id);
    if (enableError) {
      await cleanupNewUser();
      throw enableError;
    }

    return jsonResponse({ ok: true }, 200, corsHeaders);
  } catch {
    return jsonResponse({ error: 'Employee login could not be updated' }, 500, corsHeaders);
  }
});

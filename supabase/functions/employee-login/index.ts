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
    const body: unknown = await req.json();
    if (!isRecord(body)) return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error('Missing Supabase environment configuration');
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (body.action === 'list') {
      const { data, error } = await admin
        .from('employees')
        .select('id, name, photo_url')
        .eq('is_active', true)
        .eq('login_enabled', true)
        .not('photo_url', 'is', null)
        .order('name');

      if (error) throw error;
      return jsonResponse(
        {
          profiles: (data ?? []).map((employee) => ({
            id: employee.id,
            name: employee.name,
            photoUrl: employee.photo_url,
            storeName: null,
          })),
        },
        200,
        corsHeaders,
      );
    }

    if (body.action !== 'login' || !isUuid(body.employeeId) || typeof body.pin !== 'string') {
      return jsonResponse({ error: 'Invalid request' }, 400, corsHeaders);
    }
    if (!/^\d{6}$/.test(body.pin)) {
      return jsonResponse({ error: 'Invalid profile or PIN' }, 401, corsHeaders);
    }

    const { data: employee, error: employeeError } = await admin
      .from('employees')
      .select('id, is_active, login_enabled, photo_url')
      .eq('id', body.employeeId)
      .maybeSingle();

    if (employeeError) throw employeeError;
    if (!employee?.is_active || !employee.login_enabled || !employee.photo_url) {
      return jsonResponse({ error: 'Invalid profile or PIN' }, 401, corsHeaders);
    }

    const { data: account, error: accountError } = await admin
      .from('employee_auth_accounts')
      .select('login_email')
      .eq('employee_id', employee.id)
      .maybeSingle();

    if (accountError) throw accountError;
    if (!account) return jsonResponse({ error: 'Invalid profile or PIN' }, 401, corsHeaders);

    const { data: allowed, error: rateLimitError } = await admin.rpc(
      'consume_employee_login_attempt',
      { p_employee_id: employee.id, p_success: false },
    );
    if (rateLimitError) throw rateLimitError;
    if (!allowed) {
      return jsonResponse(
        { error: 'Login dibatasi sementara. Coba lagi nanti.' },
        429,
        corsHeaders,
      );
    }

    const auth = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: loginData, error: loginError } = await auth.auth.signInWithPassword({
      email: account.login_email,
      password: body.pin,
    });

    if (loginError || !loginData.session) {
      return jsonResponse({ error: 'Invalid profile or PIN' }, 401, corsHeaders);
    }

    const { error: resetError } = await admin.rpc('consume_employee_login_attempt', {
      p_employee_id: employee.id,
      p_success: true,
    });
    if (resetError) throw resetError;

    return jsonResponse(
      {
        session: {
          access_token: loginData.session.access_token,
          refresh_token: loginData.session.refresh_token,
        },
      },
      200,
      corsHeaders,
    );
  } catch {
    return jsonResponse({ error: 'Login service is temporarily unavailable' }, 500, corsHeaders);
  }
});

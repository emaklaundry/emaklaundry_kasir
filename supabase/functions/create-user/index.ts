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

type Role = 'Super Admin';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: 'Layanan belum dikonfigurasi' }, 500, corsHeaders);
  }

  // 1. Siapa pemanggilnya?
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const {
    data: { user: caller },
  } = await callerClient.auth.getUser();
  if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 2. Login email & password khusus Super Admin, jadi hanya Super Admin aktif
  //    yang boleh membuat akun email. Staf cabang dibuat lewat Karyawan + PIN
  //    (Edge Function manage-employee-login).
  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('role, isActive')
    .eq('id', caller.id)
    .maybeSingle();
  if (
    profileError ||
    !callerProfile ||
    callerProfile.isActive === false ||
    callerProfile.role !== 'Super Admin'
  ) {
    return jsonResponse(
      { error: 'Hanya Super Admin yang dapat menambah akun login' },
      403,
      corsHeaders,
    );
  }

  // 3. Validasi input
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Permintaan tidak valid' }, 400, corsHeaders);
  }
  if (!isRecord(body)) return jsonResponse({ error: 'Permintaan tidak valid' }, 400, corsHeaders);

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const requestedRole = typeof body.role === 'string' ? body.role : 'Super Admin';

  if (!email || !password || !name) {
    return jsonResponse({ error: 'Email, password, dan nama wajib diisi' }, 400, corsHeaders);
  }
  if (name.length > 80) {
    return jsonResponse({ error: 'Nama maksimal 80 karakter' }, 400, corsHeaders);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: 'Format email tidak valid' }, 400, corsHeaders);
  }
  if (password.length < 8 || password.length > 72) {
    return jsonResponse({ error: 'Password harus 8 sampai 72 karakter' }, 400, corsHeaders);
  }
  if (requestedRole !== 'Super Admin') {
    return jsonResponse(
      {
        error:
          'Akun email hanya untuk Super Admin. Admin, Kasir, dan Operator dibuat di menu Karyawan dan login dengan PIN.',
      },
      400,
      corsHeaders,
    );
  }

  // 4. Super Admin tidak terikat cabang.
  const role: Role = 'Super Admin';
  const storeId: string | null = null;

  // 5. Buat akun. Trigger database membuat profil sebagai Kasir (pengaman
  //    pendaftaran mandiri), jadi peran yang benar disetel di langkah 6.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: 'Kasir', store_id: storeId },
  });
  if (createError || !created.user) {
    const message = createError?.message ?? '';
    const duplicate = /already (been )?registered|already exists/i.test(message);
    return jsonResponse(
      { error: duplicate ? 'Email sudah terdaftar' : 'Gagal membuat akun' },
      duplicate ? 409 : 400,
      corsHeaders,
    );
  }
  const newUserId = created.user.id;

  // 6. Setel profil dengan peran yang diminta. Kalau gagal, batalkan akunnya
  //    supaya tidak ada akun setengah jadi yang bisa login sebagai Kasir.
  const { error: upsertError } = await admin.from('profiles').upsert(
    {
      id: newUserId,
      name,
      role,
      store_id: storeId,
      isActive: true,
    },
    { onConflict: 'id' },
  );
  if (upsertError) {
    await admin.auth.admin.deleteUser(newUserId);
    return jsonResponse({ error: 'Gagal menyimpan profil pengguna' }, 500, corsHeaders);
  }

  return jsonResponse(
    {
      user: {
        id: newUserId,
        email,
        name,
        role,
        storeId,
        isActive: true,
      },
    },
    200,
    corsHeaders,
  );
});

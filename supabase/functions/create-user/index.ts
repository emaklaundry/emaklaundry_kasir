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

const VALID_ROLES = ['Operator', 'Kasir', 'Admin', 'Super Admin'] as const;
type Role = (typeof VALID_ROLES)[number];

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

  // 2. Hanya Admin / Super Admin yang aktif
  const { data: callerProfile, error: profileError } = await admin
    .from('profiles')
    .select('role, store_id, isActive')
    .eq('id', caller.id)
    .maybeSingle();
  if (
    profileError ||
    !callerProfile ||
    callerProfile.isActive === false ||
    (callerProfile.role !== 'Super Admin' && callerProfile.role !== 'Admin')
  ) {
    return jsonResponse({ error: 'Hanya Admin yang dapat menambah pengguna' }, 403, corsHeaders);
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
  const role = (typeof body.role === 'string' ? body.role : 'Kasir') as Role;

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
  if (!VALID_ROLES.includes(role)) {
    return jsonResponse(
      { error: `Peran tidak valid. Pilihan: ${VALID_ROLES.join(', ')}` },
      400,
      corsHeaders,
    );
  }

  // 4. Cabang: Super Admin tanpa cabang; Admin hanya untuk cabangnya sendiri
  let storeId: string | null = null;
  if (role !== 'Super Admin') {
    storeId = isUuid(body.storeId) ? body.storeId : null;
    if (callerProfile.role === 'Admin') storeId = storeId ?? callerProfile.store_id;
    if (!storeId) return jsonResponse({ error: 'Cabang wajib dipilih' }, 400, corsHeaders);
  }
  if (callerProfile.role === 'Admin') {
    if (role === 'Super Admin') {
      return jsonResponse({ error: 'Admin tidak dapat membuat Super Admin' }, 403, corsHeaders);
    }
    if (storeId !== callerProfile.store_id) {
      return jsonResponse(
        { error: 'Admin hanya dapat menambah pengguna di cabangnya sendiri' },
        403,
        corsHeaders,
      );
    }
  }
  if (storeId) {
    const { data: store, error: storeError } = await admin
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .maybeSingle();
    if (storeError || !store) {
      return jsonResponse({ error: 'Cabang tidak ditemukan' }, 400, corsHeaders);
    }
  }

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

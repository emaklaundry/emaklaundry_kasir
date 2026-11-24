import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get('Origin') ?? '';
  const allowedOrigins = [
    Deno.env.get('ALLOWED_ORIGIN'),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ].filter(Boolean);

  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes('*');
  const allowedOrigin = isAllowed ? origin : allowedOrigins[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Buat client untuk User context (bukan Admin)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    // 2. Cek siapa yang memanggil fungsi ini
    const {
      data: { user: caller },
    } = await supabaseClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Buat Supabase Client dengan Service Role Key (Admin privileges)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 4. Cek Role pemanggil (Query ke tabel profiles)
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, store_id')
      .eq('id', caller.id)
      .single();
    if (
      profileError ||
      !callerProfile ||
      (callerProfile.role !== 'Super Admin' && callerProfile.role !== 'Admin')
    ) {
      return new Response(JSON.stringify({ error: 'Forbidden: Insufficient privileges' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Ambil data dari body request
    const body = await req.json();
    const { email, password, name, role, storeId } = body;

    // Validasi input
    if (!email || !password || !name) {
      return new Response(JSON.stringify({ error: 'Email, Password, dan Nama wajib diisi' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Format email tidak valid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password minimal 8 karakter' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const validRoles = ['Kasir', 'Admin', 'Super Admin'];
    if (role && !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Role tidak valid. Pilihan: ${validRoles.join(', ')}` }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      );
    }

    // 6. Jika Admin Toko, pastikan tidak membuat Super Admin atau user di cabang lain
    if (callerProfile.role === 'Admin') {
      if (role === 'Super Admin') {
        return new Response(JSON.stringify({ error: 'Admin cannot create Super Admin' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (storeId && storeId !== callerProfile.store_id) {
        return new Response(
          JSON.stringify({ error: 'Admin can only create users for their own store' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // 7. Buat User baru menggunakan Admin API
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: role || 'Kasir',
        store_id: storeId || callerProfile.store_id || null,
      },
    });

    if (createError) {
      throw createError;
    }

    return new Response(JSON.stringify({ user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Buat Supabase Client dengan Service Role Key (Admin privileges)
    // Environment variable ini otomatis tersedia di Supabase Edge Functions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 2. Ambil data dari body request yang dikirim dari frontend
    const { email, password, name, role, storeId } = await req.json()

    // Validasi input sederhana
    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Email, Password, dan Nama wajib diisi' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 3. Buat User baru menggunakan Admin API
    // email_confirm: true agar user langsung verified tanpa perlu klik link email (opsional, sesuaikan kebutuhan)
    const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, 
      user_metadata: {
        name: name,
        role: role || 'Kasir', // Default role Kasir jika tidak ada
        store_id: storeId || null
      }
    })

    if (createError) {
      throw createError
    }

    // 4. (Opsional) Jika Anda ingin memanipulasi tabel 'profiles' secara manual 
    // (biasanya trigger 'on_auth_user_created' di database sudah menangani ini, 
    // tapi jika trigger gagal atau tidak ada, bisa ditambahkan manual di sini).
    // Untuk saat ini, kita asumsikan Trigger database Anda yang menghandle insert ke public.profiles.

    return new Response(
      JSON.stringify({ user }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})

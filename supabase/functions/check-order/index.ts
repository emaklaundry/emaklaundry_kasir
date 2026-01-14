import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const invoice = url.searchParams.get('invoice');

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 1. Init Supabase Admin Client (to bypass RLS for public search by invoice)
    // We use SERVICE_ROLE_KEY because public/anon users might not have SELECT permission on all transactions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 2. Query transaction with invoice number
    // Note: Database field is likely 'invoice_code' (snake_case)
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(`
        id,
        invoice_code,
        customer_name: customers(name),
        orderStatus,
        paymentStatus,
        total,
        amountPaid,
        estimatedCompletionDate,
        items
      `)
      .eq('invoice_code', invoice)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // 3. Format response for public view (security: dont expose internal IDs if not needed)
    const responseData = {
      invoice: data.invoice_code,
      customerName: Array.isArray(data.customer_name) ? data.customer_name[0]?.name : (data.customer_name as any)?.name ?? 'Pelanggan',
      status: data.orderStatus,
      paymentStatus: data.paymentStatus,
      total: data.total,
      amountPaid: data.amountPaid,
      estimatedCompletion: data.estimatedCompletionDate,
      items: (data.items as any[])?.map((item: any) => ({
        service: item.serviceName,
        qty: item.quantity,
        unit: item.unit
      })) ?? []
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

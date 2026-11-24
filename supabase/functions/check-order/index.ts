import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface TransactionItem {
  serviceName: string;
  quantity: number;
  unit: string;
}

interface CustomerData {
  name: string;
}

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const invoice = url.searchParams.get('invoice')?.trim();

    if (!invoice) {
      return new Response(JSON.stringify({ error: 'Invoice number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (invoice.length > 50 || /[^a-zA-Z0-9\-_]/.test(invoice)) {
      return new Response(JSON.stringify({ error: 'Invalid invoice format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(
        `
        id,
        invoiceCode,
        customer_name: customers(name),
        orderStatus,
        paymentStatus,
        total,
        amountPaid,
        estimatedCompletionDate,
        items
      `,
      )
      .eq('invoiceCode', invoice)
      .maybeSingle();

    if (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }

    if (!data) {
      return new Response(JSON.stringify({ error: 'Transaction not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const customerName = Array.isArray(data.customer_name)
      ? (data.customer_name[0] as CustomerData)?.name
      : ((data.customer_name as CustomerData | null)?.name ?? 'Pelanggan');

    const items = Array.isArray(data.items)
      ? (data.items as TransactionItem[]).map((item) => ({
          service: item.serviceName,
          qty: item.quantity,
          unit: item.unit,
        }))
      : [];

    // Projection aman untuk konsumsi publik
    const responseData = {
      invoice: data.invoiceCode,
      customerName,
      status: data.orderStatus,
      paymentStatus: data.paymentStatus,
      total: data.total,
      amountPaid: data.amountPaid,
      estimatedCompletion: data.estimatedCompletionDate,
      items,
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Function Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

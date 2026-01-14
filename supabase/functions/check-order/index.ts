import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Type definitions for API response data
interface TransactionItem {
  serviceName: string;
  quantity: number;
  unit: string;
}

interface CustomerData {
  name: string;
}

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // PERBAIKAN: Menggunakan nama kolom yang sesuai dengan database ("invoiceCode", bukan "invoice_code")
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
      .eq('invoiceCode', invoice) // PERBAIKAN DISINI
      .maybeSingle();

    if (error) {
        console.error("Supabase Query Error:", error); // Logging error agar terlihat di Dashboard
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
      : (data.customer_name as CustomerData | null)?.name ?? 'Pelanggan';

    const items = Array.isArray(data.items)
      ? (data.items as TransactionItem[]).map((item) => ({
          service: item.serviceName,
          qty: item.quantity,
          unit: item.unit,
        }))
      : [];

    const responseData = {
      invoice: data.invoiceCode, // Sesuaikan dengan hasil query
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
    console.error("Function Error:", errorMessage); // Logging error
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

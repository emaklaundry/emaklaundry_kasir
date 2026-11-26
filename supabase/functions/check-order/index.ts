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

// ALLOWED_ORIGIN boleh berisi beberapa domain dipisah koma
// (sama seperti fungsi edge lain), mis. "https://kasir.domain,https://emaklaundry.my.id".
const getAllowedOrigins = () => [
  ...(Deno.env.get('ALLOWED_ORIGIN') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const getCorsHeaders = (req: Request): Record<string, string> => {
  const origin = req.headers.get('Origin');
  return {
    ...(origin && getAllowedOrigins().includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
      : {}),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
};

// Samarkan nama untuk konsumsi publik: "Siti Aminah" -> "Sit*** A."
const maskName = (name: string | null | undefined): string => {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Pelanggan';
  const [first, ...rest] = words;
  const head = first.length <= 3 ? first : `${first.slice(0, 3)}***`;
  const tail = rest.map((w) => `${w.charAt(0).toUpperCase()}.`);
  return [head, ...tail].join(' ');
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      status,
    });

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return json({ error: 'Metode tidak diizinkan.' }, 405);
  }

  try {
    const url = new URL(req.url);
    const invoice = url.searchParams.get('invoice')?.trim();

    if (!invoice) {
      return json({ error: 'Kode invoice wajib diisi.' }, 400);
    }

    if (invoice.length > 50 || /[^a-zA-Z0-9\-_]/.test(invoice)) {
      return json({ error: 'Format kode invoice tidak valid.' }, 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Kode invoice dibuat dalam huruf besar; terima juga input huruf kecil dari pelanggan.
    const candidates = Array.from(new Set([invoice, invoice.toUpperCase()]));

    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select(
        `
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
      .in('invoiceCode', candidates)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Supabase Query Error:', error);
      return json({ error: 'Terjadi kesalahan pada server. Coba lagi nanti.' }, 500);
    }

    if (!data) {
      return json({ error: 'Kode invoice tidak ditemukan.' }, 404);
    }

    const rawName = Array.isArray(data.customer_name)
      ? (data.customer_name[0] as CustomerData | undefined)?.name
      : (data.customer_name as CustomerData | null)?.name;

    const items = Array.isArray(data.items)
      ? (data.items as TransactionItem[]).map((item) => ({
          service: item.serviceName,
          qty: item.quantity,
          unit: item.unit,
        }))
      : [];

    // Projection aman untuk konsumsi publik
    return json(
      {
        invoice: data.invoiceCode,
        customerName: maskName(rawName),
        status: data.orderStatus,
        paymentStatus: data.paymentStatus,
        total: data.total,
        amountPaid: data.amountPaid,
        estimatedCompletion: data.estimatedCompletionDate,
        items,
      },
      200,
    );
  } catch (error) {
    console.error('Function Error:', error instanceof Error ? error.message : error);
    return json({ error: 'Terjadi kesalahan pada server. Coba lagi nanti.' }, 500);
  }
});

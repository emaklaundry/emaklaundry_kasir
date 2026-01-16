// @ts-nocheck - Deno runtime, not compatible with Node.js TypeScript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Type definitions for API response
interface ServiceResponse {
  id: string;
  name: string;
  category: string;
  washType: string;
  price: number;
  unit: string;
  durationDays: number;
}

interface ServiceRow {
  id: string;
  name: string;
  category: string;
  wash_type: string;
  price: number;
  unit: string;
  durationDays: number;
  storeId: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const storeId = url.searchParams.get('storeId');
    const category = url.searchParams.get('category');
    const includePrice = url.searchParams.get('includePrice') === 'true';

    // @ts-ignore - Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-ignore - Deno global
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabaseAdmin
      .from('services')
      .select('id, name, category, wash_type, price, unit, durationDays, storeId');

    // Filter by store if provided
    if (storeId) {
      query = query.eq('storeId', storeId);
    }

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category);
    }

    // Order by category and name
    query = query.order('category').order('name');

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }

    // Transform data for response
    const services: ServiceResponse[] = ((data || []) as ServiceRow[]).map((service) => ({
      id: service.id,
      name: service.name,
      category: service.category,
      washType: service.wash_type,
      price: includePrice ? service.price : 0,
      unit: service.unit,
      durationDays: service.durationDays,
    }));

    // Group by category for easier frontend consumption
    const groupedByCategory = services.reduce(
      (acc, service) => {
        const cat = service.category;
        if (!acc[cat]) {
          acc[cat] = [];
        }
        acc[cat].push(service);
        return acc;
      },
      {} as Record<string, ServiceResponse[]>,
    );

    const responseData = {
      success: true,
      total: services.length,
      services: includePrice ? services : services.map(({ price: _, ...rest }) => rest),
      groupedByCategory: includePrice
        ? groupedByCategory
        : Object.fromEntries(
            Object.entries(groupedByCategory).map(([cat, items]) => [
              cat,
              items.map(({ price: _, ...rest }) => rest),
            ]),
          ),
    };

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Function Error:', errorMessage);
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

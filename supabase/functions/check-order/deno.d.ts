// Deno runtime type declarations for Supabase Edge Functions
// These declarations suppress IDE errors when editing Deno-based Edge Functions

declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
  ): {
    from(table: string): {
      select(
        columns: string,
        options?: { count?: 'exact' | 'planned' | 'estimated' },
      ): {
        eq(
          column: string,
          value: string,
        ): {
          maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: Error | null }>;
        };
      };
    };
  };
}

export {};

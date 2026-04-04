import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for server-side usage.
 * Used for: Auth, Storage, Realtime — NOT for DB queries (use Drizzle instead).
 */
export function createSupabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

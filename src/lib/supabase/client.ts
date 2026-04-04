"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for browser usage.
 * Used for: Auth (if using Supabase Auth), Realtime subscriptions, Storage uploads.
 */
export function createSupabaseBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

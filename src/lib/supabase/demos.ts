// Read-only anon Supabase client for the DEMOS project.
// The demos project's RLS allows anon SELECT on every table (each row is
// fake data; the project IS the trust boundary), so the public /d/[demoJobId]
// route can render without auth.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_DEMO_SUPABASE_URL ?? "";
const ANON_KEY = process.env.NEXT_PUBLIC_DEMO_SUPABASE_ANON_KEY ?? "";

let cached: SupabaseClient | null = null;

export function demosSupabase(): SupabaseClient | null {
  if (!URL || !ANON_KEY) return null;
  if (cached) return cached;
  cached = createClient(URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export function isDemosSupabaseConfigured(): boolean {
  return Boolean(URL && ANON_KEY);
}

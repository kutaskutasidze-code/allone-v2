import { createClient } from '@supabase/supabase-js';
import { stubSupabaseClient } from './stub';

// Admin client with service role key - use only on server-side.
//
// Falls back to the shared stub when env vars are absent — same pattern as
// client.ts / server.ts. Without this, prerendered/ISR routes that touch the
// DB (e.g. `/api/careers/list`, which has `revalidate = 60`) crash the build
// with "supabaseUrl is required" on any build that lacks the Supabase env
// (notably Vercel Preview). Production sets the env and never hits the stub.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return stubSupabaseClient();
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

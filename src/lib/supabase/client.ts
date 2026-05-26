import { createBrowserClient } from "@supabase/ssr";
import { stubSupabaseClient } from "./stub";

// Cached singleton client (master's pattern) + stub fallback when env vars
// are missing (my branch's fix for Vercel Preview builds).
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    // Don't cache stubs — once env arrives we want the real client.
    return stubSupabaseClient() as unknown as ReturnType<
      typeof createBrowserClient
    >;
  }
  client = createBrowserClient(url, anon);
  return client;
}

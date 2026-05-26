import { createBrowserClient } from "@supabase/ssr";
import { stubSupabaseClient } from "./stub";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return stubSupabaseClient();
  return createBrowserClient(url, anon);
}

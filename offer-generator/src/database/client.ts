import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";

// Lazy-init: the real SupabaseClient is constructed on first property access.
// Keeps test runs from instantiating a realtime client (which needs `ws` on
// Node < 22) just because a module under test transitively imports this.

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { params: { eventsPerSecond: 0 } },
  });
  return cached;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = (getClient() as unknown as Record<string, unknown>)[
      prop as string
    ];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(getClient());
    }
    return value;
  },
});

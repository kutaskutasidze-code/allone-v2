// Stub Supabase client returned by createClient() when env vars are absent
// (e.g. Vercel Preview builds without propagated NEXT_PUBLIC_SUPABASE_URL).
//
// Implemented as a Proxy that returns itself for any chainable method, and
// resolves to an empty result when awaited (via .then) / .single() / etc.
// This way we don't have to keep adding methods every time the Vercel build
// finds a new one we missed.
//
// Production sets the env vars and never sees this code path.

import type { SupabaseClient } from "@supabase/supabase-js";

type EmptyResult = { data: never[]; error: null; count: null };

const EMPTY: EmptyResult = { data: [], error: null, count: null };

function makeBuilder(): unknown {
  const builder: Record<string, unknown> = {};

  const proxy: unknown = new Proxy(builder, {
    get(_target, prop: string | symbol) {
      if (prop === "then") {
        return (onResolve: (v: EmptyResult) => unknown) =>
          Promise.resolve(onResolve(EMPTY));
      }
      if (prop === "single") {
        return () =>
          Promise.resolve({
            data: null,
            error: { code: "PGRST116", message: "stub" },
          });
      }
      if (prop === "maybeSingle") {
        return () => Promise.resolve({ data: null, error: null });
      }
      if (prop === "csv") {
        return () => Promise.resolve({ data: "", error: null });
      }
      // Default: any other method returns the same proxy (chainable).
      return () => proxy;
    },
  });
  return proxy;
}

export function stubSupabaseClient(): SupabaseClient {
  const client = {
    from: () => makeBuilder(),
    rpc: () => makeBuilder(),
    schema: () => ({
      from: () => makeBuilder(),
      rpc: () => makeBuilder(),
    }),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: () =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      exchangeCodeForSession: () =>
        Promise.resolve({ data: { session: null, user: null }, error: null }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: () => Promise.resolve({ data: null, error: null }),
        list: () => Promise.resolve({ data: [], error: null }),
      }),
    },
    realtime: { channel: () => ({ subscribe: () => {} }) },
  };
  return client as unknown as SupabaseClient;
}

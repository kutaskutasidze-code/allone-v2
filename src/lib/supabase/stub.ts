// Stub Supabase client returned by createClient() when env vars are absent
// (e.g. Vercel Preview builds without propagated NEXT_PUBLIC_SUPABASE_URL).
//
// The stub mimics enough of the SupabaseClient surface that pages calling
// .from(...).select(...) at prerender / build time get an empty result and
// render with no data, instead of throwing.
//
// Production sets the env vars and never sees this code path; this only
// runs at build time on Preview deploys.

import type { SupabaseClient } from "@supabase/supabase-js";

type EmptyResult = { data: never[]; error: null; count: null };

interface StubBuilder {
  select: (..._: unknown[]) => StubBuilder;
  insert: (..._: unknown[]) => StubBuilder;
  update: (..._: unknown[]) => StubBuilder;
  delete: (..._: unknown[]) => StubBuilder;
  upsert: (..._: unknown[]) => StubBuilder;
  eq: (..._: unknown[]) => StubBuilder;
  neq: (..._: unknown[]) => StubBuilder;
  in: (..._: unknown[]) => StubBuilder;
  is: (..._: unknown[]) => StubBuilder;
  gt: (..._: unknown[]) => StubBuilder;
  gte: (..._: unknown[]) => StubBuilder;
  lt: (..._: unknown[]) => StubBuilder;
  lte: (..._: unknown[]) => StubBuilder;
  like: (..._: unknown[]) => StubBuilder;
  ilike: (..._: unknown[]) => StubBuilder;
  or: (..._: unknown[]) => StubBuilder;
  order: (..._: unknown[]) => StubBuilder;
  limit: (..._: unknown[]) => StubBuilder;
  range: (..._: unknown[]) => StubBuilder;
  single: () => Promise<{
    data: null;
    error: { code: "PGRST116"; message: "stub" };
  }>;
  maybeSingle: () => Promise<{ data: null; error: null }>;
  then: <T>(onResolve: (v: EmptyResult) => T) => Promise<T>;
}

function makeBuilder(): StubBuilder {
  const empty: EmptyResult = { data: [], error: null, count: null };

  const builder: StubBuilder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    is: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    or: () => builder,
    order: () => builder,
    limit: () => builder,
    range: () => builder,
    single: () =>
      Promise.resolve({
        data: null,
        error: { code: "PGRST116" as const, message: "stub" as const },
      }),
    maybeSingle: () => Promise.resolve({ data: null, error: null }),
    then: (onResolve) => Promise.resolve(onResolve(empty)),
  };
  return builder;
}

export function stubSupabaseClient(): SupabaseClient {
  const client = {
    from: (_table: string) => makeBuilder(),
    auth: {
      getSession: () =>
        Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: (_cb: unknown) => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
      signInWithPassword: () =>
        Promise.resolve({ data: { user: null, session: null }, error: null }),
      exchangeCodeForSession: () =>
        Promise.resolve({ data: { session: null, user: null }, error: null }),
    },
    rpc: () => makeBuilder(),
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        download: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      }),
    },
  };
  return client as unknown as SupabaseClient;
}

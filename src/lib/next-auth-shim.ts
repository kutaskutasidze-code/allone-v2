"use client";

// Tiny next-auth/react compatibility shim. BF's shell components call
// `signOut({ callbackUrl: "/" })` from "next-auth/react" — we don't have
// next-auth installed in this repo (we use Supabase), so this shim
// exposes the same surface but routes the call through Supabase.

import { createClient } from "@/lib/supabase/client";

export interface SignOutOpts {
  callbackUrl?: string;
}

export async function signOut(opts: SignOutOpts = {}) {
  const supabase = createClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // Continue with redirect even if signOut errored — the page reload
    // below clears local session anyway.
  }
  if (typeof window !== "undefined") {
    window.location.assign(opts.callbackUrl || "/");
  }
}

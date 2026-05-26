// Supabase client pointed at the dedicated demos project.
// Distinct from src/database/client.ts (sales/website project) per decision
// recorded 2026-05-26 in the pipeline spec: sales PII must not co-mingle
// with demo seed data.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

let cached: SupabaseClient | null = null;

export function demosSupabase(): SupabaseClient {
  if (cached) return cached;
  const url = config.demo.demosSupabaseUrl;
  const key = config.demo.demosSupabaseServiceKey;
  if (!url || !key) {
    throw new Error(
      "demos Supabase project not configured — set DEMO_SUPABASE_URL + DEMO_SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  cached = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cached;
}

export function isDemosSupabaseConfigured(): boolean {
  return Boolean(
    config.demo.demosSupabaseUrl && config.demo.demosSupabaseServiceKey,
  );
}

export function warnIfDemosUnconfigured(context: string): void {
  if (!isDemosSupabaseConfigured()) {
    logger.warn(
      `${context}: demos Supabase project not configured — DEMO_SUPABASE_URL/SERVICE_KEY missing. Skipping seed.`,
    );
  }
}

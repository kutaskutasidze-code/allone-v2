// Fetches per-user growth-pct overrides and applies them to AimResults
// produced by sales-aims.ts. Defaults flow from the hardcoded
// DEFAULT_GROWTH_PCT in sales-aims; this layer lets admins tune those.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Metric, AimResult } from "./sales-aims";

export type GrowthOverrideMap = Partial<Record<Metric, number>>;

export async function fetchGrowthOverridesForUser(
  supabase: SupabaseClient,
  salesUserId: string,
): Promise<GrowthOverrideMap> {
  const { data, error } = await supabase
    .from("aim_growth_overrides")
    .select("metric, growth_pct")
    .eq("sales_user_id", salesUserId);
  if (error) return {};
  const out: GrowthOverrideMap = {};
  for (const row of (data as Array<{
    metric: Metric;
    growth_pct: number;
  }> | null) ?? []) {
    out[row.metric] = row.growth_pct;
  }
  return out;
}

export function applyGrowthOverrides(
  results: AimResult[],
  overrides: GrowthOverrideMap,
): AimResult[] {
  return results.map((r) => {
    const override = overrides[r.metric];
    if (override === undefined || override === r.growth_pct) return r;
    // Re-scale aim from baseline using the override.
    const aim = Math.max(0, Math.ceil(r.baseline * (1 + override / 100)));
    const progress_pct =
      aim === 0 ? (r.actual > 0 ? 100 : 0) : Math.round((r.actual / aim) * 100);
    return {
      ...r,
      growth_pct: override,
      aim,
      progress_pct: Math.max(0, progress_pct),
    };
  });
}

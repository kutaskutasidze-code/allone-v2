// Returns AimResult arrays for day / week / month for the signed-in sales
// user. Backing the AimsBoard widget. Applies admin-set growth-pct overrides
// when present.

import { NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { fetchMetricEventsForUser } from "@/lib/sales-metric-events";
import { computeAllAims } from "@/lib/sales-aims";
import {
  fetchGrowthOverridesForUser,
  applyGrowthOverrides,
} from "@/lib/sales-aim-overrides";

export async function GET() {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const now = new Date();
    const [events, overrides] = await Promise.all([
      fetchMetricEventsForUser(supabase, salesUser.id, now),
      fetchGrowthOverridesForUser(supabase, salesUser.id),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        day: applyGrowthOverrides(
          computeAllAims(events, now, "day"),
          overrides,
        ),
        week: applyGrowthOverrides(
          computeAllAims(events, now, "week"),
          overrides,
        ),
        month: applyGrowthOverrides(
          computeAllAims(events, now, "month"),
          overrides,
        ),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }
}

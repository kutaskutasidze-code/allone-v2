// Returns AimResult arrays for day / week / month for the signed-in sales
// user. Backing the AimsBoard widget.

import { NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { fetchMetricEventsForUser } from "@/lib/sales-metric-events";
import { computeAllAims } from "@/lib/sales-aims";

export async function GET() {
  try {
    const { supabase, salesUser } = await requireSalesAuth();
    const now = new Date();
    const events = await fetchMetricEventsForUser(supabase, salesUser.id, now);
    return NextResponse.json({
      success: true,
      data: {
        day: computeAllAims(events, now, "day"),
        week: computeAllAims(events, now, "week"),
        month: computeAllAims(events, now, "month"),
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

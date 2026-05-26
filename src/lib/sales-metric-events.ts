// Pulls the metric events the aim engine consumes from the live Supabase
// schema. Server-only — uses the service role through a passed-in client.
//
// We pull a wide window (90 days back) once per cron invocation and let the
// aim engine slice it; cheaper than 6 metrics × 4 periods × N queries.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MetricEvent } from "./sales-aims";

const WINDOW_DAYS = 90;

export async function fetchMetricEventsForUser(
  supabase: SupabaseClient,
  salesUserId: string,
  now: Date = new Date(),
): Promise<MetricEvent[]> {
  const since = new Date(
    now.getTime() - WINDOW_DAYS * 86_400_000,
  ).toISOString();
  const events: MetricEvent[] = [];

  // Leads: contacted / qualified / won
  const { data: leads } = await supabase
    .from("leads")
    .select("id, status, value, updated_at, created_at")
    .eq("sales_user_id", salesUserId)
    .gte("updated_at", since);
  for (const l of (leads as Array<{
    status: string;
    value: number;
    updated_at: string;
    created_at: string;
  }> | null) ?? []) {
    // We use updated_at as the transition timestamp. This is approximate —
    // a lead that's only ever been 'new' counts on its created_at. For a
    // status that moved through multiple values, only the final stop is
    // recorded here.
    const t = l.updated_at;
    if (
      l.status === "contacted" ||
      l.status === "qualified" ||
      l.status === "won"
    ) {
      events.push({ metric: "leads_contacted", occurred_at: t, value: 1 });
    }
    if (l.status === "qualified" || l.status === "won") {
      events.push({ metric: "leads_qualified", occurred_at: t, value: 1 });
    }
    if (l.status === "won") {
      events.push({ metric: "leads_won_count", occurred_at: t, value: 1 });
      events.push({
        metric: "leads_won_revenue",
        occurred_at: t,
        value: l.value ?? 0,
      });
    }
  }

  // Demos: sent + engagement
  const { data: demos } = await supabase
    .from("demo_jobs")
    .select(
      "id, status, engagement_count, created_at, updated_at, lead:leads(sales_user_id)",
    )
    .gte("created_at", since);
  type DemoRow = {
    id: string;
    status: string;
    engagement_count: number;
    created_at: string;
    updated_at: string;
    lead: { sales_user_id?: string } | null;
  };
  for (const d of (demos as unknown as DemoRow[] | null) ?? []) {
    if (d.lead?.sales_user_id !== salesUserId) continue;
    if (d.status === "sent") {
      events.push({
        metric: "demos_sent",
        occurred_at: d.updated_at,
        value: 1,
      });
      if ((d.engagement_count ?? 0) > 0) {
        events.push({
          metric: "demos_engaged",
          occurred_at: d.updated_at,
          value: 1,
        });
      }
    }
  }

  return events;
}

// Server-side helper for kicking off / tearing down demo pipeline jobs.
// Lives in allone-website so the sales API can fire-and-forget without
// going through the Next.js admin auth round-trip.

import { logger } from "./logger";

const OFFER_API_URL = process.env.OFFER_API_URL || "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY || "";

export async function enqueueDemoJob(input: {
  lead_id: string;
  sales_user_id?: string | null;
}): Promise<{ ok: boolean; demo_job_id?: string; error?: string }> {
  if (!OFFER_API_URL || !OFFER_API_KEY) {
    return { ok: false, error: "OFFER_API_URL/KEY not configured" };
  }
  try {
    const res = await fetch(`${OFFER_API_URL}/api/demos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify(input),
    });
    const json = (await res.json()) as {
      success?: boolean;
      data?: { id?: string };
      error?: string;
    };
    if (!res.ok || !json.success) {
      return {
        ok: false,
        error: json.error ?? `offer-generator returned ${res.status}`,
      };
    }
    return { ok: true, demo_job_id: json.data?.id };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function teardownDemosForLead(
  lead_id: string,
): Promise<{ torn_down: number }> {
  // Look up all demo_jobs for this lead, hit teardown for each via the
  // offer-generator route. Used when a lead is marked 'lost'.
  if (!OFFER_API_URL || !OFFER_API_KEY) return { torn_down: 0 };
  try {
    const listRes = await fetch(
      `${OFFER_API_URL}/api/demos?lead_id=${encodeURIComponent(lead_id)}`,
      { headers: { Authorization: `Bearer ${OFFER_API_KEY}` } },
    );
    const listJson = (await listRes.json()) as {
      data?: Array<{ id: string; status: string }>;
    };
    const jobs = (listJson.data ?? []).filter(
      (j) => !["expired", "deleted"].includes(j.status),
    );
    let torn = 0;
    for (const job of jobs) {
      const r = await fetch(`${OFFER_API_URL}/api/demos/${job.id}/teardown`, {
        method: "POST",
        headers: { Authorization: `Bearer ${OFFER_API_KEY}` },
      });
      if (r.ok) torn++;
    }
    return { torn_down: torn };
  } catch (err) {
    logger.error("teardownDemosForLead failed", {
      lead_id,
      error: err instanceof Error ? err.message : String(err),
    });
    return { torn_down: 0 };
  }
}

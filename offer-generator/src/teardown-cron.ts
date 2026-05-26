// teardown-cron: scans demo_jobs for expired demos and tears them down.
// Designed to be run from a cron / scheduler hitting POST /api/internal/teardown
// or as a standalone process: `pnpm tsx scripts/run-teardown.ts`.

import { supabase } from "./database/client.js";
import { logger } from "./utils/logger.js";
import { teardownVercel } from "./deployer/index.js";
import { unseedDemo } from "./admin-wirer/index.js";
import type { DemoJob, Segment } from "./types/demo.js";

export interface TeardownResult {
  scanned: number;
  torn_down: number;
  failed: number;
  errors: Array<{ demo_job_id: string; error: string }>;
}

export async function runTeardownPass(
  now: Date = new Date(),
): Promise<TeardownResult> {
  const result: TeardownResult = {
    scanned: 0,
    torn_down: 0,
    failed: 0,
    errors: [],
  };

  const { data, error } = await supabase
    .from("demo_jobs")
    .select(
      "id, demo_vercel_project_id, demo_supabase_org_id, status, expires_at, reference_template_id, lead_id",
    )
    .lt("expires_at", now.toISOString())
    .in("status", ["sent", "draft_ready", "expired"]);

  if (error) {
    logger.error("teardown: scan failed", { error: error.message });
    throw error;
  }

  result.scanned = data?.length ?? 0;
  if (!data || data.length === 0) return result;

  for (const row of data) {
    const job = row as Partial<DemoJob>;
    try {
      if (job.demo_vercel_project_id) {
        const v = await teardownVercel(job.demo_vercel_project_id);
        if (!v.ok) {
          logger.warn("teardown: Vercel project rm non-zero exit", {
            id: job.id,
            exit: v.exitCode,
          });
        }
      }
      if (job.demo_supabase_org_id) {
        // segment lookup: pull from reference_templates → segment
        const segment = await lookupSegment(job.reference_template_id ?? null);
        if (segment) {
          await unseedDemo(job.demo_supabase_org_id, segment);
        }
      }
      await supabase
        .from("demo_jobs")
        .update({ status: "deleted" })
        .eq("id", job.id!);
      result.torn_down++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        demo_job_id: job.id ?? "unknown",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  logger.info("teardown: pass complete", result);
  return result;
}

async function lookupSegment(refId: string | null): Promise<Segment | null> {
  if (!refId) return null;
  const { data, error } = await supabase
    .from("reference_templates")
    .select("segment")
    .eq("id", refId)
    .single();
  if (error || !data) return null;
  return data.segment as Segment;
}

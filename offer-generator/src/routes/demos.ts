import { Router } from "express";
import { z } from "zod";
import { logger } from "../utils/logger.js";
import { supabase } from "../database/client.js";
import {
  createDemoJob,
  getDemoJob,
  listDemoJobs,
} from "../database/demo-jobs.repo.js";
import { runDemoPipeline } from "../demo-pipeline.js";
import type { LeadSource } from "../types/demo.js";

const router = Router();

const createDemoSchema = z.object({
  lead_id: z.string().uuid(),
  sales_user_id: z.string().uuid().optional(),
});

interface LeadRow {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  source: string | null;
  sales_user_id: string | null;
}

router.post("/api/demos", async (req, res) => {
  try {
    const body = createDemoSchema.parse(req.body);
    const job = await createDemoJob({
      lead_id: body.lead_id,
      sales_user_id: body.sales_user_id ?? null,
    });

    // Kick off async — caller polls GET /api/demos/:id.
    kickoff(job.id).catch((err) => {
      logger.error("demo pipeline crashed", { id: job.id, error: err.message });
    });

    res
      .status(201)
      .json({ success: true, data: { id: job.id, status: job.status } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation failed",
        errors: err.flatten().fieldErrors,
      });
      return;
    }
    logger.error("createDemo failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/api/demos/:id", async (req, res) => {
  try {
    const job = await getDemoJob(req.params.id);
    if (!job) {
      res.status(404).json({ success: false, error: "Demo job not found" });
      return;
    }
    res.json({ success: true, data: job });
  } catch (err) {
    logger.error("getDemo failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.get("/api/demos", async (req, res) => {
  try {
    const lead_id = (req.query.lead_id as string) || undefined;
    const status = (req.query.status as string) || undefined;
    const limit = Math.min(
      parseInt((req.query.limit as string) ?? "50") || 50,
      200,
    );
    const jobs = await listDemoJobs({
      lead_id,
      status: status as any,
      limit,
    });
    res.json({ success: true, data: jobs });
  } catch (err) {
    logger.error("listDemos failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/api/demos/:id/retry", async (req, res) => {
  try {
    const job = await getDemoJob(req.params.id);
    if (!job) {
      res.status(404).json({ success: false, error: "Demo job not found" });
      return;
    }
    if (job.status !== "failed") {
      res.status(409).json({
        success: false,
        error: `Cannot retry job in status ${job.status}`,
      });
      return;
    }
    // Reset status only (don't clear current_phase or phase_history — the
    // orchestrator's resume mode reads phase_history to decide which phases
    // to skip and which to re-run).
    await supabase
      .from("demo_jobs")
      .update({
        status: "queued",
        progress: 0,
        error_message: null,
      })
      .eq("id", job.id);

    kickoff(job.id, { resume: true }).catch((err) => {
      logger.error("demo pipeline retry crashed", {
        id: job.id,
        error: err.message,
      });
    });

    res
      .status(202)
      .json({ success: true, data: { id: job.id, status: "queued" } });
  } catch (err) {
    logger.error("retryDemo failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

router.post("/api/demos/:id/teardown", async (req, res) => {
  try {
    const job = await getDemoJob(req.params.id);
    if (!job) {
      res.status(404).json({ success: false, error: "Demo job not found" });
      return;
    }
    if (job.demo_vercel_project_id) {
      const { teardownVercel } = await import("../deployer/index.js");
      await teardownVercel(job.demo_vercel_project_id);
    }
    if (job.demo_supabase_org_id && job.reference_template_id) {
      const { data: ref } = await supabase
        .from("reference_templates")
        .select("segment")
        .eq("id", job.reference_template_id)
        .maybeSingle();
      if (ref?.segment) {
        const { unseedDemo } = await import("../admin-wirer/index.js");
        await unseedDemo(job.demo_supabase_org_id, ref.segment as any);
      }
    }
    await supabase
      .from("demo_jobs")
      .update({ status: "deleted" })
      .eq("id", job.id);
    res.json({ success: true });
  } catch (err) {
    logger.error("teardownDemo failed", { error: err });
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

async function kickoff(
  demoJobId: string,
  opts: { resume?: boolean } = {},
): Promise<void> {
  const job = await getDemoJob(demoJobId);
  if (!job) throw new Error(`demo_job ${demoJobId} disappeared`);

  const { data: leadRow, error } = await supabase
    .from("leads")
    .select("id, name, email, company, source, sales_user_id")
    .eq("id", job.lead_id)
    .single();
  if (error || !leadRow) {
    throw new Error(
      `lead ${job.lead_id} not found: ${error?.message ?? "no row"}`,
    );
  }
  const lead = leadRow as LeadRow;

  const lead_url = await guessLeadUrl(lead);

  await runDemoPipeline(
    demoJobId,
    {
      lead_id: lead.id,
      lead_name: lead.name,
      lead_company: lead.company,
      lead_email: lead.email ?? "",
      lead_url,
      lead_source: (lead.source as LeadSource) || "cold",
    },
    opts,
  );
}

// Derive lead's site URL: prefer leads.company_spec.domain (set by enrichment
// after the first attempt) or leads.email domain.
async function guessLeadUrl(lead: LeadRow): Promise<string | null> {
  const { data } = await supabase
    .from("leads")
    .select("company_spec")
    .eq("id", lead.id)
    .single();
  const spec = (data?.company_spec as { domain?: string } | null) ?? null;
  if (spec?.domain) return `https://${spec.domain.replace(/^https?:\/\//, "")}`;
  if (lead.email) {
    const at = lead.email.lastIndexOf("@");
    if (at >= 0) return `https://${lead.email.slice(at + 1)}`;
  }
  return null;
}

export default router;

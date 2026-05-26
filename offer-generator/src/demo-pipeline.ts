import { logger } from "./utils/logger.js";
import * as jobsRepo from "./database/demo-jobs.repo.js";
import { analyzeWebsite } from "./analyzer/index.js";
import { enrichCompanySpec, classifySegment } from "./enricher/index.js";
import { pickReference } from "./references/index.js";
import { cloneSite, validateClonedApis } from "./cloner/index.js";
import { skinClone } from "./skinner/index.js";
import { wireAdmin } from "./admin-wirer/index.js";
import { deployToVercel } from "./deployer/index.js";
import { draftEmail } from "./email-drafter/index.js";
import type { AuditSummary, CompanySpec, DemoStatus } from "./types/demo.js";

// Orchestrates the full demo pipeline for a single demo_jobs row.
//
// Phases (in order, with audit running parallel to skin/wire/deploy):
//   1. enriching         analyzer (existing) + enricher.enrichCompanySpec
//                                              + enricher.classifySegment
//   2. (parallel start)
//        skinning          references.pickReference → skinner.skinClone
//        auditing          analyzer (already ran in step 1, persist summary)
//   3. wiring_admin      admin-wirer.wireAdmin
//   4. deploying         deployer.deployToVercel → cloner.validateClonedApis
//   5. drafting          email-drafter.draftEmail
//   6. draft_ready       jobsRepo.markDraftReady → notify sales user
//
// Failure at any phase → status=failed, error_message set, retry resumes from
// current_phase. Each phase writes phase_history entry on enter + exit.
//
// Slice 8: full implementation. Slices 3-7 fill in the called modules.
export async function runDemoPipeline(
  demoJobId: string,
  leadInput: {
    lead_id: string;
    lead_name: string;
    lead_company: string | null;
    lead_email: string;
    lead_url?: string | null;
    lead_source: "cold" | "referral" | "inbound" | "imported";
  },
): Promise<void> {
  logger.info("Demo pipeline starting", {
    demoJobId,
    lead_id: leadInput.lead_id,
  });

  try {
    // Phase 1: enriching
    await phaseEnter(demoJobId, "enriching", 5);
    const analysis = leadInput.lead_url
      ? await analyzeWebsite(leadInput.lead_url, async () => {})
      : null;
    const segment = await classifySegment(analysis, undefined);
    const company: CompanySpec = await enrichCompanySpec(
      leadInput.lead_email,
      leadInput.lead_name,
      leadInput.lead_company,
      analysis,
    );
    await phaseExit(demoJobId, "enriching", { segment });

    // Phase 2: parallel { skin → wire_admin → deploy } | { audit }
    const reference = await pickReference(segment);
    if (!reference)
      throw new Error(`No active reference template for segment "${segment}"`);
    await jobsRepo.setReferenceTemplate(demoJobId, reference.id);

    const skinThenDeploy = async () => {
      await phaseEnter(demoJobId, "skinning", 30);
      const skinDir = `/tmp/demo-${demoJobId}`;
      const skinResult = await skinClone({
        refPath: reference.pre_cloned_path,
        company,
        outDir: skinDir,
        refMapPath: reference.ref_map_path,
      });
      if (skinResult.checkScore < 95) {
        throw new Error(
          `xfly-check score ${skinResult.checkScore} < 95; warnings: ${skinResult.warnings.join("; ")}`,
        );
      }
      await phaseExit(demoJobId, "skinning", {
        checkScore: skinResult.checkScore,
      });

      await phaseEnter(demoJobId, "wiring_admin", 50);
      const wired = await wireAdmin({
        demoDir: skinDir,
        demoOrgId: crypto.randomUUID(),
        demoJobId,
        segment,
        company,
      });
      await phaseExit(demoJobId, "wiring_admin", {
        seededRows: wired.seededRows,
        adminUrl: wired.adminUrl,
        warnings: wired.warnings,
      });

      await phaseEnter(demoJobId, "deploying", 70);
      const deployed = await deployToVercel({
        dir: skinDir,
        projectName: `demo-${leadInput.lead_id.slice(0, 8)}-${demoJobId.slice(0, 6)}`,
      });
      await jobsRepo.setDemoUrl(demoJobId, deployed.url, deployed.projectId);
      const apiValidation = await validateClonedApis(skinDir, deployed.url);
      if (apiValidation.matchRate < 0.95) {
        logger.warn("API replay match rate below 95%", {
          demoJobId,
          ...apiValidation,
        });
      }
      await phaseExit(demoJobId, "deploying", { ...apiValidation });
    };

    const auditPhase = async () => {
      await phaseEnter(demoJobId, "auditing", 30);
      const summary: AuditSummary | null = analysis
        ? summarizeAudit(analysis)
        : null;
      if (summary) await jobsRepo.setAuditResults(demoJobId, summary);
      await phaseExit(demoJobId, "auditing", { hasAudit: Boolean(summary) });
    };

    await Promise.all([skinThenDeploy(), auditPhase()]);

    // Phase 3: drafting
    await phaseEnter(demoJobId, "drafting", 90);
    const job = await jobsRepo.getDemoJob(demoJobId);
    if (!job?.demo_url) throw new Error("Demo URL missing after deploy");
    const draft = await draftEmail({
      lead_id: leadInput.lead_id,
      lead_name: leadInput.lead_name,
      lead_company: leadInput.lead_company,
      lead_email: leadInput.lead_email,
      segment,
      source: leadInput.lead_source,
      demo_url: job.demo_url,
      demo_job_id: demoJobId,
      audit: job.audit_results,
    });
    await jobsRepo.setEmailDraftId(demoJobId, draft.id);
    await phaseExit(demoJobId, "drafting", { draftId: draft.id });

    // Done
    await jobsRepo.markDraftReady(demoJobId);
    logger.info("Demo pipeline complete", { demoJobId });

    // Fire notification to the assigned sales user. Fire-and-forget; failure
    // doesn't unwind the pipeline — the draft is still visible in the UI.
    const { notifyDraftReady } = await import("./notifier/index.js");
    notifyDraftReady({ demoJobId }).catch((err) =>
      logger.warn("notifyDraftReady threw", {
        demoJobId,
        error: err instanceof Error ? err.message : String(err),
      }),
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    logger.error("Demo pipeline failed", { demoJobId, error: msg });
    await jobsRepo.failDemoJob(demoJobId, msg);
  }
}

async function phaseEnter(jobId: string, phase: string, progress: number) {
  await jobsRepo.updateDemoJobPhase(
    jobId,
    phase,
    phase as DemoStatus,
    progress,
  );
  await jobsRepo.appendPhaseHistory(jobId, {
    phase,
    started_at: new Date().toISOString(),
    status: "running",
  });
}

async function phaseExit(
  jobId: string,
  phase: string,
  notes: Record<string, unknown>,
) {
  await jobsRepo.appendPhaseHistory(jobId, {
    phase,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    status: "ok",
    notes,
  });
}

function summarizeAudit(
  analysis: import("./types/analysis.js").AnalysisData,
): AuditSummary {
  const all = [
    ...analysis.technical.htmlIssues,
    ...analysis.technical.seoIssues,
    ...analysis.technical.performanceIssues,
    ...analysis.technical.securityIssues,
    ...analysis.technical.accessibilityIssues,
    ...analysis.technical.additionalIssues,
  ];
  const top = all
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity))
    .slice(0, 5)
    .map((i) => ({
      severity: i.severity,
      category: i.category,
      headline: i.description,
      oneLineFix: i.recommendation ?? "",
    }));
  return {
    scores: analysis.scores,
    topIssues: top,
    techStack: {
      platform: analysis.techStack.platform,
      frameworks: analysis.techStack.frameworks,
      cms: analysis.techStack.cms,
    },
  };
}

function severityRank(s: "critical" | "warning" | "info"): number {
  return s === "critical" ? 0 : s === "warning" ? 1 : 2;
}

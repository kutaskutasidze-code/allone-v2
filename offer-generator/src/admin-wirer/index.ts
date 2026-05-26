// admin-wirer — gives the marketing demo a working /admin link.
//
// v1 model: SHARED admin. One admin SPA at config.demo.sharedAdminUrl serves
// every demo; the demo's marketing index.html gets an "Open admin" banner
// injected that points at <sharedAdminUrl>?demo=<demoJobId>. The shared admin
// queries demo_orgs by id to pull brand color/name + reads org-scoped data.
//
// Why shared, not embedded: per-demo admin builds blow up Vercel function
// quota and build time. The "feels like one product" requirement is met
// because the shared admin reads the demo's brand from demo_orgs and applies
// it at render time. Decided 2026-05-26.

import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import {
  isDemosSupabaseConfigured,
  warnIfDemosUnconfigured,
} from "../database/demos-client.js";
import { seedSegment, unseedSegment } from "./seeds/index.js";
import type { CompanySpec, ProgressHandler, Segment } from "../types/demo.js";

export interface WireAdminOpts {
  demoDir: string;
  demoOrgId: string;
  demoJobId: string;
  segment: Segment;
  company: CompanySpec;
  onProgress?: ProgressHandler;
}

export interface WireAdminResult {
  ok: boolean;
  adminUrl: string;
  seededRows: number;
  warnings: string[];
}

export async function wireAdmin(opts: WireAdminOpts): Promise<WireAdminResult> {
  const warnings: string[] = [];

  // 1. Seed segment data into demos Supabase (or skip if unconfigured)
  let seededRows = 0;
  if (isDemosSupabaseConfigured()) {
    opts.onProgress?.({ type: "phase", phase: "seed_demo_data" });
    try {
      const seed = await seedSegment(
        opts.segment,
        opts.demoOrgId,
        opts.company,
      );
      seededRows = seed.rows;
      logger.info("admin-wirer: seeded", {
        demoOrgId: opts.demoOrgId,
        segment: opts.segment,
        ...seed.detail,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      warnings.push(`seed failed: ${msg}`);
      logger.warn("admin-wirer: seed failed", { error: msg });
    }
  } else {
    warnIfDemosUnconfigured("admin-wirer");
    warnings.push(
      "Demos Supabase not configured — admin will load with empty data",
    );
  }

  // 2. Build the shared admin URL for this demo
  const adminUrl = `${config.demo.sharedAdminUrl}?demo=${encodeURIComponent(
    opts.demoJobId,
  )}`;

  // 3. Inject "Open admin" entry into the marketing clone
  opts.onProgress?.({ type: "phase", phase: "inject_admin_link" });
  try {
    await injectAdminLink(opts.demoDir, adminUrl, opts.company);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    warnings.push(`admin-link injection failed: ${msg}`);
    logger.warn("admin-wirer: link injection failed", { error: msg });
  }

  return {
    ok: warnings.length === 0,
    adminUrl,
    seededRows,
    warnings,
  };
}

export async function unseedDemo(
  demoOrgId: string,
  segment: Segment,
): Promise<void> {
  if (!isDemosSupabaseConfigured()) {
    warnIfDemosUnconfigured("unseedDemo");
    return;
  }
  await unseedSegment(segment, demoOrgId);
}

// Inject a small fixed-position "Open admin" pill near top-right of the
// marketing demo's index.html. Kept inline so we don't depend on the
// reference template's CSS conventions. Idempotent — re-running won't
// duplicate the pill.
async function injectAdminLink(
  demoDir: string,
  adminUrl: string,
  company: CompanySpec,
): Promise<void> {
  const indexPath = path.join(demoDir, "index.html");
  let html: string;
  try {
    html = await fs.readFile(indexPath, "utf8");
  } catch {
    throw new Error(`index.html not found at ${indexPath}`);
  }

  if (html.includes("data-demo-admin-pill")) return;

  const accent = company.color ?? "#0ea5e9";
  const pill = `
<style data-demo-admin-pill>
  .demo-admin-pill{position:fixed;top:18px;right:18px;z-index:99999;background:${accent};color:#fff;font:600 13px/1 system-ui,-apple-system,sans-serif;letter-spacing:.02em;padding:11px 18px;border-radius:999px;text-decoration:none;box-shadow:0 6px 24px rgba(0,0,0,.18);transition:transform .12s ease,box-shadow .12s ease}
  .demo-admin-pill:hover{transform:translateY(-1px);box-shadow:0 10px 32px rgba(0,0,0,.22)}
</style>
<a data-demo-admin-pill class="demo-admin-pill" href="${adminUrl}" target="_blank" rel="noopener">Open your admin →</a>
`.trim();

  if (html.includes("</body>")) {
    html = html.replace("</body>", `${pill}\n</body>`);
  } else {
    html += `\n${pill}\n`;
  }
  await fs.writeFile(indexPath, html, "utf8");
}

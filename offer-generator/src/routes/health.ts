import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { config } from "../config.js";
import { supabase } from "../database/client.js";
import {
  isDemosSupabaseConfigured,
  demosSupabase,
} from "../database/demos-client.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "offer-generator",
    timestamp: new Date().toISOString(),
  });
});

// Detailed self-test. Hit /healthz before opening for production traffic
// to verify every external dependency the demo pipeline reaches into.
router.get("/healthz", async (_req, res) => {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};

  checks.xray_pipeline = await fileCheck(
    path.join(config.demo.xrayBinDir, "xray-pipeline.js"),
  );
  checks.xfly = await fileCheck(path.join(config.demo.xrayBinDir, "xfly.js"));
  checks.xfly_check = await fileCheck(
    path.join(config.demo.xrayBinDir, "xfly-check.js"),
  );
  checks.xray_api_validate = await fileCheck(
    path.join(config.demo.xrayBinDir, "xray-api-validate.js"),
  );

  checks.vercel_cli = await commandCheck("vercel", ["--version"]);

  checks.refs_root = await dirWritableCheck(config.demo.refsRoot);

  checks.sales_supabase = await supabaseProbe("commercial_offers");

  if (isDemosSupabaseConfigured()) {
    try {
      const demos = demosSupabase();
      const r = await demos
        .from("demo_orgs")
        .select("id", { count: "exact", head: true });
      checks.demos_supabase = r.error
        ? { ok: false, detail: r.error.message }
        : { ok: true };
    } catch (e) {
      checks.demos_supabase = {
        ok: false,
        detail: e instanceof Error ? e.message : String(e),
      };
    }
  } else {
    checks.demos_supabase = { ok: false, detail: "DEMO_SUPABASE_URL not set" };
  }

  checks.vercel_token = {
    ok: Boolean(config.demo.vercelToken),
    detail: config.demo.vercelToken ? undefined : "VERCEL_TOKEN missing",
  };
  checks.anthropic_key = {
    ok: Boolean(config.anthropicApiKey),
    detail: config.anthropicApiKey ? undefined : "ANTHROPIC_API_KEY missing",
  };
  checks.resend_key = {
    ok: Boolean(process.env.RESEND_API_KEY),
    detail: process.env.RESEND_API_KEY ? undefined : "RESEND_API_KEY missing",
  };

  const allOk = Object.values(checks).every((c) => c.ok);
  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  });
});

async function fileCheck(p: string): Promise<{ ok: boolean; detail?: string }> {
  try {
    await fs.access(p);
    return { ok: true };
  } catch {
    return { ok: false, detail: `not found: ${p}` };
  }
}

async function dirWritableCheck(
  p: string,
): Promise<{ ok: boolean; detail?: string }> {
  try {
    await fs.mkdir(p, { recursive: true });
    const probe = path.join(p, `.healthz-${Date.now()}`);
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

function commandCheck(
  cmd: string,
  args: string[],
): Promise<{ ok: boolean; detail?: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (c) => (stdout += c.toString()));
    child.on("error", () =>
      resolve({ ok: false, detail: `${cmd} not on PATH` }),
    );
    child.on("close", (code) =>
      resolve({
        ok: code === 0,
        detail: code === 0 ? stdout.trim() : `exit ${code}`,
      }),
    );
  });
}

async function supabaseProbe(
  table: string,
): Promise<{ ok: boolean; detail?: string }> {
  try {
    const r = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    if (r.error) return { ok: false, detail: r.error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      detail: err instanceof Error ? err.message : String(err),
    };
  }
}

export default router;

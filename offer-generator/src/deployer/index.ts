import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import type { ProgressHandler } from "../types/demo.js";

export interface DeployOpts {
  dir: string;
  projectName: string; // demo-<lead-slug>-<short-hash>; lowercase, dashes only
  prod?: boolean; // default true
  team?: string; // default config.demo.vercelTeam
  onProgress?: ProgressHandler;
}

export interface DeployResult {
  ok: boolean;
  url: string;
  projectId: string;
  exitCode: number;
}

const VERCEL_URL_RE = /https:\/\/[a-z0-9._-]+\.vercel\.app/i;

export async function deployToVercel(opts: DeployOpts): Promise<DeployResult> {
  if (!config.demo.vercelToken) {
    throw new Error("VERCEL_TOKEN missing — set it in offer-generator env");
  }
  await assertDir(opts.dir);
  await ensureVercelJson(opts.dir);

  const team = opts.team ?? config.demo.vercelTeam;
  const prod = opts.prod !== false;

  const args = [
    "deploy",
    opts.dir,
    "--token",
    config.demo.vercelToken,
    "--scope",
    team,
    "--name",
    sanitizeProjectName(opts.projectName),
    "--yes",
  ];
  if (prod) args.push("--prod");

  const { ok, exitCode, stdout, stderr } = await runVercel(
    args,
    opts.onProgress,
  );

  const urlMatch = stdout.match(VERCEL_URL_RE) ?? stderr.match(VERCEL_URL_RE);
  if (!ok || !urlMatch) {
    throw new Error(
      `Vercel deploy failed (exit ${exitCode}). Last stderr: ${stderr.slice(-400)}`,
    );
  }
  const url = urlMatch[0];

  const projectId = await inspectProjectId(
    sanitizeProjectName(opts.projectName),
    team,
  );

  return { ok, url, projectId: projectId ?? "", exitCode };
}

export async function teardownVercel(
  projectId: string,
  team?: string,
): Promise<{ ok: boolean; exitCode: number }> {
  if (!config.demo.vercelToken) {
    throw new Error("VERCEL_TOKEN missing — set it in offer-generator env");
  }
  if (!projectId) return { ok: false, exitCode: 0 };

  const args = [
    "projects",
    "rm",
    projectId,
    "--yes",
    "--token",
    config.demo.vercelToken,
    "--scope",
    team ?? config.demo.vercelTeam,
  ];
  const { ok, exitCode } = await runVercel(args);
  return { ok, exitCode };
}

async function runVercel(
  args: string[],
  onProgress?: ProgressHandler,
): Promise<{ ok: boolean; exitCode: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn("vercel", args, { env: process.env });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (c: Buffer) => {
      const text = c.toString();
      stdout += text;
      for (const line of text.split("\n")) {
        if (line.trim()) onProgress?.({ type: "log", line });
      }
    });
    child.stderr.on("data", (c: Buffer) => {
      const text = c.toString();
      stderr += text;
      for (const line of text.split("\n")) {
        if (line.trim())
          onProgress?.({ type: "log", line: `[stderr] ${line}` });
      }
    });

    child.on("error", (e) => {
      onProgress?.({ type: "error", error: e.message });
      resolve({ ok: false, exitCode: -1, stdout, stderr: stderr + e.message });
    });
    child.on("close", (code) => {
      const ok = code === 0;
      onProgress?.({ type: "done", ok, exitCode: code ?? -1 });
      resolve({ ok, exitCode: code ?? -1, stdout, stderr });
    });
  });
}

async function inspectProjectId(
  projectName: string,
  team: string,
): Promise<string | null> {
  try {
    const { stdout, ok } = await runVercel([
      "projects",
      "inspect",
      projectName,
      "--token",
      config.demo.vercelToken,
      "--scope",
      team,
      "--output=json",
    ]);
    if (!ok) return null;
    const parsed = JSON.parse(stdout);
    return parsed?.id ?? parsed?.projectId ?? null;
  } catch (err) {
    logger.warn("inspectProjectId failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export function sanitizeProjectName(name: string): string {
  // Vercel: lowercase, alphanumeric + dashes, up to 100 chars.
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 100) || `demo-${Date.now()}`
  );
}

async function assertDir(p: string): Promise<void> {
  try {
    const stat = await fs.stat(p);
    if (!stat.isDirectory()) throw new Error(`${p} is not a directory`);
  } catch (err) {
    throw new Error(`Deploy dir not found: ${p}`);
  }
}

// Static-clone outputs need a minimal vercel.json so the platform serves
// index.html under each route and treats the clone as a static site. xfly's
// output may already include one; we only create if missing.
async function ensureVercelJson(dir: string): Promise<void> {
  const target = path.join(dir, "vercel.json");
  try {
    await fs.access(target);
    return;
  } catch {}
  await fs.writeFile(
    target,
    JSON.stringify(
      {
        cleanUrls: true,
        trailingSlash: false,
        outputDirectory: ".",
      },
      null,
      2,
    ),
    "utf8",
  );
}

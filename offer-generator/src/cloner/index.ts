import path from "node:path";
import fs from "node:fs";
import { config } from "../config.js";
import { spawnNodeScript } from "../utils/subprocess.js";
import type { ProgressHandler } from "../types/demo.js";

export interface CloneOpts {
  url: string;
  outDir: string;
  maxPages?: number;
  ship?: boolean;
  aiFix?: boolean;
  engine?: "auto" | "static" | "playwright";
  rate?: number;
  indexable?: boolean;
  onProgress?: ProgressHandler;
}

export interface CloneResult {
  ok: boolean;
  cloneDir: string;
  deployedUrl?: string;
  exitCode: number;
}

const DEPLOYED_URL_RE = /https:\/\/[a-z0-9.-]+\.vercel\.app(?:\/\S*)?/i;

export async function cloneSite(opts: CloneOpts): Promise<CloneResult> {
  const args: string[] = [opts.url, opts.outDir];
  if (opts.maxPages) args.push("--max-pages", String(opts.maxPages));
  if (opts.engine && opts.engine !== "auto") args.push("--engine", opts.engine);
  if (opts.indexable) args.push("--indexable");
  if (opts.rate) args.push("--rate", String(opts.rate));
  if (opts.ship) args.push("--ship");
  if (opts.aiFix) args.push("--ai-fix");

  let deployedUrl: string | undefined;
  const wrappedProgress: ProgressHandler = (e) => {
    if (e.type === "log") {
      const m = e.line.match(DEPLOYED_URL_RE);
      if (m && !deployedUrl) deployedUrl = m[0];
    }
    opts.onProgress?.(e);
  };

  const res = await spawnNodeScript({
    script: path.join(config.demo.xrayBinDir, "xray-pipeline.js"),
    args,
    cwd: config.demo.xrayBinDir,
    onProgress: wrappedProgress,
  });

  return {
    ok: res.ok,
    cloneDir: opts.outDir,
    deployedUrl,
    exitCode: res.exitCode,
  };
}

export interface ApiValidationResult {
  matchRate: number;
  total: number;
  matched: number;
  raw: string;
}

// Runs xray-api-validate.js against a deployed clone, parses the match-rate
// summary line. The validator's stdout includes a line like:
//   "MATCH: 47 SIMILAR: 3 DIFFER: 2 STATUS_4xx: 0 ERROR: 0 — total 52"
// We extract the totals; rate = (matched + similar) / total.
export async function validateClonedApis(
  cloneDir: string,
  deployedUrl: string,
  onProgress?: ProgressHandler,
): Promise<ApiValidationResult> {
  if (!fs.existsSync(cloneDir)) {
    throw new Error(`Clone dir not found: ${cloneDir}`);
  }

  const res = await spawnNodeScript({
    script: path.join(config.demo.xrayBinDir, "xray-api-validate.js"),
    args: [cloneDir, "--deployed", deployedUrl],
    cwd: config.demo.xrayBinDir,
    onProgress,
  });

  const summary = parseValidationSummary(res.stdout);
  return { ...summary, raw: res.stdout };
}

export function parseValidationSummary(stdout: string): {
  matchRate: number;
  total: number;
  matched: number;
} {
  // Be lenient — validator output formatting may evolve. Look for any line
  // that contains MATCH and a number, then any total.
  const matchedRe = /MATCH\s*[:=]\s*(\d+)/i;
  const similarRe = /SIMILAR\s*[:=]\s*(\d+)/i;
  const totalRe = /total\s+(\d+)/i;

  const matched = parseInt(stdout.match(matchedRe)?.[1] ?? "0", 10);
  const similar = parseInt(stdout.match(similarRe)?.[1] ?? "0", 10);
  const total = parseInt(stdout.match(totalRe)?.[1] ?? "0", 10);
  const matchRate = total === 0 ? 0 : (matched + similar) / total;
  return { matchRate, total, matched: matched + similar };
}

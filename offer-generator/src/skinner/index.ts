import fs from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { spawnNodeScript } from "../utils/subprocess.js";
import type { CompanySpec, ProgressHandler } from "../types/demo.js";

export interface SkinOpts {
  refPath: string;
  company: CompanySpec;
  outDir: string;
  refMapPath?: string | null;
  assetsDir?: string;
  demoBar?: boolean;
  onProgress?: ProgressHandler;
}

export interface SkinResult {
  ok: boolean;
  outDir: string;
  exitCode: number;
  checkScore: number;
  warnings: string[];
}

export async function skinClone(opts: SkinOpts): Promise<SkinResult> {
  const refExists = await fileExists(opts.refPath);
  if (!refExists) throw new Error(`refPath not found: ${opts.refPath}`);

  await fs.mkdir(opts.outDir, { recursive: true });
  const companyJsonPath = path.join(opts.outDir, ".demo-company.json");
  await fs.writeFile(
    companyJsonPath,
    JSON.stringify(opts.company, null, 2),
    "utf8",
  );

  const xflyArgs: string[] = [
    "--template",
    opts.refPath,
    "--company",
    companyJsonPath,
    "--out",
    opts.outDir,
  ];
  if (opts.refMapPath) xflyArgs.push("--map", opts.refMapPath);
  if (opts.assetsDir) xflyArgs.push("--assets", opts.assetsDir);
  if (opts.demoBar) xflyArgs.push("--demo-bar");

  const xflyRes = await spawnNodeScript({
    script: path.join(config.demo.xrayBinDir, "xfly.js"),
    args: xflyArgs,
    cwd: config.demo.xrayBinDir,
    onProgress: opts.onProgress,
  });

  if (!xflyRes.ok) {
    return {
      ok: false,
      outDir: opts.outDir,
      exitCode: xflyRes.exitCode,
      checkScore: 0,
      warnings: [`xfly exited ${xflyRes.exitCode}`, xflyRes.stderr.slice(-500)],
    };
  }

  const check = await runXflyCheck(
    opts.outDir,
    companyJsonPath,
    opts.onProgress,
  );
  return {
    ok: check.score >= 95,
    outDir: opts.outDir,
    exitCode: xflyRes.exitCode,
    checkScore: check.score,
    warnings: check.warnings,
  };
}

interface CheckResult {
  score: number;
  warnings: string[];
}

async function runXflyCheck(
  cloneDir: string,
  companyJsonPath: string,
  onProgress?: ProgressHandler,
): Promise<CheckResult> {
  const res = await spawnNodeScript({
    script: path.join(config.demo.xrayBinDir, "xfly-check.js"),
    args: [cloneDir, "--company", companyJsonPath],
    cwd: config.demo.xrayBinDir,
    onProgress,
  });

  // xfly-check.js prints per-category lines + a final "N/100" overall grade.
  const scoreMatch = res.stdout.match(/(\d+)\/100/g);
  const lastScore = scoreMatch?.[scoreMatch.length - 1] ?? null;
  const score = lastScore ? parseInt(lastScore.split("/")[0], 10) : 0;

  const warnings: string[] = [];
  for (const line of res.stdout.split("\n")) {
    const lower = line.toLowerCase();
    if (
      lower.includes("fail") ||
      lower.includes("warn") ||
      lower.includes("leftover")
    ) {
      warnings.push(line.trim());
    }
  }

  return { score, warnings };
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

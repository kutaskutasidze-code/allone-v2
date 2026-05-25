import type { CompanySpec, ProgressHandler } from "../types/demo.js";

export interface SkinOpts {
  refPath: string; // pre_cloned_path from reference_templates
  company: CompanySpec;
  outDir: string;
  refMapPath?: string | null; // optional --map for richer per-template swaps
  assetsDir?: string; // optional --assets dir for brand images
  demoBar?: boolean; // optional --demo-bar bottom attribution
  onProgress?: ProgressHandler;
}

export interface SkinResult {
  ok: boolean;
  outDir: string;
  exitCode: number;
  checkScore: number; // xfly-check.js quality score (0-100)
  warnings: string[];
}

// Spawns ~/Projects/site-xray/xfly.js with --template, --company, --out.
// Writes company spec to a temp company.json. Then runs xfly-check.js for the
// quality score. Returns the score so the orchestrator can fail the phase if < 95.
//
// Slice 3: real subprocess wiring.
export async function skinClone(opts: SkinOpts): Promise<SkinResult> {
  throw new Error("NotImplemented: skinner.skinClone — wired in Slice 3");
}

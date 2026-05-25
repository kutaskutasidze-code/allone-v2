import type { ProgressHandler } from "../types/demo.js";

export interface CloneOpts {
  url: string;
  outDir: string;
  maxPages?: number;
  ship?: boolean; // call xray-pipeline.js --ship to deploy in one go
  aiFix?: boolean; // run --ai-fix; default false (memory: feedback_xray_v54_ship_after_autofix)
  engine?: "auto" | "static" | "playwright";
  rate?: number;
  onProgress?: ProgressHandler;
}

export interface CloneResult {
  ok: boolean;
  cloneDir: string;
  deployedUrl?: string;
  exitCode: number;
  validationScore?: number;
}

// Spawns ~/Projects/site-xray/xray-pipeline.js as a subprocess.
// Streams stdout line-by-line, emits structured ProgressEvents via opts.onProgress.
// Modeled after ~/Projects/founder-brain/src/xray.ts.
//
// Slice 3: real subprocess wiring.
export async function cloneSite(opts: CloneOpts): Promise<CloneResult> {
  throw new Error("NotImplemented: cloner.cloneSite — wired in Slice 3");
}

// Re-requests every captured endpoint against the deployed URL via
// xray-api-validate.js, classifies MATCH / SIMILAR / DIFFER / STATUS_4xx / ERROR.
// Returns the match rate. Used by orchestrator to fail-fast on bad ships.
export async function validateClonedApis(
  cloneDir: string,
  deployedUrl: string,
  onProgress?: ProgressHandler,
): Promise<{ matchRate: number; total: number; matched: number }> {
  throw new Error(
    "NotImplemented: cloner.validateClonedApis — wired in Slice 3",
  );
}

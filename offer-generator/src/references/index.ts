import path from "node:path";
import fs from "node:fs/promises";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import { cloneSite } from "../cloner/index.js";
import { spawnNodeScript } from "../utils/subprocess.js";
import type { ReferenceTemplate, Segment } from "../types/demo.js";
import {
  listReferences,
  getReference,
  createReference,
  setReferenceRefreshed,
  setReferenceActive,
} from "../database/references.repo.js";

export async function pickReference(
  segment: Segment,
): Promise<ReferenceTemplate | null> {
  const refs = await listReferences({ segment, active_only: true });
  return refs[0] ?? null;
}

// Re-runs site-xray against the reference's source_url, replaces the on-disk
// pre_cloned_path contents, updates last_refreshed_at + xfly_check_score.
//
// The clone goes to refsRoot/<segment>/<slug>/ so references survive /tmp resets.
export async function refreshReference(id: string): Promise<ReferenceTemplate> {
  const ref = await getReference(id);
  if (!ref) throw new Error(`reference_template ${id} not found`);

  const slug = slugFromUrl(ref.source_url);
  const targetDir = path.join(config.demo.refsRoot, ref.segment, slug);
  await fs.mkdir(path.dirname(targetDir), { recursive: true });
  await rmrf(targetDir);

  logger.info("refreshReference: cloning", {
    id,
    url: ref.source_url,
    targetDir,
  });
  const cloneRes = await cloneSite({
    url: ref.source_url,
    outDir: targetDir,
    maxPages: 10,
    onProgress: (e) => {
      if (e.type === "phase")
        logger.debug("refreshReference phase", { phase: e.phase });
    },
  });
  if (!cloneRes.ok) {
    throw new Error(
      `clone failed for ${ref.source_url} (exit ${cloneRes.exitCode})`,
    );
  }

  // Run xfly-check against the clone using its own brand as the company spec,
  // so we get a baseline quality measurement. Score should be 100 (no swap).
  const baseline = await baselineScore(targetDir);
  await setReferenceRefreshed(id, targetDir, baseline);

  const fresh = await getReference(id);
  if (!fresh) throw new Error("reference disappeared after refresh");
  return fresh;
}

async function baselineScore(cloneDir: string): Promise<number | null> {
  try {
    // Spawn xfly-check with no --company (it falls back to xfly-meta.json).
    const res = await spawnNodeScript({
      script: path.join(config.demo.xrayBinDir, "xfly-check.js"),
      args: [cloneDir],
      cwd: config.demo.xrayBinDir,
    });
    const match = res.stdout.match(/(\d+)\/100/g);
    const last = match?.[match.length - 1];
    return last ? parseInt(last.split("/")[0], 10) : null;
  } catch (err) {
    logger.warn("baselineScore failed", {
      error: err instanceof Error ? err.message : err,
    });
    return null;
  }
}

function slugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").replace(/\./g, "-");
  } catch {
    return `ref-${Date.now()}`;
  }
}

async function rmrf(p: string): Promise<void> {
  try {
    await fs.rm(p, { recursive: true, force: true });
  } catch {}
}

export {
  listReferences,
  getReference,
  createReference,
  setReferenceActive,
  setReferenceRefreshed,
};

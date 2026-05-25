// Slice 4 seed: pre-clone an initial reference library so the pipeline has
// something to skin against from day one. Idempotent — skips entries whose
// (segment, source_url) already exists.
//
// Usage:
//   pnpm tsx scripts/seed-references.ts
//
// To add references, edit SEED_LIST below. The Awwwards picks are intentionally
// curated to be aesthetically strong AND structurally simple (clear hero,
// repeatable card grid, conventional footer) so xfly's heuristics fire well.

import path from "node:path";
import fs from "node:fs/promises";
import { config } from "../src/config.js";
import { logger } from "../src/utils/logger.js";
import { cloneSite } from "../src/cloner/index.js";
import {
  listReferences,
  createReference,
  setReferenceRefreshed,
} from "../src/references/index.js";
import type { Segment } from "../src/types/demo.js";

interface SeedEntry {
  segment: Segment;
  source_url: string;
  source_label: string;
  aesthetic_tier: number;
}

// Replace these with real Awwwards / SOTM picks per segment as we go.
// Stub URLs noted with TODO so we don't accidentally clone the wrong thing.
const SEED_LIST: SeedEntry[] = [
  {
    segment: "tourism",
    source_url: "https://www.singita.com",
    source_label: "Singita — luxury safari lodges",
    aesthetic_tier: 5,
  },
  {
    segment: "ecom",
    source_url: "https://www.allbirds.com",
    source_label: "Allbirds — sustainable footwear",
    aesthetic_tier: 4,
  },
];

async function alreadySeeded(entry: SeedEntry): Promise<boolean> {
  const existing = await listReferences({
    segment: entry.segment,
    active_only: false,
  });
  return existing.some((r) => r.source_url === entry.source_url);
}

async function seedOne(entry: SeedEntry) {
  if (await alreadySeeded(entry)) {
    logger.info("seed: skip (already exists)", { ...entry });
    return;
  }

  const slug = new URL(entry.source_url).hostname
    .replace(/^www\./, "")
    .replace(/\./g, "-");
  const targetDir = path.join(config.demo.refsRoot, entry.segment, slug);
  await fs.mkdir(path.dirname(targetDir), { recursive: true });

  logger.info("seed: cloning", {
    segment: entry.segment,
    url: entry.source_url,
    targetDir,
  });
  const cloneRes = await cloneSite({
    url: entry.source_url,
    outDir: targetDir,
    maxPages: 10,
    onProgress: (e) => {
      if (e.type === "phase")
        process.stdout.write(`\r  · ${e.phase}                          `);
    },
  });
  process.stdout.write("\n");
  if (!cloneRes.ok) {
    logger.error("seed: clone failed", {
      url: entry.source_url,
      exit: cloneRes.exitCode,
    });
    return;
  }

  const ref = await createReference({
    segment: entry.segment,
    source_url: entry.source_url,
    source_label: entry.source_label,
    pre_cloned_path: targetDir,
    aesthetic_tier: entry.aesthetic_tier,
  });
  await setReferenceRefreshed(ref.id, targetDir, null);
  logger.info("seed: inserted", { id: ref.id, segment: entry.segment });
}

async function main() {
  logger.info("seed: starting", { count: SEED_LIST.length });
  for (const entry of SEED_LIST) {
    try {
      await seedOne(entry);
    } catch (err) {
      logger.error("seed: entry failed", {
        url: entry.source_url,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  logger.info("seed: done");
  process.exit(0);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});

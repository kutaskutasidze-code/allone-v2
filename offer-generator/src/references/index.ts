import type { ReferenceTemplate, Segment } from "../types/demo.js";
import {
  listReferences,
  getReference,
  setReferenceRefreshed,
} from "../database/references.repo.js";

// Picks the best-in-segment reference: highest aesthetic_tier, then most recently
// refreshed. Returns null if no active reference exists for that segment.
export async function pickReference(
  segment: Segment,
): Promise<ReferenceTemplate | null> {
  const refs = await listReferences({ segment, active_only: true });
  return refs[0] ?? null;
}

// Re-runs site-xray against the reference's source_url, replaces the on-disk
// pre_cloned_path contents, updates last_refreshed_at + xfly_check_score.
// Slice 4: implement via cloner.cloneSite + xfly-check parse.
export async function refreshReference(id: string): Promise<ReferenceTemplate> {
  const ref = await getReference(id);
  if (!ref) throw new Error(`reference_template ${id} not found`);
  throw new Error(
    "NotImplemented: references.refreshReference — wired in Slice 4",
  );
}

export { listReferences, getReference } from "../database/references.repo.js";

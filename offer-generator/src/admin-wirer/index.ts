import type { CompanySpec, Segment, ProgressHandler } from "../types/demo.js";

export interface WireAdminOpts {
  demoDir: string; // skinned output from skinner
  demoOrgId: string; // UUID for row-scoped seed data
  segment: Segment;
  company: CompanySpec;
  bfShellPath?: string; // override default ~/Desktop/Claude/business-forge/shell-zone
  onProgress?: ProgressHandler;
}

export interface WireAdminResult {
  ok: boolean;
  adminMountPoint: string; // path under demoDir where admin lives (e.g. "/admin")
  seededRows: number;
}

// Copies the BF shell-zone snapshot into <demoDir>/admin, writes per-demo
// .env (DEMO_ORG_ID, Supabase service-role key for seeded reads), then runs
// the segment-appropriate seed script to insert fake data scoped to
// demo_org_id (tourism = hotels+orders, ecom = products+orders, etc.).
//
// Slice 6: real implementation.
export async function wireAdmin(opts: WireAdminOpts): Promise<WireAdminResult> {
  throw new Error("NotImplemented: admin-wirer.wireAdmin — wired in Slice 6");
}

// Deletes all rows scoped to a demo_org_id across the seeded tables.
// Called by teardown-cron when a demo expires.
export async function unseedDemo(
  demoOrgId: string,
  segment: Segment,
): Promise<void> {
  throw new Error("NotImplemented: admin-wirer.unseedDemo — wired in Slice 6");
}

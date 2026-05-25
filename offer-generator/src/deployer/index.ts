import type { ProgressHandler } from "../types/demo.js";

export interface DeployOpts {
  dir: string;
  projectName: string; // demo-<lead-slug>-<short-hash>
  prod?: boolean; // default true
  team?: string; // default 'allonelabs'
  onProgress?: ProgressHandler;
}

export interface DeployResult {
  ok: boolean;
  url: string; // https://...vercel.app
  projectId: string;
  exitCode: number;
}

// Shells `vercel deploy <dir> --prod --token $VERCEL_TOKEN --scope <team>
// --name <projectName>`. Parses the deployed URL from stdout. Reads VERCEL_TOKEN
// from process.env (set from Keychain entry "vercel-api-token" at boot).
//
// Slice 5: real subprocess wiring.
export async function deployToVercel(opts: DeployOpts): Promise<DeployResult> {
  throw new Error("NotImplemented: deployer.deployToVercel — wired in Slice 5");
}

// `vercel projects rm <projectId> --yes --token $VERCEL_TOKEN --scope <team>`.
// Called by teardown-cron + on lead marked 'lost'.
export async function teardownVercel(
  projectId: string,
  team?: string,
): Promise<{ ok: boolean; exitCode: number }> {
  throw new Error("NotImplemented: deployer.teardownVercel — wired in Slice 5");
}

import "dotenv/config";
import os from "node:os";
import path from "node:path";

export const config = {
  port: parseInt(process.env.PORT || "3100"),
  apiKey: process.env.API_SECRET_KEY || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  nodeEnv: process.env.NODE_ENV || "development",
  puppeteer: {
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    timeout: 20000,
  },
  // Sales → personalized demo pipeline
  // Spec: docs/superpowers/specs/2026-05-25-sales-demo-pipeline-design.md
  demo: {
    xrayBinDir:
      process.env.XRAY_BIN_DIR ||
      path.join(os.homedir(), "Projects", "site-xray"),
    bfShellPath:
      process.env.BF_SHELL_PATH ||
      path.join(
        os.homedir(),
        "Desktop",
        "Claude",
        "business-forge",
        "shell-zone",
      ),
    refsRoot: process.env.REFS_ROOT || path.join(os.homedir(), "Vault", "refs"),
    vercelToken: process.env.VERCEL_TOKEN || "",
    vercelTeam: process.env.VERCEL_TEAM || "allonelabs",
    tmpRoot: process.env.DEMO_TMP_ROOT || "/tmp",
    // Dedicated Supabase project for demo orgs + seed data (decision recorded
    // 2026-05-26 in the spec). NOT the same project as the sales website.
    // When unset, admin-wirer skips data seeding and emits a warning.
    demosSupabaseUrl: process.env.DEMO_SUPABASE_URL || "",
    demosSupabaseServiceKey: process.env.DEMO_SUPABASE_SERVICE_ROLE_KEY || "",
    // Shared admin frontend URL — every demo links to it with ?demo=<jobId>
    // so one deploy serves all demos. Set after admin-shell goes live.
    sharedAdminUrl:
      process.env.SHARED_ADMIN_URL || "https://admin.allone-demos.com",
  },
} as const;

const required = [
  "API_SECRET_KEY",
  "ANTHROPIC_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

export function validateConfig() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

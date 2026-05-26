// Vitest setup: stub the env vars our module-load-time code expects.
// Keeps tests pure (no real Supabase / Anthropic / Resend calls).

process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "test-service-role-key";
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "sk-ant-test";
process.env.API_SECRET_KEY = process.env.API_SECRET_KEY || "test-secret";
(process.env as Record<string, string>).NODE_ENV = "test";

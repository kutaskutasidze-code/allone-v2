import { createClient as createServiceClient } from '@supabase/supabase-js';

/**
 * Verify Claude API key for self-reporting
 * Uses service role client to bypass RLS
 */
export function verifyClaudeApiKey(request: Request): boolean {
  const apiKey = request.headers.get('X-Claude-API-Key');
  const expectedKey = process.env.CLAUDE_REPORT_API_KEY;

  if (!expectedKey) {
    console.warn('CLAUDE_REPORT_API_KEY not set');
    return false;
  }

  return apiKey === expectedKey;
}

/**
 * Get Supabase service role client for Claude operations
 * Service role bypasses RLS for insert operations
 */
export function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

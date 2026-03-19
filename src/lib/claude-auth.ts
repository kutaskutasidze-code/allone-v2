import { createClient as createServiceClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';

/**
 * Verify Claude API key for self-reporting
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyClaudeApiKey(request: Request): boolean {
  const apiKey = request.headers.get('X-Claude-API-Key');
  const expectedKey = process.env.CLAUDE_REPORT_API_KEY;

  if (!expectedKey || !apiKey) {
    return false;
  }

  try {
    const a = Buffer.from(apiKey);
    const b = Buffer.from(expectedKey);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
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

import { requireRole } from '@/lib/sales-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthError } from '@/lib/auth';
import { success, error, authErrorResponse } from '@/lib/api-response';
import { buildPipeline } from '@/lib/pipeline';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireRole(['admin', 'supervisor']);
    const admin = createAdminClient();
    const data = await buildPipeline(admin, {});
    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    logger.error('Failed to build admin pipeline', { error: String(err) });
    return error('Failed to load pipeline');
  }
}

import { NextRequest } from 'next/server';
import { requireRole } from '@/lib/sales-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthError } from '@/lib/auth';
import { success, error, authErrorResponse } from '@/lib/api-response';
import { buildCalendar } from '@/lib/calendar';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);
    const start = request.nextUrl.searchParams.get('start');
    const end = request.nextUrl.searchParams.get('end');
    if (!start || !end) return error('start and end are required', 400);

    const admin = createAdminClient();
    const data = await buildCalendar(admin, { start, end });
    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    logger.error('Failed to build admin calendar', { error: String(err) });
    return error('Failed to load calendar');
  }
}

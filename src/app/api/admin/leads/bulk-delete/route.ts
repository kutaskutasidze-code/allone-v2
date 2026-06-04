import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';

const bodySchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const { salesUser } = await requireRole(['admin', 'supervisor']);

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid body', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { leadIds } = parsed.data;

    const admin = createAdminClient();
    const { error: dbError, count } = await admin
      .from('leads')
      .delete({ count: 'exact' })
      .in('id', leadIds);

    if (dbError) {
      logger.error('Failed to bulk-delete leads', { error: dbError.message });
      return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 });
    }

    logger.audit('bulk_delete', 'leads', leadIds.join(','), salesUser.email, {
      count: count ?? leadIds.length,
    });
    return NextResponse.json({ data: { deleted: count ?? leadIds.length } });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in POST /api/admin/leads/bulk-delete', {
      error: String(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

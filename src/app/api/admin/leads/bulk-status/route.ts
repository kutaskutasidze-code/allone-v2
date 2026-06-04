import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { leadStatusSchema, lostReasonSchema } from '@/lib/validations/leads';

const bodySchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(500),
  status: leadStatusSchema,
  lost_reason: lostReasonSchema.optional(),
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
    const { leadIds, status, lost_reason } = parsed.data;

    const admin = createAdminClient();
    const update: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    // Moving to 'lost' records the reason; moving to anything else must CLEAR
    // it, or the leads_lost_reason_requires_lost CHECK rejects the update.
    if (status === 'lost') update.lost_reason = lost_reason ?? null;
    else update.lost_reason = null;

    const { error: dbError, count } = await admin
      .from('leads')
      .update(update, { count: 'exact' })
      .in('id', leadIds);

    if (dbError) {
      logger.error('Failed to bulk-update status', { error: dbError.message });
      return NextResponse.json({ error: 'Failed to update leads' }, { status: 500 });
    }

    logger.audit('bulk_status', 'leads', leadIds.join(','), salesUser.email, {
      status,
      count: count ?? leadIds.length,
    });
    return NextResponse.json({ data: { updated: count ?? leadIds.length } });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in POST /api/admin/leads/bulk-status', {
      error: String(err),
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

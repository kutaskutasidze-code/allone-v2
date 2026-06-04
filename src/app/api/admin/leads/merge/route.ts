import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';

const bodySchema = z.object({
  targetId: z.string().uuid(),
  sourceId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const { salesUser } = await requireRole(['admin', 'supervisor']);

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }
    const { targetId, sourceId } = parsed.data;
    if (targetId === sourceId) {
      return NextResponse.json(
        { error: 'Cannot merge a lead into itself' },
        { status: 400 },
      );
    }

    // The merge_leads() function re-points every child row, snapshots the
    // source into lead_merge_audit, and removes the source — atomically.
    const admin = createAdminClient();
    const { error } = await admin.rpc('merge_leads', {
      p_source: sourceId,
      p_target: targetId,
      p_actor: salesUser.email,
    });
    if (error) {
      logger.error('merge_leads failed', { error: error.message, sourceId, targetId });
      return NextResponse.json({ error: 'Merge failed' }, { status: 500 });
    }

    logger.audit('merge', 'leads', `${sourceId}->${targetId}`, salesUser.email, {});
    return NextResponse.json({ data: { merged: true } });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('merge error', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

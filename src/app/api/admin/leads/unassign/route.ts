import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';

// Send leads back to the unassigned pool. Only works on leads whose status is
// still 'new' — once a rep has touched a lead, it stays with them.
const bodySchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { leadIds } = parsed.data;

    const admin = createAdminClient();

    const { data: existing, error: fetchError } = await admin
      .from('leads')
      .select('id, status, sales_user_id')
      .in('id', leadIds);
    if (fetchError) {
      logger.error('Failed to load leads for unassignment', { error: fetchError.message });
      return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
    }

    const unassignable: string[] = [];
    const skippedTouched: string[] = [];
    const skippedAlreadyUnassigned: string[] = [];
    for (const row of existing || []) {
      if (row.sales_user_id === null) {
        skippedAlreadyUnassigned.push(row.id);
        continue;
      }
      if (row.status !== 'new') {
        skippedTouched.push(row.id);
        continue;
      }
      unassignable.push(row.id);
    }

    if (unassignable.length === 0) {
      return NextResponse.json({
        data: {
          unassigned: 0,
          skippedTouched: skippedTouched.length,
          skippedAlreadyUnassigned: skippedAlreadyUnassigned.length,
        },
      });
    }

    const { error: updateError } = await admin
      .from('leads')
      .update({ sales_user_id: null, assigned_by: null })
      .in('id', unassignable);
    if (updateError) {
      logger.error('Failed to bulk-unassign leads', { error: updateError.message });
      return NextResponse.json({ error: 'Failed to unassign leads' }, { status: 500 });
    }

    logger.audit('unassign', 'leads', unassignable.join(','), user.email || 'unknown', {
      count: unassignable.length,
    });

    return NextResponse.json({
      data: {
        unassigned: unassignable.length,
        skippedTouched: skippedTouched.length,
        skippedAlreadyUnassigned: skippedAlreadyUnassigned.length,
        touchedIds: skippedTouched,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in POST /api/admin/leads/unassign', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

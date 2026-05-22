import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// Bulk-assign leads to a sales user. Refuses to reassign any lead whose
// status has already moved off 'new' — those leads are permanently owned by
// whoever first touched them, so the admin must explicitly unassign first
// (which itself only works on untouched leads).
const bodySchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(500),
  salesUserId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const json = await request.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    const { leadIds, salesUserId } = parsed.data;

    const admin = createAdminClient();

    // Resolve the admin's own sales_users row for the `assigned_by` audit field.
    // It's fine if the admin isn't in sales_users — we just leave the audit field null.
    const { data: actor } = await admin
      .from('sales_users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();

    // Verify the target sales user exists.
    const { data: target } = await admin
      .from('sales_users')
      .select('id, name')
      .eq('id', salesUserId)
      .maybeSingle();
    if (!target) {
      return NextResponse.json({ error: 'Sales user not found' }, { status: 404 });
    }

    // Look up current state of every requested lead.
    const { data: existing, error: fetchError } = await admin
      .from('leads')
      .select('id, status, sales_user_id')
      .in('id', leadIds);
    if (fetchError) {
      logger.error('Failed to load leads for assignment', { error: fetchError.message });
      return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
    }

    const assignable: string[] = [];
    const skippedTouched: string[] = [];
    const skippedSameOwner: string[] = [];
    for (const row of existing || []) {
      if (row.sales_user_id === salesUserId) {
        skippedSameOwner.push(row.id);
        continue;
      }
      if (row.status !== 'new') {
        skippedTouched.push(row.id);
        continue;
      }
      assignable.push(row.id);
    }

    if (assignable.length === 0) {
      return NextResponse.json({
        data: {
          assigned: 0,
          skippedTouched: skippedTouched.length,
          skippedSameOwner: skippedSameOwner.length,
        },
      });
    }

    const { error: updateError } = await admin
      .from('leads')
      .update({ sales_user_id: salesUserId, assigned_by: actor?.id ?? null })
      .in('id', assignable);
    if (updateError) {
      logger.error('Failed to bulk-assign leads', { error: updateError.message });
      return NextResponse.json({ error: 'Failed to assign leads' }, { status: 500 });
    }

    logger.audit('assign', 'leads', assignable.join(','), user.email, {
      to: target.id,
      count: assignable.length,
    });

    return NextResponse.json({
      data: {
        assigned: assignable.length,
        skippedTouched: skippedTouched.length,
        skippedSameOwner: skippedSameOwner.length,
        touchedIds: skippedTouched,
      },
    });
  } catch (err) {
    logger.error('Unexpected error in POST /api/admin/leads/assign', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

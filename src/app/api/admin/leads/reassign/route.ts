import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';

// Manager override: move any leads to a rep — or back to the pool (null) —
// REGARDLESS of status. Unlike /assign (which only touches untouched 'new'
// leads), this deliberately bypasses the first-touch ownership lock so an
// admin/supervisor can reassign worked leads. Reps cannot reach this route.
const bodySchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(500),
  salesUserId: z.string().uuid().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'supervisor']);

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

    // Resolve the actor's sales_users row for the `assigned_by` audit field.
    // It's fine if the admin isn't in sales_users — we just leave it null.
    const { data: actor } = await admin
      .from('sales_users')
      .select('id')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    // If a target rep was given, verify it exists.
    if (salesUserId) {
      const { data: target } = await admin
        .from('sales_users')
        .select('id')
        .eq('id', salesUserId)
        .maybeSingle();
      if (!target) {
        return NextResponse.json({ error: 'Sales user not found' }, { status: 404 });
      }
    }

    const { error: updateError, count } = await admin
      .from('leads')
      .update(
        {
          sales_user_id: salesUserId,
          assigned_by: salesUserId ? actor?.id ?? null : null,
        },
        { count: 'exact' },
      )
      .in('id', leadIds);
    if (updateError) {
      logger.error('Failed to reassign leads', { error: updateError.message });
      return NextResponse.json({ error: 'Failed to reassign leads' }, { status: 500 });
    }

    logger.audit('reassign', 'leads', leadIds.join(','), user.email, {
      to: salesUserId,
      count: count ?? leadIds.length,
    });

    return NextResponse.json({ data: { reassigned: count ?? leadIds.length } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in POST /api/admin/leads/reassign', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

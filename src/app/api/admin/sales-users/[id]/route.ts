import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { salesUserIndustriesSchema } from '@/lib/validations/leads';

const patchSchema = z.object({
  daily_target: z.number().int().min(0).max(10000).optional(),
  name: z.string().min(1).max(255).optional(),
  role: z.enum(['salesperson', 'supervisor', 'admin']).optional(),
  is_active: z.boolean().optional(),
  industries: salesUserIndustriesSchema.optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { salesUser } = await requireRole(['admin']);

    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('sales_users')
      .update(parsed.data)
      .eq('id', id)
      .select('id, email, name, role, is_active, daily_target, industries')
      .single();

    if (error) {
      logger.error('Failed to update sales user', { error: error.message, id });
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    if (parsed.data.role !== undefined) {
      logger.audit('update_sales_user_role', 'sales_users', id, salesUser.id, { role: parsed.data.role });
    }
    return NextResponse.json({ data });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in PATCH /api/admin/sales-users/[id]', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Soft delete: set is_active=false. We don't hard-delete because the rep's
// historical lead ownership and audit log entries reference their id.
export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(['admin']);

    const { id } = await ctx.params;
    const admin = createAdminClient();
    const { error } = await admin
      .from('sales_users')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      logger.error('Failed to deactivate sales user', { error: error.message, id });
      return NextResponse.json({ error: 'Failed to deactivate' }, { status: 500 });
    }

    return NextResponse.json({ data: { id, is_active: false } });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('Unexpected error in DELETE /api/admin/sales-users/[id]', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

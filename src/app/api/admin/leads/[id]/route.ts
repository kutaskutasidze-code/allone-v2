import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateLeadSchema } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { success, error, notFound, authErrorResponse } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'supervisor']);

    const { id } = await params;

    const admin = createAdminClient();
    const { data, error: dbError } = await admin
      .from('leads')
      .select('*, sales_user:sales_users!leads_sales_user_id_fkey(id, name, email)')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') return notFound('Lead');
      logger.error('Failed to fetch lead', { error: dbError.message, id });
      return error('Failed to fetch lead');
    }

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return authErrorResponse(err);
    logger.error('Lead fetch error', { error: String(err) });
    return error('Internal server error');
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'supervisor']);

    // Auth check via user session
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const result = updateLeadSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid data', details: result.error.flatten() }, { status: 400 });
    }

    // Use service role to bypass RLS for the actual update
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('leads')
      .update({ ...result.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      logger.error('Failed to update lead', { error: error.message, id });
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    logger.error('Lead update error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(['admin', 'supervisor']);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const admin = createAdminClient();
    const { error } = await admin.from('leads').delete().eq('id', id);

    if (error) {
      logger.error('Failed to delete lead', { error: error.message, id });
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    logger.error('Lead delete error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

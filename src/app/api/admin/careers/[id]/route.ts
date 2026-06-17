import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { success, error, validationError, authErrorResponse } from '@/lib/api-response';
import { vacancySchema } from '@/lib/validations/careers';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH — update a vacancy (partial).
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'supervisor']);
    const { id } = await params;
    const body = await request.json();
    const result = vacancySchema.partial().safeParse(body);
    if (!result.success) return validationError(result.error);

    const updates: Record<string, unknown> = {};
    const v = result.data;
    if (v.title !== undefined) updates.title = v.title;
    if (v.slug !== undefined) updates.slug = v.slug;
    if (v.department !== undefined) updates.department = v.department || null;
    if (v.employment_type !== undefined) updates.employment_type = v.employment_type;
    if (v.location !== undefined) updates.location = v.location || null;
    if (v.summary !== undefined) updates.summary = v.summary || null;
    if (v.description_md !== undefined) updates.description_md = v.description_md || null;
    if (v.is_open !== undefined) updates.is_open = v.is_open;
    if (v.sort_order !== undefined) updates.sort_order = v.sort_order;

    const supabase = createAdminClient();
    const { data, error: dbError } = await supabase
      .from('vacancies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (dbError) {
      logger.error('Failed to update vacancy', { error: dbError.message, id });
      return error(dbError.code === '23505' ? 'That slug is already in use' : 'Failed to update vacancy');
    }
    return success(data);
  } catch (err) {
    return authErrorResponse(err);
  }
}

// DELETE — remove a vacancy. Applications keep their title snapshot (FK SET NULL).
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireRole(['admin', 'supervisor']);
    const { id } = await params;
    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from('vacancies').delete().eq('id', id);
    if (dbError) {
      logger.error('Failed to delete vacancy', { error: dbError.message, id });
      return error('Failed to delete vacancy');
    }
    return success({ deleted: true });
  } catch (err) {
    return authErrorResponse(err);
  }
}

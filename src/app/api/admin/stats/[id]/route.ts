import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, validationError, unauthorized, notFound } from '@/lib/api-response';
import { idParamSchema, updateStatSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { supabase, userId } = await requireAuth();
    const { id } = await params;

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    logger.db('select', 'stats', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('stats')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Stat');
      }
      logger.error('Failed to fetch stat', { error: dbError.message, userId, resourceId: id });
      return error('Failed to fetch stat');
    }

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/stats/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { supabase, userId } = await requireAuth();
    const { id } = await params;

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    const body = await request.json();

    // Validate input
    const result = updateStatSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.value !== undefined) updateData.value = validated.value;
    if (validated.label !== undefined) updateData.label = validated.label;
    if (validated.display_order !== undefined) updateData.display_order = validated.display_order;

    logger.db('update', 'stats', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('stats')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Stat');
      }
      logger.error('Failed to update stat', { error: dbError.message, userId, resourceId: id });
      return error('Failed to update stat');
    }

    logger.audit('update', 'stats', id, userId);
    invalidateCache('stats');
    revalidatePath('/about');
    revalidatePath('/');

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/stats/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { supabase, userId } = await requireAuth();
    const { id } = await params;

    // Validate ID
    const idResult = idParamSchema.safeParse({ id });
    if (!idResult.success) {
      return validationError(idResult.error);
    }

    logger.db('delete', 'stats', { userId, resourceId: id });

    const { error: dbError } = await supabase
      .from('stats')
      .delete()
      .eq('id', id);

    if (dbError) {
      logger.error('Failed to delete stat', { error: dbError.message, userId, resourceId: id });
      return error('Failed to delete stat');
    }

    logger.audit('delete', 'stats', id, userId);
    invalidateCache('stats');
    revalidatePath('/about');
    revalidatePath('/');

    return success({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in DELETE /api/admin/stats/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

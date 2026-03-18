import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, validationError, unauthorized, notFound } from '@/lib/api-response';
import { updateValueSchema, idParamSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ id: string }>;
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
    const result = updateValueSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.number !== undefined) updateData.number = validated.number;
    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.display_order !== undefined) updateData.display_order = validated.display_order;

    logger.db('update', 'company_values', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('company_values')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Value');
      }
      logger.error('Failed to update value', { error: dbError.message, userId, resourceId: id });
      return error('Failed to update value');
    }

    logger.audit('update', 'company_values', id, userId);
    invalidateCache('company_values');
    revalidatePath('/about');

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/values/[id]', { error: String(err) });
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

    logger.db('delete', 'company_values', { userId, resourceId: id });

    const { error: dbError } = await supabase
      .from('company_values')
      .delete()
      .eq('id', id);

    if (dbError) {
      logger.error('Failed to delete value', { error: dbError.message, userId, resourceId: id });
      return error('Failed to delete value');
    }

    logger.audit('delete', 'company_values', id, userId);
    invalidateCache('company_values');
    revalidatePath('/about');

    return success({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in DELETE /api/admin/values/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

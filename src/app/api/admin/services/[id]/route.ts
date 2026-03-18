import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, validationError, unauthorized, notFound } from '@/lib/api-response';
import { updateServiceSchema, idParamSchema } from '@/lib/validations';
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

    logger.db('select', 'services', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Service');
      }
      logger.error('Failed to fetch service', { error: dbError.message, userId, resourceId: id });
      return error('Failed to fetch service');
    }

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/services/[id]', { error: String(err) });
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
    const result = updateServiceSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (validated.title !== undefined) updateData.title = validated.title;
    if (validated.description !== undefined) updateData.description = validated.description;
    if (validated.icon !== undefined) updateData.icon = validated.icon;
    if (validated.features !== undefined) updateData.features = validated.features;
    if (validated.subtitle !== undefined) updateData.subtitle = validated.subtitle;
    if (validated.secondary_description !== undefined) updateData.secondary_description = validated.secondary_description;
    if (validated.stats !== undefined) updateData.stats = validated.stats;
    if (validated.footer_text !== undefined) updateData.footer_text = validated.footer_text;
    if (validated.cta_text !== undefined) updateData.cta_text = validated.cta_text;
    if (validated.cta_url !== undefined) updateData.cta_url = validated.cta_url;
    if (validated.card_type !== undefined) updateData.card_type = validated.card_type;
    if (validated.is_published !== undefined) updateData.is_published = validated.is_published;
    if (validated.display_order !== undefined) updateData.display_order = validated.display_order;

    logger.db('update', 'services', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Service');
      }
      logger.error('Failed to update service', { error: dbError.message, userId, resourceId: id });
      return error('Failed to update service');
    }

    logger.audit('update', 'services', id, userId);
    invalidateCache('services');
    revalidatePath('/services');
    revalidatePath('/');

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/services/[id]', { error: String(err) });
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

    logger.db('delete', 'services', { userId, resourceId: id });

    const { error: dbError } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (dbError) {
      logger.error('Failed to delete service', { error: dbError.message, userId, resourceId: id });
      return error('Failed to delete service');
    }

    logger.audit('delete', 'services', id, userId);
    invalidateCache('services');
    revalidatePath('/services');
    revalidatePath('/');

    return success({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in DELETE /api/admin/services/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

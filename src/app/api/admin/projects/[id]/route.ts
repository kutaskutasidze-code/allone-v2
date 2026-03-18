import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, validationError, unauthorized, notFound } from '@/lib/api-response';
import { updateProjectSchema, idParamSchema } from '@/lib/validations';
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

    logger.db('select', 'projects', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Project');
      }
      logger.error('Failed to fetch project', { error: dbError.message, userId, resourceId: id });
      return error('Failed to fetch project');
    }

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/projects/[id]', { error: String(err) });
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
    const result = updateProjectSchema.safeParse(body);
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
    if (validated.image_url !== undefined) updateData.image_url = validated.image_url;
    if (validated.category !== undefined) updateData.category = validated.category;
    if (validated.technologies !== undefined) updateData.technologies = validated.technologies;
    if (validated.is_published !== undefined) updateData.is_published = validated.is_published;
    if (validated.display_order !== undefined) updateData.display_order = validated.display_order;

    logger.db('update', 'projects', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Project');
      }
      logger.error('Failed to update project', { error: dbError.message, userId, resourceId: id });
      return error('Failed to update project');
    }

    logger.audit('update', 'projects', id, userId);
    invalidateCache('projects');
    revalidatePath('/projects');
    revalidatePath('/');

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/projects/[id]', { error: String(err) });
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

    logger.db('delete', 'projects', { userId, resourceId: id });

    const { error: dbError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (dbError) {
      logger.error('Failed to delete project', { error: dbError.message, userId, resourceId: id });
      return error('Failed to delete project');
    }

    logger.audit('delete', 'projects', id, userId);
    invalidateCache('projects');
    revalidatePath('/projects');
    revalidatePath('/');

    return success({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in DELETE /api/admin/projects/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, validationError, unauthorized, notFound, conflict } from '@/lib/api-response';
import { updateCategorySchema, idParamSchema } from '@/lib/validations';
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

    logger.db('select', 'categories', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Category');
      }
      logger.error('Failed to fetch category', { error: dbError.message, userId, resourceId: id });
      return error('Failed to fetch category');
    }

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/categories/[id]', { error: String(err) });
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
    const result = updateCategorySchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    logger.db('update', 'categories', { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from('categories')
      .update(validated)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound('Category');
      }
      if (dbError.code === '23505') {
        return conflict('Category name already exists');
      }
      logger.error('Failed to update category', { error: dbError.message, userId, resourceId: id });
      return error('Failed to update category');
    }

    logger.audit('update', 'categories', id, userId);
    invalidateCache('categories');
    revalidatePath('/admin/projects');

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/categories/[id]', { error: String(err) });
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

    // Check if any projects use this category
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', id)
      .single();

    if (category) {
      const { count } = await supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .eq('category', category.name);

      if (count && count > 0) {
        return conflict(`Cannot delete category. ${count} project(s) are using it.`);
      }
    }

    logger.db('delete', 'categories', { userId, resourceId: id });

    const { error: dbError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (dbError) {
      logger.error('Failed to delete category', { error: dbError.message, userId, resourceId: id });
      return error('Failed to delete category');
    }

    logger.audit('delete', 'categories', id, userId);
    invalidateCache('categories');
    revalidatePath('/admin/projects');

    return success({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in DELETE /api/admin/categories/[id]', { error: String(err) });
    return error('Internal server error');
  }
}

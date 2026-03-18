import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import {
  success,
  successWithPagination,
  error,
  validationError,
  unauthorized,
  conflict,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';
import { createCategorySchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const { page, limit, offset } = getPaginationParams(request.url);

    logger.db('select', 'categories', { userId });

    const { data, error: dbError, count } = await supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch categories', { error: dbError.message, userId });
      return error('Failed to fetch categories');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/categories', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createCategorySchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Get the highest display_order
    const { data: lastCategory } = await supabase
      .from('categories')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = validated.display_order ?? (lastCategory ? lastCategory.display_order + 1 : 0);

    logger.db('insert', 'categories', { userId });

    const { data, error: dbError } = await supabase
      .from('categories')
      .insert({
        name: validated.name,
        display_order,
      })
      .select()
      .single();

    if (dbError) {
      // Unique constraint violation
      if (dbError.code === '23505') {
        return conflict('Category already exists');
      }
      logger.error('Failed to create category', { error: dbError.message, userId });
      return error('Failed to create category');
    }

    logger.audit('create', 'categories', data.id, userId, { name: validated.name });
    invalidateCache('categories');
    revalidatePath('/admin/projects');

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/categories', { error: String(err) });
    return error('Internal server error');
  }
}

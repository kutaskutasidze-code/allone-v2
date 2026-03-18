import { revalidatePath } from 'next/cache';
import { invalidateCache } from '@/lib/cache';
import { requireAuth, AuthError } from '@/lib/auth';
import {
  success,
  successWithPagination,
  error,
  validationError,
  unauthorized,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';
import { createValueSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const { page, limit, offset } = getPaginationParams(request.url);

    logger.db('select', 'company_values', { userId });

    const { data, error: dbError, count } = await supabase
      .from('company_values')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch values', { error: dbError.message, userId });
      return error('Failed to fetch values');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/values', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createValueSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Get the highest display_order
    const { data: lastValue } = await supabase
      .from('company_values')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = validated.display_order ?? (lastValue ? lastValue.display_order + 1 : 0);

    logger.db('insert', 'company_values', { userId });

    const { data, error: dbError } = await supabase
      .from('company_values')
      .insert({
        number: validated.number,
        title: validated.title,
        description: validated.description,
        display_order,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to create value', { error: dbError.message, userId });
      return error('Failed to create value');
    }

    logger.audit('create', 'company_values', data.id, userId, { title: validated.title });
    invalidateCache('company_values');
    revalidatePath('/about');

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/values', { error: String(err) });
    return error('Internal server error');
  }
}

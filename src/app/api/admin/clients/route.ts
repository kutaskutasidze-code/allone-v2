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
import { createClientSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const { page, limit, offset } = getPaginationParams(request.url);

    logger.db('select', 'clients', { userId });

    const { data, error: dbError, count } = await supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch clients', { error: dbError.message, userId });
      return error('Failed to fetch clients');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/clients', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createClientSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Get the highest display_order
    const { data: lastClient } = await supabase
      .from('clients')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = validated.display_order ?? (lastClient ? lastClient.display_order + 1 : 0);

    logger.db('insert', 'clients', { userId });

    const { data, error: dbError } = await supabase
      .from('clients')
      .insert({
        name: validated.name,
        logo_text: validated.logo_text,
        logo_url: validated.logo_url || null,
        is_published: validated.is_published,
        display_order,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to create client', { error: dbError.message, userId });
      return error('Failed to create client');
    }

    logger.audit('create', 'clients', data.id, userId, { name: validated.name });
    invalidateCache('clients');
    revalidatePath('/');

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/clients', { error: String(err) });
    return error('Internal server error');
  }
}

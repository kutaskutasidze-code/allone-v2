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
import { createServiceSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const { page, limit, offset } = getPaginationParams(request.url);

    logger.db('select', 'services', { userId });

    const { data, error: dbError, count } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch services', { error: dbError.message, userId });
      return error('Failed to fetch services');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/services', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createServiceSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Get the highest display_order
    const { data: lastService } = await supabase
      .from('services')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = validated.display_order ?? (lastService ? lastService.display_order + 1 : 0);

    logger.db('insert', 'services', { userId });

    const { data, error: dbError } = await supabase
      .from('services')
      .insert({
        title: validated.title,
        description: validated.description,
        icon: validated.icon,
        features: validated.features,
        subtitle: validated.subtitle || null,
        secondary_description: validated.secondary_description || null,
        stats: validated.stats || [],
        footer_text: validated.footer_text || null,
        cta_text: validated.cta_text || null,
        cta_url: validated.cta_url || null,
        card_type: validated.card_type || null,
        is_published: validated.is_published,
        display_order,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to create service', { error: dbError.message, userId });
      return error('Failed to create service');
    }

    logger.audit('create', 'services', data.id, userId, { title: validated.title });
    invalidateCache('services');
    revalidatePath('/services');
    revalidatePath('/');

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/services', { error: String(err) });
    return error('Internal server error');
  }
}

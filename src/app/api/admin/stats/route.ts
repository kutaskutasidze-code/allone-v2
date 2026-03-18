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
import { createStatSchema, batchUpdateStatsSchema } from '@/lib/validations';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const { page, limit, offset } = getPaginationParams(request.url);

    logger.db('select', 'stats', { userId });

    const { data, error: dbError, count } = await supabase
      .from('stats')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch stats', { error: dbError.message, userId });
      return error('Failed to fetch stats');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/stats', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = createStatSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data;

    // Get the highest display_order
    const { data: lastStat } = await supabase
      .from('stats')
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const display_order = validated.display_order ?? (lastStat ? lastStat.display_order + 1 : 0);

    logger.db('insert', 'stats', { userId });

    const { data, error: dbError } = await supabase
      .from('stats')
      .insert({
        value: validated.value,
        label: validated.label,
        display_order,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to create stat', { error: dbError.message, userId });
      return error('Failed to create stat');
    }

    logger.audit('create', 'stats', data.id, userId, { label: validated.label });
    invalidateCache('stats');
    revalidatePath('/about');
    revalidatePath('/');

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/stats', { error: String(err) });
    return error('Internal server error');
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = batchUpdateStatsSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const { stats } = result.data;

    logger.db('update', 'stats', { userId, count: stats.length });

    // Try atomic batch update via RPC first
    const { data: rpcResult, error: rpcError } = await supabase.rpc('batch_update_stats', {
      p_stats: stats,
    });

    if (!rpcError && rpcResult) {
      // RPC succeeded
      if (rpcResult.success) {
        logger.audit('batch_update', 'stats', undefined, userId, { count: rpcResult.updated });
        invalidateCache('stats');
        revalidatePath('/about');
        revalidatePath('/');
        return success({ updated: rpcResult.updated });
      } else {
        logger.error('Batch stat update failed', { errors: rpcResult.errors, userId });
        return error('Some updates failed');
      }
    }

    // Fallback to sequential updates if RPC not available
    logger.warn('batch_update_stats RPC not available, using fallback', { userId });

    const errors: string[] = [];

    for (const stat of stats) {
      const { error: dbError } = await supabase
        .from('stats')
        .update({
          value: stat.value,
          label: stat.label,
          display_order: stat.display_order,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stat.id);

      if (dbError) {
        errors.push(`Failed to update stat ${stat.id}: ${dbError.message}`);
      }
    }

    if (errors.length > 0) {
      logger.error('Partial failure in batch stat update', { errors, userId });
      return error(`Some updates failed: ${errors.join(', ')}`);
    }

    logger.audit('batch_update', 'stats', undefined, userId, { count: stats.length });
    invalidateCache('stats');
    revalidatePath('/about');
    revalidatePath('/');

    return success({ updated: stats.length });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in PUT /api/admin/stats', { error: String(err) });
    return error('Internal server error');
  }
}

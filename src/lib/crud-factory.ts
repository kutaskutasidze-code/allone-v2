/**
 * Generic CRUD Factory
 * Reduces code duplication across API routes while maintaining type safety
 */

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { ZodSchema, ZodError } from 'zod';
import { SupabaseClient } from '@supabase/supabase-js';
import { requireAuth, AuthError } from '@/lib/auth';
import { invalidateCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import {
  success,
  successWithPagination,
  error,
  validationError,
  unauthorized,
  notFound,
  conflict,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';

// ============================================
// Types
// ============================================

export interface CrudConfig<T> {
  tableName: string;
  resourceName: string;
  cacheTags?: string[];
  revalidatePaths?: string[];
  orderBy?: { column: string; ascending: boolean };
  publishedFilter?: boolean;
  uniqueFields?: string[];
}

export interface ListOptions {
  searchFields?: string[];
  additionalFilters?: Record<string, unknown>;
}

// ============================================
// Generic List Handler
// ============================================

export async function handleList<T>(
  request: Request,
  config: CrudConfig<T>,
  options: ListOptions = {}
) {
  try {
    const { supabase, userId } = await requireAuth();
    const { page, limit, offset } = getPaginationParams(request.url);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';

    logger.db('select', config.tableName, { userId, page, limit });

    let query = supabase
      .from(config.tableName)
      .select('*', { count: 'exact' });

    // Apply search if provided
    if (search && options.searchFields?.length) {
      const searchConditions = options.searchFields
        .map(field => `${field}.ilike.%${search}%`)
        .join(',');
      query = query.or(searchConditions);
    }

    // Apply ordering
    if (config.orderBy) {
      query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error: dbError, count } = await query;

    if (dbError) {
      logger.error(`Failed to fetch ${config.tableName}`, { error: dbError.message, userId });
      return error(`Failed to fetch ${config.resourceName}`);
    }

    return successWithPagination(
      data || [],
      createPaginationMeta(count || 0, page, limit)
    );
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error(`Unexpected error in GET /api/admin/${config.tableName}`, { error: String(err) });
    return error('Internal server error');
  }
}

// ============================================
// Generic Get By ID Handler
// ============================================

export async function handleGetById<T>(
  id: string,
  config: CrudConfig<T>
) {
  try {
    const { supabase, userId } = await requireAuth();

    logger.db('select', config.tableName, { userId, resourceId: id });

    const { data, error: dbError } = await supabase
      .from(config.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound(config.resourceName);
      }
      logger.error(`Failed to fetch ${config.resourceName}`, { error: dbError.message, userId, resourceId: id });
      return error(`Failed to fetch ${config.resourceName}`);
    }

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error(`Unexpected error in GET /api/admin/${config.tableName}/[id]`, { error: String(err) });
    return error('Internal server error');
  }
}

// ============================================
// Generic Create Handler
// ============================================

export async function handleCreate<T>(
  request: Request,
  config: CrudConfig<T>,
  schema: ZodSchema,
  buildInsertData: (validated: T, displayOrder: number) => Record<string, unknown>
) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = schema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data as T;

    // Check for unique field conflicts
    if (config.uniqueFields?.length) {
      for (const field of config.uniqueFields) {
        const value = (validated as Record<string, unknown>)[field];
        if (value) {
          const { data: existing } = await supabase
            .from(config.tableName)
            .select('id')
            .eq(field, value)
            .single();

          if (existing) {
            return conflict(`${config.resourceName} with this ${field} already exists`);
          }
        }
      }
    }

    // Get next display_order
    const { data: lastItem } = await supabase
      .from(config.tableName)
      .select('display_order')
      .order('display_order', { ascending: false })
      .limit(1)
      .single();

    const displayOrder = (lastItem?.display_order ?? 0) + 1;

    logger.db('insert', config.tableName, { userId });

    const insertData = buildInsertData(validated, displayOrder);

    const { data, error: dbError } = await supabase
      .from(config.tableName)
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      logger.error(`Failed to create ${config.resourceName}`, { error: dbError.message, userId });
      return error(`Failed to create ${config.resourceName}`);
    }

    logger.audit('create', config.tableName, data.id, userId);

    // Invalidate caches
    config.cacheTags?.forEach(tag => invalidateCache(tag));
    config.revalidatePaths?.forEach(path => revalidatePath(path));

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error(`Unexpected error in POST /api/admin/${config.tableName}`, { error: String(err) });
    return error('Internal server error');
  }
}

// ============================================
// Generic Update Handler
// ============================================

export async function handleUpdate<T>(
  id: string,
  request: Request,
  config: CrudConfig<T>,
  schema: ZodSchema,
  buildUpdateData: (validated: Partial<T>) => Record<string, unknown>
) {
  try {
    const { supabase, userId } = await requireAuth();
    const body = await request.json();

    // Validate input
    const result = schema.safeParse(body);
    if (!result.success) {
      return validationError(result.error);
    }

    const validated = result.data as Partial<T>;

    // Check for unique field conflicts (excluding current record)
    if (config.uniqueFields?.length) {
      for (const field of config.uniqueFields) {
        const value = (validated as Record<string, unknown>)[field];
        if (value !== undefined) {
          const { data: existing } = await supabase
            .from(config.tableName)
            .select('id')
            .eq(field, value)
            .neq('id', id)
            .single();

          if (existing) {
            return conflict(`${config.resourceName} with this ${field} already exists`);
          }
        }
      }
    }

    logger.db('update', config.tableName, { userId, resourceId: id });

    const updateData = {
      ...buildUpdateData(validated),
      updated_at: new Date().toISOString(),
    };

    const { data, error: dbError } = await supabase
      .from(config.tableName)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      if (dbError.code === 'PGRST116') {
        return notFound(config.resourceName);
      }
      logger.error(`Failed to update ${config.resourceName}`, { error: dbError.message, userId, resourceId: id });
      return error(`Failed to update ${config.resourceName}`);
    }

    logger.audit('update', config.tableName, id, userId);

    // Invalidate caches
    config.cacheTags?.forEach(tag => invalidateCache(tag));
    config.revalidatePaths?.forEach(path => revalidatePath(path));

    return success(data);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error(`Unexpected error in PUT /api/admin/${config.tableName}/[id]`, { error: String(err) });
    return error('Internal server error');
  }
}

// ============================================
// Generic Delete Handler
// ============================================

export async function handleDelete(
  id: string,
  config: CrudConfig<unknown>,
  preDeleteCheck?: (supabase: SupabaseClient, id: string) => Promise<{ canDelete: boolean; reason?: string }>
) {
  try {
    const { supabase, userId } = await requireAuth();

    // Run pre-delete check if provided
    if (preDeleteCheck) {
      const checkResult = await preDeleteCheck(supabase, id);
      if (!checkResult.canDelete) {
        return error(checkResult.reason || `Cannot delete this ${config.resourceName}`, 400);
      }
    }

    logger.db('delete', config.tableName, { userId, resourceId: id });

    const { error: dbError } = await supabase
      .from(config.tableName)
      .delete()
      .eq('id', id);

    if (dbError) {
      logger.error(`Failed to delete ${config.resourceName}`, { error: dbError.message, userId, resourceId: id });
      return error(`Failed to delete ${config.resourceName}`);
    }

    logger.audit('delete', config.tableName, id, userId);

    // Invalidate caches
    config.cacheTags?.forEach(tag => invalidateCache(tag));
    config.revalidatePaths?.forEach(path => revalidatePath(path));

    return success({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error(`Unexpected error in DELETE /api/admin/${config.tableName}/[id]`, { error: String(err) });
    return error('Internal server error');
  }
}

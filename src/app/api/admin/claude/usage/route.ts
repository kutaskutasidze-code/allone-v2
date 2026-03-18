import { requireAuth, AuthError } from '@/lib/auth';
import { verifyClaudeApiKey, getServiceClient } from '@/lib/claude-auth';
import {
  success,
  successWithPagination,
  error,
  unauthorized,
  getPaginationParams,
  createPaginationMeta,
} from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { supabase, userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(request.url);
    const capabilityName = searchParams.get('capability_name');
    const days = parseInt(searchParams.get('days') || '7', 10);
    const groupBy = searchParams.get('group_by'); // 'capability' or 'day'

    logger.db('select', 'claude_usage', { userId });

    const since = new Date();
    since.setDate(since.getDate() - days);

    if (groupBy === 'capability') {
      // Aggregate by capability
      const { data, error: dbError } = await supabase
        .from('claude_usage')
        .select('capability_name, success')
        .gte('used_at', since.toISOString());

      if (dbError) {
        logger.error('Failed to fetch usage', { error: dbError.message, userId });
        return error('Failed to fetch usage');
      }

      // Aggregate in memory
      const stats: Record<string, { total: number; success: number; failure: number }> = {};
      (data || []).forEach((row) => {
        if (!stats[row.capability_name]) {
          stats[row.capability_name] = { total: 0, success: 0, failure: 0 };
        }
        stats[row.capability_name].total++;
        if (row.success) {
          stats[row.capability_name].success++;
        } else {
          stats[row.capability_name].failure++;
        }
      });

      const result = Object.entries(stats)
        .map(([name, counts]) => ({
          capability_name: name,
          ...counts,
          success_rate: counts.total > 0 ? (counts.success / counts.total) * 100 : 0,
        }))
        .sort((a, b) => b.total - a.total);

      return success(result);
    }

    // Default: return raw usage with pagination
    let query = supabase
      .from('claude_usage')
      .select('*', { count: 'exact' })
      .gte('used_at', since.toISOString());

    if (capabilityName) {
      query = query.eq('capability_name', capabilityName);
    }

    const { data, error: dbError, count } = await query
      .order('used_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch usage', { error: dbError.message, userId });
      return error('Failed to fetch usage');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/claude/usage', { error: String(err) });
    return error('Internal server error');
  }
}

export async function POST(request: Request) {
  try {
    // Check for Claude API key (for self-reporting)
    const isClaudeRequest = verifyClaudeApiKey(request);

    let supabase;
    let userId = 'claude-self-report';

    if (isClaudeRequest) {
      supabase = getServiceClient();
    } else {
      const auth = await requireAuth();
      supabase = auth.supabase;
      userId = auth.userId;
    }

    const body = await request.json();

    // Validate required fields
    if (!body.capability_name) {
      return error('capability_name is required', 400);
    }

    // Look up capability ID if it exists
    let capabilityId = body.capability_id;
    if (!capabilityId) {
      const { data: cap } = await supabase
        .from('claude_capabilities')
        .select('id')
        .eq('name', body.capability_name)
        .single();

      if (cap) {
        capabilityId = cap.id;
      }
    }

    const { data, error: dbError } = await supabase
      .from('claude_usage')
      .insert({
        capability_id: capabilityId || null,
        capability_name: body.capability_name,
        success: body.success ?? true,
        duration_ms: body.duration_ms || null,
        context: body.context || null,
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to log usage', { error: dbError.message, userId });
      return error('Failed to log usage');
    }

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/claude/usage', { error: String(err) });
    return error('Internal server error');
  }
}

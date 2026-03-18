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
    const { page, limit, offset } = getPaginationParams(request.url);
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    logger.db('select', 'claude_capabilities', { userId });

    let query = supabase
      .from('claude_capabilities')
      .select('*', { count: 'exact' });

    if (category) {
      query = query.eq('category', category);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error: dbError, count } = await query
      .order('category', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (dbError) {
      logger.error('Failed to fetch capabilities', { error: dbError.message, userId });
      return error('Failed to fetch capabilities');
    }

    return successWithPagination(data || [], createPaginationMeta(page, limit, count));
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/claude/capabilities', { error: String(err) });
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
      // Use service role client for Claude
      supabase = getServiceClient();
    } else {
      // Require admin auth for manual additions
      const auth = await requireAuth();
      supabase = auth.supabase;
      userId = auth.userId;
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category) {
      return error('name and category are required', 400);
    }

    logger.db('insert', 'claude_capabilities', { userId });

    const { data, error: dbError } = await supabase
      .from('claude_capabilities')
      .insert({
        name: body.name,
        category: body.category,
        source: body.source || null,
        status: body.status || 'active',
        version: body.version || null,
        description: body.description || null,
        metadata: body.metadata || {},
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Failed to create capability', { error: dbError.message, userId });
      return error('Failed to create capability');
    }

    logger.audit('create', 'claude_capabilities', data.id, userId, { name: body.name });

    return success(data, 201);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in POST /api/admin/claude/capabilities', { error: String(err) });
    return error('Internal server error');
  }
}

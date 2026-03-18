import { verifyClaudeApiKey, getServiceClient } from '@/lib/claude-auth';
import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, unauthorized } from '@/lib/api-response';

export async function GET(request: Request) {
  try {
    // Allow both Claude API key and admin auth
    const isClaudeRequest = verifyClaudeApiKey(request);
    if (!isClaudeRequest) {
      try {
        await requireAuth();
      } catch (e) {
        if (e instanceof AuthError) return unauthorized();
        throw e;
      }
    }

    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const taskType = searchParams.get('task_type');
    const sortBy = searchParams.get('sort') || 'success_rate';
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabase
      .from('claude_patterns')
      .select('*');

    if (taskType) {
      query = query.eq('task_type', taskType);
    }

    const { data, error: dbError } = await query.limit(100);

    if (dbError) {
      return error('Failed to fetch patterns');
    }

    // Calculate success rates and sort
    const patterns = (data || []).map(p => ({
      ...p,
      total_uses: p.success_count + p.fail_count,
      success_rate: p.success_count + p.fail_count > 0
        ? Math.round((p.success_count / (p.success_count + p.fail_count)) * 100)
        : 0,
      avg_duration_ms: p.success_count + p.fail_count > 0
        ? Math.round(p.total_duration_ms / (p.success_count + p.fail_count))
        : 0,
    }));

    // Sort
    if (sortBy === 'success_rate') {
      patterns.sort((a, b) => b.success_rate - a.success_rate);
    } else if (sortBy === 'usage') {
      patterns.sort((a, b) => b.total_uses - a.total_uses);
    } else if (sortBy === 'recent') {
      patterns.sort((a, b) => new Date(b.last_used).getTime() - new Date(a.last_used).getTime());
    }

    return success(patterns.slice(0, limit));
  } catch (err) {
    console.error('Patterns fetch error:', err);
    return error('Internal server error');
  }
}

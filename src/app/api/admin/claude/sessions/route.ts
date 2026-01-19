import { verifyClaudeApiKey, getServiceClient } from '@/lib/claude-auth';
import { success, error, unauthorized } from '@/lib/api-response';
import crypto from 'crypto';

// Hash a sequence for lookup
function hashSequence(seq: string[], taskType: string | null): string {
  return crypto.createHash('md5').update(seq.join('→') + (taskType || '')).digest('hex');
}

export async function POST(request: Request) {
  try {
    if (!verifyClaudeApiKey(request)) {
      return unauthorized();
    }

    const supabase = getServiceClient();
    const body = await request.json();

    // Validate required fields
    if (!body.session_id) {
      return error('session_id is required', 400);
    }

    // Insert session
    const { data: session, error: sessionError } = await supabase
      .from('claude_sessions')
      .insert({
        session_id: body.session_id,
        duration_mins: body.duration_mins || null,
        task_type: body.task_type || null,
        tools_used: body.tools_used || [],
        tool_counts: body.tool_counts || {},
        outcome: body.outcome || 'unknown',
        error_summary: body.error_summary || null,
        tokens_used: body.tokens_used || null,
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session insert error:', sessionError);
      return error('Failed to create session: ' + sessionError.message);
    }

    // Process patterns if provided
    if (body.patterns && Array.isArray(body.patterns)) {
      for (const p of body.patterns) {
        if (!p.seq || !Array.isArray(p.seq) || p.seq.length < 2) continue;

        const seqHash = hashSequence(p.seq, body.task_type);
        const succeeded = p.success > 0;

        // Upsert pattern
        const { data: existing } = await supabase
          .from('claude_patterns')
          .select('id, success_count, fail_count, total_duration_ms')
          .eq('sequence_hash', seqHash)
          .eq('task_type', body.task_type || '')
          .single();

        let patternId: string;

        if (existing) {
          // Update existing pattern
          await supabase
            .from('claude_patterns')
            .update({
              success_count: existing.success_count + (succeeded ? p.count : 0),
              fail_count: existing.fail_count + (succeeded ? 0 : p.count),
              total_duration_ms: existing.total_duration_ms + (p.duration_ms || 0),
              last_used: new Date().toISOString(),
            })
            .eq('id', existing.id);
          patternId = existing.id;
        } else {
          // Insert new pattern
          const { data: newPattern } = await supabase
            .from('claude_patterns')
            .insert({
              sequence: p.seq,
              sequence_hash: seqHash,
              task_type: body.task_type || null,
              success_count: succeeded ? p.count : 0,
              fail_count: succeeded ? 0 : p.count,
              total_duration_ms: p.duration_ms || 0,
            })
            .select()
            .single();

          if (newPattern) patternId = newPattern.id;
          else continue;
        }

        // Link pattern to session
        await supabase
          .from('claude_session_patterns')
          .insert({
            session_id: session.id,
            pattern_id: patternId,
            occurrences: p.count,
            succeeded,
          });
      }
    }

    return success({ session_id: session.id, patterns_processed: body.patterns?.length || 0 }, 201);
  } catch (err) {
    console.error('Session report error:', err);
    return error('Internal server error');
  }
}

export async function GET(request: Request) {
  try {
    if (!verifyClaudeApiKey(request)) {
      // Also allow authenticated admin users
      const { requireAuth, AuthError } = await import('@/lib/auth');
      try {
        await requireAuth();
      } catch (e) {
        if (e instanceof AuthError) return unauthorized();
        throw e;
      }
    }

    const supabase = getServiceClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data, error: dbError } = await supabase
      .from('claude_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (dbError) {
      return error('Failed to fetch sessions');
    }

    return success(data || []);
  } catch (err) {
    return error('Internal server error');
  }
}

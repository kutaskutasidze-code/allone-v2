import { requireAuth, AuthError } from '@/lib/auth';
import { success, error, unauthorized } from '@/lib/api-response';
import { logger } from '@/lib/logger';

interface ClaudeStats {
  capabilities: {
    total: number;
    by_category: Record<string, number>;
    by_status: Record<string, number>;
  };
  upgrades: {
    total: number;
    verified: number;
    unverified: number;
    recent: Array<{
      id: string;
      action: string;
      capability_name: string | null;
      description: string;
      verified: boolean;
      reported_at: string;
    }>;
  };
  usage: {
    total_7d: number;
    today: number;
    success_rate: number;
    avg_duration_ms: number | null;
    top_capabilities: Array<{
      name: string;
      count: number;
    }>;
  };
  patterns: {
    total: number;
    top_patterns: Array<{
      sequence: string[];
      success_rate: number;
      total_uses: number;
    }>;
  };
  sessions: {
    total_7d: number;
    avg_duration_mins: number | null;
    outcomes: Record<string, number>;
  };
}

export async function GET() {
  try {
    const { supabase, userId } = await requireAuth();

    logger.db('select', 'claude_stats', { userId });

    // Fetch capabilities
    const { data: capabilities } = await supabase
      .from('claude_capabilities')
      .select('id, category, status');

    // Fetch upgrades (recent 10)
    const { data: upgrades } = await supabase
      .from('claude_upgrades')
      .select('id, action, capability_name, description, verified, reported_at')
      .order('reported_at', { ascending: false })
      .limit(10);

    // Fetch usage stats (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: usage7d } = await supabase
      .from('claude_usage')
      .select('capability_name, success, duration_ms, used_at')
      .gte('used_at', sevenDaysAgo.toISOString());

    const { data: usageToday } = await supabase
      .from('claude_usage')
      .select('id')
      .gte('used_at', today.toISOString());

    // Calculate stats
    const capsByCategory: Record<string, number> = {};
    const capsByStatus: Record<string, number> = {};
    (capabilities || []).forEach((cap) => {
      capsByCategory[cap.category] = (capsByCategory[cap.category] || 0) + 1;
      capsByStatus[cap.status] = (capsByStatus[cap.status] || 0) + 1;
    });

    const upgradesVerified = (upgrades || []).filter((u) => u.verified).length;

    // Usage stats
    const usageData = usage7d || [];
    const successCount = usageData.filter((u) => u.success).length;
    const successRate = usageData.length > 0 ? (successCount / usageData.length) * 100 : 100;

    const durationsWithValue = usageData
      .filter((u) => u.duration_ms !== null)
      .map((u) => u.duration_ms as number);
    const avgDuration =
      durationsWithValue.length > 0
        ? Math.round(durationsWithValue.reduce((a, b) => a + b, 0) / durationsWithValue.length)
        : null;

    // Top capabilities by usage
    const capUsage: Record<string, number> = {};
    usageData.forEach((u) => {
      capUsage[u.capability_name] = (capUsage[u.capability_name] || 0) + 1;
    });
    const topCaps = Object.entries(capUsage)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Fetch patterns (with fallback if table doesn't exist)
    let patterns: Array<{ sequence: string[]; success_rate: number; total_uses: number }> = [];
    let patternsTotal = 0;
    try {
      const { data: patternsData } = await supabase
        .from('claude_patterns')
        .select('sequence, success_count, fail_count')
        .order('success_count', { ascending: false })
        .limit(5);

      if (patternsData) {
        patternsTotal = patternsData.length;
        patterns = patternsData.map(p => ({
          sequence: p.sequence,
          total_uses: p.success_count + p.fail_count,
          success_rate: p.success_count + p.fail_count > 0
            ? Math.round((p.success_count / (p.success_count + p.fail_count)) * 100)
            : 0,
        }));
      }
    } catch {
      // Table might not exist yet
    }

    // Fetch sessions (with fallback)
    let sessionsTotal = 0;
    let avgSessionDuration: number | null = null;
    const sessionOutcomes: Record<string, number> = {};
    try {
      const { data: sessionsData } = await supabase
        .from('claude_sessions')
        .select('duration_mins, outcome')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (sessionsData) {
        sessionsTotal = sessionsData.length;
        const durations = sessionsData.filter(s => s.duration_mins).map(s => s.duration_mins);
        avgSessionDuration = durations.length > 0
          ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
          : null;
        sessionsData.forEach(s => {
          sessionOutcomes[s.outcome] = (sessionOutcomes[s.outcome] || 0) + 1;
        });
      }
    } catch {
      // Table might not exist yet
    }

    const stats: ClaudeStats = {
      capabilities: {
        total: capabilities?.length || 0,
        by_category: capsByCategory,
        by_status: capsByStatus,
      },
      upgrades: {
        total: upgrades?.length || 0,
        verified: upgradesVerified,
        unverified: (upgrades?.length || 0) - upgradesVerified,
        recent: upgrades || [],
      },
      usage: {
        total_7d: usageData.length,
        today: usageToday?.length || 0,
        success_rate: Math.round(successRate * 10) / 10,
        avg_duration_ms: avgDuration,
        top_capabilities: topCaps,
      },
      patterns: {
        total: patternsTotal,
        top_patterns: patterns,
      },
      sessions: {
        total_7d: sessionsTotal,
        avg_duration_mins: avgSessionDuration,
        outcomes: sessionOutcomes,
      },
    };

    return success(stats);
  } catch (err) {
    if (err instanceof AuthError) return unauthorized();
    logger.error('Unexpected error in GET /api/admin/claude/stats', { error: String(err) });
    return error('Internal server error');
  }
}

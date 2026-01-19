import { createClient } from '@/lib/supabase/server';
import { ClaudeDashboardContent } from './ClaudeDashboardContent';

interface Capability {
  id: string;
  name: string;
  category: string;
  status: string;
  source: string | null;
  description: string | null;
  metadata: Record<string, unknown>;
  installed_at: string;
}

interface Upgrade {
  id: string;
  action: string;
  capability_name: string | null;
  capability_category: string | null;
  description: string;
  details: Record<string, unknown>;
  verified: boolean;
  reported_at: string;
}

interface Usage {
  capability_name: string;
  success: boolean;
  duration_ms: number | null;
  used_at: string;
}

interface PatternRow {
  sequence: string[];
  success_count: number;
  fail_count: number;
}

interface Session {
  duration_mins: number | null;
  outcome: string;
}

async function getClaudeStats() {
  const supabase = await createClient();

  // Get capabilities grouped by category and status
  const { data: capabilities } = await supabase
    .from('claude_capabilities')
    .select('*')
    .order('category')
    .order('name');

  // Get recent upgrades
  const { data: upgrades } = await supabase
    .from('claude_upgrades')
    .select('*')
    .order('reported_at', { ascending: false })
    .limit(10);

  // Get usage from last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: usage } = await supabase
    .from('claude_usage')
    .select('capability_name, success, duration_ms, used_at')
    .gte('used_at', sevenDaysAgo.toISOString());

  // Get today's usage count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from('claude_usage')
    .select('id', { count: 'exact' })
    .gte('used_at', today.toISOString());

  // Calculate stats
  const capsByCategory: Record<string, number> = {};
  const capsByStatus: Record<string, number> = {};
  (capabilities || []).forEach((cap: Capability) => {
    capsByCategory[cap.category] = (capsByCategory[cap.category] || 0) + 1;
    capsByStatus[cap.status] = (capsByStatus[cap.status] || 0) + 1;
  });

  // Usage stats
  const usageData = usage || [];
  const successCount = usageData.filter((u: Usage) => u.success).length;
  const successRate = usageData.length > 0 ? (successCount / usageData.length) * 100 : 100;

  const durationsWithValue = usageData
    .filter((u: Usage) => u.duration_ms !== null)
    .map((u: Usage) => u.duration_ms as number);
  const avgDuration =
    durationsWithValue.length > 0
      ? Math.round(durationsWithValue.reduce((a, b) => a + b, 0) / durationsWithValue.length)
      : null;

  // Top capabilities by usage
  const capUsage: Record<string, number> = {};
  usageData.forEach((u: Usage) => {
    capUsage[u.capability_name] = (capUsage[u.capability_name] || 0) + 1;
  });
  const topCapabilities = Object.entries(capUsage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Count upgrades by status
  const verifiedCount = (upgrades || []).filter((u: Upgrade) => u.verified).length;
  const pendingCount = (upgrades || []).filter((u: Upgrade) => !u.verified).length;

  // Get patterns (with fallback if table doesn't exist)
  let patterns: Array<{ sequence: string[]; successRate: number; totalUses: number }> = [];
  let patternsTotal = 0;
  try {
    const { data: patternsData } = await supabase
      .from('claude_patterns')
      .select('sequence, success_count, fail_count')
      .order('success_count', { ascending: false })
      .limit(5);

    if (patternsData) {
      patternsTotal = patternsData.length;
      patterns = patternsData.map((p: PatternRow) => ({
        sequence: p.sequence,
        totalUses: p.success_count + p.fail_count,
        successRate: p.success_count + p.fail_count > 0
          ? Math.round((p.success_count / (p.success_count + p.fail_count)) * 100)
          : 0,
      }));
    }
  } catch {
    // Table might not exist yet
  }

  // Get sessions (with fallback)
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
      const durations = sessionsData
        .filter((s: Session) => s.duration_mins)
        .map((s: Session) => s.duration_mins as number);
      avgSessionDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;
      sessionsData.forEach((s: Session) => {
        sessionOutcomes[s.outcome] = (sessionOutcomes[s.outcome] || 0) + 1;
      });
    }
  } catch {
    // Table might not exist yet
  }

  return {
    capabilities: capabilities || [],
    capsByCategory,
    capsByStatus,
    upgrades: upgrades || [],
    verifiedCount,
    pendingCount,
    usage: {
      total7d: usageData.length,
      today: todayCount || 0,
      successRate: Math.round(successRate * 10) / 10,
      avgDurationMs: avgDuration,
      topCapabilities,
    },
    patterns: {
      total: patternsTotal,
      topPatterns: patterns,
    },
    sessions: {
      total7d: sessionsTotal,
      avgDurationMins: avgSessionDuration,
      outcomes: sessionOutcomes,
    },
  };
}

export default async function ClaudeDashboard() {
  const stats = await getClaudeStats();

  return <ClaudeDashboardContent {...stats} />;
}

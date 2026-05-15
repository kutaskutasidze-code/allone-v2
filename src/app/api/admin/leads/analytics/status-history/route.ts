import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { leadStatusSchema, LEAD_STATUSES } from '@/lib/validations/leads';
import { logger } from '@/lib/logger';

type Status = typeof LEAD_STATUSES[number]['value'];

const DAYS = 30;

export type DailyStatusRow = { date: string } & Record<Status, number>;

function emptyRow(date: string): DailyStatusRow {
  const row = { date } as DailyStatusRow;
  for (const { value } of LEAD_STATUSES) row[value] = 0;
  return row;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - (DAYS - 1));
    since.setUTCHours(0, 0, 0, 0);

    const admin = createAdminClient();

    const buckets = new Map<string, DailyStatusRow>();
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(since);
      d.setUTCDate(since.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, emptyRow(key));
    }

    const PAGE = 1000;
    for (let offset = 0; ; offset += PAGE) {
      const { data, error } = await admin
        .from('lead_status_history')
        .select('to_status, changed_at')
        .gte('changed_at', since.toISOString())
        .order('changed_at', { ascending: true })
        .range(offset, offset + PAGE - 1);

      if (error) {
        logger.error('Failed to load lead status history', { error: error.message });
        return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
      }

      if (!data || data.length === 0) break;

      for (const row of data) {
        const day = String(row.changed_at).slice(0, 10);
        const bucket = buckets.get(day);
        if (!bucket) continue;
        const parsed = leadStatusSchema.safeParse(row.to_status);
        if (parsed.success) bucket[parsed.data]++;
      }

      if (data.length < PAGE) break;
    }

    return NextResponse.json({ data: Array.from(buckets.values()) });
  } catch (error) {
    logger.error('Lead analytics error', { error: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

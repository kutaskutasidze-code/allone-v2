import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/sales-auth';
import { AuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { fetchAllRows } from '@/lib/supabase/paginate';

export const dynamic = 'force-dynamic';

interface DupLead {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  value: number;
  created_at: string;
}

// Last 9 digits — tolerant of +995 / 995 / local-format variants.
const normPhone = (p: string | null) => {
  const d = (p || '').replace(/\D/g, '');
  return d.length >= 7 ? d.slice(-9) : '';
};
const normEmail = (e: string | null) => (e || '').trim().toLowerCase();

const push = (map: Map<string, DupLead[]>, key: string, l: DupLead) => {
  const a = map.get(key);
  if (a) a.push(l);
  else map.set(key, [l]);
};

export async function GET() {
  try {
    await requireRole(['admin', 'supervisor']);
    const admin = createAdminClient();
    // Page through ALL leads — a bare select is capped at 1000 rows by
    // PostgREST, which would make the dedupe scan only ~4% of the table.
    const rows = await fetchAllRows<DupLead>((from, to) =>
      admin
        .from('leads')
        .select('id, name, company, phone, email, status, value, created_at')
        .range(from, to),
    );
    const byPhone = new Map<string, DupLead[]>();
    const byEmail = new Map<string, DupLead[]>();
    for (const l of rows) {
      const p = normPhone(l.phone);
      if (p) push(byPhone, p, l);
      const e = normEmail(l.email);
      if (e) push(byEmail, e, l);
    }

    const groups: { key: string; by: 'phone' | 'email'; leads: DupLead[] }[] = [];
    const seen = new Set<string>();
    const collect = (map: Map<string, DupLead[]>, by: 'phone' | 'email') => {
      for (const [key, ls] of map) {
        if (ls.length < 2) continue;
        const sig = ls
          .map((l) => l.id)
          .sort()
          .join(',');
        if (seen.has(sig)) continue;
        seen.add(sig);
        groups.push({ key, by, leads: ls });
      }
    };
    collect(byPhone, 'phone');
    collect(byEmail, 'email');

    groups.sort((a, b) => b.leads.length - a.leads.length);

    return NextResponse.json({
      data: { groups: groups.slice(0, 100), total: groups.length },
    });
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    logger.error('find-duplicates error', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

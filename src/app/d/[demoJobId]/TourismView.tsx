// Server component — reads tourism rows for the demo org and renders them.

import { demosSupabase } from "@/lib/supabase/demos";

interface Props {
  orgId: string;
  accent: string;
}

interface Hotel {
  id: string;
  name: string;
  city: string | null;
  tier: string | null;
  rooms: number | null;
  base_price_eur: number | null;
  balance_eur: number | null;
}
interface Contact {
  id: string;
  name: string;
  email: string | null;
  role: string | null;
}
interface OrderRow {
  id: string;
  total_eur: number | null;
  level: string | null;
  check_in: string | null;
  check_out: string | null;
  created_at: string;
}
interface AuditRow {
  id: string;
  action: string;
  target: string | null;
  actor: string | null;
  occurred_at: string;
}

export async function TourismView({ orgId, accent }: Props) {
  const db = demosSupabase();
  if (!db) return <EmptyMessage />;

  const [
    { data: hotels },
    { data: contacts },
    { data: orders },
    { data: audit },
  ] = await Promise.all([
    db
      .from("hotels")
      .select("id, name, city, tier, rooms, base_price_eur, balance_eur")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    db
      .from("contacts")
      .select("id, name, email, role")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    db
      .from("orders")
      .select("id, total_eur, level, check_in, check_out, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(12),
    db
      .from("audit_log")
      .select("id, action, target, actor, occurred_at")
      .eq("org_id", orgId)
      .order("occurred_at", { ascending: false })
      .limit(10),
  ]);

  const totalRevenue =
    (orders as OrderRow[] | null)?.reduce(
      (s, o) => s + (o.total_eur ?? 0),
      0,
    ) ?? 0;

  return (
    <div className="space-y-8">
      <Stats
        accent={accent}
        items={[
          { label: "Hotels", value: hotels?.length ?? 0 },
          { label: "Contacts", value: contacts?.length ?? 0 },
          { label: "Recent orders", value: orders?.length ?? 0 },
          {
            label: "Recent revenue",
            value: `€${totalRevenue.toLocaleString()}`,
          },
        ]}
      />

      <Section title="Hotels">
        <Table
          columns={["Name", "City", "Tier", "Rooms", "Base €", "Balance €"]}
          rows={(hotels as Hotel[] | null)?.map((h) => [
            h.name,
            h.city ?? "—",
            h.tier ?? "—",
            String(h.rooms ?? "—"),
            h.base_price_eur != null ? `€${h.base_price_eur}` : "—",
            h.balance_eur != null ? `€${h.balance_eur.toLocaleString()}` : "—",
          ])}
        />
      </Section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Section title="Recent orders">
          <Table
            columns={["Created", "Level", "Check-in", "Total"]}
            rows={(orders as OrderRow[] | null)?.map((o) => [
              new Date(o.created_at).toLocaleDateString(),
              o.level ?? "—",
              o.check_in ?? "—",
              o.total_eur != null ? `€${o.total_eur}` : "—",
            ])}
          />
        </Section>
        <Section title="Recent activity">
          {(audit as AuditRow[] | null)?.length ? (
            <ul className="divide-y divide-slate-100">
              {(audit as AuditRow[]).map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-900">{a.action}</p>
                    <p className="text-xs text-slate-500">
                      {a.target ?? "—"} · {a.actor ?? "—"}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(a.occurred_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No recent activity.</p>
          )}
        </Section>
      </div>
    </div>
  );
}

function EmptyMessage() {
  return (
    <p className="text-sm text-slate-500">
      Demo data not configured for this admin.
    </p>
  );
}

function Stats({
  items,
  accent,
}: {
  items: Array<{ label: string; value: string | number }>;
  accent: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-slate-200 bg-white p-5"
          style={{ borderTopColor: accent, borderTopWidth: 2 }}
        >
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500">
            {s.label}
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        {children}
      </div>
    </section>
  );
}

function Table({
  columns,
  rows,
}: {
  columns: string[];
  rows?: Array<Array<string>> | null;
}) {
  if (!rows || rows.length === 0) {
    return <p className="text-sm text-slate-500">No rows yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-mono uppercase tracking-wider text-slate-500">
            {columns.map((c) => (
              <th
                key={c}
                className="border-b border-slate-200 py-2 pr-4 font-medium"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="text-slate-900">
              {row.map((cell, j) => (
                <td key={j} className="border-b border-slate-100 py-2.5 pr-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

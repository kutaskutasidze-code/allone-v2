// Server component — reads ecom rows for the demo org and renders them.

import { demosSupabase } from "@/lib/supabase/demos";

interface Props {
  orgId: string;
  accent: string;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  price_eur: number | null;
  stock: number | null;
}
interface Customer {
  id: string;
  name: string;
  email: string | null;
  country: string | null;
  lifetime_value_eur: number | null;
}
interface OrderRow {
  id: string;
  status: string | null;
  qty: number | null;
  total_eur: number | null;
  created_at: string;
}
interface StockRow {
  id: string;
  delta: number;
  reason: string | null;
  occurred_at: string;
}

export async function EcomView({ orgId, accent }: Props) {
  const db = demosSupabase();
  if (!db)
    return <p className="text-sm text-slate-500">Demo data not configured.</p>;

  const [
    { data: products },
    { data: customers },
    { data: orders },
    { data: stock },
  ] = await Promise.all([
    db
      .from("products")
      .select("id, name, sku, price_eur, stock")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    db
      .from("customers")
      .select("id, name, email, country, lifetime_value_eur")
      .eq("org_id", orgId)
      .order("lifetime_value_eur", { ascending: false }),
    db
      .from("orders")
      .select("id, status, qty, total_eur, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(15),
    db
      .from("stock_movements")
      .select("id, delta, reason, occurred_at")
      .eq("org_id", orgId)
      .order("occurred_at", { ascending: false })
      .limit(10),
  ]);

  const revenue =
    (orders as OrderRow[] | null)?.reduce(
      (s, o) => s + (o.total_eur ?? 0),
      0,
    ) ?? 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Products", value: products?.length ?? 0 },
          { label: "Customers", value: customers?.length ?? 0 },
          { label: "Recent orders", value: orders?.length ?? 0 },
          { label: "Recent revenue", value: `€${revenue.toLocaleString()}` },
        ].map((s) => (
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

      <Section title="Products">
        <Table
          columns={["Name", "SKU", "Price", "Stock"]}
          rows={(products as Product[] | null)?.map((p) => [
            p.name,
            p.sku ?? "—",
            p.price_eur != null ? `€${p.price_eur}` : "—",
            String(p.stock ?? "—"),
          ])}
        />
      </Section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Section title="Recent orders">
          <Table
            columns={["Created", "Status", "Qty", "Total"]}
            rows={(orders as OrderRow[] | null)?.map((o) => [
              new Date(o.created_at).toLocaleDateString(),
              o.status ?? "—",
              String(o.qty ?? "—"),
              o.total_eur != null ? `€${o.total_eur}` : "—",
            ])}
          />
        </Section>
        <Section title="Top customers">
          <Table
            columns={["Name", "Country", "LTV"]}
            rows={(customers as Customer[] | null)
              ?.slice(0, 8)
              .map((c) => [
                c.name,
                c.country ?? "—",
                c.lifetime_value_eur != null ? `€${c.lifetime_value_eur}` : "—",
              ])}
          />
        </Section>
      </div>

      <Section title="Stock movements (last 10)">
        <Table
          columns={["When", "Delta", "Reason"]}
          rows={(stock as StockRow[] | null)?.map((m) => [
            new Date(m.occurred_at).toLocaleString(),
            (m.delta >= 0 ? "+" : "") + m.delta,
            m.reason ?? "—",
          ])}
        />
      </Section>
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

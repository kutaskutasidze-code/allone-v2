"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Trash2, Plus, X } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  due_date: string | null;
  paid_at: string | null;
  label: string | null;
}

const fmt = (n: number) =>
  `₾${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
// Today's calendar date in Tbilisi (UTC+4), for due-date defaults + overdue.
const tbilisiToday = () =>
  new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10);
const addDays = (iso: string, d: number) =>
  new Date(new Date(iso + "T00:00:00Z").getTime() + d * 86400_000)
    .toISOString()
    .slice(0, 10);
const addMonths = (iso: string, m: number) => {
  const dt = new Date(iso + "T00:00:00Z");
  dt.setUTCMonth(dt.getUTCMonth() + m);
  return dt.toISOString().slice(0, 10);
};
const fmtDate = (iso: string) =>
  new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const CARD =
  "rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]";
const FIELD =
  "w-full px-2.5 py-1.5 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-900)] focus:border-gray-400 focus:outline-none";
const BTN =
  "inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-2.5 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:border-[var(--allone-line-strong)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50 transition-all";

// Per-deal payment schedule. Each row is an installment (owed or collected).
// Managers and the owning rep can edit; the server enforces access.
export function LeadBilling({
  leadId,
  value,
}: {
  leadId: string;
  value: number;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);
  const [amount, setAmount] = useState("");
  const [due, setDue] = useState("");
  const [label, setLabel] = useState("");
  const [months, setMonths] = useState("3");

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/sales/leads/${leadId}/payments`);
      if (!res.ok) return;
      const json = await res.json();
      setPayments(json.data || []);
    } catch {
      /* non-blocking */
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const run = async (fn: () => Promise<Response>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fn();
      if (!res.ok) throw new Error();
      await fetchPayments();
      return true;
    } catch {
      setError("Couldn't save — try again");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addInstallments = (installments: Record<string, unknown>[]) =>
    run(() =>
      fetch(`/api/sales/leads/${leadId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ installments }),
      }),
    );

  const setPaid = (id: string, paid: boolean) =>
    run(() =>
      fetch(`/api/sales/leads/${leadId}/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid }),
      }),
    );

  const remove = (id: string) =>
    run(() =>
      fetch(`/api/sales/leads/${leadId}/payments/${id}`, { method: "DELETE" }),
    );

  const today = tbilisiToday();
  const paid = payments
    .filter((p) => p.paid_at)
    .reduce((s, p) => s + Number(p.amount), 0);
  const owed = Math.max(0, value - paid);
  const pct = value > 0 ? Math.min(100, Math.round((paid / value) * 100)) : 0;

  const split3070 = () => {
    if (value <= 0) return;
    const adv = Math.round(value * 0.3 * 100) / 100;
    addInstallments([
      { amount: adv, label: "Advance 30%", due_date: today },
      {
        amount: Math.round((value - adv) * 100) / 100,
        label: "Final 70%",
        due_date: addDays(today, 30),
      },
    ]);
  };

  const splitMonthly = async () => {
    const n = Math.min(24, Math.max(2, parseInt(months, 10) || 0));
    if (value <= 0 || !n) return;
    const each = Math.round((value / n) * 100) / 100;
    let acc = 0;
    const items = Array.from({ length: n }, (_, i) => {
      const amt =
        i === n - 1 ? Math.round((value - acc) * 100) / 100 : each;
      acc += amt;
      return { amount: amt, label: `Month ${i + 1}`, due_date: addMonths(today, i) };
    });
    if (await addInstallments(items)) setShowMonthly(false);
  };

  const submitAdd = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      setError("Enter an amount");
      return;
    }
    const ok = await addInstallments([
      { amount: amt, due_date: due || undefined, label: label.trim() || undefined },
    ]);
    if (ok) {
      setAmount("");
      setDue("");
      setLabel("");
      setAdding(false);
    }
  };

  return (
    <div className={CARD}>
      <h2 className="mb-3 text-sm font-medium text-[var(--ink-900)]">Billing</h2>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Value", fmt(value), "text-[var(--ink-900)]"],
          ["Paid", fmt(paid), "text-emerald-600"],
          ["Owed", fmt(owed), owed > 0 ? "text-amber-600" : "text-[var(--ink-500)]"],
        ].map(([k, v, cls]) => (
          <div key={k}>
            <div className="text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
              {k}
            </div>
            <div className={`text-sm font-semibold ${cls}`}>{v}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-sm)] bg-red-50 p-2 text-xs text-red-600">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Installments */}
      {loading ? (
        <p className="mt-4 text-xs text-[var(--ink-500)]">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="mt-4 text-xs text-[var(--ink-500)]">
          No installments yet. Use the 30 / 70 split or add one below.
        </p>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {payments.map((p) => {
            const isPaid = !!p.paid_at;
            const overdue = !isPaid && !!p.due_date && p.due_date < today;
            return (
              <li
                key={p.id}
                className="flex items-center gap-2.5 rounded-[var(--radius-sm)] border border-[var(--allone-line-soft)] px-2.5 py-2"
              >
                <button
                  onClick={() => setPaid(p.id, !isPaid)}
                  disabled={busy}
                  title={isPaid ? "Mark as owed" : "Mark as paid"}
                  className="shrink-0 disabled:opacity-50"
                >
                  {isPaid ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-[var(--ink-400)]" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-[var(--ink-900)]">
                      {p.label || "Installment"}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-[var(--ink-900)]">
                      {fmt(Number(p.amount))}
                    </span>
                  </div>
                  {p.due_date && (
                    <div
                      className={`text-[11px] ${overdue ? "font-medium text-red-500" : "text-[var(--ink-500)]"}`}
                    >
                      {isPaid ? "Paid" : overdue ? "Overdue" : "Due"} ·{" "}
                      {fmtDate(p.due_date)}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(p.id)}
                  disabled={busy}
                  title="Delete installment"
                  className="shrink-0 text-[var(--ink-400)] hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        {!loading && payments.length === 0 && value > 0 && (
          <button onClick={split3070} disabled={busy} className={BTN}>
            30 / 70 split
          </button>
        )}
        {value > 0 && (
          <button
            onClick={() => {
              setShowMonthly((v) => !v);
              setAdding(false);
            }}
            disabled={busy}
            className={BTN}
          >
            Monthly…
          </button>
        )}
        <button
          onClick={() => {
            setAdding((v) => !v);
            setShowMonthly(false);
          }}
          disabled={busy}
          className={BTN}
        >
          <Plus className="h-3.5 w-3.5" /> Add installment
        </button>
      </div>

      {showMonthly && (
        <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] p-2.5">
          <span className="text-xs text-[var(--ink-700)]">Split value into</span>
          <input
            type="number"
            min={2}
            max={24}
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className={`${FIELD} w-16`}
          />
          <span className="text-xs text-[var(--ink-700)]">monthly payments</span>
          <button
            onClick={splitMonthly}
            disabled={busy}
            className="ml-auto rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--ink-800)] disabled:opacity-50"
          >
            Create
          </button>
        </div>
      )}

      {adding && (
        <div className="mt-3 space-y-2 rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] p-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount ₾"
              className={FIELD}
            />
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className={FIELD}
            />
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional) — e.g. Advance"
            className={FIELD}
          />
          <div className="flex justify-end">
            <button
              onClick={submitAdd}
              disabled={busy}
              className="rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--ink-800)] disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

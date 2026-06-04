"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, GitMerge, RefreshCw, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { LEAD_STATUS_LABELS } from "@/lib/validations/leads";

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
interface Group {
  key: string;
  by: "phone" | "email";
  leads: DupLead[];
}

const sigOf = (g: Group) => `${g.by}:${g.key}`;

export function DuplicatesView() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [keep, setKeep] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/leads/find-duplicates");
      if (!res.ok) throw new Error();
      const json = await res.json();
      const gs: Group[] = json.data?.groups || [];
      setGroups(gs);
      setTotal(json.data?.total ?? gs.length);
      const k: Record<string, string> = {};
      for (const g of gs) k[sigOf(g)] = g.leads[0].id;
      setKeep(k);
    } catch {
      setError("Failed to scan for duplicates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const mergeGroup = async (g: Group) => {
    const sig = sigOf(g);
    const targetId = keep[sig];
    const sources = g.leads.filter((l) => l.id !== targetId);
    if (
      !confirm(
        `Merge ${sources.length} duplicate${sources.length === 1 ? "" : "s"} into the kept lead? Their calls, tasks, meetings and history move to the kept lead; the duplicates are removed (recoverable from the merge audit).`,
      )
    )
      return;
    setBusy(sig);
    setError("");
    try {
      for (const src of sources) {
        const res = await fetch("/api/admin/leads/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId, sourceId: src.id }),
        });
        if (!res.ok) throw new Error();
      }
      setGroups((prev) => prev.filter((x) => sigOf(x) !== sig));
    } catch {
      setError("Merge failed — some duplicates may remain. Rescan to retry.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--allone-line)] border-t-[var(--ink-900)]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--ink-500)]">
          {total} duplicate group{total === 1 ? "" : "s"}
          {total > groups.length ? ` (showing top ${groups.length})` : ""}.
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)]"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Rescan
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {groups.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--allone-line)] bg-[var(--bg-surface)] p-10 text-center text-sm text-[var(--ink-500)]">
          No duplicates found.
        </div>
      ) : (
        groups.map((g) => {
          const sig = sigOf(g);
          return (
            <div
              key={sig}
              className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]"
            >
              <div className="flex items-center justify-between border-b border-[var(--allone-line-soft)] px-4 py-2.5">
                <span className="text-xs text-[var(--ink-500)]">
                  Shared {g.by} ·{" "}
                  <span className="font-medium text-[var(--ink-800)]">{g.key}</span>{" "}
                  · {g.leads.length} leads
                </span>
                <button
                  onClick={() => mergeGroup(g)}
                  disabled={busy === sig}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--ink-800)] disabled:opacity-50"
                >
                  <GitMerge className="h-3.5 w-3.5" />
                  {busy === sig ? "Merging…" : "Merge into kept"}
                </button>
              </div>
              <div>
                {g.leads.map((l, i) => (
                  <label
                    key={l.id}
                    className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 hover:bg-[var(--bg-surface-alt)] ${i > 0 ? "border-t border-[var(--allone-line-soft)]" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`keep-${sig}`}
                      checked={keep[sig] === l.id}
                      onChange={() => setKeep((p) => ({ ...p, [sig]: l.id }))}
                      className="h-4 w-4 accent-[var(--ao-accent)]"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/leads/${l.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-[var(--ink-900)] hover:underline"
                      >
                        {l.company || l.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-x-3 text-[11.5px] text-[var(--ink-500)]">
                        {l.phone && <span>{l.phone}</span>}
                        {l.email && <span>{l.email}</span>}
                        <span>{LEAD_STATUS_LABELS[l.status] || l.status}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-[var(--ink-700)]">
                      {formatCurrency(l.value)}
                    </span>
                    <span className="shrink-0 text-[11px] text-[var(--ink-400)]">
                      {new Date(l.created_at).toLocaleDateString()}
                    </span>
                    {keep[sig] === l.id && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        keep
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

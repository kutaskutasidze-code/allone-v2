"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Power,
  ExternalLink,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

interface Reference {
  id: string;
  segment: string;
  source_url: string;
  source_label: string | null;
  pre_cloned_path: string;
  aesthetic_tier: number;
  xfly_check_score: number | null;
  ref_map_path: string | null;
  last_refreshed_at: string | null;
  is_active: boolean;
  created_at: string;
}

const SEGMENTS = [
  "tourism",
  "ecom",
  "law-firm",
  "dental",
  "agency",
  "other",
] as const;

export function ReferencesManagerContent({
  initial,
  errorMessage,
}: {
  initial: Reference[];
  errorMessage: string | null;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [showAdd, setShowAdd] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const refreshOne = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/admin/references/${id}/refresh`, { method: "POST" });
    } finally {
      setBusyId(null);
      refresh();
    }
  };

  const toggleActive = async (ref: Reference) => {
    setBusyId(ref.id);
    try {
      if (ref.is_active) {
        await fetch(`/api/admin/references/${ref.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/admin/references/${ref.id}/reactivate`, {
          method: "POST",
        });
      }
    } finally {
      setBusyId(null);
      refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/sales/demos"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Demos
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink-900)]">
            Reference library
          </h1>
          <p className="text-sm text-[var(--ink-500)]">
            Pre-cloned best-in-segment sites the pipeline skins for new leads.
            Adding a reference clones it via site-xray — this takes a few
            minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--ao-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--ao-accent-hover)]"
        >
          <Plus className="h-4 w-4" /> Add reference
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--allone-line)] bg-[var(--bg-surface)] p-12 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-[var(--gray-300)]" />
          <p className="mt-3 text-sm text-[var(--ink-500)]">
            No reference templates yet. Add one to seed the library.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--allone-line)] bg-[var(--bg-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--allone-line)] text-left text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
                <th className="px-5 py-3 font-medium">Segment</th>
                <th className="px-5 py-3 font-medium">Source</th>
                <th className="px-5 py-3 font-medium">Tier</th>
                <th className="px-5 py-3 font-medium">Quality</th>
                <th className="px-5 py-3 font-medium">Refreshed</th>
                <th className="px-5 py-3 font-medium">State</th>
                <th className="px-5 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--bg-sunken)] last:border-b-0"
                >
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-[var(--bg-sunken)] px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-700)]">
                      {r.segment}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="font-medium text-[var(--ink-900)]">
                      {r.source_label || hostnameOf(r.source_url)}
                    </div>
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--ink-500)] hover:underline inline-flex items-center gap-1"
                    >
                      {hostnameOf(r.source_url)}{" "}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {r.aesthetic_tier}/5
                  </td>
                  <td className="px-5 py-3 font-mono text-xs">
                    {r.xfly_check_score != null
                      ? `${r.xfly_check_score}/100`
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-[var(--ink-500)]">
                    {r.last_refreshed_at
                      ? new Date(r.last_refreshed_at).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {r.is_active ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        active
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-[var(--bg-sunken)] px-2 py-0.5 text-[11px] font-medium text-[var(--gray-600)]">
                        archived
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => refreshOne(r.id)}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-[var(--allone-line)] px-2 py-1 text-xs text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50"
                      >
                        {busyId === r.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Refresh
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(r)}
                        disabled={busyId === r.id}
                        className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-[var(--allone-line)] px-2 py-1 text-xs text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50"
                      >
                        <Power className="h-3 w-3" />
                        {r.is_active ? "Archive" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <AddReferenceModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function AddReferenceModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [segment, setSegment] = useState<(typeof SEGMENTS)[number]>("tourism");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [tier, setTier] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const slug = new URL(sourceUrl).hostname
        .replace(/^www\./, "")
        .replace(/\./g, "-");
      const res = await fetch("/api/admin/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment,
          source_url: sourceUrl,
          source_label: sourceLabel || null,
          pre_cloned_path: `~/Vault/refs/${segment}/${slug}`,
          aesthetic_tier: tier,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || "Failed to add reference");
        return;
      }
      // Trigger refresh-clone async so xray runs.
      const refId = json.data?.id;
      if (refId) {
        fetch(`/api/admin/references/${refId}/refresh`, {
          method: "POST",
        }).catch(() => {});
      }
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-[var(--radius-lg)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-[var(--ink-900)]">
            Add reference
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--gray-400)] hover:text-[var(--ink-900)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <label className="block">
          <span className="text-xs font-medium text-[var(--ink-700)]">
            Segment
          </span>
          <select
            value={segment}
            onChange={(e) =>
              setSegment(e.target.value as (typeof SEGMENTS)[number])
            }
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-[var(--ao-accent)] focus:outline-none"
          >
            {SEGMENTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[var(--ink-700)]">
            Source URL
          </span>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://www.example.com"
            required
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-2 text-sm focus:border-[var(--ao-accent)] focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[var(--ink-700)]">
            Label (optional)
          </span>
          <input
            type="text"
            value={sourceLabel}
            onChange={(e) => setSourceLabel(e.target.value)}
            placeholder="Awwwards SOTD 2025-04"
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-2 text-sm focus:border-[var(--ao-accent)] focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-[var(--ink-700)]">
            Aesthetic tier (1 = generic, 5 = Awwwards-grade)
          </span>
          <input
            type="number"
            min={1}
            max={5}
            value={tier}
            onChange={(e) => setTier(parseInt(e.target.value) || 4)}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-2 text-sm focus:border-[var(--ao-accent)] focus:outline-none"
          />
        </label>

        {error && (
          <p className="rounded-[var(--radius-xs)] border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-1.5 text-sm font-medium text-[var(--ink-700)] hover:bg-[var(--bg-surface-alt)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !sourceUrl}
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--ao-accent)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--ao-accent-hover)] disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add and clone
          </button>
        </div>
        <p className="text-[11px] text-[var(--ink-500)]">
          The clone runs in the background via site-xray. The reference will
          show up active once the first clone completes (5–10 min).
        </p>
      </form>
    </div>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

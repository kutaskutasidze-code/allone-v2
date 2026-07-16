"use client";

import { useState } from "react";
import { Bot, Copy, Check, Plus, Loader2, ExternalLink } from "lucide-react";
import type { BotConfig, BotQuestion } from "@/lib/bots/types";

interface DraftResponse {
  questions: BotQuestion[];
}

interface CreateResponse {
  bot: BotConfig;
}

export function BotsContent({ bots }: { bots: BotConfig[] }) {
  const [draft, setDraft] = useState<BotQuestion[] | null>(null);
  const [clientName, setClientName] = useState("");
  const [brief, setBrief] = useState("");
  const [knowledge, setKnowledge] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function handleDraft() {
    if (!brief.trim()) return;
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/sales/bots/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const json = (await res.json()) as DraftResponse;
      setDraft(json.questions ?? []);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setDrafting(false);
    }
  }

  async function handleCreate() {
    if (!clientName.trim() || !draft?.length) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/sales/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: clientName,
          questions: draft,
          knowledge: knowledge.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _json = (await res.json()) as CreateResponse;
      location.reload();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Create failed");
      setSaving(false);
    }
  }

  function copyLink(url: string) {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
            Questionnaire Bots
          </h1>
          <p className="mt-1 text-[13px] text-[var(--ink-500)]">
            Generate and share client intake questionnaires.
          </p>
        </div>
        <span className="text-sm text-[var(--ink-500)]">
          {bots.length} bot{bots.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Bot list */}
      {bots.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--allone-line)] bg-[var(--bg-surface)] p-12 text-center">
          <Bot className="mx-auto h-8 w-8 text-[var(--ink-300)]" />
          <p className="mt-3 text-sm text-[var(--ink-500)]">
            No bots yet. Create your first one below.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--allone-line)] bg-[var(--bg-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--allone-line)] text-left text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Questions</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {bots.map((b) => {
                const url = `${origin}/b/${b.slug}`;
                return (
                  <tr
                    key={b.id}
                    className="border-b border-[var(--bg-sunken)] last:border-b-0"
                  >
                    <td className="px-5 py-3 font-medium text-[var(--ink-900)]">
                      {b.client_name}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[var(--ink-500)]">
                      {b.slug}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--ink-500)]">
                      {b.questions.length}
                    </td>
                    <td className="px-5 py-3 text-xs text-[var(--ink-500)]">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ao-accent)] hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </a>
                        <button
                          type="button"
                          onClick={() => copyLink(url)}
                          className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] border border-[var(--allone-line)] px-2 py-0.5 text-xs text-[var(--ink-600)] hover:bg-[var(--bg-sunken)] transition-colors"
                          title="Copy link"
                        >
                          {copied === url ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          {copied === url ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New bot form */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-xs)]">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[var(--ink-500)]" />
          <h2 className="text-sm font-semibold text-[var(--ink-900)]">
            New bot
          </h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
              Client name
            </label>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="e.g. Woodco Georgia"
              className="w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface-alt)] px-3 py-2 text-sm focus:border-[var(--ao-accent)] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
              Brief
            </label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="One line: what is this client / what do we want to learn?"
              rows={2}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface-alt)] px-3 py-2 text-sm focus:border-[var(--ao-accent)] focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
              Knowledge{" "}
              <span className="normal-case tracking-normal text-[var(--ink-400)]">
                — optional
              </span>
            </label>
            <textarea
              value={knowledge}
              onChange={(e) => setKnowledge(e.target.value)}
              placeholder="Paste facts/FAQ to turn this into a bilingual website/FAQ bot that answers visitors and captures their contact. Leave empty for the standard Georgian intake bot."
              rows={3}
              className="w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface-alt)] px-3 py-2 text-sm focus:border-[var(--ao-accent)] focus:outline-none resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => void handleDraft()}
            disabled={drafting || !brief.trim()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface-alt)] px-4 py-2 text-sm font-medium text-[var(--ink-700)] hover:bg-[var(--bg-sunken)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {drafting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            {drafting ? "Drafting…" : "Draft questions"}
          </button>

          {draftError && (
            <p className="rounded-[var(--radius-sm)] border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
              {draftError}
            </p>
          )}

          {draft !== null && (
            <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-sunken)] p-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
                Drafted questions ({draft.length})
              </p>
              <ol className="space-y-2 pl-1">
                {draft.map((q, i) => (
                  <li key={q.id} className="flex gap-3 text-sm">
                    <span className="mt-0.5 shrink-0 font-mono text-xs text-[var(--ink-400)]">
                      {i + 1}.
                    </span>
                    <div>
                      <p className="text-[var(--ink-900)]">{q.text}</p>
                      {q.hint && (
                        <p className="mt-0.5 text-xs text-[var(--ink-500)]">
                          {q.hint}
                        </p>
                      )}
                      {q.options && q.options.length > 0 && (
                        <p className="mt-0.5 text-xs text-[var(--ink-400)]">
                          Options: {q.options.join(", ")}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={() => void handleCreate()}
                disabled={saving || !clientName.trim()}
                className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {saving ? "Creating…" : "Create bot"}
              </button>

              {saveError && (
                <p className="rounded-[var(--radius-sm)] border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {saveError}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

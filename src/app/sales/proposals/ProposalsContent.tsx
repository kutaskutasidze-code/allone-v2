"use client";

import { useState } from "react";
import {
  ClipboardList,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Save,
  FileText,
} from "lucide-react";
import type {
  Proposal,
  OfferDraft,
  OfferScopeLine,
  Recipient,
} from "@/lib/offers/types";
import type { QuestionnaireResponse } from "@/lib/bots/types";

interface Props {
  proposals: Proposal[];
  openResponses: QuestionnaireResponse[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft:
      "bg-yellow-50 text-yellow-700 border border-yellow-200 font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider",
    approved:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider",
    sent: "bg-sky-50 text-sky-700 border border-sky-200 font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider",
  };
  return map[status] ?? map["draft"];
}

// ---------------------------------------------------------------------------
// Open-response card
// ---------------------------------------------------------------------------

function ResponseCard({ response }: { response: QuestionnaireResponse }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDraft() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sales/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response_id: response.id }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      // Reload to show the new proposal in the list
      location.reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "ვერ მოხერხდა — სცადეთ მოგვიანებით",
      );
    } finally {
      setLoading(false);
    }
  }

  const displayName =
    response.client_name ?? response.respondent_name ?? "Unknown";
  const date = response.completed_at
    ? new Date(response.completed_at).toLocaleDateString()
    : "—";

  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--ink-900)]">
          {displayName}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-[var(--ink-400)]">
          {response.bot_slug} · {date}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => void handleDraft()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ClipboardList className="h-3 w-3" />
          )}
          {loading ? "დრაფტი…" : "Draft offer"}
        </button>
        {error && (
          <p className="max-w-xs rounded-[var(--radius-xs)] border border-red-100 bg-red-50 px-2 py-1 text-[11px] text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proposal card (editable)
// ---------------------------------------------------------------------------

function ProposalCard({ proposal: initial }: { proposal: Proposal }) {
  const [proposal, setProposal] = useState<Proposal>(initial);
  const [price, setPrice] = useState<string>(
    initial.price !== null ? String(initial.price) : "",
  );
  const [scopeLines, setScopeLines] = useState<OfferScopeLine[]>(
    initial.offer?.scope_lines ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Document generation state (approved proposals)
  const [recipient, setRecipient] = useState<Recipient>(
    initial.recipient ?? { name: initial.client_name },
  );
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const isDraft = proposal.status === "draft";
  const isApproved = proposal.status === "approved";

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const updatedOffer: OfferDraft = {
        ...proposal.offer,
        scope_lines: scopeLines,
      };
      const res = await fetch(`/api/sales/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: price !== "" ? parseFloat(price) : undefined,
          offer: updatedOffer,
        }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { proposal: Proposal };
      setProposal(json.proposal);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "ვერ მოხერხდა — სცადეთ მოგვიანებით",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    setApproveError(null);
    try {
      const res = await fetch(`/api/sales/proposals/${proposal.id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { proposal: Proposal };
      setProposal(json.proposal);
    } catch (err) {
      setApproveError(
        err instanceof Error
          ? err.message
          : "ვერ მოხერხდა — სცადეთ მოგვიანებით",
      );
    } finally {
      setApproving(false);
    }
  }

  async function handleGenerateDocs() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(`/api/sales/proposals/${proposal.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(
          json.error ?? `სერვისი მიუწვდომელია (HTTP ${res.status})`,
        );
      }
      const json = (await res.json()) as { proposal: Proposal };
      setProposal(json.proposal);
    } catch (err) {
      setGenerateError(
        err instanceof Error
          ? err.message
          : "ვერ მოხერხდა — სცადეთ მოგვიანებით",
      );
    } finally {
      setGenerating(false);
    }
  }

  function updateScopePrice(index: number, val: string) {
    setScopeLines((prev) =>
      prev.map((line, i) =>
        i === index ? { ...line, price: parseFloat(val) || 0 } : line,
      ),
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-xs)]">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--ink-900)]">
            {proposal.client_name}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-[var(--ink-400)]">
            {proposal.doc_number ?? "—"}
          </p>
        </div>
        <span className={statusBadge(proposal.status)}>{proposal.status}</span>
      </div>

      {/* Summary */}
      {proposal.offer?.summary && (
        <p className="mb-4 text-xs leading-relaxed text-[var(--ink-600)]">
          {proposal.offer.summary}
        </p>
      )}

      {/* Scope lines */}
      {scopeLines.length > 0 && (
        <div className="mb-4 overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--allone-line)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--allone-line)] text-left text-[10px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
                <th className="px-3 py-2 font-medium">სერვისი</th>
                <th className="px-3 py-2 font-medium">ფასი (₾)</th>
              </tr>
            </thead>
            <tbody>
              {scopeLines.map((line, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--bg-sunken)] last:border-b-0"
                >
                  <td className="px-3 py-2 text-[var(--ink-900)]">
                    {line.label}
                  </td>
                  <td className="px-3 py-2">
                    {isDraft ? (
                      <input
                        type="number"
                        min={0}
                        value={String(line.price)}
                        onChange={(e) => updateScopePrice(i, e.target.value)}
                        className="w-24 rounded-[var(--radius-xs)] border border-[var(--allone-line)] bg-[var(--bg-surface-alt)] px-2 py-1 text-xs focus:border-[var(--ao-accent)] focus:outline-none"
                      />
                    ) : (
                      <span className="text-[var(--ink-700)]">
                        {line.price} ₾
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Headline price */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
          სულ ფასი
        </label>
        {isDraft ? (
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-32 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface-alt)] px-3 py-1.5 text-sm focus:border-[var(--ao-accent)] focus:outline-none"
          />
        ) : (
          <span className="text-sm font-semibold text-[var(--ink-900)]">
            {proposal.price} ₾
          </span>
        )}
        <span className="text-[11px] text-[var(--ink-400)]">
          {proposal.currency}
        </span>
      </div>

      {/* PDF link (offer — approved) */}
      {proposal.offer_pdf_url && (
        <a
          href={proposal.offer_pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] px-3 py-1.5 text-xs font-medium text-[var(--ao-accent)] hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          PDF გახსნა
        </a>
      )}

      {/* Document generation panel (approved proposals) */}
      {isApproved && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-sunken)] p-4 space-y-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
            მიმღების დეტალები (ხელშეკრულება / ინვოისი)
          </p>

          {/* Recipient fields */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">
                სახელი *
              </label>
              <input
                type="text"
                value={recipient.name}
                onChange={(e) =>
                  setRecipient((r) => ({ ...r, name: e.target.value }))
                }
                placeholder={proposal.client_name}
                className="rounded-[var(--radius-xs)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ao-accent)] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">
                ს/ნ (ID კოდი)
              </label>
              <input
                type="text"
                value={recipient.id_code ?? ""}
                onChange={(e) =>
                  setRecipient((r) => ({ ...r, id_code: e.target.value }))
                }
                placeholder="405826361"
                className="rounded-[var(--radius-xs)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ao-accent)] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">
                მისამართი
              </label>
              <input
                type="text"
                value={recipient.address ?? ""}
                onChange={(e) =>
                  setRecipient((r) => ({ ...r, address: e.target.value }))
                }
                placeholder="თბილისი, ..."
                className="rounded-[var(--radius-xs)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ao-accent)] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">
                წარმომადგენელი
              </label>
              <input
                type="text"
                value={recipient.representative ?? ""}
                onChange={(e) =>
                  setRecipient((r) => ({
                    ...r,
                    representative: e.target.value,
                  }))
                }
                placeholder="სახელი გვარი"
                className="rounded-[var(--radius-xs)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-2 py-1.5 text-xs text-[var(--ink-900)] placeholder:text-[var(--ink-300)] focus:border-[var(--ao-accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* Generated document links */}
          {(proposal.contract_pdf_url || proposal.invoice_pdf_url) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {proposal.contract_pdf_url && (
                <a
                  href={proposal.contract_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  ხელშეკრულება
                </a>
              )}
              {proposal.invoice_pdf_url && (
                <a
                  href={proposal.invoice_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:underline"
                >
                  <FileText className="h-3 w-3" />
                  ინვოისი
                </a>
              )}
            </div>
          )}

          {/* Generate button + error */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => void handleGenerateDocs()}
              disabled={generating || !recipient.name.trim()}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              {generating
                ? "გენერაცია…"
                : proposal.contract_pdf_url
                  ? "განახლება"
                  : "ხელშეკრ. + ინვოისი"}
            </button>
            {generateError && (
              <p className="w-full rounded-[var(--radius-xs)] border border-red-100 bg-red-50 px-2 py-1 text-[11px] text-red-700">
                {generateError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions (draft only) */}
      {isDraft && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface-alt)] px-3 py-1.5 text-xs font-medium text-[var(--ink-700)] hover:bg-[var(--bg-sunken)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Save className="h-3 w-3" />
            )}
            {saving ? "შენახვა…" : "Save"}
          </button>

          <button
            type="button"
            onClick={() => void handleApprove()}
            disabled={approving}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {approving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {approving ? "გენერაცია…" : "Approve & generate PDF"}
          </button>

          {saveError && (
            <p className="w-full rounded-[var(--radius-xs)] border border-red-100 bg-red-50 px-2 py-1 text-[11px] text-red-700">
              {saveError}
            </p>
          )}
          {approveError && (
            <p className="w-full rounded-[var(--radius-xs)] border border-red-100 bg-red-50 px-2 py-1 text-[11px] text-red-700">
              {approveError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page-level component
// ---------------------------------------------------------------------------

export function ProposalsContent({ proposals, openResponses }: Props) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-10">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
            Proposals
          </h1>
          <p className="mt-1 text-[13px] text-[var(--ink-500)]">
            AI-drafted commercial offers — review, edit, then approve & render
            PDF.
          </p>
        </div>
        <span className="text-sm text-[var(--ink-500)]">
          {proposals.length} proposal{proposals.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* New answers inbox */}
      {openResponses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
            New answers ({openResponses.length})
          </h2>
          <div className="space-y-2">
            {openResponses.map((r) => (
              <ResponseCard key={r.id} response={r} />
            ))}
          </div>
        </section>
      )}

      {/* Proposals list */}
      <section className="space-y-3">
        <h2 className="text-[11px] font-mono uppercase tracking-wider text-[var(--ink-500)]">
          Proposals
        </h2>
        {proposals.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--allone-line)] bg-[var(--bg-surface)] p-12 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-[var(--ink-300)]" />
            <p className="mt-3 text-sm text-[var(--ink-500)]">
              No proposals yet. Draft one from a questionnaire response above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {proposals.map((p) => (
              <ProposalCard key={p.id} proposal={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

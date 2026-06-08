"use client";

// Inline action bar shown on /sales/leads/[id]. Wraps the existing
// chat-tool handlers (issue_offer / issue_contract / issue_invoice /
// send_draft) so reps can fire them from a button instead of having to
// know the chat magic. Each button opens a small inline form, posts to
// /api/sales/actions, and surfaces the resulting signed PDF URL.

import { useState } from "react";
import {
  FileSignature,
  Receipt,
  Send,
  Sparkles,
  ExternalLink,
  X,
  Plus,
  Trash2,
} from "lucide-react";

type ActionKind = "offer" | "contract" | "invoice" | "draft";

// Statuses from which issuing an offer/contract should auto-advance the lead to
// "proposal". Won/lost/proposal/on_hold are intentionally left untouched.
const AUTO_PROPOSAL_FROM = new Set(["new", "in_process", "interested"]);

interface Props {
  leadId: string;
  leadName: string;
  leadStatus?: string;
  onStatusChange?: (status: string) => void;
}

interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface ActionResult {
  url?: string;
  offer_number?: string;
  contract_number?: string;
  invoice_number?: string;
  valid_until?: string;
  due_date?: string;
}

export function LeadActionsBar({
  leadId,
  leadName,
  leadStatus,
  onStatusChange,
}: Props) {
  const [open, setOpen] = useState<ActionKind | null>(null);
  const [lastResult, setLastResult] = useState<{
    kind: ActionKind;
    data: ActionResult;
  } | null>(null);

  // After an offer/contract goes out, nudge the lead into "proposal" — but only
  // from an earlier pipeline stage, never from won/lost/proposal/on_hold.
  const advanceToProposal = async () => {
    if (!leadStatus || !AUTO_PROPOSAL_FROM.has(leadStatus)) return;
    try {
      const res = await fetch(`/api/sales/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "proposal" }),
      });
      if (res.ok) onStatusChange?.("proposal");
    } catch {
      /* non-blocking — the PDF was still issued */
    }
  };

  return (
    <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-xs)]">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
            Actions
          </div>
          <div className="text-[12px] text-[var(--ink-400)]">
            Send a proposal, contract, or invoice to {leadName || "this lead"}.
          </div>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <ActionButton
          icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
          label="Issue offer"
          hint="Priced proposal"
          onClick={() => setOpen(open === "offer" ? null : "offer")}
          active={open === "offer"}
        />
        <ActionButton
          icon={<FileSignature className="h-4 w-4" strokeWidth={1.75} />}
          label="Issue contract"
          hint="Service agreement"
          onClick={() => setOpen(open === "contract" ? null : "contract")}
          active={open === "contract"}
        />
        <ActionButton
          icon={<Receipt className="h-4 w-4" strokeWidth={1.75} />}
          label="Issue invoice"
          hint="Billable PDF"
          onClick={() => setOpen(open === "invoice" ? null : "invoice")}
          active={open === "invoice"}
        />
        <ActionButton
          icon={<Send className="h-4 w-4" strokeWidth={1.75} />}
          label="Send draft email"
          hint="From latest demo"
          onClick={() => setOpen(open === "draft" ? null : "draft")}
          active={open === "draft"}
        />
      </div>

      {open === "offer" && (
        <OfferForm
          leadId={leadId}
          onCancel={() => setOpen(null)}
          onDone={(d) => {
            setOpen(null);
            setLastResult({ kind: "offer", data: d });
            advanceToProposal();
          }}
        />
      )}
      {open === "contract" && (
        <ContractForm
          leadId={leadId}
          onCancel={() => setOpen(null)}
          onDone={(d) => {
            setOpen(null);
            setLastResult({ kind: "contract", data: d });
            advanceToProposal();
          }}
        />
      )}
      {open === "invoice" && (
        <InvoiceForm
          leadId={leadId}
          onCancel={() => setOpen(null)}
          onDone={(d) => {
            setOpen(null);
            setLastResult({ kind: "invoice", data: d });
          }}
        />
      )}
      {open === "draft" && (
        <DraftForm
          leadId={leadId}
          onCancel={() => setOpen(null)}
          onDone={(d) => {
            setOpen(null);
            setLastResult({ kind: "draft", data: d });
          }}
        />
      )}

      {lastResult && (
        <ResultBanner
          result={lastResult}
          onDismiss={() => setLastResult(null)}
        />
      )}
    </div>
  );
}

function ActionButton({
  icon,
  label,
  hint,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-3 rounded-[var(--radius-sm)] border p-3 text-left transition ${
        active
          ? "border-[var(--ink-900)] bg-[var(--bg-surface-alt)]"
          : "border-[var(--allone-line)] bg-[var(--bg-surface-alt)] hover:border-[var(--allone-line-strong)]"
      }`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--bg-surface)] text-[var(--ink-700)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-[var(--ink-900)]">
          {label}
        </div>
        <div className="truncate text-[11px] text-[var(--ink-400)]">{hint}</div>
      </div>
    </button>
  );
}

// ── Forms ──────────────────────────────────────────────────────────────

const CURRENCIES = ["GEL", "USD", "EUR"] as const;

function OfferForm({
  leadId,
  onCancel,
  onDone,
}: {
  leadId: string;
  onCancel: () => void;
  onDone: (data: ActionResult) => void;
}) {
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("GEL");
  const [intro, setIntro] = useState("");
  const [paymentTerms, setPaymentTerms] = useState(
    "50% on signature, 50% on delivery",
  );
  const [validDays, setValidDays] = useState(14);
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await callAction("issue_offer", {
      lead_id: leadId,
      currency,
      intro: intro.trim() || undefined,
      payment_terms: paymentTerms.trim() || undefined,
      valid_days: validDays,
      line_items: items.filter(
        (i) => i.description.trim() && i.quantity > 0 && i.unit_price >= 0,
      ),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone(res.data ?? {});
  };

  return (
    <FormShell
      title="Commercial offer"
      onCancel={onCancel}
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Generate PDF"
      error={error}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <CurrencyPicker value={currency} onChange={setCurrency} />
        <Field label="Valid for (days)">
          <input
            type="number"
            min={1}
            max={90}
            value={validDays}
            onChange={(e) => setValidDays(parseInt(e.target.value) || 14)}
            className={INPUT_CLS}
          />
        </Field>
      </div>
      <Field label="Intro (optional)">
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          placeholder="1–2 sentences on why we're a fit"
          rows={2}
          className={INPUT_CLS}
        />
      </Field>
      <Field label="Payment terms">
        <input
          value={paymentTerms}
          onChange={(e) => setPaymentTerms(e.target.value)}
          className={INPUT_CLS}
        />
      </Field>
      <LineItemEditor items={items} onChange={setItems} currency={currency} />
    </FormShell>
  );
}

function ContractForm({
  leadId,
  onCancel,
  onDone,
}: {
  leadId: string;
  onCancel: () => void;
  onDone: (data: ActionResult) => void;
}) {
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("GEL");
  const [total, setTotal] = useState(0);
  const [scope, setScope] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([""]);
  const [paymentTerms, setPaymentTerms] = useState(
    "50% upfront, 50% on delivery",
  );
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await callAction("issue_contract", {
      lead_id: leadId,
      total_amount: total,
      currency,
      scope: scope.trim(),
      payment_terms: paymentTerms.trim(),
      start_date: startDate,
      delivery_date: deliveryDate,
      deliverables: deliverables.map((d) => d.trim()).filter(Boolean),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone(res.data ?? {});
  };

  return (
    <FormShell
      title="Service agreement"
      onCancel={onCancel}
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Generate PDF"
      error={error}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <CurrencyPicker value={currency} onChange={setCurrency} />
        <Field label="Total amount">
          <input
            type="number"
            min={0}
            value={total}
            onChange={(e) => setTotal(parseFloat(e.target.value) || 0)}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Payment terms">
          <input
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Delivery date">
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className={INPUT_CLS}
          />
        </Field>
      </div>
      <Field label="Scope (1–2 sentences)">
        <textarea
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          rows={2}
          className={INPUT_CLS}
        />
      </Field>
      <Field label="Deliverables">
        <div className="space-y-1.5">
          {deliverables.map((d, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={d}
                onChange={(e) =>
                  setDeliverables((prev) => {
                    const next = [...prev];
                    next[i] = e.target.value;
                    return next;
                  })
                }
                placeholder="What's being delivered"
                className={INPUT_CLS}
              />
              <button
                type="button"
                onClick={() =>
                  setDeliverables((prev) => prev.filter((_, j) => j !== i))
                }
                className="px-2 text-[var(--ink-400)] hover:text-red-600"
                disabled={deliverables.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setDeliverables((prev) => [...prev, ""])}
            className="inline-flex items-center gap-1 text-[12px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
          >
            <Plus className="h-3 w-3" /> Add deliverable
          </button>
        </div>
      </Field>
    </FormShell>
  );
}

function InvoiceForm({
  leadId,
  onCancel,
  onDone,
}: {
  leadId: string;
  onCancel: () => void;
  onDone: (data: ActionResult) => void;
}) {
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>("GEL");
  const [dueInDays, setDueInDays] = useState(14);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await callAction("issue_invoice", {
      lead_id: leadId,
      currency,
      due_in_days: dueInDays,
      notes: notes.trim() || undefined,
      line_items: items.filter(
        (i) => i.description.trim() && i.quantity > 0 && i.unit_price >= 0,
      ),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone(res.data ?? {});
  };

  return (
    <FormShell
      title="Invoice"
      onCancel={onCancel}
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Generate PDF"
      error={error}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <CurrencyPicker value={currency} onChange={setCurrency} />
        <Field label="Due in (days)">
          <input
            type="number"
            min={1}
            max={90}
            value={dueInDays}
            onChange={(e) => setDueInDays(parseInt(e.target.value) || 14)}
            className={INPUT_CLS}
          />
        </Field>
      </div>
      <LineItemEditor items={items} onChange={setItems} currency={currency} />
      <Field label="Notes (optional)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={INPUT_CLS}
        />
      </Field>
    </FormShell>
  );
}

function DraftForm({
  leadId,
  onCancel,
  onDone,
}: {
  leadId: string;
  onCancel: () => void;
  onDone: (data: ActionResult) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await callAction("send_draft", { lead_id: leadId });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onDone(res.data ?? {});
  };

  return (
    <FormShell
      title="Send demo draft"
      onCancel={onCancel}
      onSubmit={submit}
      submitting={submitting}
      submitLabel="Send email"
      error={error}
    >
      <p className="text-[13px] text-[var(--ink-500)]">
        Sends the email drafted alongside the most recent demo for this lead.
        The lead must have a demo in <code>draft_ready</code> state.
      </p>
    </FormShell>
  );
}

// ── Shared bits ────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:border-[var(--ao-accent)] focus:outline-none";

function FormShell({
  title,
  children,
  onCancel,
  onSubmit,
  submitting,
  submitLabel,
  error,
}: {
  title: string;
  children: React.ReactNode;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  error: string | null;
}) {
  return (
    <div className="mt-4 space-y-3 rounded-[var(--radius-sm)] border border-[var(--allone-line-soft)] bg-[var(--bg-surface-alt)] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold text-[var(--ink-900)]">
          {title}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-[var(--ink-400)] hover:text-[var(--ink-900)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {children}
      {error && (
        <div className="rounded-[var(--radius-xs)] border border-red-100 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-[12px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-[var(--radius-sm)] bg-[var(--ink-900)] px-3 py-1.5 text-[12px] font-medium text-white shadow-[var(--shadow-xs)] hover:bg-[var(--ink-800)] disabled:opacity-50"
        >
          {submitting ? "Working…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-500)]">
        {label}
      </div>
      {children}
    </label>
  );
}

function CurrencyPicker({
  value,
  onChange,
}: {
  value: (typeof CURRENCIES)[number];
  onChange: (v: (typeof CURRENCIES)[number]) => void;
}) {
  return (
    <Field label="Currency">
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value as (typeof CURRENCIES)[number])
        }
        className={INPUT_CLS}
      >
        {CURRENCIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </Field>
  );
}

function LineItemEditor({
  items,
  onChange,
  currency,
}: {
  items: LineItem[];
  onChange: (next: LineItem[]) => void;
  currency: string;
}) {
  const subtotal = items.reduce(
    (sum, i) => sum + (i.quantity || 0) * (i.unit_price || 0),
    0,
  );
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--ink-500)]">
        Line items
      </div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-12 gap-2">
            <input
              value={it.description}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i ? { ...x, description: e.target.value } : x,
                  ),
                )
              }
              placeholder="Description"
              className={`${INPUT_CLS} col-span-6`}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={it.quantity}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i
                      ? { ...x, quantity: parseFloat(e.target.value) || 0 }
                      : x,
                  ),
                )
              }
              placeholder="Qty"
              className={`${INPUT_CLS} col-span-2 text-right tabular-nums`}
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={it.unit_price}
              onChange={(e) =>
                onChange(
                  items.map((x, j) =>
                    j === i
                      ? { ...x, unit_price: parseFloat(e.target.value) || 0 }
                      : x,
                  ),
                )
              }
              placeholder="Unit price"
              className={`${INPUT_CLS} col-span-3 text-right tabular-nums`}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              disabled={items.length === 1}
              className="col-span-1 flex items-center justify-center text-[var(--ink-400)] hover:text-red-600 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            onChange([
              ...items,
              { description: "", quantity: 1, unit_price: 0 },
            ])
          }
          className="inline-flex items-center gap-1 text-[12px] text-[var(--ink-500)] hover:text-[var(--ink-900)]"
        >
          <Plus className="h-3 w-3" /> Add line item
        </button>
        <div className="text-[12px] text-[var(--ink-500)]">
          Subtotal:{" "}
          <span className="font-medium text-[var(--ink-900)] tabular-nums">
            {currency} {subtotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

function ResultBanner({
  result,
  onDismiss,
}: {
  result: { kind: ActionKind; data: ActionResult };
  onDismiss: () => void;
}) {
  const label =
    result.kind === "offer"
      ? `Offer ${result.data.offer_number}`
      : result.kind === "contract"
        ? `Contract ${result.data.contract_number}`
        : result.kind === "invoice"
          ? `Invoice ${result.data.invoice_number}`
          : "Draft sent";
  return (
    <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-emerald-200 bg-emerald-50 p-3 text-sm">
      <div className="flex items-center gap-2 text-emerald-800">
        <span className="font-medium">{label} ready.</span>
        {result.data.valid_until && (
          <span className="text-emerald-700">
            Valid until {result.data.valid_until}.
          </span>
        )}
        {result.data.due_date && (
          <span className="text-emerald-700">Due {result.data.due_date}.</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {result.data.url && (
          <a
            href={result.data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-[var(--radius-xs)] bg-emerald-700 px-2 py-1 text-[12px] font-medium text-white hover:bg-emerald-800"
          >
            <ExternalLink className="h-3 w-3" /> Open
          </a>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="text-emerald-700 hover:text-emerald-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Action client ──────────────────────────────────────────────────────

type CallResult =
  | { ok: true; data?: ActionResult }
  | { ok: false; error: string };

async function callAction(
  tool: string,
  input: Record<string, unknown>,
): Promise<CallResult> {
  const res = await fetch("/api/sales/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, input }),
  });
  const json = (await res.json()) as {
    ok?: boolean;
    error?: string;
    data?: ActionResult;
  };
  if (!res.ok || !json.ok) {
    return { ok: false, error: json.error || `HTTP ${res.status}` };
  }
  return { ok: true, data: json.data };
}

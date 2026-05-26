"use client";

import { useEffect, useState } from "react";
import { Send, Save, Trash2, Loader2, CheckCircle2 } from "lucide-react";

interface DraftPanelProps {
  draft: { id: string; subject: string; body_html: string } | null;
  jobId: string;
  status: string;
}

export function DraftPanel({ draft, jobId, status }: DraftPanelProps) {
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [bodyHtml, setBodyHtml] = useState(draft?.body_html ?? "");
  const [view, setView] = useState<"preview" | "edit">("preview");
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [sent, setSent] = useState(status === "sent");

  useEffect(() => {
    setSubject(draft?.subject ?? "");
    setBodyHtml(draft?.body_html ?? "");
    setSent(status === "sent");
  }, [draft?.id, draft?.subject, draft?.body_html, status]);

  const save = async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/demos/${jobId}/draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body_html: bodyHtml }),
      });
      if (res.ok) setSavedAt(Date.now());
    } finally {
      setIsSaving(false);
    }
  };

  const send = async () => {
    if (!draft) return;
    if (!confirm("Send this email to the lead?")) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/admin/demos/${jobId}/draft/send`, {
        method: "POST",
      });
      if (res.ok) setSent(true);
    } finally {
      setIsSending(false);
    }
  };

  const discard = async () => {
    if (!draft) return;
    if (!confirm("Discard this draft?")) return;
    await fetch(`/api/admin/demos/${jobId}/draft/revoke`, { method: "POST" });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--gray-200)] bg-white lg:col-span-2">
      <div className="flex items-center justify-between border-b border-[var(--gray-200)] px-5 py-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--gray-500)]">
            Email draft
          </p>
          <p className="text-sm font-medium text-[#071D2F]">
            {sent ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> Sent
              </span>
            ) : (
              "Review and send"
            )}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-[var(--gray-50)] p-1">
          <button
            type="button"
            onClick={() => setView("preview")}
            className={`rounded-md px-3 py-1 text-xs font-medium ${
              view === "preview"
                ? "bg-white shadow-sm text-[#071D2F]"
                : "text-[var(--gray-500)]"
            }`}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => setView("edit")}
            className={`rounded-md px-3 py-1 text-xs font-medium ${
              view === "edit"
                ? "bg-white shadow-sm text-[#071D2F]"
                : "text-[var(--gray-500)]"
            }`}
          >
            Edit
          </button>
        </div>
      </div>
      {!draft ? (
        <div className="flex items-center justify-center px-5 py-12 text-sm text-[var(--gray-500)]">
          Draft will appear here once the pipeline reaches the drafting phase.
        </div>
      ) : (
        <>
          <div className="border-b border-[var(--gray-200)] px-5 py-3">
            {view === "edit" ? (
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-[var(--gray-200)] px-3 py-1.5 text-sm focus:border-[#0ea5e9] focus:outline-none"
                disabled={sent}
              />
            ) : (
              <p className="text-sm font-medium text-[#071D2F]">{subject}</p>
            )}
          </div>
          <div className="px-5 py-4" style={{ minHeight: 320 }}>
            {view === "edit" ? (
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                className="h-72 w-full resize-none rounded-md border border-[var(--gray-200)] px-3 py-2 font-mono text-xs focus:border-[#0ea5e9] focus:outline-none"
                disabled={sent}
              />
            ) : (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: bodyHtml }}
              />
            )}
          </div>
          {!sent && (
            <div className="flex items-center justify-between gap-2 border-t border-[var(--gray-200)] px-5 py-3">
              <div className="text-xs text-[var(--gray-500)]">
                {savedAt && Date.now() - savedAt < 5000 ? "Saved" : ""}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={discard}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gray-200)] px-3 py-1.5 text-xs font-medium text-[var(--gray-600)] transition hover:bg-[var(--gray-50)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Discard
                </button>
                {view === "edit" && (
                  <button
                    type="button"
                    onClick={save}
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--gray-200)] px-3 py-1.5 text-xs font-medium text-[#071D2F] transition hover:bg-[var(--gray-50)] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save
                  </button>
                )}
                <button
                  type="button"
                  onClick={send}
                  disabled={isSending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f172a] px-4 py-1.5 text-xs font-medium text-white transition hover:bg-[#0b1220] disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Send
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

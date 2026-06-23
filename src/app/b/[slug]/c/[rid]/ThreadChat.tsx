"use client";

import { useState, useEffect, useRef } from "react";
import { AssistantThinking } from "@/components/bf-shell/AssistantThinking";
import { StreamingText } from "@/components/bf-shell/StreamingText";
import { AutolabOffer, type OfferData } from "./AutolabOffer";
import { SignPanel } from "./SignPanel";
import { PaymentPanel } from "./PaymentPanel";

interface ConvMsg {
  role: "bot" | "user";
  text: string;
  streaming?: boolean;
}

interface ThreadDocument {
  kind: string;
  label: string;
  url: string;
}

interface ThreadStatus {
  status: string;
  intro: string;
  documents: ThreadDocument[];
  offer?: OfferData | null;
  doc_number?: string | null;
  contract_url?: string | null;
  signed?: boolean;
  signer_name?: string | null;
  signer_prefill_name?: string | null;
  signer_prefill_id?: string | null;
  invoice_url?: string | null;
  paid?: boolean;
  pay_gel?: number;
}

const LABEL_MAP: Record<string, string> = {
  offer: "შეთავაზება",
  contract: "ხელშეკრულება",
  invoice: "ინვოისი",
};

export function ThreadChat({
  slug,
  rid,
  title,
}: {
  slug: string;
  rid: string;
  title: string;
}) {
  const [thread, setThread] = useState<ThreadStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conv, setConv] = useState<ConvMsg[]>([]);
  const [input, setInput] = useState("");
  const [chatThinking, setChatThinking] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const apiRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Continue the conversation in the thread (client can keep asking).
  async function send(text: string) {
    const v = text.trim();
    if (!v || chatThinking) return;
    apiRef.current = [...apiRef.current, { role: "user", content: v }];
    setConv((c) => [...c, { role: "user", text: v }]);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    setChatThinking(true);
    try {
      const res = await fetch(`/api/bots/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiRef.current }),
      });
      const data = (await res.json()) as { reply?: string };
      const reply = data.reply || "ბოდიში, სცადეთ ისევ.";
      apiRef.current = [
        ...apiRef.current,
        { role: "assistant", content: reply },
      ];
      setConv((c) => [...c, { role: "bot", text: reply, streaming: true }]);
    } catch {
      setConv((c) => [
        ...c,
        { role: "bot", text: "კავშირის შეფერხება — სცადეთ მოგვიანებით." },
      ]);
    } finally {
      setChatThinking(false);
    }
  }

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch(`/api/bots/${slug}/thread/${rid}`);
        if (!res.ok) {
          setError("ვერ ჩაიტვირთა. სცადეთ გვერდის განახლება.");
          return;
        }
        const data = (await res.json()) as ThreadStatus;
        setThread(data);
        // Slow the poll once we have something to show (offer or documents).
        if (data.offer || data.documents.length > 0) {
          if (intervalRef.current !== null) clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => void poll(), 15_000);
        }
      } catch {
        setError("კავშირის შეცდომა. სცადეთ მოგვიანებით.");
      }
    }
    void poll();
    intervalRef.current = setInterval(() => void poll(), 5_000);
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [slug, rid]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [thread, conv, chatThinking]);

  const initial = title.trim().charAt(0) || "A";

  return (
    <div className="mx-auto flex h-dvh max-w-4xl flex-col bg-[var(--bg-surface)]">
      <header className="flex items-center gap-3 border-b border-[var(--allone-line,#ececec)] px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink-900)] text-[13px] font-semibold text-white">
          {initial}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-[var(--ink-900)]">
            {title}
          </div>
          <div className="text-[11px] text-[var(--ink-400)]">საუბარი</div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {error}
          </div>
        )}

        {!thread && !error && (
          <div className="py-0.5">
            <AssistantThinking />
          </div>
        )}

        {thread && (
          <ul className="space-y-5">
            {/* intro */}
            <li className="space-y-1.5">
              <div className="text-[11px] font-medium text-[var(--ink-500)]">
                {title}
              </div>
              <div className="py-0.5 text-[14.5px] leading-[1.6] text-[var(--ink-900)]">
                {thread.intro}
              </div>
            </li>

            {/* in-chat offer (autolab style) */}
            {thread.offer && (
              <li>
                <AutolabOffer
                  offer={thread.offer}
                  docNumber={thread.doc_number ?? ""}
                  dateLabel={new Date().toLocaleDateString("ka-GE")}
                  onConfirm={(sel) =>
                    void send(
                      `ვირჩევ: ${sel.items.join(", ")} — სულ ${sel.total.toLocaleString("en-US")} ₾`,
                    )
                  }
                />
              </li>
            )}

            {/* delivered documents as cards */}
            {thread.documents.map((doc, i) => (
              <li key={i} className="space-y-1.5">
                <div className="text-[11px] font-medium text-[var(--ink-500)]">
                  {title}
                </div>
                <div className="max-w-[85%] rounded-2xl border border-[var(--allone-line,#ececec)] bg-[var(--bg-surface)] p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-sunken,#f4f4f5)] text-[15px]">
                      📄
                    </span>
                    <span className="text-[14px] font-medium text-[var(--ink-900)]">
                      {LABEL_MAP[doc.kind] ?? doc.label}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-[var(--ink-900)] px-4 py-2 text-[13px] font-medium text-white transition active:scale-[0.98]"
                    >
                      ნახვა
                    </a>
                    <a
                      href={doc.url}
                      download
                      className="rounded-full border border-[var(--allone-line,#e4e4e7)] px-4 py-2 text-[13px] font-medium text-[var(--ink-700,#3f3f46)] transition hover:bg-[var(--bg-surface-alt,#f7f7f8)]"
                    >
                      ჩამოტვირთვა
                    </a>
                  </div>
                </div>
              </li>
            ))}

            {/* e-sign the contract once it's available */}
            {thread.contract_url && (
              <li className="space-y-1.5">
                <div className="text-[11px] font-medium text-[var(--ink-500)]">
                  {title}
                </div>
                <SignPanel
                  slug={slug}
                  rid={rid}
                  contractUrl={thread.contract_url}
                  signed={!!thread.signed}
                  signerName={thread.signer_name ?? null}
                  prefillName={thread.signer_prefill_name ?? null}
                  prefillIdCode={thread.signer_prefill_id ?? null}
                  onSigned={() =>
                    setThread((t) => (t ? { ...t, signed: true } : t))
                  }
                />
              </li>
            )}

            {/* payment — once there's an amount due */}
            {(thread.pay_gel ?? 0) > 0 && (
              <li className="space-y-1.5">
                <div className="text-[11px] font-medium text-[var(--ink-500)]">
                  {title}
                </div>
                <PaymentPanel
                  slug={slug}
                  rid={rid}
                  amountGel={thread.pay_gel ?? 0}
                  invoiceUrl={thread.invoice_url ?? null}
                  paid={!!thread.paid}
                  onPaid={() =>
                    setThread((t) => (t ? { ...t, paid: true } : t))
                  }
                />
              </li>
            )}

            {/* waiting — only before anything is delivered */}
            {!thread.offer && thread.documents.length === 0 && (
              <li className="space-y-1.5">
                <div className="text-[11px] font-medium text-[var(--ink-500)]">
                  {title}
                </div>
                <div className="py-0.5">
                  <AssistantThinking stage="ვამზადებთ თქვენს შეთავაზებას" />
                </div>
              </li>
            )}

            {/* continued conversation */}
            {conv.map((m, i) => (
              <li key={`c${i}`} className="space-y-1.5">
                <div className="text-[11px] font-medium text-[var(--ink-500)]">
                  {m.role === "user" ? "თქვენ" : title}
                </div>
                <div
                  className={`whitespace-pre-wrap break-words text-[14.5px] leading-[1.6] ${
                    m.role === "user"
                      ? "inline-block max-w-full rounded-[28px] bg-[var(--bg-sunken,#f4f4f5)] px-4 py-2.5 text-[var(--ink-900)]"
                      : "py-0.5 text-[var(--ink-900)]"
                  }`}
                  style={{ overflowWrap: "anywhere" }}
                >
                  {m.role === "bot" && m.streaming ? (
                    <StreamingText
                      text={m.text}
                      charsPerSecond={55}
                      onDone={() =>
                        setConv((curr) => {
                          const next = [...curr];
                          if (next[i]?.streaming)
                            next[i] = { ...next[i]!, streaming: false };
                          return next;
                        })
                      }
                    />
                  ) : (
                    m.text
                  )}
                </div>
              </li>
            ))}
            {chatThinking && (
              <li className="py-0.5">
                <AssistantThinking />
              </li>
            )}
          </ul>
        )}
      </div>

      {/* persistent composer — the chat stays a chat */}
      <div className="px-5 pb-4">
        <div className="relative mx-auto max-w-2xl rounded-[1.625rem] border border-[var(--allonce-line,#e4e4e7)] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_16px_-4px_rgba(0,0,0,0.06)]">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              const ta = e.currentTarget;
              ta.style.height = "auto";
              ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
            }}
            rows={1}
            disabled={chatThinking}
            placeholder="დაწერეთ შეტყობინება…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            className="block w-full resize-none rounded-[1.625rem] bg-transparent px-4 pt-3 pb-11 text-[15px] leading-[1.5] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] disabled:opacity-60"
          />
          <button
            type="button"
            aria-label="გაგზავნა"
            disabled={chatThinking || !input.trim()}
            onClick={() => void send(input)}
            className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink-900)] text-white transition hover:opacity-90 disabled:opacity-30"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

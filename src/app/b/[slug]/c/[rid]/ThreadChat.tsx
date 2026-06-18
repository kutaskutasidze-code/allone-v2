"use client";

import { useState, useEffect, useRef } from "react";
import { AssistantThinking } from "@/components/bf-shell/AssistantThinking";
import { AutolabOffer, type OfferData } from "./AutolabOffer";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [thread]);

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
          </ul>
        )}
      </div>
    </div>
  );
}

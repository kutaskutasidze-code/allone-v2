"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { OTHER_LABEL, type BotQuestion } from "@/lib/bots/types";
import { AssistantThinking } from "@/components/bf-shell/AssistantThinking";
import { StreamingText } from "@/components/bf-shell/StreamingText";

// Questionnaire as a real Business-Forge-style chat: a persistent composer
// textbox (type any answer), optional suggestion chips for the current
// question (tap or ignore), assistant text revealed via StreamingText, a
// pulsing thinking indicator between turns, and the BF chat shell frame.

interface Msg {
  role: "bot" | "user";
  text: string;
  streaming?: boolean;
}

export function BotChat({
  slug,
  title,
  intro,
  questions,
}: {
  slug: string;
  title: string;
  intro: string | null;
  questions: BotQuestion[];
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(-1); // question awaiting an answer; -1 = none
  const [thinking, setThinking] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const startedRef = useRef(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Resume an existing thread if one was stored for this slug.
  useEffect(() => {
    const stored = localStorage.getItem(`bot_thread_${slug}`);
    if (stored) window.location.assign(`/b/${slug}/c/${stored}`);
  }, [slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, thinking, step]);

  const ask = useCallback(
    (i: number) => {
      const q = questions[i];
      if (!q) return;
      setThinking(true);
      setStep(-1);
      setTimeout(() => {
        setThinking(false);
        const text = q.hint ? `${q.text}\n${q.hint}` : q.text;
        setMessages((m) => [...m, { role: "bot", text, streaming: true }]);
        setStep(i);
      }, 650);
    },
    [questions],
  );

  // Auto-start the conversation on first mount (after the resume check).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const greeting =
      intro ?? "გამარჯობა! მოდით, რამდენიმე კითხვას გავუსვათ ერთმანეთს.";
    setMessages([{ role: "bot", text: greeting, streaming: true }]);
    setThinking(true);
    const t = setTimeout(() => ask(0), 1100);
    return () => clearTimeout(t);
  }, [intro, ask]);

  async function submitAll(all: Record<string, string>) {
    setSubmitting(true);
    setThinking(true);
    try {
      const res = await fetch(`/api/bots/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: all }),
      });
      const data = (await res.json()) as { ok?: boolean; response_id?: string };
      if (data.response_id) {
        localStorage.setItem(`bot_thread_${slug}`, data.response_id);
        window.location.assign(`/b/${slug}/c/${data.response_id}`);
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
      setThinking(false);
    }
  }

  // Send the current message (typed or from a tapped suggestion) as the
  // answer to the active question, then advance.
  function send(text: string) {
    const value = text.trim();
    if (!value || step < 0 || thinking || submitting) return;
    const q = questions[step];
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: value }]);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (step + 1 >= questions.length) void submitAll(next);
    else ask(step + 1);
  }

  const q = step >= 0 ? questions[step] : undefined;
  const suggestions = q
    ? [...(q.options ?? [])].filter((o) => o !== OTHER_LABEL)
    : [];
  const canSend = !!q && !thinking && !submitting && !done;
  const initial = title.trim().charAt(0) || "A";
  const answered = step >= 0 ? step : Object.keys(answers).length;

  return (
    <aside className="mx-auto flex h-dvh max-w-2xl flex-col bg-[var(--bg-surface)]">
      {/* header — chat frame only */}
      <div className="flex items-center gap-3 border-b border-[var(--allonce-line,#ececec)] px-4 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink-900)] text-[13px] font-semibold text-white">
          {initial}
        </div>
        <div className="min-w-0 flex flex-col">
          <span className="truncate text-[14px] font-medium text-[var(--ink-900)]">
            {title}
          </span>
          <span className="text-[11px] text-[var(--ink-400)]">
            {Math.min(answered, questions.length)} / {questions.length}
          </span>
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <ul className="space-y-5">
          {messages.map((m, i) => (
            <li key={i} className="space-y-1.5">
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
                      setMessages((curr) => {
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
          {thinking && (
            <li className="space-y-1.5">
              <div className="text-[11px] font-medium text-[var(--ink-500)]">
                {title}
              </div>
              <div className="py-0.5">
                <AssistantThinking />
              </div>
            </li>
          )}
          {done && (
            <li className="py-0.5 text-[14.5px] text-[var(--ink-900)]">
              მადლობა! 🙌
            </li>
          )}
        </ul>
      </div>

      {/* composer + optional suggestion chips */}
      <div className="px-4 pb-4">
        {canSend && suggestions.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {suggestions.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => send(o)}
                className="rounded-full border border-[var(--allonce-line,#e4e4e7)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-[13px] text-[var(--ink-700,#3f3f46)] transition hover:bg-[var(--bg-surface-alt,#f7f7f8)] hover:text-[var(--ink-900)] active:scale-[0.98]"
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {/* ChatGPT-style composer — same shape as the BF side-chat */}
        <div className="relative rounded-[1.625rem] border border-[var(--allonce-line,#e4e4e7)] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_16px_-4px_rgba(0,0,0,0.06)]">
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
            disabled={!canSend}
            placeholder={done ? "დასრულდა" : canSend ? "დაწერეთ პასუხი…" : "…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            className="block w-full resize-none rounded-[1.625rem] bg-transparent px-4 pt-3 pb-11 text-[14.5px] leading-[1.5] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] disabled:opacity-60"
          />
          <button
            type="button"
            aria-label="გაგზავნა"
            disabled={!canSend || !input.trim()}
            onClick={() => send(input)}
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
    </aside>
  );
}

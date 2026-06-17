"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { OTHER_LABEL, type BotQuestion } from "@/lib/bots/types";
import { AssistantThinking } from "@/components/bf-shell/AssistantThinking";
import { StreamingText } from "@/components/bf-shell/StreamingText";

// Chat-native questionnaire, styled to match the Business Forge chat:
// flowing assistant text revealed char-by-char (StreamingText), a pulsing
// "thinking" indicator between turns (AssistantThinking), user answers as
// rounded pill bubbles, and an answer dock (chips / text) pinned at the bottom.

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
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(-1); // index of the question awaiting an answer; -1 = none yet
  const [thinking, setThinking] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // multi-select working set + free-text "other"
  const [picks, setPicks] = useState<string[]>([]);
  const [otherOn, setOtherOn] = useState(false);
  const [draft, setDraft] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, [messages, thinking, step, picks, otherOn]);

  // Ask question `i`: brief thinking indicator, then stream the question in.
  const ask = useCallback(
    (i: number) => {
      const q = questions[i];
      if (!q) return;
      setThinking(true);
      setStep(-1);
      const t = setTimeout(() => {
        setThinking(false);
        const text = q.hint ? `${q.text}\n${q.hint}` : q.text;
        setMessages((m) => [...m, { role: "bot", text, streaming: true }]);
        setStep(i);
        setPicks([]);
        setOtherOn(false);
        setDraft("");
      }, 650);
      return () => clearTimeout(t);
    },
    [questions],
  );

  function start() {
    setStarted(true);
    const greeting =
      intro ?? "გამარჯობა! მოდით, რამდენიმე კითხვას გავუსვათ ერთმანეთს.";
    setMessages([{ role: "bot", text: greeting, streaming: true }]);
    setThinking(true);
    setTimeout(() => ask(0), 900);
  }

  async function submit(all: Record<string, string | string[]>) {
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

  function commit(q: BotQuestion, value: string | string[], display: string) {
    setMessages((m) => [...m, { role: "user", text: display }]);
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    if (step + 1 >= questions.length) void submit(next);
    else ask(step + 1);
  }

  const q = step >= 0 ? questions[step] : undefined;
  const inputActive = !!q && !thinking && !submitting && !done;

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col bg-[var(--bg-surface)]">
      {/* slim header — chat only, no app chrome */}
      <header className="flex items-center gap-3 border-b border-[var(--allone-line,#ececec)] px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink-900)] text-[13px] font-semibold text-white">
          {title.trim().charAt(0) || "A"}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-[var(--ink-900)]">
            {title}
          </div>
          <div className="text-[11px] text-[var(--ink-400)]">
            {started
              ? `${Math.min(step + 1, questions.length)} / ${questions.length}`
              : "კითხვარი"}
          </div>
        </div>
      </header>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
        {!started ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ink-900)] text-lg font-semibold text-white">
              {title.trim().charAt(0) || "A"}
            </div>
            <h1 className="mt-4 text-[19px] font-semibold tracking-tight text-[var(--ink-900)]">
              {title}
            </h1>
            {intro && (
              <p className="mt-2 max-w-md text-[14px] leading-relaxed text-[var(--ink-500)]">
                {intro}
              </p>
            )}
            <button
              onClick={start}
              className="mt-6 rounded-full bg-[var(--ink-900)] px-6 py-3 text-[14px] font-medium text-white transition active:scale-[0.98]"
            >
              დავიწყოთ
            </button>
          </div>
        ) : (
          <ul className="space-y-5">
            {messages.map((m, i) => (
              <li key={i} className="space-y-1.5">
                <div className="text-[11px] font-medium text-[var(--ink-500)]">
                  {m.role === "user" ? "თქვენ" : title}
                </div>
                <div
                  className={`whitespace-pre-wrap break-words text-[14.5px] leading-[1.6] ${
                    m.role === "user"
                      ? "inline-block max-w-full rounded-[24px] bg-[var(--bg-sunken,#f4f4f5)] px-4 py-2.5 text-[var(--ink-900)]"
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
        )}
      </div>

      {/* answer dock */}
      {inputActive && q && (
        <div className="border-t border-[var(--allone-line,#ececec)] px-5 py-4">
          <AnswerDock
            q={q}
            picks={picks}
            otherOn={otherOn}
            draft={draft}
            setDraft={setDraft}
            onPickSingle={(o) => commit(q, o, o)}
            onToggle={(o) => {
              if (o === OTHER_LABEL) {
                setOtherOn((v) => !v);
              } else {
                setPicks((p) =>
                  p.includes(o) ? p.filter((x) => x !== o) : [...p, o],
                );
              }
            }}
            onContinueMulti={() => {
              const other = otherOn ? draft.trim() : "";
              const all = [...picks, ...(other ? [other] : [])];
              if (all.length === 0) return;
              commit(q, all, all.join(", "));
            }}
            onSubmitText={(v) => commit(q, v ? [v] : [], v || "—")}
            onSubmitOther={(v) => v.trim() && commit(q, [v.trim()], v.trim())}
          />
        </div>
      )}
    </div>
  );
}

function AnswerDock({
  q,
  picks,
  otherOn,
  draft,
  setDraft,
  onPickSingle,
  onToggle,
  onContinueMulti,
  onSubmitText,
  onSubmitOther,
}: {
  q: BotQuestion;
  picks: string[];
  otherOn: boolean;
  draft: string;
  setDraft: (v: string) => void;
  onPickSingle: (o: string) => void;
  onToggle: (o: string) => void;
  onContinueMulti: () => void;
  onSubmitText: (v: string) => void;
  onSubmitOther: (v: string) => void;
}) {
  if (q.type === "text") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitText(draft.trim());
          setDraft("");
        }}
        className="flex items-center gap-2"
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="ჩაწერეთ პასუხი…"
          className="flex-1 rounded-full border border-[var(--allone-line,#e4e4e7)] bg-[var(--bg-surface)] px-4 py-2.5 text-[14px] text-[var(--ink-900)] outline-none focus:border-[var(--ink-900)]"
        />
        <button
          type="submit"
          className="rounded-full bg-[var(--ink-900)] px-5 py-2.5 text-[14px] font-medium text-white transition active:scale-[0.98]"
        >
          გაგზავნა
        </button>
      </form>
    );
  }

  const opts = [...(q.options ?? []), ...(q.allowOther ? [OTHER_LABEL] : [])];

  if (q.type === "single") {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {opts.map((o) =>
            o === OTHER_LABEL ? (
              <OtherInline key={o} onSubmit={onSubmitOther} />
            ) : (
              <button
                key={o}
                onClick={() => onPickSingle(o)}
                className="rounded-2xl bg-[var(--bg-surface-alt,#f7f7f8)] px-4 py-2.5 text-[13.5px] text-[var(--ink-800,#27272a)] transition hover:bg-[var(--bg-sunken,#ededed)] active:scale-[0.98]"
              >
                {o}
              </button>
            ),
          )}
        </div>
      </div>
    );
  }

  // multi
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => {
          const active = o === OTHER_LABEL ? otherOn : picks.includes(o);
          return (
            <button
              key={o}
              onClick={() => onToggle(o)}
              className={`rounded-2xl px-4 py-2.5 text-[13.5px] transition active:scale-[0.98] ${
                active
                  ? "bg-[var(--ink-900)] text-white"
                  : "bg-[var(--bg-surface-alt,#f7f7f8)] text-[var(--ink-800,#27272a)] hover:bg-[var(--bg-sunken,#ededed)]"
              }`}
            >
              {active && o !== OTHER_LABEL ? "✓ " : ""}
              {o}
            </button>
          );
        })}
      </div>
      {otherOn && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="ჩაწერეთ თქვენი ვარიანტი…"
          className="w-full rounded-full border border-[var(--allone-line,#e4e4e7)] bg-[var(--bg-surface)] px-4 py-2.5 text-[14px] outline-none focus:border-[var(--ink-900)]"
        />
      )}
      <button
        onClick={onContinueMulti}
        disabled={picks.length === 0 && !(otherOn && draft.trim())}
        className="w-full rounded-full bg-[var(--ink-900)] py-2.5 text-[14px] font-medium text-white transition active:scale-[0.99] disabled:opacity-30"
      >
        გაგრძელება
      </button>
    </div>
  );
}

function OtherInline({ onSubmit }: { onSubmit: (v: string) => void }) {
  const [v, setV] = useState("");
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-[var(--bg-surface-alt,#f7f7f8)] px-4 py-2.5 text-[13.5px] text-[var(--ink-800,#27272a)] transition hover:bg-[var(--bg-sunken,#ededed)]"
      >
        {OTHER_LABEL}
      </button>
    );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
      className="flex items-center gap-2"
    >
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="ჩაწერეთ…"
        className="rounded-full border border-[var(--allone-line,#e4e4e7)] bg-[var(--bg-surface)] px-4 py-2 text-[14px] outline-none focus:border-[var(--ink-900)]"
      />
      <button
        type="submit"
        className="rounded-full bg-[var(--ink-900)] px-4 py-2 text-[13.5px] font-medium text-white"
      >
        ok
      </button>
    </form>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AssistantThinking } from "@/components/bf-shell/AssistantThinking";
import { StreamingText } from "@/components/bf-shell/StreamingText";

// Conversational intake agent, Business-Forge chat styling. The bot drives a
// free conversation (goal: gather the company's info), answers the visitor's
// questions, and when it has enough, the /chat endpoint returns complete:true
// + the gathered answers → we submit them and move the visitor to their thread.

interface Msg {
  role: "bot" | "user";
  text: string;
  streaming?: boolean;
}
interface ApiMsg {
  role: "user" | "assistant";
  content: string;
}

const SEED =
  "(ვიზიტორმა გახსნა ჩატი — მომესალმე ქართულად და დასვი პირველი კითხვა.)";

export function BotChat({
  slug,
  title,
}: {
  slug: string;
  title: string;
  intro: string | null;
}) {
  const [display, setDisplay] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [busy, setBusy] = useState(false); // submitting / redirecting
  const [input, setInput] = useState("");
  const apiRef = useRef<ApiMsg[]>([{ role: "user", content: SEED }]);
  const startedRef = useRef(false);
  const sessionRef = useRef<string | null>(null);
  // Gate the opening turn until we know whether there's a session to resume.
  const [resumeChecked, setResumeChecked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Restore an interrupted conversation. The server saves the transcript every
  // turn, so a refresh, a dead connection or a closed tab no longer throws away
  // everything the visitor already answered.
  useEffect(() => {
    const done = localStorage.getItem(`bot_thread_${slug}`);
    if (done) {
      window.location.assign(`/b/${slug}/c/${done}`);
      return;
    }

    const key = `bot_session_${slug}`;
    const existing = localStorage.getItem(key);
    if (!existing) {
      const fresh = crypto.randomUUID();
      localStorage.setItem(key, fresh);
      sessionRef.current = fresh;
      setResumeChecked(true);
      return;
    }

    sessionRef.current = existing;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/bots/${slug}/session/${existing}`);
        if (res.ok && !cancelled) {
          const data = (await res.json()) as {
            transcript?: ApiMsg[];
            response_id?: string | null;
          };
          if (data.response_id) {
            localStorage.setItem(`bot_thread_${slug}`, data.response_id);
            window.location.assign(`/b/${slug}/c/${data.response_id}`);
            return;
          }
          const prior = (data.transcript ?? []).filter(
            (m) => m.role === "user" || m.role === "assistant",
          );
          if (prior.length > 1) {
            apiRef.current = prior;
            setDisplay(
              prior
                .filter(
                  (m) => !(m.role === "user" && m.content.startsWith("(")),
                )
                .map((m) => ({
                  role:
                    m.role === "user" ? ("user" as const) : ("bot" as const),
                  text: m.content,
                })),
            );
            // Already mid-conversation: don't fire an opening turn, wait for
            // the visitor to carry on.
            startedRef.current = true;
          }
        }
      } catch {
        // Resume is best-effort — fall through to a fresh conversation.
      }
      if (!cancelled) setResumeChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [display, thinking]);

  // One agent turn: send apiRef history, append the reply, handle completion.
  const turn = useCallback(async () => {
    setThinking(true);
    try {
      const res = await fetch(`/api/bots/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiRef.current,
          session_id: sessionRef.current,
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        complete?: boolean;
        answers?: Record<string, unknown>;
        error?: string;
      };
      setThinking(false);
      const reply =
        data.reply ||
        (data.error ? "ბოდიში, დროებითი შეფერხებაა — სცადეთ ისევ." : "…");
      apiRef.current = [
        ...apiRef.current,
        { role: "assistant", content: reply },
      ];
      setDisplay((d) => [...d, { role: "bot", text: reply, streaming: true }]);

      if (data.complete && data.answers) {
        setBusy(true);
        const res2 = await fetch(`/api/bots/${slug}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers: data.answers,
            messages: apiRef.current,
            session_id: sessionRef.current,
          }),
        });
        const sub = (await res2.json()) as { response_id?: string };
        if (sub.response_id) {
          localStorage.setItem(`bot_thread_${slug}`, sub.response_id);
          // give the closing message a moment to render, then move to thread
          setTimeout(
            () => window.location.assign(`/b/${slug}/c/${sub.response_id}`),
            2200,
          );
        }
      }
    } catch {
      setThinking(false);
      setDisplay((d) => [
        ...d,
        { role: "bot", text: "კავშირის შეფერხება — სცადეთ მოგვიანებით." },
      ]);
    }
  }, [slug]);

  // Kick off the opening turn — but only once the resume check has run, so a
  // returning visitor continues their conversation instead of restarting it.
  useEffect(() => {
    if (!resumeChecked || startedRef.current) return;
    startedRef.current = true;
    void turn();
  }, [turn, resumeChecked]);

  function send(text: string) {
    const v = text.trim();
    if (!v || thinking || busy) return;
    apiRef.current = [...apiRef.current, { role: "user", content: v }];
    setDisplay((d) => [...d, { role: "user", text: v }]);
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    void turn();
  }

  const canSend = !thinking && !busy;
  const initial = title.trim().charAt(0) || "A";

  return (
    <aside className="mx-auto flex h-dvh max-w-4xl flex-col bg-white">
      <div className="flex items-center gap-3 border-b border-[var(--allonce-line,#ececec)] px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ink-900)] text-[13px] font-semibold text-white">
          {initial}
        </div>
        <span className="truncate text-[14px] font-medium text-[var(--ink-900)]">
          {title}
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6">
        <ul className="mx-auto max-w-2xl space-y-5">
          {display.map((m, i) => (
            <li key={i} className="space-y-1.5">
              <div className="text-[11px] font-medium text-[var(--ink-500)]">
                {m.role === "user" ? "თქვენ" : title}
              </div>
              <div
                className={`whitespace-pre-wrap break-words text-[15px] leading-[1.65] ${
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
                      setDisplay((curr) => {
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
        </ul>
      </div>

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
            disabled={!canSend}
            placeholder={busy ? "მზადდება…" : "დაწერეთ პასუხი ან შეკითხვა…"}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            className="block w-full resize-none rounded-[1.625rem] bg-transparent px-4 pt-3 pb-11 text-[15px] leading-[1.5] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-400)] disabled:opacity-60"
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

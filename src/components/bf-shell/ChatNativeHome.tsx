"use client";

import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2, Sparkles, ArrowRight } from "lucide-react";

export interface QuickAction {
  label: string;
  prompt?: string; // text to send to chat
  href?: string; // or just navigate
  icon?: ReactNode;
}

interface ChatNativeHomeProps {
  greeting: string;
  subhead?: string;
  starters: QuickAction[];
  apiPath?: string;
  scopeLabel?: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

export function ChatNativeHome({
  greeting,
  subhead,
  starters,
  apiPath = "/api/sales/chat",
  scopeLabel,
}: ChatNativeHomeProps) {
  const router = useRouter();
  const LS_KEY = `allone.chat.history.${apiPath}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore history on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setMessages(JSON.parse(raw) as Message[]);
    } catch {}
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on every change.
  useEffect(() => {
    try {
      if (messages.length > 0)
        localStorage.setItem(LS_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, LS_KEY]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const send = async (text?: string, e?: FormEvent) => {
    e?.preventDefault();
    const t = (text ?? input).trim();
    if (!t || busy) return;
    setMessages((m) => [...m, { role: "user", text: t }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: t }],
        }),
      });
      const json = await res.json();
      const reply: string = json.text ?? json.error ?? "No response.";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const startersOnEmpty = messages.length === 0;

  return (
    <div
      className="bf-island mx-auto flex max-w-3xl flex-col"
      style={{ borderRadius: 20, minHeight: "calc(100vh - 8rem)" }}
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-4">
        <div
          className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            background: "var(--ao-accent-soft)",
            color: "var(--ao-accent)",
          }}
        >
          <Sparkles className="h-3 w-3" /> {scopeLabel ?? "Allone"}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--ink-900)]">
          {greeting}
        </h1>
        {subhead && (
          <p className="mt-1.5 text-sm text-[color:var(--ink-500)]">
            {subhead}
          </p>
        )}
      </div>

      {/* Chat thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 pb-4">
        {!startersOnEmpty && (
          <div className="flex flex-col gap-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[color:var(--ao-accent)] text-white"
                    : "mr-auto bg-[color:var(--bg-sunken)] text-[color:var(--ink-800)]"
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="mr-auto inline-flex items-center gap-1.5 rounded-2xl bg-[color:var(--bg-sunken)] px-4 py-2 text-sm text-[color:var(--ink-500)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> thinking…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => send(undefined, e)}
        className="border-t px-8 py-4"
        style={{ borderColor: "var(--allone-line-soft)" }}
      >
        <div className="bf-card-sunken flex items-end gap-2 px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="Ask anything — find a lead, generate a demo, see today's aims…"
            className="flex-1 resize-none bg-transparent text-[14px] text-[color:var(--ink-900)] placeholder-[color:var(--ink-400)] focus:outline-none"
            style={{ maxHeight: 140 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-white transition disabled:opacity-40"
            style={{ background: "var(--ao-accent)" }}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Quick-action chips */}
        {startersOnEmpty && (
          <div className="mt-3 flex flex-wrap gap-2">
            {starters.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (s.href) router.push(s.href);
                  else if (s.prompt) send(s.prompt);
                }}
                className="group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-[color:var(--ink-700)] transition hover:bg-[color:var(--bg-sunken)]"
                style={{ borderColor: "var(--allone-line)" }}
              >
                {s.icon}
                <span>{s.label}</span>
                <ArrowRight className="h-3 w-3 text-[color:var(--ink-300)] transition group-hover:text-[color:var(--ao-accent)]" />
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

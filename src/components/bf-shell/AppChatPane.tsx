"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { Send, X, Loader2, Sparkles } from "lucide-react";

export interface ChatScope {
  level: "org" | "tool" | "artifact";
  org?: string;
  tool?: string;
  artifact?: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface AppChatPaneProps {
  scope?: ChatScope;
  scopeLabel?: string;
  apiPath?: string;
  onClose: () => void;
}

export function AppChatPane({
  scope,
  scopeLabel,
  apiPath = "/api/sales/chat",
  onClose,
}: AppChatPaneProps) {
  const LS_KEY = `allonce.chat.history.side.${apiPath}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore on mount, persist on every change.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setMessages(JSON.parse(raw) as Message[]);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      if (messages.length > 0)
        localStorage.setItem(LS_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages, LS_KEY]);

  const clearHistory = () => {
    setMessages([]);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const userMsg: Message = { role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.text,
          })),
          scope,
        }),
      });
      const json = await res.json();
      const reply: string =
        json.text ?? json.error ?? "Hmm, I couldn't respond. Try again?";
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

  return (
    <aside
      className="bf-island mx-3 mt-3 mb-3 hidden w-80 shrink-0 flex-col xl:flex"
      style={{ borderRadius: 16 }}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2"
        style={{ borderColor: "var(--allonce-line-soft)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded"
            style={{
              background: "var(--ao-accent-soft)",
              color: "var(--ao-accent)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[color:var(--ink-500)]">
              {scopeLabel ?? "Side chat"}
            </p>
            <p className="text-[11px] text-[color:var(--ink-400)]">
              {scope?.level ?? "org"}
              {scope?.org ? ` · ${scope.org}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              aria-label="Clear chat history"
              title="Clear chat history"
              className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--ink-400)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-900)]"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[color:var(--ink-400)] hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink-900)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <p className="text-xs text-[color:var(--ink-400)]">
            Ask anything about your leads, demos, or sales activity.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] rounded-xl px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-[color:var(--ao-accent)] text-white"
                    : "mr-auto bg-[color:var(--bg-sunken)] text-[color:var(--ink-800)]"
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="mr-auto inline-flex items-center gap-1.5 rounded-xl bg-[color:var(--bg-sunken)] px-3 py-2 text-xs text-[color:var(--ink-500)]">
                <Loader2 className="h-3 w-3 animate-spin" /> thinking…
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={send}
        className="border-t px-2 py-2"
        style={{ borderColor: "var(--allonce-line-soft)" }}
      >
        <div className="bf-card-sunken flex items-end gap-1 px-2 py-1.5">
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
            placeholder="Message…"
            className="flex-1 resize-none bg-transparent text-[13px] text-[color:var(--ink-900)] placeholder-[color:var(--ink-400)] focus:outline-none"
            style={{ maxHeight: 120 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            className="rounded-md p-1.5 text-white disabled:opacity-40"
            style={{ background: "var(--ao-accent)" }}
            aria-label="Send"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </form>
    </aside>
  );
}

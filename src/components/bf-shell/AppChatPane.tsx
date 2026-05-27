"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sparkles, Send, Loader2, X } from "lucide-react";

// BF-styled side chat. Visually matches travelplace-bf's AppChatPane shape
// (header / scrollable history / sticky composer) but keeps the chat backend
// thin — POSTs to /api/sales/chat which already supports tool-use.

export interface ChatScope {
  level: "org" | "tool" | "artifact" | string;
  org?: string;
  tool?: string;
  artifact?: string;
}

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface AppChatPaneProps {
  scope: ChatScope;
  scopeLabel: string;
  starters?: string[];
  onClose: () => void;
  apiPath?: string;
}

export function AppChatPane({
  scope,
  scopeLabel,
  starters,
  onClose,
  apiPath = "/api/sales/chat",
}: AppChatPaneProps) {
  const LS_KEY = `allone.chat.history.side.${apiPath}`;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  const clearHistory = () => {
    setMessages([]);
    try {
      localStorage.removeItem(LS_KEY);
    } catch {}
  };

  const send = async (text?: string, e?: FormEvent) => {
    e?.preventDefault();
    const t = (text ?? input).trim();
    if (!t || busy) return;
    const userMsg: Message = { role: "user", text: t };
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

  return (
    <aside className="flex h-full flex-col">
      <header
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: "var(--allone-line-soft)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{
              background: "var(--ao-accent-soft)",
              color: "var(--ao-accent)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="leading-tight">
            <p className="text-[12px] font-medium text-[var(--ink-900)]">
              {scopeLabel}
            </p>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-400)]">
              {scope.level}
              {scope.org ? ` · ${scope.org}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-medium text-[var(--ink-400)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-900)]"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className="rounded-md p-1 text-[var(--ink-400)] hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-900)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-[12px] text-[var(--ink-400)]">
              Ask anything about your leads, demos, or sales activity.
            </p>
            {starters && starters.length > 0 && (
              <div className="space-y-1.5">
                {starters.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => send(s)}
                    className="block w-full rounded-[var(--radius-xs)] border px-2.5 py-1.5 text-left text-[12px] text-[var(--ink-700)] transition hover:bg-[var(--bg-sunken)]"
                    style={{ borderColor: "var(--allone-line)" }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[88%] rounded-[var(--radius-sm)] px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto text-white"
                    : "mr-auto text-[var(--ink-800)]"
                }`}
                style={{
                  background:
                    m.role === "user" ? "var(--ao-accent)" : "var(--bg-sunken)",
                }}
              >
                {m.text}
              </div>
            ))}
            {busy && (
              <div
                className="mr-auto inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-2 text-xs text-[var(--ink-500)]"
                style={{ background: "var(--bg-sunken)" }}
              >
                <Loader2 className="h-3 w-3 animate-spin" /> thinking…
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => send(undefined, e)}
        className="border-t px-2 py-2"
        style={{ borderColor: "var(--allone-line-soft)" }}
      >
        <div
          className="flex items-end gap-1 rounded-[var(--radius-xs)] px-2 py-1.5"
          style={{ background: "var(--bg-sunken)" }}
        >
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
            className="flex-1 resize-none bg-transparent text-[13px] text-[var(--ink-900)] placeholder-[var(--ink-400)] focus:outline-none"
            style={{ maxHeight: 120 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || busy}
            aria-label="Send"
            className="rounded-md p-1.5 text-white transition disabled:opacity-40"
            style={{ background: "var(--ao-accent)" }}
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

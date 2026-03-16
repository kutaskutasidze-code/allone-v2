"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown } from "lucide-react";
import { ChatInput } from "./chat-input";
import { useAnimatedText } from "./use-animated-text";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#+\s/gm, "")
    .replace(/^[-*]\s/gm, "• ");
}

function AnimatedResultText({ text }: { text: string }) {
  const animated = useAnimatedText(stripMarkdown(text), " ");
  return <span>{animated}</span>;
}

interface SearchResult {
  score: number;
  chunk: {
    text: string;
    heading: string;
    lang: "en" | "ka";
  };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  results?: SearchResult[];
  loading?: boolean;
}

function SourceLink({ result }: { result: SearchResult }) {
  return (
    <Link
      href="/lab"
      className="flex items-center gap-2 py-1.5 hover:bg-accent/5 rounded px-1 -mx-1 transition-colors"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/allone-icon.png" alt="" width={14} height={14} className="shrink-0 opacity-40" />
      <span className="text-xs text-accent font-body leading-tight truncate underline-offset-2 hover:underline">
        {result.chunk.heading}
      </span>
    </Link>
  );
}

function SourcesCollapsible({ msgId, results, lang }: { msgId: string; results: SearchResult[]; lang: string }) {
  const [open, setOpen] = useState(false);
  const sourcesLabel = lang === "ka" ? "წყაროები" : "sources";

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 text-[11px] text-muted hover:text-heading
          transition-colors cursor-pointer font-body py-1"
      >
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        {results.length} {sourcesLabel}
      </button>
      {open && (
        <div className="pt-1">
          {results.map((r, i) => (
            <SourceLink key={`${msgId}-${i}`} result={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-3 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-accent/40"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

export function LabChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { lang } = useI18n();
  const askLabel = lang === "ka" ? "ჰკითხე AI-ს" : "Ask AI";

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClose = () => {
    setIsOpen(false);
    setMessages([]);
  };

  const handleSearch = async (query: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };

    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      loading: true,
    };

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsSearching(true);

    const history = messages
      .filter((m) => !m.loading)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history, lang }),
      });

      const data = await res.json();
      const results: SearchResult[] = data.results ?? [];
      const answer: string = data.answer ?? "";

      const assistantMsg: Message = {
        id: loadingMsg.id,
        role: "assistant",
        content: answer || (lang === "ka" ? "პასუხი ვერ გენერირდა." : "No answer could be generated."),
        results: results.length > 0 ? results : undefined,
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === loadingMsg.id ? assistantMsg : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? { ...m, content: lang === "ka" ? "ძიება ვერ მოხერხდა." : "Search failed. Try again.", loading: false }
            : m
        )
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* Stage 1: Trigger — icon + label */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 sm:top-auto sm:bottom-6 left-1/2 -translate-x-1/2 z-40
              flex flex-col items-center gap-1.5"
          >
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="w-12 h-12 rounded-full
                bg-transparent backdrop-blur-sm
                border border-border-light/50
                flex items-center justify-center cursor-pointer
                hover:border-accent/30 transition-all"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/allone-icon.png" alt="ALLONE" width={24} height={24} />
            </motion.button>
            <span className="text-[10px] text-heading font-semibold tracking-widest uppercase font-display">
              {askLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 2 & 3: Input pill → expanding chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-20 sm:top-auto sm:bottom-6 left-1/2 -translate-x-1/2 z-40
              w-[420px] max-w-[calc(100vw-48px)]
              flex flex-col items-stretch"
          >
            {/* Chat area — appears after first message, grows with content */}
            <AnimatePresence>
              {hasMessages && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="bg-white/5 backdrop-blur-lg rounded-2xl
                    border border-border shadow-2xl shadow-black/10
                    mb-2"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <h3 className="text-sm font-semibold text-heading font-display">
                        {lang === "ka" ? "კვანტური AI ძიება" : "Quantum AI Search"}
                      </h3>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-6 h-6 rounded-full hover:bg-surface-2 flex items-center justify-center
                        text-muted hover:text-heading transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Messages — grows with content, scrolls at max */}
                  <div
                    ref={scrollRef}
                    className="max-h-[55vh] overflow-y-auto scrollbar-hide px-4 py-3"
                    onWheel={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div key={msg.id}>
                          {msg.role === "user" ? (
                            <div className="flex justify-end">
                              <div className="bg-heading text-white px-3 py-2 rounded-xl rounded-br-sm max-w-[85%] text-xs font-body">
                                {msg.content}
                              </div>
                            </div>
                          ) : msg.loading ? (
                            <LoadingDots />
                          ) : (
                            <div className="space-y-1">
                              <div className="text-sm text-heading font-body leading-relaxed whitespace-pre-wrap">
                                <AnimatedResultText text={msg.content} />
                              </div>
                              {msg.results && (
                                <SourcesCollapsible msgId={msg.id} results={msg.results} lang={lang} />
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input — always visible when open */}
            <div className="relative">
              {/* Close button — only when input-only mode (no messages yet) */}
              {!hasMessages && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleClose}
                  className="absolute -top-9 right-1 w-6 h-6 rounded-full
                    bg-white/10 backdrop-blur-sm border border-border-light/50
                    flex items-center justify-center
                    text-muted hover:text-heading transition-colors cursor-pointer z-10"
                >
                  <X className="w-3 h-3" />
                </motion.button>
              )}
              <ChatInput
                onSend={handleSearch}
                disabled={isSearching}
                placeholder={lang === "ka" ? "მოძებნეთ კვლევები..." : "Search research papers..."}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

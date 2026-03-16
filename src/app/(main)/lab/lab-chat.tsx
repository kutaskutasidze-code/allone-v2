"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChatInput } from "./chat-input";
import { useAnimatedText } from "./use-animated-text";

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

const SUGGESTIONS = [
  "What is a Born machine?",
  "How does tensor compression work?",
  "Error mitigation results",
  "რა არის ბორნის მანქანა?",
];

function AnimatedResultText({ text }: { text: string }) {
  const animated = useAnimatedText(text, " ");
  return <span>{animated}</span>;
}

function ResultCard({
  result,
  index,
}: {
  result: SearchResult;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="border border-border-light rounded-xl p-4 bg-surface hover:bg-surface-2 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            result.chunk.lang === "en"
              ? "bg-accent/10 text-accent"
              : "bg-[#F5ABA0]/20 text-[#C0564A]"
          }`}
        >
          {result.chunk.lang === "en" ? "EN" : "KA"}
        </span>
        <span className="text-xs text-muted font-mono">
          {(result.score * 100).toFixed(1)}% match
        </span>
      </div>
      <h3 className="text-sm font-semibold text-heading mb-2 font-display">
        {result.chunk.heading}
      </h3>
      <p className="text-sm text-muted leading-relaxed font-body">
        <AnimatedResultText
          text={
            result.chunk.text.length > 400
              ? result.chunk.text.slice(0, 400) + "..."
              : result.chunk.text
          }
        />
      </p>
    </motion.div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 py-4 px-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-accent/40"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

export function LabChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

    try {
      const res = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      const results: SearchResult[] = data.results ?? [];

      const assistantMsg: Message = {
        id: loadingMsg.id,
        role: "assistant",
        content:
          results.length > 0
            ? `Found ${results.length} results for "${query}"`
            : `No results found for "${query}". Try different keywords or search in the other language.`,
        results: results.length > 0 ? results : undefined,
      };

      setMessages((prev) =>
        prev.map((m) => (m.id === loadingMsg.id ? assistantMsg : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingMsg.id
            ? {
                ...m,
                content: "Search failed. Please try again.",
                loading: false,
              }
            : m
        )
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100svh - 80px)" }}>
      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[55vh] gap-8">
              <div className="text-center space-y-3">
                <h2 className="text-2xl font-semibold text-heading font-display">
                  Quantum AI Research
                </h2>
                <p className="text-sm text-muted max-w-md font-body">
                  Search across our tensor compression, Born machine, and error
                  mitigation research. Supports English and Georgian.
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="px-4 py-2 text-sm text-muted bg-surface
                      border border-border-light rounded-full hover:bg-surface-2
                      hover:text-heading transition-all cursor-pointer font-body"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="bg-heading text-white px-4 py-2.5 rounded-2xl rounded-br-md max-w-md text-sm font-body">
                          {msg.content}
                        </div>
                      </div>
                    ) : msg.loading ? (
                      <LoadingDots />
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted font-body">
                          {msg.content}
                        </p>
                        {msg.results && (
                          <div className="space-y-3">
                            {msg.results.map((r, i) => (
                              <ResultCard
                                key={`${msg.id}-${i}`}
                                result={r}
                                index={i}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Input — sticky bottom */}
      <div className="sticky bottom-0 border-t border-border-light bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <ChatInput onSend={handleSearch} disabled={isSearching} />
        </div>
      </div>
    </div>
  );
}

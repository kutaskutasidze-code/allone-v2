"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  placeholder?: string;
  onSend?: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function ChatInput({
  placeholder = "Ask about our quantum AI research...",
  onSend,
  disabled = false,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = !shouldReduceMotion;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && onSend && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <motion.div
      className={cn("relative", className)}
      initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
    >
      <div className="relative rounded-full bg-white/5 backdrop-blur-sm border border-border-light/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "w-full border-none bg-transparent appearance-none",
              "text-heading placeholder:text-muted/60",
              "text-sm leading-5 py-1 px-0 h-7",
              "outline-none ring-0 shadow-none",
              "focus:outline-none focus:ring-0 focus:border-none focus:shadow-none",
              "font-body",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ outline: "none", boxShadow: "none" }}
          />

          <motion.button
            type="submit"
            onClick={handleSubmit}
            disabled={disabled || !message.trim()}
            className={cn(
              "flex items-center justify-center",
              "w-8 h-8 shrink-0",
              "text-muted hover:text-heading",
              "transition-colors cursor-pointer",
              (disabled || !message.trim()) &&
                "opacity-30 cursor-not-allowed"
            )}
            whileHover={
              shouldAnimate && message.trim() ? { scale: 1.1 } : {}
            }
            whileTap={
              shouldAnimate && message.trim() ? { scale: 0.9 } : {}
            }
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

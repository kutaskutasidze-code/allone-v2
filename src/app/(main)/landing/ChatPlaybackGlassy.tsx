'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { conversationScript } from '@/components/sections/services/constants';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

const BotAvatar = memo(() => (
  <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/80 shadow-[0_2px_6px_rgba(0,0,0,0.1)]">
    <Image src="/images/allone-icon.png" alt="ALLONE" width={24} height={24} className="object-contain" />
  </div>
));
BotAvatar.displayName = 'BotAvatar';

export function ChatPlaybackGlassy() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    let cancelled = false;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const typeText = async (text: string) => {
      for (let i = 0; i <= text.length; i++) {
        if (cancelled) return;
        setCurrentInput(text.slice(0, i));
        await sleep(35 + Math.random() * 25);
      }
    };

    const runConversation = async () => {
      while (!cancelled) {
        setMessages([]);
        setCurrentInput('');
        setIsTyping(false);
        await sleep(1500);

        for (const item of conversationScript) {
          if (cancelled) return;

          if (item.type === 'user') {
            await typeText(item.text);
            await sleep(350);
            if (cancelled) return;
            setIsSending(true);
            await sleep(150);
            setIsSending(false);
            setCurrentInput('');
            setMessages(prev => [...prev, { type: 'user', text: item.text }]);
            setTimeout(scrollToBottom, 50);
            await sleep(500);
          } else {
            if (cancelled) return;
            setIsTyping(true);
            setTimeout(scrollToBottom, 50);
            await sleep(1000 + item.text.length * 6);
            if (cancelled) return;
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: item.text }]);
            setTimeout(scrollToBottom, 50);
            await sleep(1200);
          }
        }
        await sleep(2500);
      }
    };

    runConversation();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="w-full rounded-[20px] overflow-hidden bg-white/20 sm:bg-white/10 backdrop-blur-md sm:backdrop-blur-3xl border border-white/20 shadow-[0_12px_80px_rgba(14,165,233,0.1),0_0_0_1px_rgba(255,255,255,0.5)_inset,0_1px_0_rgba(255,255,255,0.8)_inset]">
      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 bg-white/20 sm:bg-white/10 backdrop-blur-md sm:backdrop-blur-3xl border-b border-white/20 flex items-center gap-2 sm:gap-3">
        <div className="flex gap-1 sm:gap-1.5">
          <span className="w-[8px] sm:w-[10px] h-[8px] sm:h-[10px] rounded-full bg-[#ff5f57]" />
          <span className="w-[8px] sm:w-[10px] h-[8px] sm:h-[10px] rounded-full bg-[#febc2e]" />
          <span className="w-[8px] sm:w-[10px] h-[8px] sm:h-[10px] rounded-full bg-[#28c840]" />
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 ml-1">
          <BotAvatar />
          <span className="text-[10px] sm:text-[12px] text-gray-600 font-semibold tracking-[-0.01em]">ALLONE AI</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatContainerRef} className="h-[220px] sm:h-[280px] p-2.5 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto bg-white/5">
        {/* Welcome */}
        <div className="flex gap-1.5 sm:gap-2 items-end">
          <BotAvatar />
          <div className="bg-white/25 backdrop-blur-2xl rounded-xl sm:rounded-2xl rounded-bl-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 max-w-[82%] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white/40">
            <p className="text-[11px] sm:text-[13px] text-gray-700 leading-relaxed">Hi! How can I help you today?</p>
          </div>
        </div>

        {messages.map((msg, i) => (
          msg.type === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl sm:rounded-2xl rounded-br-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 max-w-[82%] shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-gray-800/30">
                <p className="text-[11px] sm:text-[13px] text-white leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-1.5 sm:gap-2 items-end">
              <BotAvatar />
              <div className="bg-white/25 backdrop-blur-2xl rounded-xl sm:rounded-2xl rounded-bl-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 max-w-[82%] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-white/40">
                <p className="text-[11px] sm:text-[13px] text-gray-700 leading-relaxed">{msg.text}</p>
              </div>
            </div>
          )
        ))}

        {isTyping && (
          <div className="flex gap-2 items-end">
            <BotAvatar />
            <div className="bg-gray-50/90 rounded-2xl rounded-bl-md px-3.5 py-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-200/50">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-gray-400/60 rounded-full animate-pulse [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400/60 rounded-full animate-pulse [animation-delay:200ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400/60 rounded-full animate-pulse [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-2 sm:px-3 py-2 sm:py-2.5 bg-white/20 sm:bg-white/10 backdrop-blur-md sm:backdrop-blur-3xl border-t border-white/20">
        <div className="bg-transparent backdrop-blur-none rounded-lg sm:rounded-xl flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 min-h-[32px] sm:min-h-[38px] border border-white/20">
          <div className="flex-1 min-w-0 flex items-center">
            {currentInput ? (
              <span className="text-[11px] sm:text-[13px] text-gray-800 break-words leading-relaxed">{currentInput}</span>
            ) : (
              <span className="text-[11px] sm:text-[13px] text-gray-400">Type a message...</span>
            )}
          </div>
          <motion.button
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-900/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
            animate={isSending ? { scale: [1, 0.85, 1] } : {}}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <motion.svg
              className="w-3.5 h-3.5 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={isSending ? { x: [0, 3, 0] } : {}}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </motion.svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { conversationScript } from './constants';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

// ALLONE logo avatar — same as navbar
const BotAvatar = memo(({ size = 'md' }: { size?: 'sm' | 'md' }) => {
  const px = size === 'sm' ? 22 : 32;
  return (
    <div className="flex-shrink-0 rounded-full overflow-hidden" style={{ width: px, height: px }}>
      <Image
        src="/images/allone-logo.png"
        alt="ALLONE"
        width={px}
        height={px}
        className="object-contain"
      />
    </div>
  );
});
BotAvatar.displayName = 'BotAvatar';

// iOS spring easing
const iosSpring = { type: 'spring' as const, damping: 25, stiffness: 350, mass: 0.8 };

export function ChatPlayback() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);
  const [loopCount, setLoopCount] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ 
        top: chatContainerRef.current.scrollHeight, 
        behavior: 'smooth' 
      });
    }
  };

  useEffect(() => {
    const animation = animationRef.current;
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const typeText = async (text: string) => {
      for (let i = 0; i <= text.length; i++) {
        if (animation.cancelled) return;
        setCurrentInput(text.slice(0, i));
        await sleep(15 + Math.random() * 20); // Slightly faster typing
      }
    };

    const runConversation = async () => {
      while (!animation.cancelled) {
        setMessages([]);
        setCurrentInput('');
        setIsTyping(false);
        setDeliveryStatus(null);
        await sleep(1000);

        for (const item of conversationScript) {
          if (animation.cancelled) return;

          if (item.type === 'user') {
            await typeText(item.text);
            await sleep(300);
            if (animation.cancelled) return;
            setIsSending(true);
            await sleep(150);
            setIsSending(false);
            setCurrentInput('');
            setMessages(prev => [...prev, { type: 'user', text: item.text }]);
            setDeliveryStatus('Delivered');
            setTimeout(scrollToBottom, 50);
            await sleep(600);
            setDeliveryStatus('Read');
            await sleep(500);
          } else {
            if (animation.cancelled) return;
            setDeliveryStatus(null);
            setIsTyping(true);
            setTimeout(scrollToBottom, 50);
            await sleep(800 + item.text.length * 3);
            if (animation.cancelled) return;
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: item.text }]);
            setTimeout(scrollToBottom, 100);
            await sleep(1500);
          }
        }
        await sleep(4000);
        setLoopCount(prev => prev + 1);
      }
    };

    runConversation();
    return () => { animation.cancelled = true; };
  }, []);

  const lastUserMsgIndex = messages.reduce((acc, msg, i) => msg.type === 'user' ? i : acc, -1);

  return (
    <div className="rounded-[22px] bg-[#F8FAFE] border border-[#DCE9F6]/80 overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_0.5px_rgba(0,0,0,0.04)]">
      {/* iOS-style nav bar header */}
      <div className="px-4 py-2.5 bg-white/70 backdrop-blur-2xl border-b border-[#DCE9F6]/60">
        <div className="flex items-center gap-2.5">
          <svg className="w-[18px] h-[18px] text-[#0A68F5] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <BotAvatar size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-[#071D2F] leading-tight tracking-[-0.01em]">ALLONE AI</p>
            <p className="text-[11px] text-[#34C759] leading-tight flex items-center gap-1 mt-[1px]">
              <span className="w-[5px] h-[5px] rounded-full bg-[#34C759] inline-block" />
              Online
            </p>
          </div>
          <div className="flex items-center gap-4">
            <svg className="w-[18px] h-[18px] text-[#0A68F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <svg className="w-[18px] h-[18px] text-[#0A68F5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div ref={chatContainerRef} className="h-[250px] px-3 py-3 space-y-[6px] overflow-y-auto scroll-smooth">
        <div className="flex justify-center mb-2">
          <span className="text-[10px] text-[#8E8E93] bg-[#E5E5EA]/40 px-2 py-0.5 rounded-full">Today 10:24 AM</span>
        </div>

        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={`msg-${loopCount}-${i}`}
              initial={{ opacity: 0, y: 16, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={iosSpring}
            >
              {msg.type === 'user' ? (
                <div className="flex flex-col items-end">
                  <div className="bg-[#0A68F5] rounded-[18px] rounded-br-[6px] px-3 py-[7px] max-w-[78%]">
                    <p className="text-[14px] text-white leading-[1.35] tracking-[-0.01em]">{msg.text}</p>
                  </div>
                  {i === lastUserMsgIndex && deliveryStatus && (
                    <motion.p
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 0.6, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="text-[10px] text-[#8E8E93] mt-[2px] mr-1 font-normal"
                    >
                      {deliveryStatus === 'Read' ? 'Read' : 'Delivered'}
                    </motion.p>
                  )}
                </div>
              ) : (
                <div className="flex gap-[6px] items-end">
                  <BotAvatar size="sm" />
                  <div className="bg-white rounded-[18px] rounded-bl-[6px] px-3 py-[7px] max-w-[78%] shadow-[0_0.5px_1px_rgba(0,0,0,0.04)] border border-[#E5E5EA]/50">
                    <p className="text-[14px] text-[#1C1C1E] leading-[1.35] tracking-[-0.01em]">{msg.text}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && (
            <motion.div
              key="typing-indicator"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={iosSpring}
              className="flex gap-[6px] items-end"
            >
              <BotAvatar size="sm" />
              <div className="bg-white rounded-[18px] rounded-bl-[6px] px-3.5 py-[9px] shadow-[0_0.5px_1px_rgba(0,0,0,0.04)] border border-[#E5E5EA]/50">
                <div className="flex gap-[4px] items-center h-[14px]">
                  <motion.span
                    className="w-[7px] h-[7px] bg-[#8E8E93] rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1, 0.85] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                  />
                  <motion.span
                    className="w-[7px] h-[7px] bg-[#8E8E93] rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1, 0.85] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                  />
                  <motion.span
                    className="w-[7px] h-[7px] bg-[#8E8E93] rounded-full"
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1, 0.85] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-2 py-[6px] bg-white/70 backdrop-blur-2xl border-t border-[#DCE9F6]/60">
        <div className="flex items-end gap-[6px]">
          <button className="w-[30px] h-[30px] rounded-full bg-[#0A68F5] flex items-center justify-center flex-shrink-0 mb-[1px]">
            <svg className="w-[16px] h-[16px] text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div className="flex-1 bg-[#F2F2F7] rounded-[20px] px-3 py-[6px] flex items-center min-h-[34px] border border-[#E5E5EA]/60">
            {currentInput ? (
              <span className="text-[14px] text-[#1C1C1E] break-words leading-[1.35] tracking-[-0.01em]">{currentInput}</span>
            ) : (
              <span className="text-[14px] text-[#C7C7CC] tracking-[-0.01em]">iMessage</span>
            )}
          </div>
          <motion.button
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 mb-[1px]"
            animate={isSending ? { scale: [1, 0.75, 1.1, 1] } : {}}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <svg className="w-[26px] h-[26px] text-[#0A68F5]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}

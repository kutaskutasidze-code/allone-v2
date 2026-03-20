'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { type ChannelConfig, conversationScript } from './channelConfigs';
import { useI18n } from '@/lib/i18n';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

const iosSpring = { type: 'spring' as const, damping: 25, stiffness: 350, mass: 0.8 };

const BotAvatar = memo(({ channel }: { channel: ChannelConfig }) => {
  if (!channel.showAvatar) return null;

  if (channel.avatarStyle === 'allone-logo') {
    return (
      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
        <Image src="/images/allone-logo.png" alt="ALLONE" width={28} height={28} className="object-contain" />
      </div>
    );
  }

  if (channel.avatarStyle === 'story-circle') {
    return (
      <div className="w-7 h-7 rounded-full flex-shrink-0 p-[2px]" style={{ background: 'linear-gradient(135deg, #833AB4, #E1306C, #F77737)' }}>
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // blue-circle (Messenger)
  return (
    <div className="w-7 h-7 rounded-full flex-shrink-0 bg-[#0084FF] flex items-center justify-center">
      <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
});
BotAvatar.displayName = 'BotAvatar';

function Checkmarks() {
  return (
    <span className="text-[10px] text-blue-400 ml-1 inline-flex items-center">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 12 5 16 12 6" />
        <polyline points="7 12 11 16 18 6" />
      </svg>
    </span>
  );
}

function TypingIndicator({ channel }: { channel: ChannelConfig }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={iosSpring}
      className="flex gap-1.5 items-end"
    >
      <BotAvatar channel={channel} />
      <div
        className="px-3 py-2 shadow-sm"
        style={{
          backgroundColor: channel.botBubble.bg,
          borderRadius: channel.botBubble.radius,
          border: channel.id === 'telegram' ? '1px solid #E5E7EB' : undefined,
        }}
      >
        <div className="flex gap-1 items-center h-[14px]">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.span
              key={i}
              className="w-[6px] h-[6px] bg-gray-400 rounded-full"
              animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1, 0.85] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export function ChannelChatUI({ channel }: { channel: ChannelConfig }) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const anim = { cancelled: false };
    animRef.current = anim;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const run = async () => {
      while (!anim.cancelled) {
        setMessages([]);
        setIsTyping(false);
        await sleep(800);

        for (const item of conversationScript) {
          if (anim.cancelled) return;

          if (item.type === 'user') {
            await sleep(600);
            if (anim.cancelled) return;
            setMessages(prev => [...prev, { type: 'user', text: t(item.textKey) }]);
            setTimeout(scrollToBottom, 50);
            await sleep(800);
          } else {
            if (anim.cancelled) return;
            setIsTyping(true);
            setTimeout(scrollToBottom, 50);
            await sleep(1200);
            if (anim.cancelled) return;
            setIsTyping(false);
            setMessages(prev => [...prev, { type: 'bot', text: t(item.textKey) }]);
            setTimeout(scrollToBottom, 50);
            await sleep(1500);
          }
        }
        await sleep(3500);
        setLoopCount(prev => prev + 1);
      }
    };

    run();
    return () => { anim.cancelled = true; };
  }, [channel.id, t]);

  // Channel-specific background
  const chatBg = channel.id === 'whatsapp'
    ? '#ECE5DD'
    : channel.id === 'telegram'
    ? '#8BABC7'
    : '#F8F8F8';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-3 py-2.5 flex items-center gap-2.5"
        style={{ background: channel.headerBg, color: channel.headerText }}
      >
        <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <BotAvatar channel={channel} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-tight">ALLONE AI</p>
          <p className="text-[10px] opacity-80 leading-tight mt-[1px]">Online</p>
        </div>
        <div className="flex items-center gap-3 opacity-80">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatRef}
        className="flex-1 px-3 py-3 space-y-2 overflow-y-auto scroll-smooth"
        style={{ backgroundColor: chatBg }}
      >
        <AnimatePresence mode="popLayout">
          {messages.map((msg, i) => (
            <motion.div
              key={`${loopCount}-${i}`}
              initial={{ opacity: 0, y: 14, scale: 0.93 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={iosSpring}
            >
              {msg.type === 'user' ? (
                <div className="flex justify-end">
                  <div
                    className="px-3 py-[6px] max-w-[80%] shadow-sm relative"
                    style={{
                      backgroundColor: channel.userBubble.bg,
                      color: channel.userBubble.text,
                      borderRadius: channel.userBubble.radius,
                      borderBottomRightRadius: channel.showTail ? '4px' : undefined,
                    }}
                  >
                    <p className="text-[13px] leading-[1.35]">{msg.text}</p>
                    {channel.showCheckmarks && (
                      <div className="flex items-center justify-end gap-0.5 mt-0.5">
                        <span className="text-[9px] opacity-50">10:24</span>
                        <Checkmarks />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-1.5 items-end">
                  <BotAvatar channel={channel} />
                  <div
                    className="px-3 py-[6px] max-w-[80%] shadow-sm"
                    style={{
                      backgroundColor: channel.botBubble.bg,
                      color: channel.botBubble.text,
                      borderRadius: channel.botBubble.radius,
                      borderBottomLeftRadius: channel.showTail ? '4px' : undefined,
                      border: channel.id === 'telegram' ? '1px solid #E5E7EB' : undefined,
                    }}
                  >
                    <p className="text-[13px] leading-[1.35]">{msg.text}</p>
                    {channel.showCheckmarks && (
                      <div className="flex items-center justify-end gap-0.5 mt-0.5">
                        <span className="text-[9px] opacity-50">10:24</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {isTyping && <TypingIndicator channel={channel} />}
        </AnimatePresence>
      </div>

      {/* Input bar */}
      <div className="px-2.5 py-2 bg-white border-t border-gray-100 flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full px-3 py-1.5">
          <span className="text-[12px] text-gray-400">{t('chatbot.input.placeholder')}</span>
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: channel.brandColor }}
        >
          <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Globe, X, Send } from 'lucide-react';

// Filled SVG icons for mobile dock — crisp at small sizes
function IconHome({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12.71 2.29a1 1 0 00-1.42 0l-9 9a1 1 0 001.42 1.42L4 12.41V21a1 1 0 001 1h5a1 1 0 001-1v-5h2v5a1 1 0 001 1h5a1 1 0 001-1v-8.59l.29.3a1 1 0 001.42-1.42l-9-9z"/>
    </svg>
  );
}

function IconServices({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M13 2l.5 4.5c.3 2.7 2.3 4.7 5 5l4.5.5-4.5.5c-2.7.3-4.7 2.3-5 5L13 22l-.5-4.5c-.3-2.7-2.3-4.7-5-5L3 12l4.5-.5c2.7-.3 4.7-2.3 5-5L13 2z"/>
      <path d="M6 2l.2 1.5c.1 1.1.9 1.9 2 2L9.7 5.7 8.2 5.9c-1.1.1-1.9.9-2 2L6 9.4l-.2-1.5c-.1-1.1-.9-1.9-2-2L2.3 5.7l1.5-.2c1.1-.1 1.9-.9 2-2L6 2z"/>
    </svg>
  );
}

function IconWork({ className }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v11a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z"/>
    </svg>
  );
}

function IconLab({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={`${className} translate-y-[2.5px]`}>
      <path d="M9 2v7.06l-5.47 8.6A2 2 0 005.22 21h13.56a2 2 0 001.69-3.34L15 9.06V2h1a1 1 0 100-2H8a1 1 0 000 2h1zm2 0h2v7.5a1 1 0 00.16.54L16.5 15h-9l3.34-4.96A1 1 0 0011 9.5V2z"/>
    </svg>
  );
}
import { useI18n } from '@/lib/i18n';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function Header() {
  const [hovered, setHovered] = useState<string | null>(null);
  const { lang, setLang, t } = useI18n();
  const pathname = usePathname();
  const isKa = lang === 'ka';

  // Mobile state
  const [isMobile, setIsMobile] = useState(false);

  // Chat state
  const [chatMode, setChatMode] = useState<'closed' | 'input' | 'expanded'>('closed');
  const [hasUnread, setHasUnread] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (chatMode === 'input') {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [chatMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const openChat = () => {
    setChatMode(messages.length > 0 ? 'expanded' : 'input');
    setHasUnread(false);
  };

  const closeChat = () => {
    setChatMode('closed');
    setMessages([]);
    setInputValue('');
    setHasUnread(false);
  };

  const minimizeChat = () => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      setHasUnread(true);
    }
    setChatMode('closed');
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setInputValue('');

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text };
    const assistantId = (Date.now() + 1).toString();

    setMessages(prev => [...prev, userMsg]);
    setChatMode('expanded');
    setIsStreaming(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', isStreaming: true }]);

      const res = await fetch('/api/allone-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: data.response || 'No response.', isStreaming: false } : m
      ));
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "Sorry, something went wrong. Try again.", isStreaming: false }
          : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    if (e.key === 'Escape') {
      minimizeChat();
    }
  };

  const navItems = [
    { name: 'Home', i18nKey: 'nav.home', href: '/', icon: IconHome },
    { name: 'Services', i18nKey: 'nav.services', href: '/#services', icon: IconServices },
    { name: 'Work', i18nKey: 'nav.work', href: '/work', icon: IconWork },
    { name: 'Lab', i18nKey: 'nav.lab', href: '/lab', icon: IconLab },
  ];

  const dockWidth = isMobile ? 'auto' : chatMode === 'closed' ? 780 : 400;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 mb-5 pointer-events-none">
      {/* Premium chat panel above dock */}
      <AnimatePresence>
        {chatMode === 'expanded' && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="pointer-events-auto mb-2 bg-white/80 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden"
            style={{ width: '400px', maxWidth: 'calc(100vw - 48px)' }}
          >
            <div className="h-px bg-gradient-to-r from-transparent via-[#071D2F]/[0.08] to-transparent" />
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#F8FAFE]/40 border-b border-[#071D2F]/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-[#071D2F] font-display">ALLONE AI</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={minimizeChat} className="w-6 h-6 rounded-full hover:bg-[#071D2F]/[0.04] flex items-center justify-center text-[#4D4D4D] hover:text-[#071D2F] transition-colors cursor-pointer">
                  <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" rx="1" fill="currentColor"/></svg>
                </button>
                <button onClick={closeChat} className="w-6 h-6 rounded-full hover:bg-[#071D2F]/[0.04] flex items-center justify-center text-[#4D4D4D] hover:text-[#071D2F] transition-colors cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="max-h-[45vh] overflow-y-auto px-4 py-3 space-y-3"
              onWheel={(e) => e.stopPropagation()}
            >
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-[#071D2F] text-white px-3.5 py-2.5 rounded-2xl rounded-br-sm max-w-[85%] text-xs shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F4F7FB]/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                      <div className="text-sm text-[#071D2F] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                        {msg.isStreaming && (
                          <span className="inline-flex items-center gap-1 ml-1.5 align-middle">
                            <motion.span className="w-1.5 h-1.5 rounded-full bg-[#071D2F]/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
                            <motion.span className="w-1.5 h-1.5 rounded-full bg-[#071D2F]/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
                            <motion.span className="w-1.5 h-1.5 rounded-full bg-[#071D2F]/50" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock pill */}
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1, width: dockWidth }}
        transition={{
          width: { type: 'spring', stiffness: 200, damping: 28 },
          y: { type: 'spring', stiffness: 260, damping: 24, delay: 0.3 },
          opacity: { duration: 0.3 },
        }}
        className="pointer-events-auto rounded-full bg-white/50 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] max-w-[calc(100vw-32px)]"
      >
        <AnimatePresence mode="wait">
          {chatMode === 'closed' ? (
            <motion.div
              key="nav"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex items-center justify-between px-4 sm:px-5 py-1.5"
            >
              {isMobile ? (
                <>
                  {/* Mobile: icon nav */}
                  {navItems.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : item.href.startsWith('/#') ? pathname === '/' : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                      <Link key={item.name} href={item.href} className="relative w-10 h-10 flex items-center justify-center rounded-full">
                        {isActive && (
                          <motion.div
                            layoutId="dock-lamp"
                            className="absolute inset-0 bg-[#071D2F]/[0.05] rounded-full -z-10"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#071D2F] rounded-t-full">
                              <div className="absolute w-12 h-6 bg-[#071D2F]/20 rounded-full blur-md -top-2 -left-2" />
                            </div>
                          </motion.div>
                        )}
                        <Icon className={isActive ? 'text-[#071D2F]' : 'text-[#071D2F]/40'} />
                      </Link>
                    );
                  })}

                  <div className="w-px h-5 bg-[#071D2F]/10" />

                  {/* Language */}
                  <button
                    onClick={() => setLang(isKa ? 'en' : 'ka')}
                    className="w-10 h-10 flex items-center justify-center rounded-full text-[#071D2F]/40"
                  >
                    <Globe size={18} strokeWidth={1.5} />
                  </button>

                  {/* Ask AI */}
                  <button
                    onClick={openChat}
                    className="relative px-3 py-2 rounded-full text-xs font-semibold text-[#071D2F]/70 whitespace-nowrap"
                  >
                    {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#071D2F] rounded-full ring-2 ring-white animate-pulse" />}
                    AI
                  </button>
                </>
              ) : (
                <>
                  {/* Desktop: logo + text nav */}
                  <Link href="/" className="flex items-center gap-2 pl-1 pr-2">
                    <Image src="/images/allone-logo-transparent.png" alt="allone" width={26} height={26} className="object-contain" />
                    <span className="font-display font-semibold text-[15px] tracking-tight text-[#071D2F]">AllOne</span>
                  </Link>

                  <div className="w-px h-5 bg-[#071D2F]/10 mx-1" />

                  {navItems.map((item) => {
                    const isActive = item.href === '/' ? pathname === '/' : item.href.startsWith('/#') ? pathname === '/' : pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onMouseEnter={() => setHovered(item.name)}
                        onMouseLeave={() => setHovered(null)}
                        className={`relative px-4 py-2 text-[13px] font-medium rounded-full transition-colors duration-150 ${
                          isActive ? 'text-[#071D2F]' : 'text-[#071D2F]/60 hover:text-[#071D2F]'
                        }`}
                      >
                        {isActive && <div className="absolute inset-0 bg-[#071D2F]/[0.06] rounded-full" />}
                        {hovered === item.name && !isActive && (
                          <motion.div layoutId="dock-hover" className="absolute inset-0 bg-[#071D2F]/[0.04] rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                        )}
                        <span className="relative z-10">{item.i18nKey ? t(item.i18nKey) : item.name}</span>
                      </Link>
                    );
                  })}

                  <div className="w-px h-5 bg-[#071D2F]/10 mx-1" />

                  <button onClick={() => setLang(isKa ? 'en' : 'ka')} className="w-8 h-8 flex items-center justify-center rounded-full text-[#071D2F]/40 hover:text-[#071D2F] transition-colors cursor-pointer" title={isKa ? 'Switch to English' : 'ქართულად'}>
                    <Globe size={16} strokeWidth={1.5} />
                  </button>

                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={openChat} className="relative px-4 py-2 rounded-full text-[13px] font-semibold text-[#071D2F]/70 hover:text-[#071D2F] transition-colors cursor-pointer whitespace-nowrap">
                    {hasUnread && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#071D2F] rounded-full ring-2 ring-white animate-pulse" />}
                    {isKa ? 'ჰკითხე AI-ს' : 'Ask AI'}
                  </motion.button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat-input"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex items-center justify-center gap-2 w-full px-4 py-1.5"
            >
              <button onClick={minimizeChat} className="w-8 h-8 flex items-center justify-center rounded-full text-[#071D2F]/40 hover:text-[#071D2F] transition-colors cursor-pointer shrink-0">
                <X size={16} />
              </button>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isKa ? 'იკითხეთ რაიმე...' : 'Ask anything...'}
                className="flex-1 bg-transparent text-[16px] sm:text-sm text-[#071D2F] placeholder:text-[#071D2F]/30 py-2 border-none outline-none"
                style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
                disabled={isStreaming}
              />
              <button onClick={sendMessage} disabled={!inputValue.trim() || isStreaming} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#071D2F] text-white disabled:opacity-30 transition-opacity cursor-pointer shrink-0">
                <Send size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/layout';
import { useEffect, useRef, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Send } from 'lucide-react';
import { PulsingBorder } from '@paper-design/shaders-react';

const IntroAnimation = dynamic(
  () => import('@/components/intro').then((m) => m.IntroAnimation),
  { ssr: false }
);

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayedContent?: string;
}

// Typewriter component for streaming effect
function TypewriterText({ text, onComplete, onType }: { text: string; onComplete?: () => void; onType?: () => void }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;

    let index = 0;
    const speed = 20; // ms per character

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        onType?.(); // Trigger scroll on each character
      } else {
        clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, isComplete, onComplete, onType]);

  return <>{displayedText}</>;
}

export function Hero() {
  const [isChatActive, setIsChatActive] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [shaderReady, setShaderReady] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Determine whether to show intro animation
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const alreadyPlayed = sessionStorage.getItem('allone-intro-played') === 'true';

    if (prefersReduced || alreadyPlayed) {
      setIntroComplete(true);
      setShowIntro(false);
    } else {
      setShowIntro(true);
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem('allone-intro-played', 'true');
    setShowIntro(false);
    setIntroComplete(true);
  }, []);

  // Wait for shader to initialize before showing button
  useEffect(() => {
    const timer = setTimeout(() => setShaderReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const openChat = useCallback(() => {
    setIsChatActive(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const closeChat = useCallback(() => {
    setIsChatActive(false);
    setMessages([]);
    setInput('');
    setStreamingMessageId(null);
  }, []);

  // Global ESC key listener
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatActive) {
        closeChat();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isChatActive, closeChat]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessageId);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't connect. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingMessageId(errorMessage.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section className="min-h-[100svh] relative overflow-hidden bg-[var(--black)]">
      {/* Intro animation overlay */}
      {showIntro && (
        <div className="fixed inset-0 z-[60] bg-[#0B0B0B]">
          <IntroAnimation onComplete={handleIntroComplete} />
        </div>
      )}
      <Container>
        {/* Fixed height container - button position never changes */}
        <div className="min-h-[100svh] flex flex-col items-center justify-center relative z-10 py-20">

          {/* Upper content area - fixed height so button stays in place */}
          <div className="h-[300px] flex flex-col items-center justify-end mb-4 relative">
            {/* Hero content - fades out */}
            <div
              className={`
                flex flex-col items-center text-center
                transition-all duration-500 ease-out
                ${isChatActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}
              `}
            >
              {/* Monospace subtitle */}
              <motion.p
                initial={{ opacity: 0, filter: 'blur(12px)' }}
                animate={introComplete ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(12px)' }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.76, 0, 0.24, 1] }}
                className="mono-label mb-6"
              >
                Automate the Mundane — Unleash the Remarkable
              </motion.p>

              {/* Display heading */}
              <motion.h1
                initial={{ opacity: 0, filter: 'blur(12px)', y: 8 }}
                animate={introComplete ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(12px)', y: 8 }}
                transition={{ duration: 0.9, delay: 0.25, ease: [0.76, 0, 0.24, 1] }}
                className="text-[clamp(3rem,6vw,5rem)] font-light leading-[0.95] tracking-[-0.03em] text-white mb-6"
              >
                The Future<br />Runs Itself
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, filter: 'blur(12px)', y: 8 }}
                animate={introComplete ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(12px)', y: 8 }}
                transition={{ duration: 0.8, delay: 0.45, ease: [0.76, 0, 0.24, 1] }}
                className="text-base lg:text-lg text-white/60 max-w-md leading-relaxed"
              >
                We design and build intelligent automation systems that transform how businesses operate, scale, and compete.
              </motion.p>

            </div>

            {/* Chat messages area - classic chatbot layout */}
            <div
              className={`
                absolute inset-0 flex flex-col justify-end
                w-full max-w-lg mx-auto px-4
                transition-all duration-500 ease-out
                ${isChatActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}
              `}
            >
              {/* Messages container - scrollable, content aligned to bottom */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto flex flex-col justify-end"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

                {/* Fade gradient at top */}
                {messages.length > 0 && (
                  <div className="sticky top-0 h-6 bg-gradient-to-b from-[var(--black)] to-transparent pointer-events-none" />
                )}

                {/* Messages */}
                <div className="space-y-4 pb-4">
                  {messages.map((message) => (
                    <div key={message.id} className="animate-blur-reveal">
                      {message.role === 'user' ? (
                        <p className="text-sm text-white/70 text-left">{message.content}</p>
                      ) : (
                        <p className="text-[15px] text-white leading-relaxed text-left">
                          {streamingMessageId === message.id ? (
                            <TypewriterText
                              text={message.content}
                              onComplete={() => setStreamingMessageId(null)}
                              onType={scrollToBottom}
                            />
                          ) : (
                            message.content
                          )}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex items-center gap-1.5 py-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ask AI - Button that expands into input */}
          <motion.div
            initial={{ opacity: 0, filter: 'blur(12px)', y: 8 }}
            animate={shaderReady && introComplete ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(12px)', y: 8 }}
            transition={{ duration: 0.8, delay: shaderReady && introComplete ? 0.7 : 0, ease: [0.76, 0, 0.24, 1] }}
            className="relative flex justify-center items-center"
          >
            {/* PulsingBorder container - entire area is clickable */}
            <div
              onClick={!isChatActive ? openChat : undefined}
              className={`
                relative flex items-center justify-center
                transition-all duration-500 ease-out
                ${isChatActive ? 'w-[calc(100vw-32px)] sm:w-[480px] md:w-[540px] h-[60px] sm:h-[80px]' : 'w-[280px] sm:w-[320px] h-[70px] sm:h-[80px] cursor-pointer'}
              `}
            >
              {/* PulsingBorder shader - hidden when chat active */}
              <div className={`absolute inset-0 transition-opacity duration-500 ${isChatActive ? 'opacity-0' : 'opacity-100'}`}>
                <PulsingBorder
                  speed={0.79}
                  roundness={1}
                  thickness={0.03}
                  softness={0.75}
                  intensity={0.25}
                  bloom={0.3}
                  spots={5}
                  spotSize={0.5}
                  pulse={0.25}
                  smoke={0.3}
                  smokeSize={0.6}
                  scale={0.6}
                  rotation={0}
                  aspectRatio="auto"
                  colors={['#233944', '#262426', '#F6F3F3C2']}
                  colorBack="#00000000"
                  className="w-full h-full"
                />
              </div>

              {/* Inner content - Button */}
              <div className={`relative z-10 flex items-center gap-2 sm:gap-3 ${isChatActive ? '' : 'pl-2 sm:pl-4'}`}>
                {/* Ask AI button / Input area */}
                <div
                  className={`
                    relative h-[44px] sm:h-[50px] rounded-full
                    flex items-center justify-center
                    transition-all duration-500 ease-out
                    ${!isChatActive ? 'w-[140px] sm:w-[160px]' : 'w-[calc(100vw-64px)] sm:w-[400px] md:w-[460px]'}
                  `}
                >
                  {/* "Ask AI" text */}
                  <div
                    className={`
                      flex items-center gap-2
                      transition-all duration-300
                      ${isChatActive ? 'opacity-0 scale-90 absolute' : 'opacity-100 scale-100'}
                    `}
                  >
                    <span
                      className="text-sm sm:text-base font-medium tracking-wide text-white pr-2 sm:pr-4"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      Ask AI
                    </span>
                  </div>

                  {/* Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading || !isChatActive}
                    placeholder={isChatActive ? "Ask anything..." : ""}
                    className={`
                      w-full h-full px-4 sm:px-6 pr-10 sm:pr-12
                      text-sm font-medium tracking-wide
                      bg-transparent text-white rounded-full
                      outline-none text-left caret-white
                      placeholder:text-[var(--muted-warm)] placeholder:font-normal
                      transition-all duration-300
                      ${isChatActive ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}
                    `}
                  />

                  {/* Send button */}
                  <div className={`
                    absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1
                    transition-all duration-200
                    ${isChatActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                  `}>
                    <button
                      onClick={(e) => { e.stopPropagation(); sendMessage(); }}
                      disabled={isLoading || !input.trim()}
                      className="p-1.5 text-white hover:text-[var(--muted-warm)] disabled:opacity-30 transition-all duration-200"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Close button - below on mobile, outside on desktop */}
            <button
              onClick={closeChat}
              className={`
                absolute z-20
                p-2 rounded-full
                text-white hover:text-[var(--muted-warm)] hover:bg-white/5
                transition-all duration-300
                top-full mt-3 left-1/2 -translate-x-1/2 sm:mt-0 sm:top-1/2 sm:-translate-y-1/2 sm:translate-x-0 sm:left-full sm:ml-2
                ${isChatActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
              `}
              aria-label="Close chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

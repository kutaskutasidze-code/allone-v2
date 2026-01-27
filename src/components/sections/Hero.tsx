'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/layout';
import { useEffect, useRef, useState, useCallback } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import { ArrowRight, Send, Mic } from 'lucide-react';
import { LiquidMetal, PulsingBorder } from '@paper-design/shaders-react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulseOffset: number;
  color: { rgb: string; opacity: number };
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  displayedContent?: string;
}

const colors = [
  { rgb: '80, 80, 80', opacity: 0.85 },
  { rgb: '100, 100, 100', opacity: 0.75 },
  { rgb: '120, 120, 120', opacity: 0.65 },
  { rgb: '90, 90, 90', opacity: 0.8 },
  { rgb: '110, 110, 110', opacity: 0.7 },
];

function ConnectedNodes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let nodes: Node[] = [];
    let isPaused = false;
    const connectionDistance = 160;
    const nodeCount = 60;

    const getCanvasDimensions = () => {
      const parent = canvas.parentElement;
      if (!parent) return { width: window.innerWidth, height: window.innerHeight };
      return { width: parent.offsetWidth, height: parent.offsetHeight };
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const { width, height } = getCanvasDimensions();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    const initNodes = () => {
      nodes = [];
      const { width, height } = getCanvasDimensions();
      const isMobile = width < 768;
      const count = isMobile ? 25 : nodeCount;
      const speed = isMobile ? 0.1 : 0.12;
      const padding = 30;

      for (let i = 0; i < count; i++) {
        // Random size with more variation (some tiny, some large)
        const sizeRand = Math.random();
        let radius;
        if (sizeRand < 0.3) {
          radius = isMobile ? 1.5 : 2; // Small dots
        } else if (sizeRand < 0.7) {
          radius = isMobile ? 2.5 : 3.5; // Medium dots
        } else {
          radius = isMobile ? 3.5 : 5; // Large dots
        }

        nodes.push({
          x: padding + Math.random() * (width - padding * 2),
          y: padding + Math.random() * (height - padding * 2),
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          radius,
          pulseOffset: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = (time: number) => {
      if (isPaused) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const { width, height } = getCanvasDimensions();
      ctx.clearRect(0, 0, width, height);

      const padding = 20;
      const maxVel = 0.25;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < padding) { node.x = padding; node.vx *= -1; }
        else if (node.x > width - padding) { node.x = width - padding; node.vx *= -1; }
        if (node.y < padding) { node.y = padding; node.vy *= -1; }
        else if (node.y > height - padding) { node.y = height - padding; node.vy *= -1; }

        node.vx = Math.max(-maxVel, Math.min(maxVel, node.vx));
        node.vy = Math.max(-maxVel, Math.min(maxVel, node.vy));
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < connectionDistance * connectionDistance) {
            const opacity = (1 - Math.sqrt(distSq) / connectionDistance) * 0.35;
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * 1.5})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const radius = node.radius;

        // Draw outer lighter ring first
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${node.color.rgb}, 0.10)`;
        ctx.fill();

        // Draw inner solid circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${node.color.rgb}, ${node.color.opacity})`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resize();
    initNodes();

    let lastWidth = window.innerWidth;
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newWidth = window.innerWidth;
        resize();
        if (Math.abs(newWidth - lastWidth) > 50) {
          initNodes();
          lastWidth = newWidth;
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(animate);

    const handleVisibilityChange = () => {
      isPaused = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
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
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTime, setVoiceTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

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

  // Voice mode timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isVoiceActive) {
      intervalId = setInterval(() => setVoiceTime(t => t + 1), 1000);
    } else {
      setVoiceTime(0);
    }
    return () => clearInterval(intervalId);
  }, [isVoiceActive]);

  const toggleVoice = useCallback(() => {
    if (isVoiceActive) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsVoiceActive(false);
      return;
    }

    // Start listening with Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setInput('Voice recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInput(transcript);

      // If final result, auto-send
      if (event.results[event.results.length - 1].isFinal) {
        setIsVoiceActive(false);
        // Send after a short delay to show the transcribed text
        setTimeout(() => {
          const fakeInput = transcript.trim();
          if (fakeInput) {
            setInput('');
            const userMessage: Message = {
              id: Date.now().toString(),
              role: 'user',
              content: fakeInput,
            };
            setMessages(prev => [...prev, userMessage]);
            setIsLoading(true);

            fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
              }),
            })
              .then(res => res.json())
              .then(data => {
                if (data.error) throw new Error(data.error);
                const id = (Date.now() + 1).toString();
                setMessages(prev => [...prev, { id, role: 'assistant', content: data.reply }]);
                setStreamingMessageId(id);
              })
              .catch(() => {
                const id = (Date.now() + 1).toString();
                setMessages(prev => [...prev, { id, role: 'assistant', content: "Sorry, I couldn't connect. Please try again." }]);
                setStreamingMessageId(id);
              })
              .finally(() => setIsLoading(false));
          }
        }, 300);
      }
    };

    recognition.onerror = () => {
      setIsVoiceActive(false);
    };

    recognition.onend = () => {
      setIsVoiceActive(false);
    };

    recognition.start();
    setIsVoiceActive(true);
  }, [isVoiceActive, messages]);

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
    <section className="min-h-[100svh] relative overflow-hidden">
      <ConnectedNodes />

      <Container>
        {/* Fixed height container - button position never changes */}
        <div className="min-h-[100svh] flex flex-col items-center justify-center relative z-10 py-20">

          {/* Upper content area - fixed height so button stays in place */}
          <div className="h-[260px] flex flex-col items-center justify-end mb-4 relative">
            {/* Hero content - fades out */}
            <div
              className={`
                flex flex-col items-center text-center
                transition-all duration-500 ease-out
                ${isChatActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}
              `}
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-[clamp(2.5rem,6vw,4rem)] font-light leading-[1.1] tracking-[-0.02em] text-[var(--black)] mb-6"
              >
                The Future Runs Itself
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="text-base lg:text-lg text-[var(--gray-500)] max-w-md leading-relaxed"
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
                  <div className="sticky top-0 h-6 bg-gradient-to-b from-white to-transparent pointer-events-none" />
                )}

                {/* Messages */}
                <div className="space-y-4 pb-4">
                  {messages.map((message) => (
                    <div key={message.id} className="animate-fade-in">
                      {message.role === 'user' ? (
                        <p className="text-sm text-black text-left">{message.content}</p>
                      ) : (
                        <p className="text-[15px] text-black leading-relaxed text-left">
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

                  {/* Voice mode visualization - AI Voice style */}
                  {isVoiceActive && (
                    <div className="flex flex-col items-center gap-2 py-4 animate-fade-in">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVoice(); }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-none hover:bg-black/5 transition-colors"
                        type="button"
                      >
                        <div
                          className="w-4 h-4 rounded-sm animate-spin bg-black cursor-pointer"
                          style={{ animationDuration: '3s' }}
                        />
                      </button>
                      <span className="font-mono text-sm text-black/70">
                        {`${Math.floor(voiceTime / 60).toString().padStart(2, '0')}:${(voiceTime % 60).toString().padStart(2, '0')}`}
                      </span>
                      <div className="h-4 w-48 flex items-center justify-center gap-0.5">
                        {[...Array(40)].map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 rounded-full bg-black/50 animate-pulse"
                            style={{
                              height: `${20 + Math.random() * 80}%`,
                              animationDelay: `${i * 0.05}s`,
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-black/60">Listening...</p>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isLoading && !isVoiceActive && (
                    <div className="flex items-center gap-1.5 py-2">
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ask AI - Button that expands into input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={shaderReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: shaderReady ? 0.9 : 0 }}
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

              {/* Inner content - LiquidMetal + Button */}
              <div className={`relative z-10 flex items-center gap-2 sm:gap-3 ${isChatActive ? '' : 'pl-2 sm:pl-4'}`}>
                {/* LiquidMetal circle with AI Voice - hidden when chat active */}
                <div
                  className={`flex-shrink-0 relative transition-all duration-500 overflow-hidden cursor-pointer ${isChatActive ? 'opacity-0 scale-90 w-0' : 'opacity-100 scale-100'}`}
                  onClick={(e) => { e.stopPropagation(); if (!isChatActive) { openChat(); setTimeout(() => toggleVoice(), 300); } }}
                >
                  {/* LiquidMetal background */}
                  <LiquidMetal
                    speed={isVoiceActive ? 1.2 : 0.68}
                    softness={0.1}
                    repetition={2}
                    shiftRed={isVoiceActive ? 0.5 : 0.3}
                    shiftBlue={isVoiceActive ? 0.5 : 0.3}
                    distortion={isVoiceActive ? 0.12 : 0.07}
                    contour={0.4}
                    scale={0.6}
                    rotation={0}
                    shape="circle"
                    angle={70}
                    image="https://workers.paper.design/file-assets/01KF3FJDBVRQRC2Z21M10KBDQ5/01KF3JVMCGH3M6TG0XEQ9ZA6S3.svg"
                    colorBack="#00000000"
                    colorTint="#FFFFFF"
                    className="w-[44px] h-[44px] sm:w-[56px] sm:h-[56px] rounded-full"
                  />
                  {/* Mic icon overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-black/60 drop-shadow-sm" />
                  </div>
                </div>

                {/* Ask AI button / Input area */}
                <div
                  className={`
                    relative h-[44px] sm:h-[50px] rounded-full
                    flex items-center justify-center
                    transition-all duration-500 ease-out
                    ${!isChatActive ? 'w-[140px] sm:w-[160px]' : 'w-[calc(100vw-64px)] sm:w-[400px] md:w-[460px]'}
                  `}
                >
                  {/* LiquidMetal sparkle + "Ask AI" text */}
                  <div
                    className={`
                      flex items-center gap-2
                      transition-all duration-300
                      ${isChatActive ? 'opacity-0 scale-90 absolute' : 'opacity-100 scale-100'}
                    `}
                  >
                    <LiquidMetal
                      speed={0.68}
                      softness={0.1}
                      repetition={2}
                      shiftRed={0.3}
                      shiftBlue={0.3}
                      distortion={0.07}
                      contour={0.4}
                      scale={0.6}
                      rotation={0}
                      shape="circle"
                      angle={70}
                      image="https://workers.paper.design/file-assets/01KF3FJDBVRQRC2Z21M10KBDQ5/01KF3JVMCGH3M6TG0XEQ9ZA6S3.svg"
                      colorBack="#00000000"
                      colorTint="#FFFFFF"
                      className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full flex-shrink-0"
                    />
                    <span className="text-sm sm:text-base font-medium tracking-wide text-[var(--black)] pr-2 sm:pr-4">
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
                      bg-transparent text-black rounded-full
                      outline-none text-left caret-black
                      placeholder:text-black/50 placeholder:font-normal
                      transition-all duration-300
                      ${isChatActive ? 'opacity-100' : 'opacity-0 pointer-events-none absolute'}
                    `}
                  />

                  {/* Action buttons - mic + send */}
                  <div className={`
                    absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1
                    transition-all duration-200
                    ${isChatActive ? 'opacity-100' : 'opacity-0 pointer-events-none'}
                  `}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVoice(); }}
                      className={`
                        p-1.5 rounded-full transition-all duration-200
                        ${isVoiceActive
                          ? 'bg-black text-white scale-110'
                          : 'text-black/40 hover:text-black/70 hover:bg-black/5'}
                      `}
                      aria-label={isVoiceActive ? 'Stop voice' : 'Start voice'}
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); sendMessage(); }}
                      disabled={isLoading || !input.trim() || isVoiceActive}
                      className="p-1.5 text-black hover:text-black/70 disabled:opacity-30 transition-all duration-200"
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
                text-black hover:text-black/70 hover:bg-black/5
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

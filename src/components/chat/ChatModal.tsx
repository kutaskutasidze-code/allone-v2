'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, User, Loader2, Mic, MicOff, ArrowRight } from 'lucide-react';

interface ServiceData {
  id: string;
  title: string;
  description: string;
  icon: string;
  card_type: string | null;
  features: string[];
  cta_url: string | null;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  services?: ServiceData[];
  isStreaming?: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Service card with fade-in animation
const ServiceCard = memo(function ServiceCard({ service, index }: { service: ServiceData; index: number }) {
  return (
    <motion.a
      href={service.cta_url || `/services/${service.card_type?.replace(/_/g, '-') || ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.15 }}
      className="block border border-black/10 rounded-xl p-3 hover:border-black/25 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-2">
        <span className="text-lg">{service.icon || '🤖'}</span>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-black truncate">{service.title}</h4>
          <p className="text-[11px] text-black/60 line-clamp-2 mt-0.5">{service.description}</p>
          {service.features.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {service.features.map((f, i) => (
                <span key={i} className="text-[10px] bg-black/5 text-black/70 px-1.5 py-0.5 rounded">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-black/30 flex-shrink-0 mt-0.5" />
      </div>
    </motion.a>
  );
});

// Memoized message component
const ChatMessage = memo(function ChatMessage({ message }: { message: Message }) {
  return (
    <div className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          message.role === 'user' ? 'bg-black/10' : 'bg-black'
        }`}
      >
        {message.role === 'user' ? (
          <User className="w-4 h-4 text-black" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={`max-w-[80%] space-y-2 ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            message.role === 'user'
              ? 'bg-black text-white rounded-tr-sm'
              : 'bg-black/5 text-black rounded-tl-sm'
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-1.5 h-4 bg-black/60 ml-1 align-middle" 
              />
            )}
          </div>
        </div>
        {/* Service cards appear after text */}
        {message.services && message.services.length > 0 && (
          <div className="w-full space-y-1.5">
            {message.services.map((service, i) => (
              <ServiceCard key={service.id} service={service} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

// Isolated input component - typing here won't re-render messages
const ChatInput = memo(function ChatInput({
  onSend,
  isDisabled,
  isRecording,
  isTranscribing,
  isStreaming,
  onToggleRecording,
  inputRef,
}: {
  onSend: (text: string) => void;
  isDisabled: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  isStreaming: boolean;
  onToggleRecording: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim() && !isDisabled) {
      onSend(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Expose method to set input value from parent (for transcription)
  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      (input as HTMLInputElement & { setExternalValue?: (v: string) => void }).setExternalValue = (v: string) => {
        setInputValue(prev => prev + (prev ? ' ' : '') + v);
      };
    }
  }, [inputRef]);

  return (
    <div className="px-6 py-4 border-t border-black/5 bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isTranscribing ? "Transcribing..." : isRecording ? "Listening..." : isStreaming ? "AI is responding..." : "Type or speak your message..."}
          className="flex-1 px-4 py-3 bg-black/5 rounded-xl text-base sm:text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
          disabled={isDisabled}
          style={{ fontSize: '16px' }} // Explicitly set to 16px to prevent iOS zoom
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleRecording}
            disabled={isDisabled}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
                : isTranscribing
                  ? 'bg-black/5 text-black/30'
                  : 'bg-black/5 text-black hover:bg-black/10'
            } disabled:cursor-not-allowed`}
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isDisabled}
            className="w-11 h-11 rounded-xl bg-black text-white flex items-center justify-center hover:bg-black/90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/10"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-[10px] text-black/40 text-center mt-3 font-medium uppercase tracking-widest">
        Powered by ALLONE AI
      </p>
    </div>
  );
});

// Messages list component - isolated from input state
const MessagesList = memo(function MessagesList({
  messages,
  messagesContainerRef,
  messagesEndRef,
  onScroll,
}: {
  messages: Message[];
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
}) {
  return (
    <div
      ref={messagesContainerRef}
      onScroll={onScroll}
      className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4 scroll-smooth"
      style={{
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        isolation: 'isolate',
      }}
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} className="h-4 w-full" />
    </div>
  );
});

export function ChatModal({ isOpen, onClose }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm the ALLONE AI Assistant. I can help you learn about our AI automation services, answer questions about how we work, or help you get started. What would you like to know?",
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastScrollTopRef = useRef(0);

  const isInputDisabled = isStreaming || isTranscribing;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, [shouldAutoScroll]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

    if (scrollTop < lastScrollTopRef.current && !isAtBottom) {
      setShouldAutoScroll(false);
    } else if (isAtBottom) {
      setShouldAutoScroll(true);
    }

    lastScrollTopRef.current = scrollTop;
  }, []);

  // Auto-scroll on new messages or content updates
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom, shouldAutoScroll]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      setShouldAutoScroll(true);
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    const assistantId = (Date.now() + 1).toString();
    const loadingMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '...',
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsStreaming(true);
    setShouldAutoScroll(true);

    try {
      const response = await fetch('/api/allone-ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // The current backend is NOT streaming, it returns full JSON.
      // But we will simulate streaming for better UX or prepare for real streaming.
      const data = await response.json();
      
      if (data.response) {
        // Simulate streaming typewriter effect
        const fullContent = data.response;
        let currentContent = '';
        const words = fullContent.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          currentContent += (i === 0 ? '' : ' ') + words[i];
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId ? { ...msg, content: currentContent } : msg
            )
          );
          // Faster typing
          await new Promise(r => setTimeout(r, 15 + Math.random() * 20));
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { 
                ...msg, 
                content: "I'm sorry, I'm having trouble connecting right now. Please try again or contact us directly at info@allone.ge", 
                isStreaming: false 
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  }, [messages, isStreaming]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          const response = await fetch('/api/allone-ai/chat', { 
            method: 'POST', 
            body: formData 
          });
          const data = await response.json();
          if (data.transcript) {
            sendMessage(data.transcript);
          }
        } catch (error) {
          console.error('Transcription error:', error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }, [sendMessage]);

  const toggleRecording = useCallback(() => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    } else {
      startRecording();
    }
  }, [isRecording, startRecording]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[460px] bg-white z-50 flex flex-col shadow-[-20px_0_50px_-20px_rgba(0,0,0,0.1)] border-l border-black/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-black/5 bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shadow-lg shadow-black/10">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-black text-base tracking-tight">ALLONE AI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Live Response</p>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-black/5 rounded-xl transition-all active:scale-95 group"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-black/40 group-hover:text-black transition-colors" />
              </button>
            </div>

            <MessagesList
              messages={messages}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              onScroll={handleScroll}
            />

            <ChatInput
              onSend={sendMessage}
              isDisabled={isInputDisabled}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              isStreaming={isStreaming}
              onToggleRecording={toggleRecording}
              inputRef={inputRef}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

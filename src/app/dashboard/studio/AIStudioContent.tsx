'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Bot,
  User,
  Zap,
  Mic,
  FileText,
  Plus,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Star,
  Trash2,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createAction?: {
    type: string;
    config: Record<string, unknown>;
  };
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  chat_messages?: { id: string; role: string; content: string; created_at: string }[];
}

interface Product {
  id: string;
  name: string;
  type: string;
  status: string;
  created_at: string;
}

interface AIStudioContentProps {
  user: {
    id: string;
    email?: string;
  };
  products: Product[];
  profile: {
    pricing_tiers?: {
      name: string;
      max_products: number;
    };
  } | null;
}

const productTypeIcons: Record<string, typeof Zap> = {
  automation: Zap,
  voice_agent: Mic,
  rag_bot: FileText,
};

const productTypeLabels: Record<string, string> = {
  automation: 'Automation',
  voice_agent: 'Voice AI',
  rag_bot: 'RAG Bot',
};

const MAX_MESSAGE_LENGTH = 4000;

const QUICK_PROMPTS = [
  { icon: Zap, label: 'Lead capture automation', prompt: 'I need an automation to capture leads from my website form and notify my team on Slack' },
  { icon: Mic, label: 'Phone receptionist', prompt: 'Create a voice AI that answers calls, takes messages, and schedules appointments' },
  { icon: FileText, label: 'Support chatbot', prompt: 'I want a chatbot that can answer customer questions from my FAQ documents' },
];

export default function AIStudioContent({ user, products, profile }: AIStudioContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [sessions, setSessions] = useState<{ starred: ChatSession[]; recent: ChatSession[] }>({ starred: [], recent: [] });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await fetch('/api/chat/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session.id);
        setMessages([]);
        await loadSessions();
        return data.session.id;
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
    return null;
  };

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        const loadedMessages: Message[] = data.messages.map((m: { id: string; role: string; content: string; created_at: string }) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at),
        }));
        setMessages(loadedMessages);
        setCurrentSessionId(sessionId);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }, []);

  const saveMessage = async (sessionId: string, role: 'user' | 'assistant', content: string) => {
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, role, content }),
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const toggleStar = async (sessionId: string, currentStarred: boolean) => {
    try {
      await fetch('/api/chat/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, is_starred: !currentStarred }),
      });
      await loadSessions();
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/chat/sessions?sessionId=${sessionId}`, { method: 'DELETE' });
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Client-side validation
    if (input.length > MAX_MESSAGE_LENGTH) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Message too long. Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Create session if needed
    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Save user message
    await saveMessage(sessionId, 'user', userMessage.content);

    try {
      const response = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        createAction: data.createAction,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message
      await saveMessage(sessionId, 'assistant', assistantMessage.content);

      // Reload sessions to update titles
      await loadSessions();

      // If there's a create action, show confirmation
      if (data.createAction) {
        // Auto-create the product
        await handleCreateProduct(data.createAction, sessionId);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(sessionId, 'assistant', errorMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (createAction: { type: string; config: Record<string, unknown> }, sessionId: string) => {
    try {
      const endpoint = `/api/ecosystem/${createAction.type === 'voice_agent' ? 'voice-agent' : createAction.type === 'rag_bot' ? 'rag-bot' : 'automation'}`;

      // Merge config with settings and ensure assign_phone for voice agents
      const requestBody = {
        ...createAction.config,
        ...(createAction.config.settings || {}),
        assign_phone: createAction.type === 'voice_agent' ? true : undefined,
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedProduct(data.product);

        // Build success message based on product type
        let successContent = `I've created your ${productTypeLabels[createAction.type] || 'product'} "${createAction.config.name}".`;

        if (createAction.type === 'voice_agent') {
          if (data.phone_number) {
            successContent += `\n\nPhone Number: ${data.phone_number}\n\nYou can test it by calling this number! Find more details in your Voice AI dashboard.`;
          } else if (data.warning) {
            successContent += `\n\n${data.warning}\n\nYour agent configuration is saved. Check the Voice AI dashboard for status updates.`;
          } else {
            successContent += `\n\nGo to your Voice AI dashboard to see details and configure the phone number.`;
          }
        } else if (createAction.type === 'rag_bot') {
          successContent += `\n\nGo to your RAG Bots dashboard to upload documents and get the embed code.`;
        } else {
          successContent += `\n\nGo to your Workflows dashboard to configure triggers and actions.`;
        }

        const successMessage: Message = {
          id: `success-${Date.now()}`,
          role: 'assistant',
          content: successContent,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
        await saveMessage(sessionId, 'assistant', successContent);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create product' }));
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Failed to create the product: ${errorData.error || 'Unknown error'}. Please try again.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        await saveMessage(sessionId, 'assistant', errorMessage.content);
      }
    } catch (error) {
      console.error('Create product error:', error);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const allSessions = [...sessions.starred, ...sessions.recent];

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Sidebar - Full Left */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 250, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 border-r border-black/[0.04] bg-[#f5f5f7]/80 overflow-hidden"
          >
            <div className="w-[250px] h-full flex flex-col">
              {/* New Chat Button */}
              <div className="p-2.5 border-b border-black/[0.04]">
                <button
                  onClick={startNewChat}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1d1d1f] text-white text-[13px] font-medium hover:bg-[#3a3a3c] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2">
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--gray-400)]" />
                  </div>
                ) : allSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-[var(--gray-300)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--gray-500)]">No chats yet</p>
                  </div>
                ) : (
                  <>
                    {sessions.starred.length > 0 && (
                      <div className="mb-3">
                        <p className="text-[10px] font-semibold text-[var(--gray-400)] uppercase tracking-wider mb-1.5">
                          Starred
                        </p>
                        {sessions.starred.map((session) => (
                          <SessionItem
                            key={session.id}
                            session={session}
                            isActive={currentSessionId === session.id}
                            onSelect={() => loadSession(session.id)}
                            onToggleStar={() => toggleStar(session.id, session.is_starred)}
                            onDelete={() => deleteSession(session.id)}
                          />
                        ))}
                      </div>
                    )}
                    {sessions.recent.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--gray-400)] uppercase tracking-wider mb-1.5">
                          Recent
                        </p>
                        {sessions.recent.map((session) => (
                          <SessionItem
                            key={session.id}
                            session={session}
                            isActive={currentSessionId === session.id}
                            onSelect={() => loadSession(session.id)}
                            onToggleStar={() => toggleStar(session.id, session.is_starred)}
                            onDelete={() => deleteSession(session.id)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-black/[0.04] bg-white/80 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded-lg hover:bg-black/[0.04] transition-colors"
            >
              {showSidebar ? (
                <PanelLeftClose className="w-[18px] h-[18px] text-[#86868b]" />
              ) : (
                <PanelLeft className="w-[18px] h-[18px] text-[#86868b]" />
              )}
            </button>
            <div>
              <h1 className="text-[15px] font-semibold text-[#1d1d1f] tracking-tight">AI Studio</h1>
            </div>
          </div>
          {profile?.pricing_tiers && (
            <div className="text-right">
              <p className="text-[11px] text-[#86868b] font-medium">
                {profile.pricing_tiers.name} · {products.length}/{profile.pricing_tiers.max_products === -1 ? '∞' : profile.pricing_tiers.max_products}
              </p>
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto py-8 px-4 md:px-8 space-y-5 bg-[#fafafa] scroll-smooth">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0, rotate: -10 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-24 h-24 rounded-[28px] bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c] flex items-center justify-center mb-8 shadow-2xl shadow-black/20"
                >
                  <Sparkles className="w-12 h-12 text-white/90" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="text-3xl font-bold text-[#1d1d1f] mb-3 tracking-tight"
                >
                  What would you like to build?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[#86868b] max-w-md mb-12 leading-relaxed text-[15px]"
                >
                  Describe what you need in plain English, and I&apos;ll help you create automations, voice agents, or AI chatbots.
                </motion.p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
                  {QUICK_PROMPTS.map((prompt, index) => {
                    const Icon = prompt.icon;
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.3 + index * 0.08,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-black/[0.04] shadow-sm hover:shadow-md transition-all duration-300 text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center group-hover:bg-[#1d1d1f] transition-colors duration-300">
                          <Icon className="w-[18px] h-[18px] text-[#6e6e73] group-hover:text-white transition-colors duration-300" />
                        </div>
                        <span className="text-[13px] font-medium text-[#1d1d1f] flex-1 leading-tight">
                          {prompt.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#d2d2d7] group-hover:text-[#1d1d1f] group-hover:translate-x-0.5 transition-all duration-200" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                      delay: index === messages.length - 1 ? 0.05 : 0
                    }}
                    className={cn(
                      'flex gap-3 group/message',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c] flex items-center justify-center flex-shrink-0 shadow-sm mt-1"
                      >
                        <Bot className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                    <div className="relative max-w-[72%]">
                      <div
                        className={cn(
                          'rounded-[20px] px-4 py-3 transition-all duration-200',
                          message.role === 'user'
                            ? 'bg-[#1d1d1f] text-white shadow-sm'
                            : 'bg-white border border-black/[0.04] shadow-sm'
                        )}
                      >
                        <p className="text-[14px] leading-[1.5] whitespace-pre-wrap break-words">{message.content}</p>
                        {message.createAction && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 pt-3 border-t border-black/[0.06]"
                          >
                            <div className="flex items-center gap-2 text-xs text-[#86868b]">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                              >
                                <Loader2 className="w-3.5 h-3.5 text-[#34c759]" />
                              </motion.div>
                              Creating {productTypeLabels[message.createAction.type]}...
                            </div>
                          </motion.div>
                        )}
                      </div>
                      {/* Timestamp on hover */}
                      <span
                        className={cn(
                          'absolute -bottom-5 text-[10px] text-[#aeaeb2] opacity-0 group-hover/message:opacity-100 transition-opacity duration-300',
                          message.role === 'user' ? 'right-1' : 'left-1'
                        )}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {message.role === 'user' && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="w-8 h-8 rounded-full bg-[#e5e5ea] flex items-center justify-center flex-shrink-0 mt-1"
                      >
                        <User className="w-4 h-4 text-[#636366]" />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1d1d1f] to-[#3a3a3c] flex items-center justify-center shadow-sm mt-1">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-black/[0.04] rounded-[20px] px-4 py-3.5 shadow-sm">
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="w-[7px] h-[7px] rounded-full bg-[#c7c7cc]"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.4, 1, 0.4],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.2,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-5 bg-[#fafafa]">
            <form onSubmit={handleSubmit} className="flex items-end gap-2.5 max-w-3xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build..."
                  rows={1}
                  maxLength={MAX_MESSAGE_LENGTH}
                  className={cn(
                    "w-full px-4 py-3.5 rounded-[22px] border focus:ring-0 focus:outline-none resize-none text-[14px] transition-all duration-200 bg-white placeholder:text-[#aeaeb2]",
                    input.length > MAX_MESSAGE_LENGTH * 0.9
                      ? "border-red-200 focus:border-red-300"
                      : "border-black/[0.06] focus:border-black/[0.12]"
                  )}
                  style={{ minHeight: '48px', maxHeight: '140px' }}
                />
                {input.length > MAX_MESSAGE_LENGTH * 0.8 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "absolute bottom-2 right-4 text-[10px]",
                      input.length > MAX_MESSAGE_LENGTH * 0.9 ? "text-red-400" : "text-[#aeaeb2]"
                    )}
                  >
                    {input.length}/{MAX_MESSAGE_LENGTH}
                  </motion.span>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isLoading ? { scale: 0.92 } : {}}
                transition={{ duration: 0.15 }}
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 mb-1',
                  input.trim() && !isLoading
                    ? 'bg-[#1d1d1f] text-white shadow-sm'
                    : 'bg-[#e5e5ea] text-[#aeaeb2] cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Created Product Toast */}
      <AnimatePresence>
        {createdProduct && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-[var(--gray-200)] p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--black)]">Product Created!</p>
              <p className="text-xs text-[var(--gray-500)]">{createdProduct.name}</p>
            </div>
            <button
              onClick={() => setCreatedProduct(null)}
              className="ml-4 text-xs text-[var(--gray-500)] hover:text-[var(--black)]"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Session Item Component
function SessionItem({
  session,
  isActive,
  onSelect,
  onToggleStar,
  onDelete,
}: {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onToggleStar: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
        isActive ? 'bg-white shadow-sm' : 'hover:bg-white/60'
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <MessageSquare className="w-3.5 h-3.5 text-[var(--gray-400)] flex-shrink-0" />
      <span className="text-[13px] text-[var(--gray-700)] truncate flex-1">
        {session.title}
      </span>

      {/* Actions */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar();
              }}
              className="p-1 rounded hover:bg-[var(--gray-200)] transition-colors"
            >
              <Star
                className={cn(
                  'w-3.5 h-3.5',
                  session.is_starred ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--gray-400)]'
                )}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-[var(--gray-400)] hover:text-red-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

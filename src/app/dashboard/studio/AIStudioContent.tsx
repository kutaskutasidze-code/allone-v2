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
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-r border-[var(--gray-200)] bg-[var(--gray-50)] overflow-hidden"
          >
            <div className="w-[260px] h-full flex flex-col">
              {/* New Chat Button */}
              <div className="p-2 border-b border-[var(--gray-200)]">
                <button
                  onClick={startNewChat}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--black)] text-white text-sm font-medium hover:bg-[var(--gray-800)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--gray-200)] bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-lg hover:bg-[var(--gray-100)] transition-colors"
            >
              {showSidebar ? (
                <PanelLeftClose className="w-5 h-5 text-[var(--gray-600)]" />
              ) : (
                <PanelLeft className="w-5 h-5 text-[var(--gray-600)]" />
              )}
            </button>
            <div>
              <h1 className="text-lg font-semibold text-[var(--black)]">AI Studio</h1>
              <p className="text-xs text-[var(--gray-500)]">
                Build AI products through conversation
              </p>
            </div>
          </div>
          {profile?.pricing_tiers && (
            <div className="text-right">
              <p className="text-xs text-[var(--gray-500)]">
                {profile.pricing_tiers.name} Plan
              </p>
              <p className="text-sm font-medium text-[var(--black)]">
                {products.length} / {profile.pricing_tiers.max_products === -1 ? 'Unlimited' : profile.pricing_tiers.max_products} products
              </p>
            </div>
          )}
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[var(--gray-50)]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--black)] to-[var(--gray-600)] flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--black)] mb-2">
                  What would you like to build?
                </h2>
                <p className="text-[var(--gray-500)] max-w-md mb-8">
                  Describe what you need in plain English, and I&apos;ll help you create automations, voice agents, or AI chatbots.
                </p>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-2xl">
                  {QUICK_PROMPTS.map((prompt, index) => {
                    const Icon = prompt.icon;
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--black)] hover:shadow-md transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[var(--gray-100)] flex items-center justify-center group-hover:bg-[var(--black)] transition-colors">
                          <Icon className="w-5 h-5 text-[var(--gray-600)] group-hover:text-white transition-colors" />
                        </div>
                        <span className="text-sm font-medium text-[var(--black)]">
                          {prompt.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[var(--gray-400)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 30,
                      delay: index === messages.length - 1 ? 0.05 : 0
                    }}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-9 h-9 rounded-full bg-[var(--black)] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.005 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'max-w-[70%] rounded-2xl px-5 py-4 shadow-sm',
                        message.role === 'user'
                          ? 'bg-[var(--black)] text-white'
                          : 'bg-white border border-[var(--gray-200)]'
                      )}
                    >
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      {message.createAction && (
                        <div className="mt-3 pt-3 border-t border-[var(--gray-200)]">
                          <div className="flex items-center gap-2 text-xs text-[var(--gray-500)]">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Creating {productTypeLabels[message.createAction.type]}...
                          </div>
                        </div>
                      )}
                    </motion.div>
                    {message.role === 'user' && (
                      <div className="w-9 h-9 rounded-full bg-[var(--gray-200)] flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[var(--gray-600)]" />
                      </div>
                    )}
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="flex gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--black)] flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-white border border-[var(--gray-200)] rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <motion.span
                          className="w-2 h-2 rounded-full bg-[var(--gray-400)]"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          className="w-2 h-2 rounded-full bg-[var(--gray-400)]"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.span
                          className="w-2 h-2 rounded-full bg-[var(--gray-400)]"
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 md:p-6 border-t border-[var(--gray-200)] bg-white">
            <form onSubmit={handleSubmit} className="flex gap-3 max-w-4xl mx-auto">
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
                    "w-full px-5 py-4 rounded-xl border focus:ring-1 resize-none text-[15px]",
                    input.length > MAX_MESSAGE_LENGTH * 0.9
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-[var(--gray-200)] focus:border-[var(--black)] focus:ring-[var(--black)]"
                  )}
                  style={{ minHeight: '56px', maxHeight: '150px' }}
                />
                {input.length > MAX_MESSAGE_LENGTH * 0.8 && (
                  <span className={cn(
                    "absolute bottom-1 right-2 text-[10px]",
                    input.length > MAX_MESSAGE_LENGTH * 0.9 ? "text-red-500" : "text-[var(--gray-400)]"
                  )}>
                    {input.length}/{MAX_MESSAGE_LENGTH}
                  </span>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={!input.trim() || isLoading}
                whileHover={input.trim() && !isLoading ? { scale: 1.02 } : {}}
                whileTap={input.trim() && !isLoading ? { scale: 0.98 } : {}}
                transition={{ duration: 0.15 }}
                className={cn(
                  'px-5 py-4 rounded-xl font-medium text-[15px] flex items-center gap-2 transition-all',
                  input.trim() && !isLoading
                    ? 'bg-[var(--black)] text-white hover:bg-[var(--gray-800)] hover:shadow-md'
                    : 'bg-[var(--gray-100)] text-[var(--gray-400)] cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Send
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

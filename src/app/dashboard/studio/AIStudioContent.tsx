'use client';

import { useState, useRef, useEffect } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

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

      // If there's a create action, show confirmation
      if (data.createAction) {
        // Auto-create the product
        await handleCreateProduct(data.createAction);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (createAction: { type: string; config: Record<string, unknown> }) => {
    try {
      const endpoint = `/api/ecosystem/${createAction.type === 'voice_agent' ? 'voice-agent' : createAction.type === 'rag_bot' ? 'rag-bot' : 'automation'}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createAction.config),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedProduct(data.product);

        // Add success message
        const successMessage: Message = {
          id: `success-${Date.now()}`,
          role: 'assistant',
          content: `✅ I've created your ${productTypeLabels[createAction.type] || 'product'} "${createAction.config.name}". You can find it in your dashboard.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, successMessage]);
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

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--black)]">AI Studio</h1>
          <p className="text-sm text-[var(--gray-500)] mt-1">
            Build AI products through conversation
          </p>
        </div>
        {profile?.pricing_tiers && (
          <div className="text-right">
            <p className="text-xs text-[var(--gray-500)]">
              {profile.pricing_tiers.name} Plan
            </p>
            <p className="text-sm font-medium text-[var(--black)]">
              {products.length} / {profile.pricing_tiers.max_products === -1 ? '∞' : profile.pricing_tiers.max_products} products
            </p>
          </div>
        )}
      </div>

      {/* Chat Container */}
      <div className="flex-1 flex flex-col bg-[var(--gray-50)] rounded-2xl border border-[var(--gray-200)] overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    <button
                      key={index}
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                      className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--black)] hover:shadow-sm transition-all text-left group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[var(--gray-100)] flex items-center justify-center group-hover:bg-[var(--black)] transition-colors">
                        <Icon className="w-5 h-5 text-[var(--gray-600)] group-hover:text-white transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-[var(--black)]">
                        {prompt.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--gray-400)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'flex gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-[var(--black)] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-[var(--black)] text-white'
                        : 'bg-white border border-[var(--gray-200)]'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.createAction && (
                      <div className="mt-3 pt-3 border-t border-[var(--gray-200)]">
                        <div className="flex items-center gap-2 text-xs text-[var(--gray-500)]">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Creating {productTypeLabels[message.createAction.type]}...
                        </div>
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[var(--gray-200)] flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-[var(--gray-600)]" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-[var(--black)] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white border border-[var(--gray-200)] rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--gray-500)]" />
                      <span className="text-sm text-[var(--gray-500)]">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[var(--gray-200)] bg-white">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build..."
                rows={1}
                className="w-full px-4 py-3 rounded-xl border border-[var(--gray-200)] focus:border-[var(--black)] focus:ring-1 focus:ring-[var(--black)] resize-none text-sm"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 transition-all',
                input.trim() && !isLoading
                  ? 'bg-[var(--black)] text-white hover:bg-[var(--gray-800)]'
                  : 'bg-[var(--gray-100)] text-[var(--gray-400)] cursor-not-allowed'
              )}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Recent Products Sidebar */}
      {products.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-[var(--gray-500)] mb-3">Recent Products</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {products.slice(0, 5).map((product) => {
              const Icon = productTypeIcons[product.type] || Zap;
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[var(--gray-200)] flex-shrink-0"
                >
                  <Icon className="w-4 h-4 text-[var(--gray-500)]" />
                  <span className="text-sm font-medium text-[var(--black)]">{product.name}</span>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full',
                    product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-[var(--gray-100)] text-[var(--gray-500)]'
                  )}>
                    {product.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

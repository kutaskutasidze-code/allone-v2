'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Check,
  ArrowRight,
  ArrowUp,
  Loader2,
  Copy,
  Mic,
  FileText,
  Zap,
  Terminal,
  Circle,
  Plus,
  Settings,
  LayoutDashboard,
  ChevronLeft,
  User,
  CreditCard,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Subscription {
  id: string;
  status: string;
  current_period_end: string;
  limits: {
    voice_agents: number;
    rag_bots: number;
    automations: number;
  };
}

interface Project {
  id: string;
  name: string;
  type: 'voice_agent' | 'rag_bot' | 'automation';
  status: string;
  created_at: string;
}

interface ProductsPageProps {
  isAuthenticated: boolean;
  hasSubscription: boolean;
  subscription: Subscription | null;
  projects: Project[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface CreateAction {
  action: 'create_project';
  type: 'voice_agent' | 'rag_bot' | 'automation';
  config: {
    name: string;
    description: string;
    systemPrompt?: string;
    templateId?: string;
  };
}

const productTypes = [
  {
    type: 'voice_agent' as const,
    title: 'Voice AI',
    description: 'Phone & web voice assistants',
    icon: Mic,
    specs: ['Real-time STT/TTS', 'Telephony integration', 'Custom personas'],
  },
  {
    type: 'rag_bot' as const,
    title: 'RAG Systems',
    description: 'Knowledge-base retrieval',
    icon: FileText,
    specs: ['Vector embeddings', 'Document parsing', 'Semantic search'],
  },
  {
    type: 'automation' as const,
    title: 'Workflows',
    description: 'Event-driven automation',
    icon: Zap,
    specs: ['500+ connectors', 'Conditional logic', 'Scheduled triggers'],
  },
];

export default function ProductsPage({
  isAuthenticated,
  hasSubscription,
  subscription,
  projects,
}: ProductsPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirectTo=/products');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        alert(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (hasSubscription && subscription) {
    return (
      <>
        <style jsx global>{`
          footer { display: none !important; }
          header { display: none !important; }
          main { padding-top: 0 !important; }
        `}</style>
        <AIStudio subscription={subscription} projects={projects} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Lab Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 mb-8"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gray-200)] bg-[var(--gray-50)]">
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              <span className="text-xs font-medium text-[var(--gray-600)] uppercase tracking-wider">Lab Online</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <h1 className="text-5xl md:text-7xl font-light text-[var(--black)] tracking-tight mb-4">
              AI Studio
            </h1>
            <p className="text-lg text-[var(--gray-500)] max-w-xl mx-auto font-light">
              Build production-ready AI systems through conversation.
              <br />
              No code required.
            </p>
          </motion.div>

          {/* Terminal Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto mt-12 mb-16"
          >
            <div className="bg-[var(--black)] rounded-xl overflow-hidden shadow-2xl shadow-black/20">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <span className="text-xs text-white/40 ml-2 font-mono">ai-studio</span>
              </div>

              {/* Terminal Content */}
              <div className="p-6 font-mono text-sm space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-white/40">$</span>
                  <span className="text-white/80">describe your AI product</span>
                </div>

                <div className="pl-6 text-white/60">
                  <TerminalTypewriter />
                </div>

                <div className="flex items-start gap-3 pt-4">
                  <Terminal className="w-4 h-4 text-white/40 mt-0.5" />
                  <div className="text-white/80">
                    <span className="text-green-400">✓</span> Analyzing requirements...
                    <br />
                    <span className="text-green-400">✓</span> Configuring voice model...
                    <br />
                    <span className="text-green-400">✓</span> Setting up telephony...
                    <br />
                    <span className="text-white/40">→</span> Ready to deploy
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Capabilities Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-3 gap-px bg-[var(--gray-200)] rounded-xl overflow-hidden mb-16"
          >
            {productTypes.map((product, index) => (
              <motion.div
                key={product.type}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white p-8 group"
              >
                <div className="w-10 h-10 rounded-lg border border-[var(--gray-200)] flex items-center justify-center mb-4 group-hover:border-[var(--black)] transition-colors">
                  <product.icon className="w-5 h-5 text-[var(--gray-600)] group-hover:text-[var(--black)] transition-colors" />
                </div>

                <h3 className="text-lg font-medium text-[var(--black)] mb-1">
                  {product.title}
                </h3>
                <p className="text-sm text-[var(--gray-500)] mb-4">
                  {product.description}
                </p>

                <ul className="space-y-2">
                  {product.specs.map((spec, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-[var(--gray-400)]">
                      <div className="w-1 h-1 rounded-full bg-[var(--gray-300)]" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>

          {/* Pricing Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="max-w-lg mx-auto"
          >
            <div className="border border-[var(--gray-200)] rounded-xl p-8">
              <div className="text-center mb-6">
                <p className="text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider mb-2">
                  Platform Access
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-light text-[var(--black)]">$100</span>
                  <span className="text-[var(--gray-400)]">/mo</span>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  '3 Voice AI agents',
                  '5 RAG chatbots',
                  '10 Automation workflows',
                  'AI building assistant',
                  'Hosted infrastructure',
                  'Priority support',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-[var(--gray-600)]">
                    <Check className="w-4 h-4 text-[var(--gray-400)]" />
                    {feature}
                  </div>
                ))}
              </div>

              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full py-3.5 bg-[var(--black)] text-white font-medium rounded-lg hover:bg-[var(--gray-800)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Enter Lab
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              {!isAuthenticated && (
                <p className="text-center mt-4 text-xs text-[var(--gray-400)]">
                  Have an account?{' '}
                  <Link href="/login?redirectTo=/products" className="text-[var(--black)] hover:underline">
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          </motion.div>

          {/* Footer Note */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8 text-xs text-[var(--gray-400)]"
          >
            Secure checkout via PayPal · Cancel anytime
          </motion.p>
        </div>
      </div>
    </div>
  );
}

// Terminal typewriter that doesn't restart
function TerminalTypewriter() {
  const text = "I need a voice assistant for my dental clinic that can book appointments and answer FAQs...";
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <span className="select-none">
      {displayText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}

// Dashboard nav items - same as dashboard layout
const dashboardNavItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'AI Studio', icon: Terminal },
  { href: '/dashboard/voice', label: 'Voice AI', icon: Mic },
  { href: '/dashboard/rag', label: 'RAG Bots', icon: FileText },
  { href: '/dashboard/bots', label: 'Workflows', icon: Zap },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

// Full-screen AI Studio Chat Interface
function AIStudio({ subscription, projects }: { subscription: Subscription; projects: Project[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "What would you like to build today?\n\nI can help you create Voice AI agents, RAG chatbots, or automation workflows. Just describe your use case.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [createdProject, setCreatedProject] = useState<{
    id: string;
    type: string;
    embed_code?: string;
    iframe_embed?: string;
    webhook_url?: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    if (href === '/products') return pathname.startsWith('/products');
    return pathname.startsWith(href);
  };

  // Smooth scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, []);

  // Scroll on new messages, but only if already near bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const getProjectCount = (type: string) => projects.filter(p => p.type === type).length;
  const getLimit = (type: string) => {
    const limits = subscription.limits || { voice_agents: 3, rag_bots: 5, automations: 10 };
    switch (type) {
      case 'voice_agent': return limits.voice_agents;
      case 'rag_bot': return limits.rag_bots;
      case 'automation': return limits.automations;
      default: return 0;
    }
  };

  const handleCreateProject = async (action: CreateAction) => {
    const { type, config } = action;

    const count = getProjectCount(type);
    const limit = getLimit(type);
    if (count >= limit) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `You've reached the limit of ${limit} ${type.replace('_', ' ')}s. Please delete an existing project to create a new one.`,
      }]);
      return;
    }

    const endpoints: Record<string, string> = {
      voice_agent: '/api/voice/agents',
      rag_bot: '/api/rag/bots',
      automation: '/api/automations',
    };

    try {
      const response = await fetch(endpoints[type], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (data.id) {
        setCreatedProject({ ...data, type });
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Your ${type.replace('_', ' ')} has been deployed successfully.`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Failed to deploy: ${data.error || 'Unknown error'}`,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please try again.',
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/studio/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
        }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
        }]);
        return;
      }

      const cleanMessage = data.message.replace(/```json[\s\S]*?```/g, '').trim();

      if (cleanMessage) {
        setMessages(prev => [...prev, { role: 'assistant', content: cleanMessage }]);
      }

      if (data.createAction) {
        await handleCreateProject(data.createAction);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connection error. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const startNewChat = () => {
    setMessages([{
      role: 'assistant',
      content: "What would you like to build today?\n\nI can help you create Voice AI agents, RAG chatbots, or automation workflows. Just describe your use case.",
    }]);
    setCreatedProject(null);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Island Navigation - Same as Dashboard */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'pointer-events-auto mt-4 mx-4',
            'px-3 md:px-5 py-2.5',
            'rounded-full',
            'bg-white/30 backdrop-blur-xl',
            'border border-white/30',
            'shadow-lg shadow-black/[0.05]'
          )}
        >
          <nav className="flex items-center gap-1 md:gap-2">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2 pr-2 md:pr-4"
            >
              <Image
                src="/images/allone-logo.png"
                alt="Allone"
                width={22}
                height={22}
                className="group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-sm font-semibold text-[var(--black)] tracking-tight hidden sm:block">
                ALLONE
              </span>
            </Link>

            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-black/10" />

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-0.5">
              {dashboardNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-all duration-200',
                      active
                        ? 'text-[var(--black)] bg-black/5'
                        : 'text-[var(--gray-500)] hover:text-[var(--black)] hover:bg-black/5'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-black/10 ml-1" />

            {/* User Menu - Desktop */}
            <div className="hidden md:block relative ml-1">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--black)] flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 border border-white/20 overflow-hidden"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden p-1.5 rounded-full hover:bg-black/5 transition-colors touch-manipulation ml-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-[var(--black)]" />
              ) : (
                <Menu className="w-5 h-5 text-[var(--black)]" />
              )}
            </button>
          </nav>
        </motion.header>
      </div>

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-white/60 backdrop-blur-2xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative flex flex-col h-full pt-20 pb-8 px-6">
              <nav className="flex-1 space-y-1">
                {dashboardNavItems.map((item, index) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 py-3 px-4 text-base font-medium rounded-xl transition-colors',
                          active
                            ? 'text-[var(--black)] bg-black/5'
                            : 'text-[var(--gray-500)]'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="pt-6 border-t border-[var(--gray-200)]"
              >
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 py-3 px-4 text-red-600 font-medium rounded-xl hover:bg-red-50/50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] flex overflow-hidden">
        {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full border-r border-[var(--gray-200)] flex flex-col bg-white overflow-hidden"
          >
            <div className="p-3 border-b border-[var(--gray-200)]">
              <button
                onClick={startNewChat}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--gray-200)] bg-white text-sm font-medium text-[var(--black)] hover:bg-[var(--gray-100)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>

            {/* Projects */}
            <div className="flex-1 overflow-y-auto p-3">
              <p className="text-xs font-medium text-[var(--gray-400)] uppercase tracking-wider mb-2 px-2">
                Projects ({projects.length})
              </p>
              <div className="space-y-1">
                {projects.map((project) => {
                  const productType = productTypes.find(p => p.type === project.type);
                  const Icon = productType?.icon || Sparkles;

                  return (
                    <Link
                      key={project.id}
                      href={`/dashboard/${project.type === 'voice_agent' ? 'voice' : project.type === 'rag_bot' ? 'rag' : 'bots'}/${project.id}`}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white text-sm text-[var(--gray-600)] hover:text-[var(--black)] transition-colors group"
                    >
                      <Icon className="w-4 h-4 text-[var(--gray-400)] group-hover:text-[var(--black)]" />
                      <span className="flex-1 truncate">{project.name}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        project.status === 'active' ? 'bg-green-500' : 'bg-[var(--gray-300)]'
                      }`} />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[var(--gray-200)] space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white text-sm text-[var(--gray-600)] hover:text-[var(--black)] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white text-sm text-[var(--gray-600)] hover:text-[var(--black)] transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-12 border-b border-[var(--gray-200)] flex items-center px-4 gap-3 flex-shrink-0">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 rounded-lg hover:bg-[var(--gray-100)] text-[var(--gray-500)] transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${!showSidebar ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
            <span className="text-sm font-medium text-[var(--black)]">AI Studio</span>
          </div>
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-[var(--gray-400)]">
            <span>voice: {getProjectCount('voice_agent')}/{getLimit('voice_agent')}</span>
            <span>rag: {getProjectCount('rag_bot')}/{getLimit('rag_bot')}</span>
            <span>auto: {getProjectCount('automation')}/{getLimit('automation')}</span>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="max-w-3xl mr-auto ml-8 px-4 py-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`mb-6 ${message.role === 'user' ? 'flex justify-end' : ''}`}
              >
                {message.role === 'assistant' ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--black)] flex items-center justify-center flex-shrink-0">
                      <Terminal className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--black)] whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[80%] bg-[var(--gray-100)] rounded-2xl px-4 py-3">
                    <p className="text-sm text-[var(--black)] whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Created Project Card */}
            <AnimatePresence>
              {createdProject && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 border border-[var(--gray-200)] rounded-xl overflow-hidden">
                      <div className="p-4 bg-[var(--gray-50)] border-b border-[var(--gray-200)]">
                        <p className="text-sm font-medium text-[var(--black)]">Deployment Complete</p>
                      </div>
                      <div className="p-4 space-y-4">
                        {createdProject.embed_code && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-[var(--gray-500)]">Widget Embed</span>
                              <button
                                onClick={() => copyToClipboard(createdProject.embed_code!, 'embed')}
                                className="text-xs text-[var(--gray-500)] hover:text-[var(--black)] flex items-center gap-1 transition-colors"
                              >
                                {copiedField === 'embed' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedField === 'embed' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="text-xs bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg p-3 overflow-x-auto font-mono">
                              {createdProject.embed_code}
                            </pre>
                          </div>
                        )}

                        {createdProject.iframe_embed && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-[var(--gray-500)]">iFrame Embed</span>
                              <button
                                onClick={() => copyToClipboard(createdProject.iframe_embed!, 'iframe')}
                                className="text-xs text-[var(--gray-500)] hover:text-[var(--black)] flex items-center gap-1 transition-colors"
                              >
                                {copiedField === 'iframe' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedField === 'iframe' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="text-xs bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg p-3 overflow-x-auto font-mono">
                              {createdProject.iframe_embed}
                            </pre>
                          </div>
                        )}

                        {createdProject.webhook_url && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-[var(--gray-500)]">Webhook URL</span>
                              <button
                                onClick={() => copyToClipboard(createdProject.webhook_url!, 'webhook')}
                                className="text-xs text-[var(--gray-500)] hover:text-[var(--black)] flex items-center gap-1 transition-colors"
                              >
                                {copiedField === 'webhook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedField === 'webhook' ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <code className="text-xs bg-[var(--gray-50)] border border-[var(--gray-200)] rounded-lg p-3 block overflow-x-auto font-mono">
                              {createdProject.webhook_url}
                            </code>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            const path = createdProject.type === 'voice_agent' ? 'voice' : createdProject.type === 'rag_bot' ? 'rag' : 'bots';
                            router.push(`/dashboard/${path}/${createdProject.id}`);
                          }}
                          className="w-full py-2.5 bg-[var(--black)] text-white text-sm font-medium rounded-lg hover:bg-[var(--gray-800)] transition-colors flex items-center justify-center gap-2"
                        >
                          Open in Dashboard
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            {isLoading && (
              <div className="mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--black)] flex items-center justify-center flex-shrink-0">
                    <Terminal className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-1 py-2">
                    <span className="w-2 h-2 bg-[var(--gray-400)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[var(--gray-400)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[var(--gray-400)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-[var(--gray-200)] p-4 flex-shrink-0 bg-white">
          <div className="max-w-3xl mr-auto ml-8">
            <div className={`relative rounded-xl border transition-all duration-200 ${inputFocused ? 'border-[var(--black)] bg-white shadow-sm' : 'border-[var(--gray-200)] bg-[var(--gray-50)]'}`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Describe what you want to build..."
                rows={1}
                className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-sm text-[var(--black)] placeholder:text-[var(--gray-400)] focus:outline-none"
                style={{ maxHeight: '200px' }}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-[var(--black)] text-white hover:bg-[var(--gray-800)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--gray-400)] text-center mt-2">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}

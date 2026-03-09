'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Mic,
  FileText,
  Zap,
  Circle,
  Terminal
} from 'lucide-react';

interface Purchase {
  id: string;
  amount: number;
  currency: string;
  purchased_at: string;
  download_token: string;
  products: {
    name: string;
    slug: string;
    category: string;
  };
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_end: string;
}

interface DashboardContentProps {
  data: {
    purchases: Purchase[];
    subscription: Subscription | null;
    stats: {
      totalPurchases: number;
      hasActiveSubscription: boolean;
    };
  };
}

const quickActions = [
  {
    label: 'Voice AI',
    description: 'Phone & web assistants',
    icon: Mic,
    href: '/dashboard/voice',
    count: 'voice_agent',
  },
  {
    label: 'RAG Bots',
    description: 'Knowledge-base chat',
    icon: FileText,
    href: '/dashboard/rag',
    count: 'rag_bot',
  },
  {
    label: 'Workflows',
    description: 'Event-driven automation',
    icon: Zap,
    href: '/dashboard/bots',
    count: 'automation',
  },
];

export default function DashboardContent({ data }: DashboardContentProps) {
  const { subscription, stats } = data;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Circle className={`w-2 h-2 ${stats.hasActiveSubscription ? 'fill-green-500 text-green-500' : 'fill-[var(--gray-300)] text-[var(--gray-300)]'}`} />
          <span className="text-xs font-mono text-[var(--gray-500)] uppercase tracking-wider">
            {stats.hasActiveSubscription ? 'Active Session' : 'Inactive'}
          </span>
        </div>
        <h1 className="text-3xl font-light text-[var(--black)] tracking-tight">Overview</h1>
      </motion.div>

      {/* Status Card */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-[var(--black)] rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-white/60" />
                <span className="text-xs font-mono text-white/60 uppercase tracking-wider">Subscription</span>
              </div>
              <span className="text-xs font-mono text-white/40">
                renews {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-light text-white capitalize">{subscription.plan}</p>
                <p className="text-xs text-white/40 mt-1 font-mono">$100/month</p>
              </div>
              <Link
                href="/dashboard/settings"
                className="text-xs text-white/60 hover:text-white transition-colors font-mono flex items-center gap-1"
              >
                manage
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Subscription */}
      {!subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="border border-[var(--gray-200)] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Circle className="w-2 h-2 fill-[var(--gray-300)] text-[var(--gray-300)]" />
              <span className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider">No Active Subscription</span>
            </div>
            <p className="text-sm text-[var(--gray-500)] mb-4">
              Subscribe to access AI Studio and build your AI products.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--black)] hover:underline"
            >
              View Plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider">Products</span>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-[var(--gray-200)] rounded-xl overflow-hidden">
          {quickActions.map((action, index) => (
            <Link
              key={action.label}
              href={action.href}
              className="bg-white p-6 hover:bg-white transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-lg border border-[var(--gray-200)] flex items-center justify-center group-hover:border-[var(--black)] transition-colors">
                  <action.icon className="w-5 h-5 text-[var(--gray-400)] group-hover:text-[var(--black)] transition-colors" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[var(--gray-300)] group-hover:text-[var(--black)] transition-colors" />
              </div>
              <h3 className="text-base font-medium text-[var(--black)] mb-1">{action.label}</h3>
              <p className="text-xs text-[var(--gray-400)]">{action.description}</p>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* AI Studio CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Link
          href="/products"
          className="block border border-[var(--gray-200)] rounded-xl p-6 hover:border-[var(--black)] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[var(--black)] flex items-center justify-center">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[var(--black)]">AI Studio</h3>
                <p className="text-sm text-[var(--gray-500)]">Build AI products through conversation</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-[var(--gray-300)] group-hover:text-[var(--black)] group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </motion.div>

      {/* Footer Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 pt-8 border-t border-[var(--gray-200)]"
      >
        <div className="flex items-center gap-8 text-xs font-mono text-[var(--gray-400)]">
          <span>purchases: {stats.totalPurchases}</span>
          <span>status: {stats.hasActiveSubscription ? 'active' : 'inactive'}</span>
        </div>
      </motion.div>
    </div>
  );
}

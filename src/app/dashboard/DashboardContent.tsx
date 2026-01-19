'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Download,
  CreditCard,
  ArrowRight,
  Package,
  Star
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

export default function DashboardContent({ data }: DashboardContentProps) {
  const { purchases, subscription, stats } = data;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-[var(--black)]">Dashboard</h1>
        <p className="text-[var(--gray-600)]">Welcome back! Here&apos;s an overview of your account.</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-5">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[var(--black)]">{stats.totalPurchases}</p>
          <p className="text-sm text-[var(--gray-500)]">Total Purchases</p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-5">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
            <Download className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-[var(--black)]">{purchases.length}</p>
          <p className="text-sm text-[var(--gray-500)]">Available Downloads</p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--gray-200)] p-5 col-span-2 lg:col-span-1">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[var(--black)]">
            {stats.hasActiveSubscription ? 'Active' : 'None'}
          </p>
          <p className="text-sm text-[var(--gray-500)]">Subscription Status</p>
        </div>
      </motion.div>

      {/* Active Subscription */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] rounded-xl p-6 text-white mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5" />
            <span className="font-semibold capitalize">{subscription.plan} Plan</span>
          </div>
          <p className="text-white/80 text-sm mb-4">
            Your subscription renews on {new Date(subscription.current_period_end).toLocaleDateString()}
          </p>
          <Link
            href="/dashboard/subscriptions"
            className="inline-flex items-center gap-2 text-sm font-medium bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            Manage Subscription
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Recent Purchases */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl border border-[var(--gray-200)]"
      >
        <div className="p-5 border-b border-[var(--gray-200)] flex items-center justify-between">
          <h2 className="font-semibold text-[var(--black)]">Recent Purchases</h2>
          <Link
            href="/dashboard/purchases"
            className="text-sm text-[var(--accent)] hover:underline inline-flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {purchases.length > 0 ? (
          <div className="divide-y divide-[var(--gray-100)]">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--gray-100)] flex items-center justify-center">
                    <Package className="w-5 h-5 text-[var(--gray-600)]" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--black)]">
                      {purchase.products?.name || 'Product'}
                    </p>
                    <p className="text-xs text-[var(--gray-500)]">
                      {new Date(purchase.purchased_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/api/download/${purchase.download_token}`}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <ShoppingBag className="w-12 h-12 text-[var(--gray-300)] mx-auto mb-4" />
            <p className="text-[var(--gray-500)] mb-4">No purchases yet</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--black)] text-white font-medium rounded-xl hover:bg-[var(--gray-800)] transition-colors"
            >
              Browse Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}

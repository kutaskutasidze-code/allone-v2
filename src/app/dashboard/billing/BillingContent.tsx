'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Calendar,
  Download,
  AlertCircle,
  Check,
  ArrowRight,
  Loader2,
  Circle,
  Terminal
} from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  paypal_subscription_id: string;
  limits: {
    voice_agents: number;
    rag_bots: number;
    automations: number;
  };
}

interface Purchase {
  id: string;
  amount: number;
  currency: string;
  purchased_at: string;
  products: {
    name: string;
    slug: string;
    category: string;
  };
}

interface BillingContentProps {
  subscription: Subscription | null;
  purchases: Purchase[];
  userEmail: string;
}

export default function BillingContent({ subscription, purchases, userEmail }: BillingContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isActive = subscription?.status === 'active';
  const isCancelled = subscription?.cancel_at_period_end;

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        setError(data.error || 'Failed to create subscription');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Your subscription will be cancelled at the end of the billing period.');
        setShowCancelConfirm(false);
        window.location.reload();
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Circle className={`w-2 h-2 ${isActive ? 'fill-green-500 text-green-500' : 'fill-[var(--gray-300)] text-[var(--gray-300)]'}`} />
          <span className="text-xs font-mono text-[var(--gray-500)] uppercase tracking-wider">
            {isActive ? 'Active Subscription' : 'No Subscription'}
          </span>
        </div>
        <h1 className="text-3xl font-light text-[var(--black)] tracking-tight">Billing</h1>
      </motion.div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3"
        >
          <Check className="w-5 h-5 text-green-500" />
          <p className="text-sm text-green-600">{success}</p>
        </motion.div>
      )}

      {/* Current Subscription */}
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
              {isCancelled ? (
                <span className="text-xs font-mono text-orange-400">
                  Cancels {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              ) : (
                <span className="text-xs font-mono text-white/40">
                  Renews {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-light text-white capitalize">{subscription.plan} Plan</p>
                <p className="text-xs text-white/40 mt-1 font-mono">$100/month</p>
              </div>
              <a
                href="https://www.paypal.com/myaccount/autopay"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/60 hover:text-white transition-colors font-mono flex items-center gap-1"
              >
                PayPal
                <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscription Details */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="border border-[var(--gray-200)] rounded-xl divide-y divide-[var(--gray-200)]">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[var(--gray-400)]" />
                <span className="text-sm text-[var(--gray-600)]">Billing Period</span>
              </div>
              <span className="text-sm text-[var(--black)]">
                {new Date(subscription.current_period_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {' '}
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-[var(--gray-400)]" />
                <span className="text-sm text-[var(--gray-600)]">Payment Method</span>
              </div>
              <span className="text-sm text-[var(--black)]">PayPal</span>
            </div>
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-[var(--gray-600)]">Subscription ID</span>
              <code className="text-xs font-mono text-[var(--gray-400)]">{subscription.paypal_subscription_id}</code>
            </div>
          </div>
        </motion.div>
      )}

      {/* Cancel Subscription */}
      {subscription && !isCancelled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="text-sm text-[var(--gray-400)] hover:text-red-500 transition-colors"
          >
            Cancel subscription
          </button>
        </motion.div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[var(--gray-200)] rounded-xl p-6 max-w-md w-full shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-[var(--black)] font-medium">Cancel Subscription?</p>
                <p className="text-xs text-[var(--gray-400)]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-[var(--gray-500)] mb-6">
              Your subscription will remain active until the end of your current billing period. After that, you&apos;ll lose access to AI Studio features.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-lg bg-[var(--gray-100)] text-sm text-[var(--black)] hover:bg-[var(--gray-200)] transition-colors"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 py-2.5 rounded-lg bg-red-500 text-sm text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Cancel'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* No Subscription - CTA */}
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
              <span className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider">No Active Plan</span>
            </div>
            <h3 className="text-lg font-medium text-[var(--black)] mb-2">Subscribe to AI Studio</h3>
            <p className="text-sm text-[var(--gray-500)] mb-6">
              Get access to Voice AI agents, RAG chatbots, and automation workflows.
            </p>

            <div className="bg-[var(--gray-50)] rounded-lg p-4 mb-6">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-sm font-medium text-[var(--black)]">Platform Plan</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-light text-[var(--black)]">$100</span>
                  <span className="text-sm text-[var(--gray-400)]">/mo</span>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-[var(--gray-600)]">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  3 Voice AI agents
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  5 RAG chatbots
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  10 Automation workflows
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Priority support
                </li>
              </ul>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-3 bg-[var(--black)] text-white font-medium rounded-lg hover:bg-[var(--gray-800)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Subscribe with PayPal
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Purchase History */}
      {purchases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <p className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider mb-3">Purchase History</p>
          <div className="border border-[var(--gray-200)] rounded-xl divide-y divide-[var(--gray-200)]">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--gray-100)] flex items-center justify-center">
                    <Download className="w-4 h-4 text-[var(--gray-400)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--black)]">{purchase.products.name}</p>
                    <p className="text-xs text-[var(--gray-400)]">
                      {new Date(purchase.purchased_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-medium text-[var(--black)]">${purchase.amount.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Billing Email */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider mb-3">Billing Information</p>
        <div className="border border-[var(--gray-200)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--gray-400)]">Billing Email</p>
              <p className="text-sm text-[var(--black)]">{userEmail}</p>
            </div>
            <Link
              href="/dashboard/settings"
              className="text-xs text-[var(--gray-400)] hover:text-[var(--black)] transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 pt-6 border-t border-[var(--gray-200)]"
      >
        <p className="text-xs text-[var(--gray-400)]">
          All payments are processed securely via PayPal. Questions? Contact{' '}
          <a href="mailto:support@allone.ge" className="text-[var(--black)] hover:underline">
            support@allone.ge
          </a>
        </p>
      </motion.div>
    </div>
  );
}

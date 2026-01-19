'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Mail,
  Building,
  Check,
  Loader2,
  Circle,
  CreditCard,
  LogOut,
  AlertCircle
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  company: string;
  avatar_url: string;
  created_at: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_end: string;
  paypal_subscription_id: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profile
      const profileRes = await fetch('/api/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setFullName(profileData.full_name || '');
        setCompany(profileData.company || '');
      }

      // Fetch subscription
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();
        setSubscription(sub);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, company }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated' });
        // Force refresh auth session to update user metadata everywhere
        await supabase.auth.refreshSession();
        router.refresh();
        // Small delay to ensure state propagates
        setTimeout(() => window.location.reload(), 500);
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return;
    }

    setIsCancelling(true);
    setMessage(null);

    try {
      const res = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Subscription cancelled' });
        setSubscription(null);
        router.refresh();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to cancel subscription' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Connection error' });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--gray-400)]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Circle className="w-2 h-2 fill-green-500 text-green-500" />
          <span className="text-xs font-mono text-[var(--gray-500)] uppercase tracking-wider">Account</span>
        </div>
        <h1 className="text-3xl font-light text-[var(--black)] tracking-tight">Settings</h1>
      </motion.div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
        </motion.div>
      )}

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider">Profile</span>
        </div>

        <div className="border border-[var(--gray-200)] rounded-xl overflow-hidden">
          {/* Avatar & Email */}
          <div className="p-6 border-b border-[var(--gray-200)] bg-[var(--gray-50)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--black)] flex items-center justify-center text-white text-xl font-medium">
                {(fullName?.[0] || profile?.email?.[0] || 'U').toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] font-mono">{profile?.email}</p>
                <p className="text-xs text-[var(--gray-400)] mt-1">
                  member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs text-[var(--gray-500)] font-mono uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-400)]" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--gray-200)] text-[var(--black)] text-sm placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--black)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--gray-500)] font-mono uppercase tracking-wider mb-2">
                Company
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--gray-400)]" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name (optional)"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-[var(--gray-200)] text-[var(--black)] text-sm placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--black)]"
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 bg-[var(--black)] text-white text-sm font-medium rounded-lg hover:bg-[var(--gray-800)] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Subscription Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider">Subscription</span>
        </div>

        <div className="border border-[var(--gray-200)] rounded-xl overflow-hidden">
          {subscription ? (
            <>
              <div className="p-6 bg-[var(--black)] text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-white/60" />
                    <span className="text-xs font-mono text-white/60 uppercase tracking-wider">Active Plan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                    <span className="text-xs font-mono text-white/60">active</span>
                  </div>
                </div>
                <p className="text-2xl font-light capitalize">{subscription.plan}</p>
                <p className="text-xs text-white/40 mt-1 font-mono">$100/month</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--gray-500)]">Next billing date</span>
                  <span className="text-[var(--black)] font-mono">
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="w-full py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isCancelling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Cancel Subscription'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Circle className="w-2 h-2 fill-[var(--gray-300)] text-[var(--gray-300)]" />
                <span className="text-sm text-[var(--gray-500)]">No active subscription</span>
              </div>
              <a
                href="/products"
                className="block w-full py-3 bg-[var(--black)] text-white text-sm font-medium rounded-lg hover:bg-[var(--gray-800)] transition-colors text-center"
              >
                Subscribe Now
              </a>
            </div>
          )}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider">Session</span>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full py-3 border border-[var(--gray-200)] text-[var(--gray-600)] text-sm font-medium rounded-lg hover:bg-[var(--gray-50)] hover:text-red-600 hover:border-red-200 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 pt-8 border-t border-[var(--gray-200)]"
      >
        <p className="text-xs font-mono text-[var(--gray-400)]">
          user_id: {profile?.id?.slice(0, 8)}...
        </p>
      </motion.div>
    </div>
  );
}

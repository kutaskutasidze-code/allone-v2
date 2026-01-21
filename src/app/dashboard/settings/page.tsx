'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  User,
  Building,
  Check,
  Loader2,
  Circle,
  CreditCard,
  LogOut,
  AlertCircle,
  Shuffle,
  Upload,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  company: string;
  avatar_url: string;
  avatar_style: string;
  avatar_seed: string;
  custom_avatar_url: string | null;
  created_at: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  current_period_end: string;
  paypal_subscription_id: string;
}

// DiceBear avatar styles (free)
const AVATAR_STYLES = [
  { id: 'avataaars', name: 'Avataaars', desc: 'Cartoon style' },
  { id: 'bottts', name: 'Bottts', desc: 'Robot style' },
  { id: 'lorelei', name: 'Lorelei', desc: 'Artistic portraits' },
  { id: 'notionists', name: 'Notionists', desc: 'Notion-like' },
  { id: 'open-peeps', name: 'Open Peeps', desc: 'Hand-drawn' },
  { id: 'pixel-art', name: 'Pixel Art', desc: 'Retro pixels' },
  { id: 'thumbs', name: 'Thumbs', desc: 'Thumbs up/down' },
  { id: 'fun-emoji', name: 'Fun Emoji', desc: 'Cute emojis' },
];

function getDiceBearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('avataaars');
  const [avatarSeed, setAvatarSeed] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null);
  const [useCustomAvatar, setUseCustomAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
        setAvatarStyle(profileData.avatar_style || 'avataaars');
        setAvatarSeed(profileData.avatar_seed || profileData.email || '');
        setCustomAvatarUrl(profileData.custom_avatar_url);
        setUseCustomAvatar(!!profileData.custom_avatar_url);
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
        body: JSON.stringify({
          full_name: fullName,
          company,
          avatar_style: avatarStyle,
          avatar_seed: avatarSeed,
          custom_avatar_url: useCustomAvatar ? customAvatarUrl : null,
        }),
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

  const handleRandomizeSeed = () => {
    const randomSeed = Math.random().toString(36).substring(2, 15);
    setAvatarSeed(randomSeed);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be smaller than 2MB' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      setCustomAvatarUrl(publicUrl);
      setUseCustomAvatar(true);
      setMessage({ type: 'success', text: 'Avatar uploaded! Click Save to apply.' });
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
    } finally {
      setIsUploading(false);
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

  const currentAvatarUrl = useCustomAvatar && customAvatarUrl
    ? customAvatarUrl
    : getDiceBearUrl(avatarStyle, avatarSeed);

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

      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider">Avatar</span>
        </div>

        <div className="border border-[var(--gray-200)] rounded-xl overflow-hidden">
          {/* Current Avatar Preview */}
          <div className="p-6 bg-[var(--gray-50)] flex items-center gap-6">
            <div className="relative">
              <img
                src={currentAvatarUrl}
                alt="Avatar preview"
                className="w-24 h-24 rounded-2xl bg-white shadow-sm"
              />
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--black)] mb-1">Your Avatar</p>
              <p className="text-xs text-[var(--gray-500)] mb-3">
                {useCustomAvatar ? 'Custom uploaded image' : `${AVATAR_STYLES.find(s => s.id === avatarStyle)?.name || 'DiceBear'} style`}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-[var(--gray-200)] rounded-lg hover:border-[var(--black)] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                {useCustomAvatar && (
                  <button
                    onClick={() => {
                      setUseCustomAvatar(false);
                      setCustomAvatarUrl(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Style Selector */}
          {!useCustomAvatar && (
            <div className="p-6 border-t border-[var(--gray-200)]">
              <div className="flex items-center justify-between mb-4">
                <label className="text-xs text-[var(--gray-500)] font-mono uppercase tracking-wider">
                  Avatar Style
                </label>
                <button
                  onClick={handleRandomizeSeed}
                  className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[var(--gray-600)] hover:text-[var(--black)] transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  Randomize
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setAvatarStyle(style.id)}
                    className={cn(
                      'relative p-2 rounded-xl border-2 transition-all',
                      avatarStyle === style.id
                        ? 'border-[var(--black)] bg-[var(--gray-50)]'
                        : 'border-transparent hover:border-[var(--gray-200)]'
                    )}
                  >
                    <img
                      src={getDiceBearUrl(style.id, avatarSeed)}
                      alt={style.name}
                      className="w-full aspect-square rounded-lg bg-white"
                    />
                    <p className="text-[10px] font-medium text-[var(--black)] mt-1.5 truncate">
                      {style.name}
                    </p>
                    {avatarStyle === style.id && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-[var(--black)] rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-mono text-[var(--gray-400)] uppercase tracking-wider">Profile</span>
        </div>

        <div className="border border-[var(--gray-200)] rounded-xl overflow-hidden">
          {/* Email */}
          <div className="p-6 border-b border-[var(--gray-200)] bg-[var(--gray-50)]">
            <div className="flex items-center gap-4">
              <Sparkles className="w-5 h-5 text-[var(--gray-400)]" />
              <div>
                <p className="text-sm text-[var(--gray-500)] font-mono">{profile?.email}</p>
                <p className="text-xs text-[var(--gray-400)] mt-1">
                  member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
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
                href="/dashboard/billing"
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

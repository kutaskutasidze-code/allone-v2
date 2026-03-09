'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function SalesLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState<'email' | 'password' | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Check if user is a sales user
      const { data: salesUser, error: salesError } = await supabase
        .from('sales_users')
        .select('id')
        .eq('email', email)
        .single();

      if (salesError || !salesUser) {
        await supabase.auth.signOut();
        setError('You are not authorized to access the sales portal');
        return;
      }

      router.push('/sales');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--gray-50)] via-white to-[var(--gray-100)] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(100, 100, 100, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(100, 100, 100, 0.06) 0%, transparent 70%)',
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.6, 0.4, 0.6],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Login Card */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/5 border border-white/50 p-10">
          {/* Logo */}
          <div className="mb-10 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <Image src="/images/allone-logo.png" alt="Allone" width={48} height={48} className="object-contain" priority />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--black)] tracking-tight">Sales Portal</h1>
            <p className="text-sm text-[var(--gray-500)] mt-1">Sign in to manage your leads</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <label className="block text-xs uppercase tracking-[0.15em] text-[var(--gray-500)] font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                    isFocused === 'email' ? 'text-[var(--black)]' : 'text-[var(--gray-400)]'
                  }`}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused(null)}
                  placeholder="sales@allone.ai"
                  required
                  autoComplete="email"
                  className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 transition-all duration-300 text-[var(--black)] placeholder:text-[var(--gray-400)] focus:outline-none ${
                    isFocused === 'email'
                      ? 'border-[var(--black)] bg-white shadow-lg shadow-black/5'
                      : 'border-transparent hover:border-[var(--gray-200)]'
                  }`}
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <label className="block text-xs uppercase tracking-[0.15em] text-[var(--gray-500)] font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <div
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${
                    isFocused === 'password' ? 'text-[var(--black)]' : 'text-[var(--gray-400)]'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 transition-all duration-300 text-[var(--black)] placeholder:text-[var(--gray-400)] focus:outline-none ${
                    isFocused === 'password'
                      ? 'border-[var(--black)] bg-white shadow-lg shadow-black/5'
                      : 'border-transparent hover:border-[var(--gray-200)]'
                  }`}
                />
              </div>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="relative w-full py-4 px-6 bg-[var(--black)] text-white font-medium rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </>
                )}
              </span>
            </motion.button>
          </form>
        </div>

        {/* Footer Text */}
        <motion.p
          className="mt-8 text-center text-xs text-[var(--gray-500)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Sales team access only. Contact admin for access.
        </motion.p>
      </motion.div>
    </div>
  );
}

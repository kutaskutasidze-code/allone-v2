'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function SignUpPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<'name' | 'email' | 'password' | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
        return;
      }

      setEmailSent(true);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  // Password strength
  const passwordStrength = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  if (emailSent) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-md text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-[var(--gray-200)] p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-[var(--black)] mb-2">Check your email</h2>
            <p className="text-[var(--gray-500)] mb-6">
              We sent a verification link to<br />
              <span className="text-[var(--black)] font-medium">{email}</span>
            </p>
            <p className="text-sm text-[var(--gray-500)]">
              Click the link in the email to verify your account and get started.
            </p>
          </div>
          <p className="text-center mt-6 text-sm text-[var(--gray-600)]">
            Didn&apos;t receive the email?{' '}
            <button onClick={() => setEmailSent(false)} className="text-[var(--accent)] font-medium hover:underline">
              Try again
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <Link href="/" className="flex flex-col items-center mb-8">
          <Image src="/images/allone-logo.png" alt="Allone" width={48} height={48} className="object-contain mb-2" priority />
          <h1 className="text-2xl font-bold text-[var(--black)]">ALLONE</h1>
          <p className="text-sm text-[var(--gray-500)]">AI Automation Agency</p>
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-[var(--gray-200)] p-8">
          <h2 className="text-xl font-semibold text-[var(--black)] mb-2">Create your account</h2>
          <p className="text-[var(--gray-500)] text-sm mb-6">Get access to automation templates and courses</p>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            type="button"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[var(--gray-200)] rounded-xl hover:bg-white transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-[var(--gray-700)] font-medium">Continue with Google</span>
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--gray-200)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-[var(--gray-500)]">or continue with email</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs text-[var(--gray-600)] font-medium mb-1.5">Full Name</label>
              <div className="relative">
                <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isFocused === 'name' ? 'text-[var(--accent)]' : 'text-[var(--gray-400)]'}`} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setIsFocused('name')}
                  onBlur={() => setIsFocused(null)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[var(--gray-200)] text-[var(--black)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs text-[var(--gray-600)] font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isFocused === 'email' ? 'text-[var(--accent)]' : 'text-[var(--gray-400)]'}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => setIsFocused(null)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-[var(--gray-200)] text-[var(--black)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-[var(--gray-600)] font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isFocused === 'password' ? 'text-[var(--accent)]' : 'text-[var(--gray-400)]'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                  placeholder="Create a strong password"
                  required
                  minLength={8}
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-white border border-[var(--gray-200)] text-[var(--black)] placeholder:text-[var(--gray-400)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gray-400)] hover:text-[var(--gray-600)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          strengthScore >= level
                            ? strengthScore === 1
                              ? 'bg-red-400'
                              : strengthScore === 2
                              ? 'bg-yellow-400'
                              : 'bg-green-400'
                            : 'bg-[var(--gray-200)]'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-[var(--gray-500)] space-y-0.5">
                    <p className={passwordStrength.hasMinLength ? 'text-green-600' : ''}>
                      {passwordStrength.hasMinLength ? '✓' : '○'} At least 8 characters
                    </p>
                    <p className={passwordStrength.hasUppercase ? 'text-green-600' : ''}>
                      {passwordStrength.hasUppercase ? '✓' : '○'} One uppercase letter
                    </p>
                    <p className={passwordStrength.hasNumber ? 'text-green-600' : ''}>
                      {passwordStrength.hasNumber ? '✓' : '○'} One number
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terms */}
            <p className="text-xs text-[var(--gray-500)]">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-[var(--accent)] hover:underline">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-[var(--accent)] hover:underline">Privacy Policy</Link>
            </p>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading || strengthScore < 3}
              className="w-full py-3 px-4 bg-[var(--black)] text-white font-medium rounded-xl hover:bg-[var(--gray-800)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <motion.div
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>

        {/* Sign In Link */}
        <p className="text-center mt-6 text-sm text-[var(--gray-600)]">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--accent)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

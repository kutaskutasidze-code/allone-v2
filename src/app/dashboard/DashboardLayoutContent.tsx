'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  LogOut,
  Menu,
  X,
  User,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutContentProps {
  children: React.ReactNode;
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

interface ProfileData {
  avatar_style: string;
  avatar_seed: string;
  custom_avatar_url: string | null;
}

// Main nav items (shown in the morphic bar)
const navItems = [
  { href: '/dashboard/studio', label: 'AI Studio', key: 'studio' },
  { href: '/dashboard/voice', label: 'Voice AI', key: 'voice' },
  { href: '/dashboard/rag', label: 'RAG Bots', key: 'rag' },
  { href: '/dashboard/bots', label: 'Workflows', key: 'bots' },
];

// Items in user dropdown
const dropdownItems = [
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
];

function getDiceBearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

export default function DashboardLayoutContent({ children, user }: DashboardLayoutContentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setProfile({
            avatar_style: data.avatar_style || 'avataaars',
            avatar_seed: data.avatar_seed || user.email || user.id,
            custom_avatar_url: data.custom_avatar_url,
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, [user.email, user.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  const avatarUrl = profile?.custom_avatar_url ||
    (profile ? getDiceBearUrl(profile.avatar_style, profile.avatar_seed) : null);

  return (
    <div className={cn("bg-white", pathname === '/dashboard/studio' ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]')}>
      {/* Morphic Navigation - bare pills, no card */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none pt-[env(safe-area-inset-top)]">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-auto mt-3 sm:mt-4 mx-3 sm:mx-4 px-3 md:px-4 py-2.5 flex items-center justify-center"
        >
          <nav className="flex items-center gap-3 md:gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 pr-1">
              <Image
                src="/images/allone-logo.png"
                alt="Allone"
                width={22}
                height={22}
              />
              <span className="text-sm font-semibold text-[var(--black)] tracking-tight hidden sm:block">
                ALLONE
              </span>
            </Link>

            {/* Morphic Nav - Desktop */}
            <div className="hidden md:flex items-center overflow-hidden rounded-xl">
              {navItems.map((item, index) => {
                const active = isActive(item.href);
                const prevActive = index > 0 && isActive(navItems[index - 1].href);
                const nextActive = index < navItems.length - 1 && isActive(navItems[index + 1].href);
                const isFirst = index === 0;
                const isLast = index === navItems.length - 1;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      'flex items-center justify-center px-4 py-1.5 text-sm text-white transition-all duration-300 bg-black/80',
                      active
                        ? 'mx-1.5 rounded-xl font-semibold bg-black'
                        : cn(
                            'font-medium',
                            (prevActive || isFirst) && 'rounded-l-xl',
                            (nextActive || isLast) && 'rounded-r-xl'
                          )
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* User Menu - Desktop */}
            <div className="hidden md:block relative ml-1">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={cn(
                  'flex items-center gap-2 py-1 px-2 rounded-full transition-all duration-200',
                  showUserMenu ? 'bg-black/5' : 'hover:bg-black/5'
                )}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-6 h-6 rounded-full bg-white"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <span className="text-xs font-medium text-[var(--black)] max-w-[80px] truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown className={cn(
                  'w-3 h-3 text-[var(--gray-400)] transition-transform duration-200',
                  showUserMenu && 'rotate-180'
                )} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-white/40 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-black/5">
                      <p className="text-xs text-[var(--gray-500)]">Signed in as</p>
                      <p className="text-sm font-medium text-[var(--black)] truncate">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      {dropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowUserMenu(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                            isActive(item.href)
                              ? 'text-[var(--black)] bg-black/5'
                              : 'text-[var(--gray-600)] hover:text-[var(--black)] hover:bg-black/[0.03]'
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-black/5">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden p-1.5 rounded-lg hover:bg-black/5 transition-colors touch-manipulation"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
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
              {/* Morphic nav for mobile */}
              <div className="flex flex-col items-center gap-4 pt-4">
                <div className="flex items-center overflow-hidden rounded-xl">
                  {navItems.map((item, index) => {
                    const active = isActive(item.href);
                    const prevActive = index > 0 && isActive(navItems[index - 1].href);
                    const nextActive = index < navItems.length - 1 && isActive(navItems[index + 1].href);
                    const isFirst = index === 0;
                    const isLast = index === navItems.length - 1;

                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center justify-center px-4 py-2.5 text-sm text-white transition-all duration-300 bg-black/80',
                          active
                            ? 'mx-1.5 rounded-xl font-semibold bg-black'
                            : cn(
                                'font-medium',
                                (prevActive || isFirst) && 'rounded-l-xl',
                                (nextActive || isLast) && 'rounded-r-xl'
                              )
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Extra links */}
                <div className="flex gap-4 mt-2">
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm text-[var(--gray-500)] hover:text-[var(--black)] transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="mt-auto pt-6 border-t border-black/5"
              >
                <div className="flex items-center gap-3 px-4 py-3 mb-3">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full bg-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--black)]">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-[var(--gray-400)]">{user.email}</p>
                  </div>
                </div>
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
      <main className={cn(
        pathname === '/dashboard/studio'
          ? 'h-[100dvh] overflow-hidden'
          : 'pt-20 px-4 lg:px-8 pb-8'
      )}>
        <div className={cn(
          pathname === '/dashboard/studio' ? 'h-full' : 'max-w-6xl mx-auto'
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}

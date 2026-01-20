'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Terminal,
  Mic,
  FileText,
  Zap,
  User,
  CreditCard
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

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'AI Studio', icon: Terminal },
  { href: '/dashboard/voice', label: 'Voice AI', icon: Mic },
  { href: '/dashboard/rag', label: 'RAG Bots', icon: FileText },
  { href: '/dashboard/bots', label: 'Workflows', icon: Zap },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayoutContent({ children, user }: DashboardLayoutContentProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Dynamic Island Navigation */}
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
              {navItems.map((item) => {
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
                <span className="text-xs font-medium text-[var(--black)] max-w-[60px] truncate">
                  {user.email?.split('@')[0]}
                </span>
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
                    <div className="px-4 py-3 border-b border-black/5">
                      <p className="text-xs text-[var(--gray-500)]">Signed in as</p>
                      <p className="text-sm font-medium text-[var(--black)] truncate">
                        {user.email}
                      </p>
                    </div>
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
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-white/60 backdrop-blur-2xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Content */}
            <div className="relative flex flex-col h-full pt-20 pb-8 px-6">
              <nav className="flex-1 space-y-1">
                {navItems.map((item, index) => {
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
                <div className="flex items-center gap-3 px-4 py-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--black)] flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
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

      {/* Main Content - with top padding for navbar */}
      <main className="pt-20 px-4 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Container } from './Container';
import { navigation } from '@/data/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const handleMobileNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'unset';

    if (href.includes('#')) {
      const [path, hash] = href.split('#');
      const targetPath = path || '/';

      if (pathname === targetPath || (pathname === '/' && targetPath === '/')) {
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      } else {
        router.push(href);
      }
    } else {
      router.push(href);
    }
  }, [pathname, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    router.refresh();
  };

  const handleLogin = () => {
    const currentPath = pathname;
    router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
  };

  return (
    <>
      {/* Dynamic Island Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className={cn(
            'pointer-events-auto mt-4 mx-4',
            'px-4 md:px-6 py-3',
            'rounded-full',
            'bg-white/30 backdrop-blur-xl',
            'border border-white/30',
            'shadow-lg shadow-black/[0.05]',
            'transition-all duration-500 ease-out',
            isScrolled && 'bg-white/50 shadow-xl shadow-black/[0.08]'
          )}
        >
          <nav className="flex items-center gap-2 md:gap-8">
            {/* Logo */}
            <Link
              href="/"
              className="group flex items-center gap-2"
            >
              <Image
                src="/images/allone-logo.png"
                alt="Allone"
                width={24}
                height={24}
                className="group-hover:scale-110 transition-transform duration-300"
              />
              <span className="text-sm font-semibold text-[var(--black)] tracking-tight">
                ALLONE
              </span>
            </Link>

            {/* Desktop Navigation - Center */}
            <div className="hidden md:flex items-center gap-1">
              {navigation
                .filter(item => user ? item.key !== 'contact' : true)
                .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200',
                    pathname === item.href || (item.href === '/products' && pathname.startsWith('/products'))
                      ? 'text-[var(--black)] bg-black/5'
                      : 'text-[var(--gray-500)] hover:text-[var(--black)] hover:bg-black/5'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              {user && (
                <Link
                  href="/dashboard"
                  className={cn(
                    'text-sm font-medium px-3 py-1.5 rounded-full transition-all duration-200',
                    pathname.startsWith('/dashboard')
                      ? 'text-[var(--black)] bg-black/5'
                      : 'text-[var(--gray-500)] hover:text-[var(--black)] hover:bg-black/5'
                  )}
                >
                  Dashboard
                </Link>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-black/10" />

            {/* Right Side - Login/Profile */}
            <div className="hidden md:flex items-center">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-black/5 transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full bg-[var(--black)] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm font-medium text-[var(--black)] max-w-[80px] truncate">
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
                        className="absolute right-0 top-full mt-2 w-48 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 border border-white/20 overflow-hidden"
                      >
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--gray-700)] hover:bg-black/5 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Dashboard
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50/50 transition-colors border-t border-black/5"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="text-sm font-medium text-white py-1.5 px-4 rounded-full bg-[var(--black)] hover:bg-[var(--gray-800)] transition-colors"
                >
                  Login
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden p-1.5 rounded-full hover:bg-black/5 transition-colors touch-manipulation"
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
            <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl" />

            {/* Content */}
            <div className="relative flex flex-col h-full pt-24 pb-8 px-6">
              <nav className="flex-1 space-y-2">
                {navigation
                  .filter(item => user ? item.key !== 'contact' : true)
                  .map((item) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <a
                      href={item.href}
                      onClick={(e) => handleMobileNavClick(e, item.href)}
                      className={cn(
                        'block py-4 px-4 text-xl font-medium rounded-2xl transition-colors',
                        'active:bg-black/5 touch-manipulation',
                        pathname === item.href
                          ? 'text-[var(--black)] bg-black/5'
                          : 'text-[var(--gray-500)]'
                      )}
                    >
                      {item.label}
                    </a>
                  </motion.div>
                ))}
                {user && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <Link
                      href="/dashboard"
                      className={cn(
                        'block py-4 px-4 text-xl font-medium rounded-2xl transition-colors',
                        pathname.startsWith('/dashboard')
                          ? 'text-[var(--black)] bg-black/5'
                          : 'text-[var(--gray-500)]'
                      )}
                    >
                      Dashboard
                    </Link>
                  </motion.div>
                )}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="pt-6"
              >
                {user ? (
                  <div className="space-y-3">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 py-3 px-4 bg-white/80 backdrop-blur-xl rounded-2xl text-[var(--black)] font-medium border border-white/20 shadow-lg shadow-black/5"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 py-3 px-4 text-red-600 font-medium rounded-2xl hover:bg-red-50/50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleLogin}
                    className="w-full py-3.5 px-4 bg-[var(--black)] text-white font-medium rounded-full shadow-lg shadow-black/20"
                  >
                    Login
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

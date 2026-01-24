'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigation } from '@/data/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import ProfileDropdown from '@/components/kokonutui/profile-dropdown';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

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
    router.refresh();
  };

  const handleLogin = () => {
    const currentPath = pathname;
    router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
  };

  // Build nav items based on auth state
  const navItems = [
    ...navigation.filter(item => user ? item.key !== 'contact' : true),
    ...(user ? [{ label: 'Dashboard', href: '/dashboard', key: 'dashboard' }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Morphic Navigation - no card, bare pills */}
      <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="pointer-events-auto mt-4 mx-4 px-3 md:px-4 py-2.5 flex items-center justify-center"
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
              <span className="text-sm font-semibold text-[var(--black)] tracking-tight hidden sm:inline">
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

            {/* Right Side - Login/Profile */}
            <div className="hidden md:flex items-center ml-1">
              {user ? (
                <ProfileDropdown
                  glass
                  profile={{
                    name: user.email?.split('@')[0] ?? 'User',
                    email: user.email ?? '',
                  }}
                  onSignOut={handleSignOut}
                />
              ) : (
                <button
                  onClick={handleLogin}
                  className="text-sm font-medium text-[var(--black)] py-1.5 px-4 rounded-xl border border-black/10 hover:bg-black/5 transition-all duration-200"
                >
                  Login
                </button>
              )}
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
            <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl" />

            <div className="relative flex flex-col h-full pt-24 pb-8 px-6">
              {/* Morphic nav for mobile */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center overflow-hidden rounded-xl">
                  {navItems.map((item, index) => {
                    const active = isActive(item.href);
                    const prevActive = index > 0 && isActive(navItems[index - 1].href);
                    const nextActive = index < navItems.length - 1 && isActive(navItems[index + 1].href);
                    const isFirst = index === 0;
                    const isLast = index === navItems.length - 1;

                    return (
                      <a
                        key={item.key}
                        href={item.href}
                        onClick={(e) => handleMobileNavClick(e, item.href)}
                        className={cn(
                          'flex items-center justify-center px-5 py-2.5 text-sm text-white transition-all duration-300 bg-black/80',
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
                      </a>
                    );
                  })}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-auto pt-6"
              >
                {user ? (
                  <div className="space-y-3">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 py-3 px-4 bg-black text-white font-medium rounded-xl"
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
                    className="w-full py-3.5 px-4 bg-black text-white font-medium rounded-xl"
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

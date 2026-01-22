'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navigation } from '@/data/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Liquid nav link with magnetic effect
function LiquidNavLink({ href, label, isActive, mouseX }: {
  href: string;
  label: string;
  isActive: boolean;
  mouseX: ReturnType<typeof useMotionValue<number>>;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    if (!ref.current || val === -1) return 200;
    const bounds = ref.current.getBoundingClientRect();
    const itemCenterX = bounds.left + bounds.width / 2;
    return Math.abs(val - itemCenterX);
  });

  const scale = useTransform(distance, [0, 100, 200], [1.12, 1.04, 1]);
  const y = useTransform(distance, [0, 100, 200], [-1.5, -0.5, 0]);

  const springScale = useSpring(scale, { stiffness: 400, damping: 30 });
  const springY = useSpring(y, { stiffness: 400, damping: 30 });

  return (
    <motion.div style={{ scale: springScale, y: springY }}>
      <Link
        ref={ref}
        href={href}
        className={cn(
          'text-sm font-medium px-3 py-1.5 rounded-full transition-colors duration-200',
          isActive
            ? 'text-[var(--black)] bg-black/5'
            : 'text-[var(--gray-500)] hover:text-[var(--black)] hover:bg-black/5'
        )}
      >
        {label}
      </Link>
    </motion.div>
  );
}

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isNear, setIsNear] = useState(false);
  const [liquidRadius, setLiquidRadius] = useState('50px');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const headerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(-1);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track mouse proximity to navbar and compute liquid shape
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!headerRef.current) return;
    const bounds = headerRef.current.getBoundingClientRect();
    const distanceToNav = Math.abs(e.clientY - (bounds.top + bounds.height / 2));
    const horizontalIn = e.clientX >= bounds.left - 60 && e.clientX <= bounds.right + 60;

    if (distanceToNav < 100 && horizontalIn) {
      setIsNear(true);
      mouseX.set(e.clientX);

      const relX = (e.clientX - bounds.left) / bounds.width;
      const relY = Math.max(0, 1 - distanceToNav / 100);

      const base = 50;
      const variance = 18 * relY;
      const tl = base - variance * relX + variance * 0.3;
      const tr = base + variance * relX - variance * 0.5;
      const br = base - variance * (1 - relX) + variance * 0.4;
      const bl = base + variance * (1 - relX) - variance * 0.2;

      const tl2 = base + variance * 0.5;
      const tr2 = base - variance * 0.3;
      const br2 = base + variance * 0.2;
      const bl2 = base - variance * 0.4;

      setLiquidRadius(
        `${tl}% ${tr}% ${br}% ${bl}% / ${tl2}% ${tr2}% ${br2}% ${bl2}%`
      );
    } else {
      setIsNear(false);
      mouseX.set(-1);
      setLiquidRadius('50px');
    }
  }, [mouseX]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

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

  const filteredNavigation = navigation.filter(item => user ? item.key !== 'contact' : true);

  return (
    <>
      {/* Dynamic Island Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <motion.header
          ref={headerRef}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          onMouseLeave={() => { setIsNear(false); mouseX.set(-1); setLiquidRadius('50px'); }}
          style={{ borderRadius: liquidRadius }}
          className={cn(
            'pointer-events-auto mt-4 mx-4',
            'px-4 md:px-6 py-3',
            'backdrop-blur-xl',
            'border',
            'transition-all duration-300 ease-out',
            isNear
              ? 'bg-white/60 border-white/50 shadow-xl shadow-black/[0.08] scale-[1.02]'
              : isScrolled
                ? 'bg-white/50 border-white/40 shadow-xl shadow-black/[0.08]'
                : 'bg-white/30 border-white/30 shadow-lg shadow-black/[0.05]'
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

            {/* Desktop Navigation with Liquid Effect */}
            <div className="hidden md:flex items-center gap-1">
              {filteredNavigation.map((item) => (
                <LiquidNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={pathname === item.href || (item.href === '/products' && pathname.startsWith('/products'))}
                  mouseX={mouseX}
                />
              ))}
              {user && (
                <LiquidNavLink
                  href="/dashboard"
                  label="Dashboard"
                  isActive={pathname.startsWith('/dashboard')}
                  mouseX={mouseX}
                />
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
                        transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-white/40 overflow-hidden"
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
                <motion.button
                  onClick={handleLogin}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="text-sm font-medium text-white py-1.5 px-4 rounded-full bg-[var(--black)] hover:bg-[var(--gray-800)] transition-colors"
                >
                  Login
                </motion.button>
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
                {filteredNavigation.map((item) => (
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

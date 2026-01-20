'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Circle,
  ChevronRight,
  CreditCard
} from 'lucide-react';

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
  { href: '/products', label: 'AI Studio', icon: Terminal, external: true },
  { href: '/dashboard/voice', label: 'Voice AI', icon: Mic },
  { href: '/dashboard/rag', label: 'RAG Bots', icon: FileText },
  { href: '/dashboard/bots', label: 'Workflows', icon: Zap },
];

const bottomNav = [
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayoutContent({ children, user }: DashboardLayoutContentProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--gray-200)]">
        <Link href="/" className="text-base font-medium text-[var(--black)] tracking-tight">ALLONE</Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-[var(--gray-600)] hover:text-[var(--black)]"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 w-56 bg-white border-r border-[var(--gray-200)] z-50 transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[var(--gray-200)]">
            <Link href="/" className="text-base font-medium text-[var(--black)] tracking-tight">
              ALLONE
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-[var(--gray-400)] hover:text-[var(--black)] lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User */}
          <div className="px-4 py-4 border-b border-[var(--gray-200)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-[var(--black)] flex items-center justify-center text-white text-xs font-medium">
                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--black)] truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <div className="flex items-center gap-1">
                  <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
                  <span className="text-xs text-[var(--gray-400)]">Online</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4">
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors group ${
                      active
                        ? 'bg-[var(--gray-100)] text-[var(--black)]'
                        : 'text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--black)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-[var(--black)]' : 'text-[var(--gray-400)] group-hover:text-[var(--gray-600)]'}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.external && (
                      <ChevronRight className="w-3 h-3 text-[var(--gray-300)]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Bottom */}
          <div className="px-2 py-4 border-t border-[var(--gray-200)] space-y-0.5">
            {bottomNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? 'bg-[var(--gray-100)] text-[var(--black)]'
                      : 'text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-[var(--black)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm text-[var(--gray-500)] hover:bg-[var(--gray-50)] hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-56 min-h-screen">
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

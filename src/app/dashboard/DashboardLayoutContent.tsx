'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  User
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
  { href: '/dashboard/purchases', label: 'My Purchases', icon: ShoppingBag },
  { href: '/dashboard/subscriptions', label: 'Subscriptions', icon: CreditCard },
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

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[var(--gray-200)]">
        <Link href="/" className="text-xl font-bold text-[var(--black)]">ALLONE</Link>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-[var(--gray-600)] hover:text-[var(--black)]"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className="fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-[var(--gray-200)] z-50 lg:translate-x-0 transition-transform"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-[var(--gray-200)] flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-[var(--black)]">ALLONE</Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 text-[var(--gray-500)] hover:text-[var(--black)] lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-[var(--gray-200)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-[var(--accent)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--black)] truncate">
                  {user.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs text-[var(--gray-500)] truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--gray-600)] hover:bg-[var(--gray-100)] hover:text-[var(--black)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-[var(--gray-200)]">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

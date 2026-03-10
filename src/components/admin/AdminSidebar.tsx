'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  FolderKanban,
  Settings,
  Briefcase,
  Users,
  BarChart3,
  Heart,
  FileText,
  LogOut,
  ExternalLink,
  Tag,
  UserCheck,
  ChevronLeft,
  Menu,
  X,
  Bot,
} from 'lucide-react';

const navigationSections = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Content',
    items: [
      { name: 'Projects', href: '/admin/projects', icon: FolderKanban },
      { name: 'Services', href: '/admin/services', icon: Briefcase },
      { name: 'Clients', href: '/admin/clients', icon: Users },
      { name: 'Leads', href: '/admin/leads', icon: UserCheck },
    ],
  },
  {
    label: 'Manage',
    items: [
      { name: 'Categories', href: '/admin/categories', icon: Tag },
      { name: 'Stats', href: '/admin/stats', icon: BarChart3 },
      { name: 'Values', href: '/admin/values', icon: Heart },
    ],
  },
  {
    label: 'Settings',
    items: [
      { name: 'About Page', href: '/admin/about', icon: FileText },
      { name: 'Contact', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    label: 'AI',
    items: [
      { name: 'Claude', href: '/admin/claude', icon: Bot },
    ],
  },
  {
    label: 'Sales',
    items: [
      { name: 'Sales Dashboard', href: '/sales', icon: Briefcase },
      { name: 'Pitch Deck', href: '/pitch', icon: FileText },
    ],
  },
];

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function AdminSidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    if (isMobileOpen) {
      onMobileClose();
    }
  };

  // Desktop sidebar content (supports collapsed state)
  const desktopSidebarContent = (
    <div className="flex h-full flex-col relative">
      {/* Logo Section */}
      <div className={cn(
        "flex h-16 items-center border-b border-[var(--gray-100)] transition-all duration-200",
        isCollapsed ? "justify-center px-2" : "px-5"
      )}>
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-[var(--gray-200)] flex-shrink-0">
            <Image
              src="/images/allone-logo.png"
              alt="Allone"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-base font-semibold tracking-tight text-[var(--black)] whitespace-nowrap overflow-hidden"
              >
                Allone
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section) => (
            <div key={section.label}>
              {/* Section Label */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-3 mb-2 overflow-hidden"
                  >
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--gray-400)]">
                      {section.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Section Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <div key={item.name} className="relative group">
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center rounded-lg text-[13px] font-medium transition-all duration-200',
                          isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                          active
                            ? 'bg-[var(--gray-100)] text-[var(--black)]'
                            : 'text-[var(--gray-600)] hover:bg-white hover:text-[var(--black)]'
                        )}
                      >
                        <Icon className={cn(
                          'h-[18px] w-[18px] flex-shrink-0 transition-colors',
                          active ? 'text-[var(--black)]' : 'text-[var(--gray-400)]'
                        )} />
                        <AnimatePresence mode="wait">
                          {!isCollapsed && (
                            <motion.span
                              initial={{ opacity: 0, width: 0 }}
                              animate={{ opacity: 1, width: 'auto' }}
                              exit={{ opacity: 0, width: 0 }}
                              transition={{ duration: 0.15 }}
                              className="whitespace-nowrap overflow-hidden"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </Link>
                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--black)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">
                          {item.name}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-[var(--gray-100)] p-3 space-y-1">
        {/* View Website Link */}
        <div className="relative group">
          <Link
            href="/"
            target="_blank"
            className={cn(
              "flex items-center rounded-lg text-[13px] font-medium text-[var(--gray-500)] hover:bg-white hover:text-[var(--black)] transition-all duration-200",
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
            )}
          >
            <ExternalLink className="h-[18px] w-[18px] flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  View Website
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          {isCollapsed && (
            <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--black)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">
              View Website
            </div>
          )}
        </div>

        {/* Sign Out Button */}
        <div className="relative group">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center rounded-lg text-[13px] font-medium text-[var(--gray-500)] hover:bg-white hover:text-[var(--black)] transition-all duration-200",
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
            )}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          {isCollapsed && (
            <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--black)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">
              Sign Out
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-[var(--gray-200)] rounded-full flex items-center justify-center text-[var(--gray-400)] hover:text-[var(--black)] hover:border-[var(--gray-300)] hover:bg-white transition-all duration-200 shadow-sm z-50"
      >
        <ChevronLeft className={cn("h-4 w-4 transition-transform duration-200", isCollapsed && "rotate-180")} />
      </button>
    </div>
  );

  // Mobile sidebar content (always expanded, no collapse)
  const mobileSidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo Section with close button */}
      <div className="flex h-16 items-center justify-between border-b border-[var(--gray-100)] px-5">
        <Link href="/admin" className="flex items-center gap-3" onClick={handleNavClick}>
          <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-[var(--gray-200)]">
            <Image
              src="/images/allone-logo.png"
              alt="Allone"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-base font-semibold tracking-tight text-[var(--black)]">
            Allone
          </span>
        </Link>
        <button
          onClick={onMobileClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--gray-400)] hover:text-[var(--black)] hover:bg-[var(--gray-100)] transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section) => (
            <div key={section.label}>
              <div className="px-3 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--gray-400)]">
                  {section.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                        active
                          ? 'bg-[var(--gray-100)] text-[var(--black)]'
                          : 'text-[var(--gray-600)] hover:bg-white hover:text-[var(--black)]'
                      )}
                    >
                      <Icon className={cn(
                        'h-[18px] w-[18px]',
                        active ? 'text-[var(--black)]' : 'text-[var(--gray-400)]'
                      )} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="border-t border-[var(--gray-100)] p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          onClick={handleNavClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--gray-500)] hover:bg-white hover:text-[var(--black)] transition-colors"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
          <span>View Website</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--gray-500)] hover:bg-white hover:text-[var(--black)] transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-[var(--gray-200)] hidden lg:block transition-[width] duration-200 ease-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {desktopSidebarContent}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-[var(--gray-200)] rounded-lg flex items-center justify-center text-[var(--gray-600)] hover:text-[var(--black)] shadow-sm transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 z-50 h-screen w-[280px] bg-white shadow-xl"
            >
              {mobileSidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );

  function setIsMobileOpen(open: boolean) {
    if (open) {
      // Use onToggle for mobile which will set isMobileOpen to true
      onToggle();
    } else {
      onMobileClose();
    }
  }
}

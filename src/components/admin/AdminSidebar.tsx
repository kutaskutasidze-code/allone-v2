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
  Flame,
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
      { name: 'Hot Lines', href: '/admin/leads/hotlines', icon: Flame },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { name: 'Categories', href: '/admin/categories', icon: Tag },
      { name: 'Stats', href: '/admin/stats', icon: BarChart3 },
      { name: 'Values', href: '/admin/values', icon: Heart },
      { name: 'About Page', href: '/admin/about', icon: FileText },
      { name: 'Contact', href: '/admin/settings', icon: Settings },
    ],
  },
  {
    label: 'Tools',
    items: [
      { name: 'Claude', href: '/admin/claude', icon: Bot },
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
    if (href === '/admin/leads') {
      return pathname === '/admin/leads' ||
        (pathname.startsWith('/admin/leads/') && !pathname.startsWith('/admin/leads/hotlines'));
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    if (isMobileOpen) {
      onMobileClose();
    }
  };

  const NavItem = ({ item, collapsed }: { item: typeof navigationSections[0]['items'][0]; collapsed: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <div className="relative group">
        <Link
          href={item.href}
          onClick={handleNavClick}
          className={cn(
            'relative flex items-center rounded-lg text-[13px] font-medium transition-colors duration-150',
            collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
            active
              ? 'text-gray-900 font-semibold'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
          )}
        >
          {active && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-gray-900 rounded-full" />
          )}
          <Icon className={cn(
            'h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150',
            active ? 'text-gray-900' : 'text-gray-400'
          )} />
          <span className={cn(
            'whitespace-nowrap transition-all duration-200 overflow-hidden',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            {item.name}
          </span>
        </Link>
        {collapsed && (
          <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">
            {item.name}
          </div>
        )}
      </div>
    );
  };

  const desktopSidebarContent = (
    <div className="flex h-full flex-col relative">
      {/* Logo */}
      <div className={cn(
        "flex h-14 items-center border-b border-gray-100 transition-all duration-200",
        isCollapsed ? "justify-center px-2" : "px-5"
      )}>
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <Image
              src="/images/allone-logo.png"
              alt="Allone"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <span className={cn(
            'text-sm font-semibold tracking-tight text-gray-900 whitespace-nowrap transition-all duration-200 overflow-hidden',
            isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}>
            Allone
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section, idx) => (
            <div key={section.label}>
              {idx > 0 && <div className="border-t border-gray-100 mb-3" />}
              <div className={cn(
                'px-3 mb-2 transition-all duration-200 overflow-hidden',
                isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'
              )}>
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                  {section.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItem key={item.name} item={item} collapsed={isCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3 space-y-0.5">
        <div className="relative group">
          <Link
            href="/"
            target="_blank"
            className={cn(
              "flex items-center rounded-lg text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150",
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
            )}
          >
            <ExternalLink className="h-[18px] w-[18px] flex-shrink-0" />
            <span className={cn(
              'whitespace-nowrap transition-all duration-200 overflow-hidden',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}>
              View Website
            </span>
          </Link>
          {isCollapsed && (
            <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">
              View Website
            </div>
          )}
        </div>

        <div className="relative group">
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center rounded-lg text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150",
              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2"
            )}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            <span className={cn(
              'whitespace-nowrap transition-all duration-200 overflow-hidden',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}>
              Sign Out
            </span>
          </button>
          {isCollapsed && (
            <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">
              Sign Out
            </div>
          )}
        </div>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 hover:border-gray-300 transition-all duration-150 shadow-sm z-50"
      >
        <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-200", isCollapsed && "rotate-180")} />
      </button>
    </div>
  );

  const mobileSidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo + close */}
      <div className="flex h-14 items-center justify-between border-b border-gray-100 px-5">
        <Link href="/admin" className="flex items-center gap-3" onClick={handleNavClick}>
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image
              src="/images/allone-logo.png"
              alt="Allone"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-semibold tracking-tight text-gray-900">
            Allone
          </span>
        </Link>
        <button
          onClick={onMobileClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section, idx) => (
            <div key={section.label}>
              {idx > 0 && <div className="border-t border-gray-100 mb-3" />}
              <div className="px-3 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
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
                        'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150',
                        active
                          ? 'text-gray-900 font-semibold'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-gray-900 rounded-full" />
                      )}
                      <Icon className={cn(
                        'h-[18px] w-[18px]',
                        active ? 'text-gray-900' : 'text-gray-400'
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

      {/* Footer */}
      <div className="border-t border-gray-100 p-3 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          onClick={handleNavClick}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
        >
          <ExternalLink className="h-[18px] w-[18px]" />
          <span>View Website</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
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
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-100 hidden lg:block transition-[width] duration-200 ease-out",
          isCollapsed ? "w-[72px]" : "w-64"
        )}
      >
        {desktopSidebarContent}
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-sm transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
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
      onToggle();
    } else {
      onMobileClose();
    }
  }
}

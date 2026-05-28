'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Users,
  LogOut,
  ExternalLink,
  ChevronLeft,
  Menu,
  X,
  Mail,
  BarChart3,
  Database,
  FileText,
  UserCog,
  Flame,
  Sun,
  Moon,
  Phone,
} from 'lucide-react';
import { useSalesTheme } from '@/app/sales/SalesThemeContext';

function buildNavigationSections(isSupervisor: boolean) {
  const sections = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', href: '/sales', icon: LayoutDashboard },
        { name: 'Call Mode', href: '/sales/call', icon: Phone },
        { name: "Today's Queue", href: '/sales/leads?scope=today', icon: Sun },
        { name: 'Analytics', href: '/sales/analytics', icon: BarChart3 },
      ],
    },
    {
      label: 'Sales',
      items: [
        { name: 'Leads', href: '/sales/leads', icon: Users },
        { name: 'Hot Lines', href: '/sales/leads/hotlines', icon: Flame },
        { name: 'Campaigns', href: '/sales/campaigns', icon: Mail },
      ],
    },
    {
      label: 'System',
      items: [
        { name: 'Sources', href: '/sales/sources', icon: Database },
        { name: 'Templates', href: '/sales/templates', icon: FileText },
      ],
    },
  ];
  if (isSupervisor) {
    sections[1].items.push({ name: 'Team', href: '/sales/team', icon: UserCog });
  }
  return sections;
}

interface SalesSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function SalesSidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SalesSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isSupervisor, setIsSupervisor] = useState(false);
  const { theme, toggleTheme } = useSalesTheme();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;
      const { data } = await supabase.from('sales_users').select('role').eq('email', (user.email||'').toLowerCase()).maybeSingle();
      if (data?.role === 'supervisor' || data?.role === 'admin') setIsSupervisor(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigationSections = buildNavigationSections(isSupervisor);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/sales/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/sales') return pathname === '/sales';
    if (href === '/sales/leads') {
      return pathname === '/sales/leads' ||
        (pathname.startsWith('/sales/leads/') && !pathname.startsWith('/sales/leads/hotlines'));
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    if (isMobileOpen) onMobileClose();
  };

  const NavItem = ({ item, collapsed }: { item: { name: string; href: string; icon: typeof LayoutDashboard }; collapsed: boolean }) => {
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
            active ? 'text-[var(--ink-900)] dark:text-slate-100 font-semibold' : 'text-[var(--ink-500)] dark:text-[var(--ink-400)] hover:text-[var(--ink-900)] dark:hover:text-slate-100 hover:bg-[var(--bg-surface-alt)] dark:hover:bg-slate-800'
          )}
        >
          {active && !collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[var(--ink-900)] rounded-full" />
          )}
          <Icon className={cn('h-[18px] w-[18px] flex-shrink-0 transition-colors duration-150', active ? 'text-[var(--ink-900)] dark:text-slate-100' : 'text-[var(--ink-400)] dark:text-[var(--ink-500)]')} />
          <span className={cn('whitespace-nowrap transition-all duration-200 overflow-hidden', collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
            {item.name}
          </span>
        </Link>
        {collapsed && (
          <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--ink-900)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">
            {item.name}
          </div>
        )}
      </div>
    );
  };

  const desktopSidebarContent = (
    <div className="flex h-full flex-col relative">
      <div className={cn('flex h-14 items-center border-b border-[var(--allone-line-soft)] dark:border-slate-800 transition-all duration-200', isCollapsed ? 'justify-center px-2' : 'px-5')}>
        <Link href="/sales" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/images/allone-logo.png" alt="Allone" width={32} height={32} className="object-contain" priority />
          </div>
          <span className={cn('text-sm font-semibold tracking-tight text-[var(--ink-900)] dark:text-slate-100 whitespace-nowrap transition-all duration-200 overflow-hidden', isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
            Sales Portal
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section, idx) => (
            <div key={section.label}>
              {idx > 0 && <div className="border-t border-[var(--allone-line-soft)] mb-3" />}
              <div className={cn('px-3 mb-2 transition-all duration-200 overflow-hidden', isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100')}>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-400)] dark:text-[var(--ink-500)]">{section.label}</span>
              </div>
              <div className="space-y-0.5">
                {section.items.map(item => <NavItem key={item.name} item={item} collapsed={isCollapsed} />)}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--allone-line-soft)] dark:border-slate-800 p-3 space-y-0.5">
        <div className="relative group">
          <button onClick={toggleTheme} className={cn('flex w-full items-center rounded-lg text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] dark:text-[var(--ink-400)] dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors duration-150', isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2')}>
            {theme === 'dark'
              ? <Sun className="h-[18px] w-[18px] flex-shrink-0" />
              : <Moon className="h-[18px] w-[18px] flex-shrink-0" />}
            <span className={cn('whitespace-nowrap transition-all duration-200 overflow-hidden', isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </span>
          </button>
          {isCollapsed && <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--ink-900)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</div>}
        </div>
        <div className="relative group">
          <Link href="/" target="_blank" className={cn('flex items-center rounded-lg text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] dark:text-[var(--ink-400)] dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors duration-150', isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2')}>
            <ExternalLink className="h-[18px] w-[18px] flex-shrink-0" />
            <span className={cn('whitespace-nowrap transition-all duration-200 overflow-hidden', isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>View Website</span>
          </Link>
          {isCollapsed && <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--ink-900)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">View Website</div>}
        </div>
        <div className="relative group">
          <button onClick={handleLogout} className={cn('flex w-full items-center rounded-lg text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] dark:text-[var(--ink-400)] dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors duration-150', isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2')}>
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            <span className={cn('whitespace-nowrap transition-all duration-200 overflow-hidden', isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>Sign Out</span>
          </button>
          {isCollapsed && <div className="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[var(--ink-900)] text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 whitespace-nowrap z-[60]">Sign Out</div>}
        </div>
      </div>

      <button onClick={onToggle} className="absolute -right-3 top-20 w-6 h-6 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-full flex items-center justify-center text-[var(--ink-400)] hover:text-[var(--ink-900)] hover:border-[var(--allone-line-strong)] transition-all duration-150 shadow-sm z-50">
        <ChevronLeft className={cn('h-3.5 w-3.5 transition-transform duration-200', isCollapsed && 'rotate-180')} />
      </button>
    </div>
  );

  const mobileSidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between border-b border-[var(--allone-line-soft)] dark:border-slate-800 px-5">
        <Link href="/sales" className="flex items-center gap-3" onClick={handleNavClick}>
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/images/allone-logo.png" alt="Allone" width={32} height={32} className="object-contain" priority />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--ink-900)] dark:text-slate-100">Sales Portal</span>
        </Link>
        <button onClick={onMobileClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--ink-400)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section, idx) => (
            <div key={section.label}>
              {idx > 0 && <div className="border-t border-[var(--allone-line-soft)] mb-3" />}
              <div className="px-3 mb-2">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--ink-400)] dark:text-[var(--ink-500)]">{section.label}</span>
              </div>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn('relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-150', active ? 'text-[var(--ink-900)] dark:text-slate-100 font-semibold' : 'text-[var(--ink-500)] dark:text-[var(--ink-400)] hover:text-[var(--ink-900)] dark:hover:text-slate-100 hover:bg-[var(--bg-surface-alt)] dark:hover:bg-slate-800')}
                    >
                      {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5 bg-[var(--ink-900)] rounded-full" />}
                      <Icon className={cn('h-[18px] w-[18px]', active ? 'text-[var(--ink-900)] dark:text-slate-100' : 'text-[var(--ink-400)] dark:text-[var(--ink-500)]')} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <div className="border-t border-[var(--allone-line-soft)] dark:border-slate-800 p-3 space-y-0.5">
        <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] dark:text-[var(--ink-400)] dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors duration-150">
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <Link href="/" target="_blank" onClick={handleNavClick} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] dark:text-[var(--ink-400)] dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors duration-150">
          <ExternalLink className="h-[18px] w-[18px]" />
          <span>View Website</span>
        </Link>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--bg-surface-alt)] dark:text-[var(--ink-400)] dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors duration-150">
          <LogOut className="h-[18px] w-[18px]" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn('fixed left-0 top-0 z-40 h-screen bg-[var(--bg-surface)] dark:bg-[var(--ink-900)] border-r border-[var(--allone-line-soft)] dark:border-slate-800 hidden lg:block transition-[width] duration-200 ease-out', isCollapsed ? 'w-[72px]' : 'w-64')}>
        {desktopSidebarContent}
      </aside>
      <button onClick={onToggle} className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-lg flex items-center justify-center text-[var(--ink-700)] hover:text-[var(--ink-900)] shadow-sm transition-colors" aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
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
              className="lg:hidden fixed left-0 top-0 z-50 h-screen w-[280px] bg-[var(--bg-surface)] shadow-xl"
            >
              {mobileSidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

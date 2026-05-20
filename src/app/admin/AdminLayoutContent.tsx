'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminThemeContext, type AdminTheme } from './AdminThemeContext';

const THEME_STORAGE_KEY = 'allone-admin-theme';

export function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [theme, setTheme] = useState<AdminTheme>('light');

  // Read stored theme on mount (client-only — SSR renders light, then this kicks in pre-paint).
  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') setTheme(stored);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try { window.localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const desktopMargin = isDesktop ? (isCollapsed ? 72 : 256) : 0;
  const isDark = theme === 'dark';

  return (
    <AdminThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className={`${isDark ? 'dark ' : ''}min-h-screen bg-[#FAFAFA]`}>
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggle={() => {
            if (window.innerWidth < 1024) {
              setIsMobileOpen(!isMobileOpen);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />
        <main
          className="min-h-screen transition-[margin-left] duration-200 ease-out"
          style={{ marginLeft: desktopMargin }}
        >
          <div className="p-5 pt-16 lg:pt-8 lg:px-10 lg:pb-10">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </AdminThemeContext.Provider>
  );
}

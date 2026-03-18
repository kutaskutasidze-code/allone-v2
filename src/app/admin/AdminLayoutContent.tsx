'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Sidebar state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Track desktop vs mobile
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Login page has its own full-screen layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Calculate margin for desktop only
  const desktopMargin = isDesktop ? (isCollapsed ? 72 : 256) : 0;

  // All other admin pages get the sidebar layout
  return (
    <div className="min-h-screen bg-white">
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
        <div className="p-4 pt-16 lg:pt-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

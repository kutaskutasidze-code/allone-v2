'use client';

import { Home, Briefcase, Zap, Atom } from 'lucide-react';
import { NavBar } from "@/components/ui/tubelight-navbar";

export function Header() {
  const navItems = [
    { name: 'Home', i18nKey: 'nav.home', url: '/', icon: Home },
    { name: 'Services', i18nKey: 'nav.services', url: '/services', icon: Zap },
    { name: 'Work', i18nKey: 'nav.work', url: '/work', icon: Briefcase },
    { name: 'Lab', i18nKey: 'nav.lab', url: '/lab', icon: Atom },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <NavBar items={navItems} />
      </div>
    </div>
  );
}

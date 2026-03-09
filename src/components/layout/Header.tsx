'use client';

import { Home, Briefcase, FileText, User, Zap } from 'lucide-react';
import { NavBar } from "@/components/ui/tubelight-navbar";

export function Header() {
  const navItems = [
    { name: 'Home', url: '/', icon: Home },
    { name: 'Services', url: '/services', icon: Zap },
    { name: 'Work', url: '/work', icon: Briefcase },
    { name: 'About', url: '/about', icon: User }
  ];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <NavBar items={navItems} />
      </div>
    </div>
  );
}

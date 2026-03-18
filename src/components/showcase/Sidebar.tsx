'use client';

import Image from 'next/image';
import {
  LayoutDashboard,
  BarChart3,
  Zap,
  Puzzle,
  Settings,
  HelpCircle,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: BarChart3, label: 'Analytics', active: false },
  { icon: Zap, label: 'Automations', active: false },
  { icon: Puzzle, label: 'Integrations', active: false },
  { icon: Settings, label: 'Settings', active: false },
];

export function Sidebar() {
  return (
    <aside className="w-[240px] h-full bg-white border-r border-[#e4e4e7] flex flex-col py-6 relative">
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center">
            <Image
              src="/images/allone-logo.png"
              alt="Allone"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div>
            <span className="text-[#0a0a0a] font-semibold font-display tracking-tight">All</span>
            <span className="text-[#3d5a80] font-semibold font-display tracking-tight">one</span>
          </div>
        </div>
      </div>

      {/* Navigation Label */}
      <div className="px-6 mb-2">
        <span className="text-[10px] font-medium text-[#a1a1aa] uppercase tracking-wider">Menu</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map((item, index) => (
          <button
            key={index}
            className={`w-full h-10 rounded-xl flex items-center gap-3 px-3 transition-all duration-200 ${
              item.active
                ? 'bg-[#0a0a0a] text-white'
                : 'text-[#52525b] hover:text-[#0a0a0a] hover:bg-[#f4f4f5]'
            }`}
          >
            <item.icon className="w-[18px] h-[18px]" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 space-y-1">
        {/* Help */}
        <button className="w-full h-10 rounded-xl flex items-center gap-3 px-3 text-[#52525b] hover:text-[#0a0a0a] hover:bg-[#f4f4f5] transition-all duration-200">
          <HelpCircle className="w-[18px] h-[18px]" />
          <span className="text-sm font-medium">Help & Support</span>
        </button>
      </div>

      {/* User Card */}
      <div className="mx-3 mt-4 p-3 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3d5a80] to-[#6b8caa] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            SL
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0a0a0a] truncate">Sarah Lee</p>
            <p className="text-xs text-[#71717a] truncate">sarah@allone.ge</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

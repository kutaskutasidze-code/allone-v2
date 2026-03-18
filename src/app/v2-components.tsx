'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

// ═══════════════════════════════════════════════
// SHARED BOTTOM DOCK NAVBAR
// ═══════════════════════════════════════════════
export function V2Navbar() {
  const [hovered, setHovered] = useState<string | null>(null);

  const navItems = [
    { name: 'Home', href: '/v2' },
    { name: 'Services', href: '/v2/services' },
    { name: 'Work', href: '/v2/work' },
    { name: 'Lab', href: '/v2/lab' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5 pointer-events-none">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.3 }}
        className="pointer-events-auto flex items-center justify-between px-5 py-1.5 rounded-full bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] w-[780px] max-w-[calc(100vw-32px)]"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 pl-2 pr-3">
          <Image src="/images/allone-logo-green.png" alt="allone" width={26} height={26} className="object-contain" />
          <span className="font-display font-semibold text-[15px] tracking-tight">
            <span className="text-[#071D2F]">All</span>
            <span className="text-[#008000]">One</span>
          </span>
        </Link>

        <div className="w-px h-5 bg-[#071D2F]/10 mx-1" />

        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onMouseEnter={() => setHovered(item.name)}
            onMouseLeave={() => setHovered(null)}
            className="relative px-4 py-2 text-[13px] font-medium text-[#071D2F]/60 hover:text-[#071D2F] rounded-full transition-colors duration-150"
          >
            {hovered === item.name && (
              <motion.div
                layoutId="dock-hover"
                className="absolute inset-0 bg-[#071D2F]/[0.04] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.name}</span>
          </Link>
        ))}

        <div className="w-px h-5 bg-[#071D2F]/10 mx-1" />

        <button
          className="flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold text-[#071D2F]/70 hover:text-[#008000] rounded-full transition-colors duration-150 cursor-pointer"
        >
          Ask AI
        </button>
      </motion.div>
    </nav>
  );
}

// ═══════════════════════════════════════════════
// SHARED FOOTER
// ═══════════════════════════════════════════════
export function V2Footer() {
  const columns = [
    { title: 'Services', links: [
      { name: 'AI Chatbots', href: '/v2/services' },
      { name: 'Custom AI', href: '/v2/services' },
      { name: 'Workflow Automation', href: '/v2/services' },
      { name: 'Web Development', href: '/v2/services' },
      { name: 'AI Consulting', href: '/v2/services' },
    ]},
    { title: 'Company', links: [
      { name: 'Work', href: '/v2/work' },
      { name: 'Lab', href: '/v2/lab' },
      { name: 'Contact', href: '/v2/contact' },
      { name: 'Careers', href: '/v2/contact' },
    ]},
    { title: 'Resources', links: [
      { name: 'Blog', href: '/v2/lab' },
      { name: 'Case Studies', href: '/v2/work' },
      { name: 'Documentation', href: '/v2/lab' },
    ]},
    { title: 'Legal', links: [
      { name: 'Privacy', href: '#' },
      { name: 'Terms', href: '#' },
      { name: 'Cookies', href: '#' },
    ]},
  ];

  return (
    <footer className="max-w-[1280px] mx-auto px-6 py-10 border-t border-[#EBEBEB]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="font-mono text-xs font-medium text-[#071D2F] mb-4 uppercase tracking-normal">{col.title}</h5>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-[#666666] hover:text-[#071D2F] transition-colors duration-100">{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 pt-6 border-t border-[#EBEBEB] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <Image src="/images/allone-logo-green.png" alt="allone" width={16} height={16} className="object-contain" />
          <span>&copy; 2026 allone.ge</span>
        </div>
        <div className="flex items-center gap-4">
          {['GitHub', 'LinkedIn', 'X'].map((social) => (
            <Link key={social} href="#" className="text-xs text-[#666666] hover:text-[#071D2F] transition-colors duration-100">{social}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════
// PAGE SHELL — wraps sub-pages with navbar + footer
// ═══════════════════════════════════════════════
export function V2Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#071D2F] font-body antialiased">
      <V2Navbar />
      <main>{children}</main>
      <V2Footer />
      {/* Bottom padding for dock navbar */}
      <div className="h-24" />
    </div>
  );
}

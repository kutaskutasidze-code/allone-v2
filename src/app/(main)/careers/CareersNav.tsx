'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const links = [
  { label: 'Home', href: '/' },
  { label: 'Studio', href: '/studio' },
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/contact' },
  { label: 'Careers', href: '/careers' },
];

export function CareersNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <div className="px-4 lg:px-12 py-5 lg:py-7 flex items-center justify-between">
        <a href="/" aria-label="AllOne home" className="block">
          <Image
            src="/images/allone-mark.webp"
            alt="AllOne"
            width={140}
            height={48}
            priority
            className="h-9 lg:h-11 w-auto object-contain"
          />
        </a>

        <div className="relative flex items-center gap-2 lg:gap-3">
          <a
            href="/work"
            className="hidden sm:inline-flex items-center gap-3 h-11 lg:h-12 pl-5 pr-1.5 rounded-full bg-[#0c1016]/[0.06] text-[#0c1016] text-xs lg:text-sm font-semibold tracking-[0.06em] uppercase hover:bg-[#0c1016]/[0.1] transition-colors"
          >
            View our work
            <span className="flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-[#f1f0ee]">
              <ArrowRight className="w-4 h-4" />
            </span>
          </a>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-3 h-11 lg:h-12 pl-5 pr-1.5 rounded-full bg-[#0c1016] text-white text-xs lg:text-sm font-semibold tracking-[0.06em] uppercase hover:bg-[#1b212b] transition-colors"
          >
            Menu
            <span className="flex items-center justify-center gap-1 w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-white/15">
              <span className="w-1 h-1 rounded-full bg-white" />
              <span className="w-1 h-1 rounded-full bg-white" />
            </span>
          </button>

          {open && (
            <>
              <button
                aria-hidden
                tabIndex={-1}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 cursor-default"
              />
              <div className="absolute z-50 top-full right-0 mt-3 w-64 rounded-3xl bg-white shadow-[0_20px_60px_-20px_rgba(12,16,22,0.35)] border border-[#0c1016]/10 p-2 flex flex-col">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="px-5 py-3 rounded-2xl text-2xl font-semibold tracking-[-0.01em] text-[#0c1016] hover:bg-[#0c1016]/[0.05] transition-colors"
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

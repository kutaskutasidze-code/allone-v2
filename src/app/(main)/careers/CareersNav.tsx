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
    <header className="sticky top-0 z-50 flex flex-row items-center justify-between px-4 lg:px-12 py-6 lg:py-10">
      {/* Logo: studio uses w-24 lg:w-44 (96px / 176px) */}
      <a href="/" aria-label="AllOne home" className="block w-24 lg:w-44">
        <Image
          src="/images/allone-mark.webp"
          alt="ALLONE"
          width={176}
          height={60}
          priority
          className="w-full h-auto block"
        />
      </a>

      <div className="relative flex flex-row items-center gap-5">
        {/* CTA pill: studio shape (p-[0.3rem], rounded-full, blue #2776EA), label per request */}
        <a
          href="/work"
          className="group hidden lg:flex flex-row items-center rounded-full p-[0.3rem] transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)] hover:scale-110 will-change-transform"
          style={{ backgroundColor: '#2776EA' }}
        >
          <span
            className="text-sm lg:text-lg font-medium uppercase pl-10 pr-8"
            style={{ color: '#FFFFFF' }}
          >
            View our work
          </span>
          <span
            className="relative flex items-center justify-center w-7 lg:w-12 h-7 lg:h-12 rounded-full"
            style={{ backgroundColor: '#1E242C' }}
          >
            <ArrowRight
              className="w-1/2 h-1/2 transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1.5)] group-hover:translate-x-0.5"
              style={{ color: '#F0F6F8' }}
              strokeWidth={2.5}
            />
          </span>
        </a>

        {/* MENU pill: studio shape (p-[0.3rem], rounded-full, black #0C1016), two-dot chip */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="careers-menu"
          className="group flex flex-row items-center rounded-full p-[0.3rem] transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)] hover:scale-110 will-change-transform"
          style={{ backgroundColor: '#0C1016' }}
        >
          <span
            className="text-sm lg:text-base font-medium uppercase pl-6 lg:pl-10 pr-4 lg:pr-8"
            style={{ color: '#F0F6F8' }}
          >
            {open ? 'Close' : 'Menu'}
          </span>
          <span
            className="relative flex items-center justify-center w-7 lg:w-12 h-7 lg:h-12 rounded-full"
            style={{ backgroundColor: '#1E242C' }}
          >
            <span
              className="block w-1/3 transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1.5)] group-hover:rotate-90"
              style={{ color: '#F0F6F8' }}
            >
              <svg width="100%" viewBox="0 0 14 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11.4517" cy="3.41264" r="2.54545" fill="currentColor" />
                <circle cx="2.54545" cy="3.41264" r="2.54545" fill="currentColor" />
              </svg>
            </span>
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
            <div
              id="careers-menu"
              className="absolute z-50 top-full right-0 mt-3 w-64 rounded-3xl bg-white shadow-[0_20px_60px_-20px_rgba(12,16,22,0.35)] border border-[#0c1016]/10 p-2 flex flex-col"
            >
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
    </header>
  );
}

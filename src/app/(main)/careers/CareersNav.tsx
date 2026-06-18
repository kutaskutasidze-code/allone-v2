'use client';

import { useState } from 'react';
import Image from 'next/image';

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
    <>
      <header className="sticky top-0 z-50 flex flex-row items-center justify-between px-4 lg:px-12 py-6 lg:py-10">
        {/* Logo — studio sizing: 8.64rem / 15.84rem */}
        <a href="/" aria-label="AllOne home" className="block w-[8.64rem] lg:w-[15.84rem]">
          <Image src="/images/allone-mark.webp" alt="ALLONE" width={254} height={86} priority className="w-full h-auto block" />
        </a>

        <div className="flex flex-row items-center gap-5">
          {/* CTA pill — studio "Services": blue, text-only, no chip */}
          <a
            href="/contact"
            className="hidden lg:flex items-center justify-center rounded-full p-[0.3rem] h-[2.45rem] min-w-[7rem] lg:h-[3.6rem] lg:min-w-[11rem] hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)]"
            style={{ backgroundColor: '#2776EA' }}
          >
            <span className="text-sm lg:text-lg font-medium uppercase pl-10 pr-8" style={{ color: '#FFFFFF' }}>
              Services
            </span>
          </a>

          {/* MENU pill — studio black, fully round, circular two-dot chip */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="careers-menu"
            className="group flex flex-row items-center rounded-full p-[0.3rem] hover:scale-110 transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1)]"
            style={{ backgroundColor: '#0C1016' }}
          >
            <span className="text-sm lg:text-base font-medium uppercase pl-6 lg:pl-10 pr-4 lg:pr-8" style={{ color: '#F0F6F8' }}>
              {open ? 'Close' : 'Menu'}
            </span>
            <span
              className="relative flex items-center justify-center w-7 lg:w-12 h-7 lg:h-12 rounded-full"
              style={{ backgroundColor: '#1E242C' }}
            >
              <span
                className={`block w-1/3 transition-transform duration-500 ease-[cubic-bezier(.22,.68,0,1.5)] ${open ? 'rotate-90' : 'group-hover:rotate-90'}`}
                style={{ color: '#F0F6F8' }}
              >
                <svg width="100%" viewBox="0 0 14 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11.4517" cy="3.41264" r="2.54545" fill="currentColor" />
                  <circle cx="2.54545" cy="3.41264" r="2.54545" fill="currentColor" />
                </svg>
              </span>
            </span>
          </button>
        </div>
      </header>

      {/* Backdrop */}
      <button
        aria-hidden
        tabIndex={-1}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[9998] ${open ? '' : 'pointer-events-none'}`}
        style={{ cursor: 'default' }}
      />

      {/* Slide-down menu panel — studio: fixed, top 125px right 16px, max 340px,
          translateY(-100%-120px) -> 0, 0.55s cubic-bezier(.22,.68,0,1.2), soft-grey */}
      <nav
        id="careers-menu"
        className="fixed z-[9999] flex flex-col gap-2 rounded-3xl px-6 py-8 lg:py-12"
        style={{
          top: '125px',
          right: '16px',
          width: 'calc(100% - 32px)',
          maxWidth: '340px',
          backgroundColor: '#d8d6d3',
          transform: open ? 'translate3d(0,0,0)' : 'translate3d(0, calc(-100% - 120px), 0)',
          transition: 'transform 0.55s cubic-bezier(.22,.68,0,1.2)',
          pointerEvents: open ? 'auto' : 'none',
          willChange: 'transform',
        }}
      >
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setTimeout(() => setOpen(false), 80)}
            className="px-6 py-1 lg:py-3 rounded-2xl text-3xl lg:text-5xl font-semibold tracking-[-0.01em] text-[#0c1016] hover:bg-[#f0f6f8] transition-colors"
          >
            {l.label}
          </a>
        ))}
      </nav>
    </>
  );
}

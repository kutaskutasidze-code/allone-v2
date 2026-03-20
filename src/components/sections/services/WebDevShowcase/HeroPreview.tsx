'use client';

import Image from 'next/image';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1600&q=90';

export function HeroPreview() {
  return (
    <div className="relative w-full h-full bg-[#f5f5f0] overflow-hidden">
      <div className="absolute inset-0">
        <Image src={HERO_IMAGE} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 900px" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
      </div>
      {/* Navbar */}
      <div className="relative z-10 flex items-center justify-between px-[5%] py-[3%] border-b border-black/[0.04]">
        <span className="text-[9px] sm:text-[11px] font-medium text-neutral-900 tracking-[0.08em] uppercase" style={{ fontFamily: 'Georgia, serif' }}>Meridian</span>
        <div className="flex items-center gap-3 sm:gap-5">
          <span className="text-[7px] sm:text-[9px] text-neutral-600 font-medium tracking-wide">Studio</span>
          <span className="text-[7px] sm:text-[9px] text-neutral-600 font-medium tracking-wide">Work</span>
          <span className="text-[7px] sm:text-[9px] text-neutral-600 font-medium tracking-wide hidden sm:inline">About</span>
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-neutral-900 text-white text-[7px] sm:text-[9px] font-medium tracking-wide">Inquire</div>
        </div>
      </div>
      {/* Hero */}
      <div className="relative z-10 flex items-center h-[calc(100%-12%)] px-[5%]">
        <div className="max-w-[55%]">
          <h2 className="text-[24px] sm:text-[36px] lg:text-[42px] font-normal text-neutral-900 leading-[0.95] tracking-[-0.02em] mb-3 sm:mb-5" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
            Spaces<br />that <em className="italic">inspire</em>
          </h2>
          <p className="text-[7px] sm:text-[9px] lg:text-[10px] text-neutral-600 leading-[1.8] max-w-[70%] mb-3 sm:mb-6 tracking-wide" style={{ fontFamily: 'system-ui, sans-serif' }}>
            Designing structures where form meets function. Award-winning architecture since 2018.
          </p>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <button className="px-2 sm:px-5 py-1 sm:py-2 bg-neutral-900 text-[7px] sm:text-[9px] font-medium text-white tracking-[0.1em] uppercase">View projects</button>
            <button className="px-2 sm:px-5 py-1 sm:py-2 border border-neutral-300 text-[7px] sm:text-[9px] font-medium text-neutral-600 tracking-[0.1em] uppercase bg-white/60">Our process</button>
          </div>
        </div>
      </div>
    </div>
  );
}

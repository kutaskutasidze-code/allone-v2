'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

// ─── Card wrapper with glassy style + absolute positioning ───
function Card({ children, className = '', delay = 0, isInView, style, mobile }: { children: React.ReactNode; className?: string; delay?: number; isInView: boolean; style?: React.CSSProperties; mobile?: boolean }) {
  return (
    <motion.div
      className={`${mobile ? 'relative w-full max-w-[300px]' : 'absolute'} backdrop-blur-xl overflow-hidden rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.45) 0%, rgba(248,252,255,0.2) 50%, rgba(255,255,255,0.35) 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.6) inset, 0 -1px 0 rgba(0,0,0,0.02) inset, 0 10px 40px rgba(0,0,0,0.06), 0 2px 10px rgba(14,165,233,0.04)',
        border: '1px solid rgba(255,255,255,0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        ...(mobile ? {} : style),
      }}
      initial={{ opacity: 0, y: 30, scale: 0.92 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}


// ─── 1. HubSpot New Contact ───
function HubSpotCard({ isInView, mobile }: { isInView: boolean; mobile?: boolean }) {
  return (
    <Card delay={0} isInView={isInView} mobile={mobile} style={{ left: -20, top: 120, width: 240, rotate: '-2deg', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 10%, black 40%)', maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.3) 10%, black 40%)' }}>
      {/* Orange glow */}
      <div className="absolute -inset-4 -z-10 rounded-full bg-[#ff7a59]/15 blur-[25px]" />
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#ff7a59]/70 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
            <path d="M18.16 7.93V5.08a2.2 2.2 0 001.27-1.98v-.07A2.2 2.2 0 0017.24.84h-.07a2.2 2.2 0 00-2.19 2.19v.07c0 .87.51 1.62 1.27 1.98v2.85a6.15 6.15 0 00-2.93 1.46l-7.73-6.01a2.64 2.64 0 00.1-.7A2.64 2.64 0 003.04.04 2.64 2.64 0 00.41 2.68a2.64 2.64 0 002.64 2.64c.5 0 .96-.14 1.36-.38l7.6 5.91a6.17 6.17 0 00-.93 3.26c0 1.23.36 2.37.99 3.33l-2.84 2.84a2.15 2.15 0 00-.63-.1 2.15 2.15 0 00-2.15 2.15 2.15 2.15 0 002.15 2.14 2.15 2.15 0 002.14-2.14c0-.22-.03-.44-.1-.64l2.8-2.8a6.2 6.2 0 103.87-3.34l.86-7.6z"/>
          </svg>
          <span className="text-[11px] font-semibold text-white">Contacts</span>
        </div>
        <span className="text-[8px] font-bold text-white bg-white/20 px-1.5 py-0.5 rounded-full">NEW</span>
      </div>
      {/* Content */}
      <div className="p-3 bg-white/30">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff7a59]/80 to-[#ff5c35]/80 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">SC</span>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-900">Sarah Chen</div>
            <div className="text-[9px] text-gray-500">CEO @ TechCorp</div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-gray-400 w-10">Email</span>
            <span className="text-[9px] text-gray-700">sarah@techcorp.io</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-gray-400 w-10">Status</span>
            <span className="text-[8px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />New
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-gray-400 w-10">Source</span>
            <span className="text-[9px] text-gray-700">Organic Search</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── 2. Gmail Draft ───
function GmailCard({ isInView, mobile }: { isInView: boolean; mobile?: boolean }) {
  return (
    <Card delay={0.2} isInView={isInView} mobile={mobile} style={{ left: 260, top: -5, width: 265, rotate: '2deg' }}>
      {/* Red glow */}
      <div className="absolute -inset-4 -z-10 rounded-full bg-[#ea4335]/12 blur-[25px]" />
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/40 border-b border-white/30 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#ea4335"/>
          </svg>
          <span className="text-[11px] font-medium text-gray-700">Compose</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div className="w-2 h-2 rounded-full bg-gray-300" />
        </div>
      </div>
      {/* Content */}
      <div className="p-3 bg-white/30">
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-gray-400">To:</span>
            <span className="text-[9px] text-gray-800">sarah@techcorp.io</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-gray-400">Subject:</span>
            <span className="text-[9px] font-medium text-gray-900">Quick intro — AI automation for TechCorp</span>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-2">
          <p className="text-[9px] text-gray-600 leading-[1.6]">
            Hi Sarah,<br />
            I noticed TechCorp is scaling fast — congrats!<br />
            We help CEOs like you automate lead...
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <button className="bg-[#1a73e8]/70 text-white text-[8px] font-medium px-3 py-1 rounded">Send</button>
          <span className="text-[7px] text-purple-500 flex items-center gap-0.5">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5"><path d="M8 0L9.8 5.5L16 6.1L11.5 10.2L12.9 16L8 13L3.1 16L4.5 10.2L0 6.1L6.2 5.5Z"/></svg>
            AI Generated
          </span>
        </div>
      </div>
    </Card>
  );
}

// ─── 3. Calendly Booking ───
function CalendlyCard({ isInView, mobile }: { isInView: boolean; mobile?: boolean }) {
  return (
    <Card delay={0.4} isInView={isInView} mobile={mobile} style={{ left: 240, top: 295, width: 250, rotate: '-1.5deg', WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.3) 80%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 0%, black 50%, rgba(0,0,0,0.3) 80%, transparent 100%)' }}>
      {/* Blue glow */}
      <div className="absolute -inset-4 -z-10 rounded-full bg-[#006bff]/15 blur-[25px]" />
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#006bff]/70 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-white">
            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="text-[11px] font-semibold text-white">Calendly</span>
        </div>
        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 text-white/60"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      {/* Content */}
      <div className="p-3 bg-white/30">
        <div className="flex items-center gap-1.5 mb-2">
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-emerald-500"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[10px] font-semibold text-emerald-600">Event Scheduled</span>
        </div>
        <div className="text-[12px] font-semibold text-gray-900 mb-2">30 Min Discovery Call</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-gray-400 flex-shrink-0"><rect x="2" y="3" width="12" height="12" rx="1.5"/><line x1="11" y1="1" x2="11" y2="5"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="2" y1="7" x2="14" y2="7"/></svg>
            Thursday, Mar 12 at 2:00 PM
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-gray-400 flex-shrink-0"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
            30 minutes
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-gray-600">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-gray-400 flex-shrink-0"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
            Sarah Chen, CEO @ TechCorp
          </div>
        </div>
        <div className="border-t border-gray-100 mt-2.5 pt-2">
          <span className="text-[8px] text-gray-400">Confirmation sent to sarah@techcorp.io</span>
        </div>
      </div>
    </Card>
  );
}

// ─── 4. Slack Notification ───
function SlackCard({ isInView, mobile }: { isInView: boolean; mobile?: boolean }) {
  return (
    <Card delay={0.6} isInView={isInView} mobile={mobile} style={{ right: -80, top: 140, width: 255, rotate: '1.5deg' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#4a154b] rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5">
            <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313z" fill="#e01e5a"/>
            <path d="M8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312z" fill="#36c5f0"/>
            <path d="M18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.163 0a2.528 2.528 0 012.523 2.522v6.312z" fill="#2eb67d"/>
            <path d="M15.163 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.163 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 01-2.52-2.523 2.527 2.527 0 012.52-2.52h6.315A2.528 2.528 0 0124 15.163a2.528 2.528 0 01-2.522 2.523h-6.315z" fill="#ecb22e"/>
          </svg>
          <span className="text-[11px] font-semibold text-white">#sales</span>
        </div>
        <span className="text-[8px] text-white/40">12 members</span>
      </div>
      {/* Content — Slack dark theme */}
      <div className="p-3 bg-[#1a1d21]">
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded-sm bg-[#4a154b] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[7px] font-bold text-white">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-semibold text-white">Allone Bot</span>
              <span className="text-[7px] bg-white/10 text-white/50 px-1 py-0.5 rounded">APP</span>
              <span className="text-[8px] text-white/30">2:01 PM</span>
            </div>
            <p className="text-[9px] text-[#d1d2d3] leading-[1.6]">
              <span className="text-[10px]">📅</span> Meeting booked with <span className="font-semibold text-white">Sarah Chen</span> (TechCorp)<br />
              Thu Mar 12, 2:00 PM — 30 Min Discovery Call
            </p>
            <div className="flex gap-1.5 mt-2">
              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[8px] text-[#d1d2d3] flex items-center gap-1">
                <span className="text-[10px]">🎉</span> 3
              </span>
              <span className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[8px] text-[#d1d2d3] flex items-center gap-1">
                <span className="text-[10px]">🚀</span> 1
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Card layout specs — single source of truth for positions
// These match the inline styles on each card exactly
const CARD_SPECS = {
  hubspot:  { left: -20, top: 120, w: 240, h: 190 },
  gmail:    { left: 260, top: -5, w: 265, h: 185 },
  calendly: { left: 240, top: 295, w: 250, h: 210 },
  // Slack uses right:-80, so in a 700px container: left = 700 - 255 + 80 = 525
  slack:    { left: 525, top: 140, w: 255, h: 170 },
};

interface LineSpec {
  from: { x: number; y: number };
  to: { x: number; y: number };
  colors: [string, string];
  delay: number;
  sCurve?: boolean;
}

function computeLines(containerW: number): LineSpec[] {
  // Scale factor: cards are designed for 700px container
  const s = containerW / 700;
  const c = CARD_SPECS;

  // HubSpot right-center → Gmail left-center
  const h_right = { x: (c.hubspot.left + c.hubspot.w) * s, y: (c.hubspot.top + c.hubspot.h / 2) * s };
  const g_left  = { x: c.gmail.left * s, y: (c.gmail.top + c.gmail.h / 2) * s };

  // Gmail bottom-center → Calendly top-center
  const g_bottom = { x: (c.gmail.left + c.gmail.w / 2) * s, y: (c.gmail.top + c.gmail.h) * s };
  const c_top    = { x: (c.calendly.left + c.calendly.w / 2) * s, y: c.calendly.top * s };

  // Calendly right-center → Slack left-center
  const c_right  = { x: (c.calendly.left + c.calendly.w) * s, y: (c.calendly.top + c.calendly.h / 2) * s };
  const s_left   = { x: c.slack.left * s, y: (c.slack.top + c.slack.h / 2) * s };

  return [
    { from: h_right, to: g_left, colors: ['#ff7a59', '#ea4335'], delay: 1.0 },
    { from: g_bottom, to: c_top, colors: ['#ea4335', '#006bff'], delay: 1.4 },
    { from: c_right, to: s_left, colors: ['#006bff', '#4a154b'], delay: 1.8, sCurve: true },
  ];
}

function buildPath(line: LineSpec): string {
  const { from, to } = line;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (line.sCurve) {
    return `M ${from.x} ${from.y} C ${from.x + len * 0.5} ${from.y - len * 0.15}, ${to.x - len * 0.5} ${to.y + len * 0.15}, ${to.x} ${to.y}`;
  }

  // Auto-detect direction and curve accordingly
  const isMoreHorizontal = Math.abs(dx) > Math.abs(dy);
  if (isMoreHorizontal) {
    return `M ${from.x} ${from.y} C ${from.x + dx * 0.5} ${from.y}, ${to.x - dx * 0.5} ${to.y}, ${to.x} ${to.y}`;
  }
  return `M ${from.x} ${from.y} C ${from.x} ${from.y + dy * 0.5}, ${to.x} ${to.y - dy * 0.5}, ${to.x} ${to.y}`;
}

// ─── Main component ───
export function LeadFlowVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-80px' });

  const [isMobile, setIsMobile] = useState(false);
  const [containerW, setContainerW] = useState(700);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => setContainerW(entry.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const lines = computeLines(containerW);

  if (isMobile) {
    const connectors = [
      { label: 'Auto-enrich lead', colors: ['#ff7a59', '#ea4335'] },
      { label: 'Schedule meeting', colors: ['#ea4335', '#006bff'] },
      { label: 'Notify team', colors: ['#006bff', '#4a154b'] },
    ];
    return (
      <div ref={containerRef} className="relative w-full flex flex-col gap-0 items-center">
        {[
          { card: <HubSpotCard isInView={isInView} mobile />, key: 'h' },
          { card: <GmailCard isInView={isInView} mobile />, key: 'g' },
          { card: <CalendlyCard isInView={isInView} mobile />, key: 'c' },
          { card: <SlackCard isInView={isInView} mobile />, key: 's' },
        ].map((item, i) => (
          <div key={item.key} className="flex flex-col items-center w-full">
            {/* Flow connector between cards */}
            {i > 0 && (
              <motion.div
                className="flex flex-col items-center py-2"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.4 }}
              >
                {/* Line */}
                <div className="w-px h-4" style={{ background: `linear-gradient(to bottom, ${connectors[i - 1].colors[0]}, ${connectors[i - 1].colors[1]})`, opacity: 0.4 }} />
                {/* Label pill */}
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/40 backdrop-blur-sm my-1"
                  style={{ background: `linear-gradient(135deg, ${connectors[i - 1].colors[0]}10, ${connectors[i - 1].colors[1]}10)` }}
                >
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" style={{ color: connectors[i - 1].colors[1] }}>
                    <path d="M6 1v10M3 8l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[9px] font-mono font-medium text-[#4D4D4D]">{connectors[i - 1].label}</span>
                </div>
                {/* Line */}
                <div className="w-px h-4" style={{ background: `linear-gradient(to bottom, ${connectors[i - 1].colors[0]}, ${connectors[i - 1].colors[1]})`, opacity: 0.4 }} />
              </motion.div>
            )}
            {item.card}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[700px]" style={{ height: 520 }}>
      {/* SVG flow lines — behind cards, coordinates computed from known card positions */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {lines.map((line, i) => (
            <linearGradient key={`g${i}`} id={`grad${i}`} gradientUnits="userSpaceOnUse"
              x1={line.from.x} y1={line.from.y}
              x2={line.to.x} y2={line.to.y}
            >
              <stop offset="0%" stopColor={line.colors[0]} />
              <stop offset="100%" stopColor={line.colors[1]} />
            </linearGradient>
          ))}
        </defs>

        {lines.map((line, i) => {
          const d = buildPath(line);
          return (
            <g key={i}>
              <motion.path
                d={d}
                fill="none" stroke={`url(#grad${i})`} strokeOpacity="0.15" strokeWidth="1"
                initial={{ pathLength: 0 }} animate={isInView ? { pathLength: 1 } : {}}
                transition={{ delay: line.delay, duration: 0.8 }}
              />
              <motion.path
                d={d}
                fill="none" stroke={`url(#grad${i})`} strokeOpacity="0.5" strokeWidth="2"
                filter="url(#lineGlow)"
                strokeDasharray="25 200"
                initial={{ pathLength: 1, opacity: 0, strokeDashoffset: 0 }}
                animate={isInView ? { opacity: [0, 1, 1, 0], strokeDashoffset: [-225, -225, -225, -225] } : {}}
                transition={{ delay: line.delay + 0.5, duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
              />
            </g>
          );
        })}
      </svg>

      {/* Scattered cards — on top of lines */}
      <HubSpotCard isInView={isInView} />
      <GmailCard isInView={isInView} />
      <CalendlyCard isInView={isInView} />
      <SlackCard isInView={isInView} />
    </div>
  );
}

'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { motion, useInView } from 'framer-motion';

function Card({ children, className = '', delay = 0, isInView, style, mobile }: { children: React.ReactNode; className?: string; delay?: number; isInView: boolean; style?: React.CSSProperties; mobile?: boolean }) {
  return (
    <motion.div
      className={`${mobile ? 'relative w-full max-w-[300px]' : 'absolute'} overflow-hidden rounded-lg ${className}`}
      style={{
        background: '#ffffff',
        boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 8px 20px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.02), 0 0 40px rgba(37,99,235,0.03)',
        border: '1px solid rgba(0,0,0,0.06)',
        ...(mobile ? {} : style),
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: delay * 0.2, duration: 1.0, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

function LeadCard({ isInView, mobile }: { isInView: boolean; mobile?: boolean }) {
  return (
    <Card delay={0} isInView={isInView} mobile={mobile} style={{ left: 220, top: 15, width: 220 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" className="w-3.5 h-3.5"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
          <span className="text-[11px] font-semibold text-gray-700">New Lead</span>
        </div>
        <span className="text-[8px] font-bold text-[#2563eb] bg-[#2563eb]/10 px-1.5 py-0.5 rounded-full">NEW</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-full bg-[#2563eb]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-[#2563eb]">SC</span>
          </div>
          <div>
            <div className="text-[12px] font-semibold text-gray-900">Sarah Chen</div>
            <div className="text-[9px] text-gray-400">CEO @ TechCorp</div>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-gray-400 w-10">Email</span>
            <span className="text-[9px] text-gray-600">sarah@techcorp.io</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-gray-400 w-10">Status</span>
            <span className="text-[8px] font-medium text-[#2563eb] bg-[#2563eb]/10 px-1.5 py-0.5 rounded">Qualified</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-gray-400 w-10">Source</span>
            <span className="text-[9px] text-gray-600">Organic Search</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function OutreachCard({ isInView, mobile }: { isInView: boolean; mobile?: boolean }) {
  return (
    <Card delay={0.2} isInView={isInView} mobile={mobile} style={{ left: 70, top: 280, width: 250 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" className="w-3.5 h-3.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M2 4l6 4.5L14 4"/></svg>
          <span className="text-[11px] font-medium text-gray-700">Auto-Outreach</span>
        </div>
        <span className="text-[8px] text-[#2563eb] font-medium">AI Draft</span>
      </div>
      <div className="p-3">
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
          <p className="text-[9px] text-gray-500 leading-[1.6]">
            Hi Sarah,<br />
            I noticed TechCorp is scaling fast — congrats!<br />
            We help CEOs like you automate lead...
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <button className="bg-[#2563eb] text-white text-[8px] font-medium px-3 py-1 rounded">Send</button>
          <span className="text-[7px] text-[#2563eb] flex items-center gap-0.5">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5"><path d="M8 0L9.8 5.5L16 6.1L11.5 10.2L12.9 16L8 13L3.1 16L4.5 10.2L0 6.1L6.2 5.5Z"/></svg>
            AI Generated
          </span>
        </div>
      </div>
    </Card>
  );
}

function MeetingCard({ isInView, mobile }: { isInView: boolean; mobile?: boolean }) {
  return (
    <Card delay={0.4} isInView={isInView} mobile={mobile} style={{ left: 480, top: 280, width: 235 }}>
      <div className="flex items-center justify-between px-3 py-2 bg-[#2563eb]/10 rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" fill="none" stroke="#2563eb" strokeWidth="1.5" className="w-3.5 h-3.5"><rect x="2" y="3" width="12" height="12" rx="1.5"/><line x1="11" y1="1" x2="11" y2="5"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="2" y1="7" x2="14" y2="7"/></svg>
          <span className="text-[11px] font-semibold text-gray-700">Meeting Booked</span>
        </div>
        <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 text-[#2563eb]"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5 text-[#2563eb]"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M5.5 8l2 2 3-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span className="text-[10px] font-semibold text-[#2563eb]">Confirmed</span>
        </div>
        <div className="text-[12px] font-semibold text-gray-900 mb-2">30 Min Discovery Call</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-gray-300 flex-shrink-0"><rect x="2" y="3" width="12" height="12" rx="1.5"/><line x1="11" y1="1" x2="11" y2="5"/><line x1="5" y1="1" x2="5" y2="5"/><line x1="2" y1="7" x2="14" y2="7"/></svg>
            Thursday, Mar 12 at 2:00 PM
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-gray-300 flex-shrink-0"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
            30 minutes
          </div>
          <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-gray-300 flex-shrink-0"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>
            Sarah Chen, CEO @ TechCorp
          </div>
        </div>
      </div>
    </Card>
  );
}

function NotifyCard({ isInView, mobile }: { isInView: boolean; mobile?: boolean }) {
  return (
    <Card delay={0.6} isInView={isInView} mobile={mobile} style={{ left: 340, top: 535, width: 245 }}>
      <div className="flex items-center justify-between px-3 py-2 bg-[#2563eb] rounded-t-lg">
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 4h12M2 8h12M2 12h8"/></svg>
          <span className="text-[11px] font-semibold text-white">#sales</span>
        </div>
        <span className="text-[8px] text-white/80">12 members</span>
      </div>
      <div className="p-3">
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded-sm bg-[#2563eb]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[7px] font-bold text-[#2563eb]">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-semibold text-gray-900">Allone Bot</span>
              <span className="text-[7px] bg-[#2563eb]/15 text-[#2563eb] px-1 py-0.5 rounded">BOT</span>
              <span className="text-[8px] text-gray-400">2:01 PM</span>
            </div>
            <p className="text-[9px] text-gray-500 leading-[1.6]">
              Meeting booked with <span className="font-semibold text-gray-900">Sarah Chen</span> (TechCorp)<br />
              Thu Mar 12, 2:00 PM — Discovery Call
            </p>
            <div className="flex gap-1.5 mt-2">
              <span className="bg-[#2563eb]/10 border border-[#2563eb]/20 rounded px-1.5 py-0.5 text-[8px] text-[#2563eb]">View Lead</span>
              <span className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 text-[8px] text-gray-500">Dismiss</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

const CARD_SPECS = {
  lead:    { left: 220, top: 15, w: 220, h: 190 },
  outreach: { left: 70, top: 280, w: 250, h: 185 },
  meeting: { left: 480, top: 280, w: 235, h: 210 },
  notify:  { left: 340, top: 535, w: 245, h: 170 },
};

function computeLines(containerW: number) {
  const s = containerW / 700;
  const c = CARD_SPECS;

  const l_rx = (c.lead.left + c.lead.w) * s;
  const l_my = (c.lead.top + c.lead.h / 2) * s;
  const l_tx = (c.lead.left + c.lead.w / 2) * s;
  const l_ty = c.lead.top * s;
  const l_bx = (c.lead.left + c.lead.w / 2) * s;
  const l_by = (c.lead.top + c.lead.h - 15) * s;
  const o_lx = c.outreach.left * s;
  const o_rx = (c.outreach.left + c.outreach.w) * s;
  const o_tx = (c.outreach.left + c.outreach.w / 2) * s;
  const o_ty = c.outreach.top * s;
  const o_my = (c.outreach.top + c.outreach.h / 2) * s;
  const m_lx = c.meeting.left * s;
  const m_rx = (c.meeting.left + c.meeting.w) * s;
  const m_my = o_my; // keep line straight with outreach
  const n_lx = c.notify.left * s;
  const n_tx = (c.notify.left + c.notify.w / 2) * s;
  const n_ty = c.notify.top * s;
  const n_my = (c.notify.top + c.notify.h / 2) * s;
  const m_bx = (c.meeting.left + c.meeting.w / 2) * s;
  const m_by = (c.meeting.top + c.meeting.h - 40) * s;

  return [
    { d: `M${l_bx},${l_by} L${l_bx},${(l_by + o_ty) / 2} L${o_tx},${(l_by + o_ty) / 2} L${o_tx},${o_ty}`, label: 'Auto-enrich lead', lx: (l_bx + o_tx) / 2, ly: (l_by + o_ty) / 2 },
    { d: `M${o_rx},${o_my} L${(o_rx + m_lx) / 2},${o_my} L${(o_rx + m_lx) / 2},${m_my} L${m_lx},${m_my}`, label: 'Schedule meeting', lx: (o_rx + m_lx) / 2, ly: (o_my + m_my) / 2 },
    { d: `M${m_bx},${m_by} L${m_bx},${(m_by + n_ty) / 2} L${n_tx},${(m_by + n_ty) / 2} L${n_tx},${n_ty}`, label: 'Notify team', lx: (m_bx + n_tx) / 2, ly: (m_by + n_ty) / 2 },
  ];
}

export function WorkflowVisualV2() {
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

  const lines = useMemo(() => computeLines(containerW), [containerW]);

  if (isMobile) {
    const connectors = [
      { label: 'Auto-enrich lead' },
      { label: 'Schedule meeting' },
      { label: 'Notify team' },
    ];
    return (
      <div ref={containerRef} className="relative w-full flex flex-col gap-0 items-center">
        {[
          { card: <LeadCard isInView={isInView} mobile />, key: 'l' },
          { card: <OutreachCard isInView={isInView} mobile />, key: 'o' },
          { card: <MeetingCard isInView={isInView} mobile />, key: 'm' },
          { card: <NotifyCard isInView={isInView} mobile />, key: 'n' },
        ].map((item, i) => (
          <div key={item.key} className="flex flex-col items-center w-full">
            {i > 0 && (
              <motion.div
                className="flex flex-col items-center py-2"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.4 }}
              >
                <div className="w-px h-4 bg-[#2563eb]/30" />
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2563eb]/15 bg-[#2563eb]/5 my-1">
                  <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-[#2563eb]">
                    <path d="M6 1v10M3 8l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[9px] font-mono font-medium text-[#4D4D4D]">{connectors[i - 1].label}</span>
                </div>
                <div className="w-px h-4 bg-[#2563eb]/30" />
              </motion.div>
            )}
            {item.card}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[700px]" style={{ height: 680 }}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
        {lines.map((line, i) => (
          <motion.path
            key={i}
            d={line.d}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2"
            strokeOpacity="1"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ delay: 0.8 + i * 0.2, duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </svg>
      {lines.map((line, i) => (
        <motion.div
          key={`tag-${i}`}
          className="absolute flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#2563eb]/15 bg-white -translate-x-1/2 -translate-y-1/2"
          style={{ left: line.lx, top: line.ly, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 1.0 + i * 0.2, duration: 0.4 }}
        >
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-[#2563eb]">
            <path d="M6 1v10M3 8l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[9px] font-mono font-medium text-[#4D4D4D] whitespace-nowrap">{line.label}</span>
        </motion.div>
      ))}
      <LeadCard isInView={isInView} />
      <OutreachCard isInView={isInView} />
      <MeetingCard isInView={isInView} />
      <NotifyCard isInView={isInView} />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';

interface FloatingElementProps {
  scrollYProgress: MotionValue<number>;
}

// Lighthouse gauge ring helper
function ScoreRing({ score, size = 28, color = '#0cce6b' }: { score: number; size?: number; color?: string }) {
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - score / 100);
  return (
    <svg width={size} height={size} className="block">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={2.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={2.5}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        className="fill-gray-700 font-semibold" style={{ fontSize: 8 }}>{score}</text>
    </svg>
  );
}

const elements = [
  {
    // 1. VS Code Editor (Dark)
    content: (
      <div className="font-mono text-[9px] leading-[1.65] text-left bg-[#1e1e1e] rounded-lg p-0 -m-4 h-[calc(100%+2rem)] overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-1.5 bg-[#252526] border-b border-[#3c3c3c]">
          <span className="text-[7px] text-[#888]">src</span>
          <span className="text-[7px] text-[#555]">›</span>
          <span className="text-[7px] text-[#888]">app</span>
          <span className="text-[7px] text-[#555]">›</span>
          <span className="text-[7px] text-[#cccccc]">route.ts</span>
          <span className="text-[6px] text-amber-400 ml-1">M</span>
        </div>
        <div className="p-2.5 pt-2">
          <div className="flex"><span className="text-[#858585] w-5 text-right mr-2 select-none">14</span><span className="text-[#569CD6]">export async function </span><span className="text-[#DCDCAA]">POST</span><span className="text-[#cccccc]">(</span><span className="text-[#9CDCFE]">req</span><span className="text-[#cccccc]">: </span><span className="text-[#4EC9B0]">Request</span><span className="text-[#cccccc]">) {'{'}</span></div>
          <div className="flex"><span className="text-[#858585] w-5 text-right mr-2 select-none">15</span><span className="text-[#cccccc]">  </span><span className="text-[#569CD6]">const </span><span className="text-[#9CDCFE]">body</span><span className="text-[#cccccc]"> = </span><span className="text-[#569CD6]">await </span><span className="text-[#9CDCFE]">req</span><span className="text-[#cccccc]">.</span><span className="text-[#DCDCAA]">json</span><span className="text-[#cccccc]">();</span></div>
          <div className="flex relative"><span className="text-[#858585] w-5 text-right mr-2 select-none">16</span><span className="text-[#cccccc]">  </span><span className="text-[#569CD6]">const </span><span className="text-[#9CDCFE]">sig</span><span className="text-[#cccccc]"> = </span><span className="border-b border-dashed border-yellow-500/60"><span className="text-[#DCDCAA]">headers</span><span className="text-[#cccccc]">()</span></span><span className="text-[#cccccc]">.</span><span className="text-[#DCDCAA]">get</span><span className="text-[#cccccc]">(</span><span className="text-[#ce9178]">&apos;x-sig&apos;</span><span className="text-[#cccccc]">);</span></div>
          <div className="flex bg-[#ffffff08]"><span className="text-[#858585] w-5 text-right mr-2 select-none">17</span><span className="text-[#cccccc]">  </span><span className="text-[#569CD6]">const </span><span className="text-[#9CDCFE]">event</span><span className="text-[#cccccc]"> = </span><span className="text-[#9CDCFE]">stripe</span><span className="text-[#cccccc]">.</span><span className="text-[#DCDCAA]">construct</span><span className="text-[#cccccc]">(</span></div>
          <div className="flex"><span className="text-[#858585] w-5 text-right mr-2 select-none">18</span><span className="text-[#cccccc]">    </span><span className="text-[#9CDCFE]">body</span><span className="text-[#cccccc]">, </span><span className="text-[#9CDCFE]">sig</span><span className="text-[#cccccc]">, </span><span className="text-[#9CDCFE]">process</span><span className="text-[#cccccc]">.</span><span className="text-[#9CDCFE]">env</span><span className="text-[#cccccc]">.</span><span className="text-[#9CDCFE]">SECRET</span></div>
          <div className="flex"><span className="text-[#858585] w-5 text-right mr-2 select-none">19</span><span className="text-[#cccccc]">  );</span></div>
        </div>
      </div>
    ),
    w: 255, h: 160,
    x: -440, y: -180,
    rotate: -4,
    entryOffset: 0,
  },
  {
    // 2. Testimonial Card
    content: (
      <div>
        <div className="flex gap-0.5 mb-2.5">
          {[1,1,1,1,1].map((_, i) => (
            <svg key={i} viewBox="0 0 16 16" fill="#f59e0b" className="w-3 h-3"><path d="M8 0l2.47 5.01L16 5.81l-4 3.9.94 5.49L8 12.49 3.06 15.2 4 9.71 0 5.81l5.53-.8z"/></svg>
          ))}
        </div>
        <p className="text-[10px] text-gray-700 leading-[1.6] mb-3 italic">
          "They rebuilt our entire platform in 3 weeks. The performance improvement was immediate — page loads dropped from 4s to under 1s."
        </p>
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">NK</span>
          </div>
          <div>
            <div className="text-[9px] font-semibold text-gray-800">Nika K.</div>
            <div className="text-[7px] text-gray-400">CEO, DataRooms</div>
          </div>
        </div>
      </div>
    ),
    w: 230, h: 155,
    x: 420, y: -220,
    rotate: 3,
    entryOffset: 0.01,
  },
  {
    // 3. Lighthouse Scores
    content: (
      <div>
        <div className="flex items-center gap-1.5 mb-3 pb-2 border-b border-gray-100">
          <span className="text-[9px] font-semibold text-gray-700">Lighthouse</span>
          <span className="text-[7px] text-gray-300 font-mono ml-auto">v12.4</span>
        </div>
        <div className="flex justify-between px-1 mb-2">
          <div className="flex flex-col items-center gap-0.5">
            <ScoreRing score={94} />
            <span className="text-[7px] text-gray-400">Perf</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <ScoreRing score={100} />
            <span className="text-[7px] text-gray-400">A11y</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <ScoreRing score={100} />
            <span className="text-[7px] text-gray-400">BP</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <ScoreRing score={91} />
            <span className="text-[7px] text-gray-400">SEO</span>
          </div>
        </div>
        <div className="flex gap-3 text-[8px] font-mono mt-1">
          <div><span className="text-gray-400">LCP</span> <span className="text-emerald-600">1.2s</span></div>
          <div><span className="text-gray-400">CLS</span> <span className="text-emerald-600">0.003</span></div>
        </div>
        <div className="text-[7px] text-gray-300 mt-1.5 font-mono">allone.ge · Mobile</div>
      </div>
    ),
    w: 230, h: 145,
    x: 350, y: 20,
    rotate: 2,
    entryOffset: 0.02,
  },
  {
    // 4. Figma Component Panel
    content: (
      <div className="text-[9px]">
        <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-gray-100">
          <div className="w-3 h-3 flex items-center justify-center">
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5"><path d="M6 0L10.5 3V9L6 12L1.5 9V3L6 0Z" fill="#a259ff"/></svg>
          </div>
          <span className="font-semibold text-gray-800">Button / Primary</span>
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-gray-400 ml-auto"><path d="M3 4.5l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg>
        </div>
        <div className="space-y-1.5 text-[8px] text-gray-500 font-mono mb-3">
          <div className="flex gap-3"><span className="text-gray-400">W</span> <span>148</span> <span className="text-gray-300">×</span> <span className="text-gray-400">H</span> <span>44</span></div>
          <div className="flex gap-2"><span className="text-gray-400">↔</span> <span>H: 12, V: 16</span></div>
          <div className="flex gap-2"><span className="text-gray-400">◻</span> <span>Radius: 8</span></div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 bg-violet-50 px-1.5 py-1 -mx-1">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            <span className="text-[8px] text-gray-700 font-medium">Default</span>
          </div>
          <div className="flex items-center gap-1.5 px-1.5 py-1 -mx-1">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            <span className="text-[8px] text-gray-500">Hover</span>
          </div>
          <div className="flex items-center gap-1.5 px-1.5 py-1 -mx-1">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
            <span className="text-[8px] text-gray-300">Disabled</span>
          </div>
        </div>
        <div className="text-[7px] text-gray-300 mt-2 pt-1.5 border-t border-gray-100">2 instances</div>
      </div>
    ),
    w: 185, h: 200,
    x: -400, y: 240,
    rotate: -6,
    entryOffset: 0.015,
  },
  {
    // 5. Next.js Build Output (Dark)
    content: (
      <div className="font-mono text-[8px] leading-[1.8] bg-[#1e1e1e] text-gray-300 rounded-lg p-0 -m-4 h-[calc(100%+2rem)] overflow-hidden">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2d2d] border-b border-[#3c3c3c]">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff5f57]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#febc2e]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-[7px] text-gray-500 ml-1">Terminal</span>
          <span className="text-[7px] text-gray-600 ml-2 px-1 py-0.5 bg-[#3c3c3c] rounded">Problems <span className="text-amber-400">1</span></span>
        </div>
        <div className="p-2.5 pt-2">
          <div className="text-gray-500 mb-1">Route (app){'                 '}Size</div>
          <div><span className="text-cyan-400">┌</span> <span className="text-cyan-400">○</span> /{'                        '}<span className="text-gray-500">5.17 kB</span></div>
          <div><span className="text-cyan-400">├</span> <span className="text-cyan-400">○</span> /about{'                   '}<span className="text-gray-500">3.82 kB</span></div>
          <div><span className="text-cyan-400">├</span> <span className="text-violet-400">●</span> /blog/[slug]{'             '}<span className="text-gray-500">1.94 kB</span></div>
          <div><span className="text-cyan-400">├</span> <span className="text-cyan-400">○</span> /contact{'                 '}<span className="text-gray-500">4.21 kB</span></div>
          <div><span className="text-cyan-400">└</span> <span className="text-emerald-400">λ</span> /api/webhook{'             '}<span className="text-gray-500">0 B</span></div>
          <div className="text-[7px] text-gray-600 mt-1.5"><span className="text-cyan-400">○</span> Static{'  '}<span className="text-violet-400">●</span> SSG{'  '}<span className="text-emerald-400">λ</span> Dynamic</div>
        </div>
      </div>
    ),
    w: 250, h: 175,
    x: 400, y: 200,
    rotate: 4,
    entryOffset: 0.025,
  },
  {
    // 6. Analytics / Live Visitors
    content: (
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[9px] font-semibold text-gray-700">Analytics</span>
          <span className="text-[7px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-medium ml-auto flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />Live
          </span>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-[18px] font-bold text-gray-900 leading-none">1,247</span>
          <span className="text-[7px] text-gray-400">visitors today</span>
        </div>
        <svg viewBox="0 0 180 40" className="w-full h-8 mb-2">
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15"/>
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <polyline points="0,35 15,32 30,28 45,30 60,22 75,18 90,15 105,12 120,14 135,10 150,8 165,11 180,9" fill="none" stroke="#0ea5e9" strokeWidth="1.5"/>
          <polygon points="0,35 15,32 30,28 45,30 60,22 75,18 90,15 105,12 120,14 135,10 150,8 165,11 180,9 180,40 0,40" fill="url(#sparkFill)"/>
          <circle cx="180" cy="9" r="2.5" fill="#0ea5e9" className="animate-pulse"/>
        </svg>
        <div className="flex justify-between text-[8px] text-gray-400 font-mono">
          <span>/{'  '}482</span>
          <span>/services{'  '}198</span>
        </div>
      </div>
    ),
    w: 200, h: 160,
    x: -260, y: -400,
    rotate: -2,
    entryOffset: 0.02,
  },
  {
    // 7. E-commerce Product Card
    content: (
      <div>
        {/* Product image placeholder */}
        <div className="h-[70px] -mx-4 -mt-4 mb-2.5 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 60 60" className="w-10 h-10 text-gray-300"><rect x="8" y="14" width="44" height="32" rx="3" fill="currentColor" fillOpacity="0.3"/><circle cx="20" cy="26" r="4" fill="currentColor" fillOpacity="0.4"/><path d="M8 38l12-8 8 5 10-10 14 10v7H8z" fill="currentColor" fillOpacity="0.3"/></svg>
        </div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div>
            <div className="text-[10px] font-semibold text-gray-900">Minimal Desk Lamp</div>
            <div className="text-[8px] text-gray-400">Matte Black · LED</div>
          </div>
          <span className="text-[11px] font-bold text-gray-900">$89</span>
        </div>
        <div className="flex items-center gap-0.5 mb-2">
          {[1,2,3,4,5].map((_, i) => (
            <svg key={i} viewBox="0 0 12 12" className="w-2.5 h-2.5" fill={i < 4 ? '#f59e0b' : '#e5e7eb'}><path d="M6 0l1.8 3.7L12 4.3l-3 2.9.7 4.1L6 9.3 2.3 11.3l.7-4.1-3-2.9 4.2-.6z"/></svg>
          ))}
          <span className="text-[7px] text-gray-400 ml-0.5">4.0 (128)</span>
        </div>
        <div className="flex gap-1.5">
          <button className="flex-1 bg-gray-900 text-white text-[8px] font-medium py-1.5 rounded text-center">Add to Cart</button>
          <button className="w-7 h-7 flex items-center justify-center rounded border border-gray-200">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 text-gray-400"><path d="M8 14s-5.5-3.5-5.5-7A3 3 0 018 4.5 3 3 0 0113.5 7C13.5 10.5 8 14 8 14z"/></svg>
          </button>
        </div>
      </div>
    ),
    w: 180, h: 195,
    x: -420, y: 60,
    rotate: -3,
    entryOffset: 0.025,
  },
  {
    // 8. Dependencies Badge Strip
    content: (
      <div>
        <div className="flex items-center gap-1.5 mb-2.5 pb-1.5 border-b border-gray-100">
          <span className="text-[8px] text-gray-400 font-mono">dependencies</span>
          <span className="text-[7px] text-gray-300">(12)</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {[
            { name: 'next', ver: '16.2.1', dot: 'bg-black' },
            { name: 'react', ver: '19.1.0', dot: 'bg-[#61DAFB]' },
            { name: 'framer-motion', ver: '12.6.3', dot: 'bg-purple-500', warn: true },
            { name: 'tailwindcss', ver: '4.1.3', dot: 'bg-sky-500' },
            { name: 'typescript', ver: '5.7.3', dot: 'bg-[#3178C6]' },
            { name: 'supabase', ver: '2.49.1', dot: 'bg-emerald-500' },
          ].map(d => (
            <div key={d.name} className="flex items-center gap-1 bg-gray-50 border border-gray-200/60 rounded px-1.5 py-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${d.dot} ${d.warn ? 'ring-1 ring-amber-400 ring-offset-1' : ''}`} />
              <span className="text-[8px] text-gray-700 font-medium">{d.name}</span>
              <span className="text-[7px] text-gray-400">{d.ver}</span>
            </div>
          ))}
        </div>
        <div className="text-[7px] text-gray-300 mt-2">Last updated 2d ago</div>
      </div>
    ),
    w: 210, h: 130,
    x: 160, y: 310,
    rotate: 2,
    entryOffset: 0.03,
  },
];


export function WebDevFloatingElements({ scrollYProgress }: FloatingElementProps) {
  const [scale, setScale] = useState(1);
  const [maxElements, setMaxElements] = useState(8);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setScale(Math.min(1, w / 1200));
      // Show 2 on mobile, 4 on tablet, all 8 on desktop
      setMaxElements(w < 640 ? 2 : w < 1024 ? 4 : 8);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (maxElements === 0) return null;

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center', willChange: 'transform' }}>
      {elements.slice(0, maxElements).map((el, i) => {
        return (
          <FloatingElement
            key={i}
            scrollYProgress={scrollYProgress}
            baseEntry={0.4 + el.entryOffset}
            x={el.x}
            y={el.y}
            w={el.w}
            rotate={el.rotate}
            index={i}
          >
            {el.content}
          </FloatingElement>
        );
      })}
    </div>
  );
}

const EXIT_START = 0.72;
// Target slightly above textbox center
const TEXTBOX_TARGET_Y = 30;

function FloatingElement({
  scrollYProgress,
  baseEntry,
  x, y, w, rotate,
  index,
  children,
}: {
  scrollYProgress: MotionValue<number>;
  baseEntry: number;
  x: number; y: number; w: number; rotate: number;
  index: number;
  children: React.ReactNode;
}) {
  const stagger = index * 0.008;
  const exitStart = EXIT_START + stagger;

  // Fade in, then vanish behind textbox at the end of collapse
  const opacity = useTransform(
    scrollYProgress,
    [baseEntry, baseEntry + 0.04, exitStart + 0.06, exitStart + 0.09],
    [0, 1, 1, 0]
  );

  // Move to textbox center
  const collapseX = useTransform(
    scrollYProgress,
    [exitStart, exitStart + 0.10],
    [0, -x]
  );
  const translateY = useTransform(
    scrollYProgress,
    [baseEntry, baseEntry + 0.05, exitStart, exitStart + 0.10],
    [30, 0, 0, TEXTBOX_TARGET_Y - y]
  );

  // Scale down as they go behind
  const collapseScale = useTransform(
    scrollYProgress,
    [exitStart, exitStart + 0.10],
    [1, 0.4]
  );

  // Flatten rotation
  const collapseRotate = useTransform(
    scrollYProgress,
    [exitStart, exitStart + 0.10],
    [rotate, 0]
  );

  return (
    <motion.div
      className="absolute pointer-events-auto cursor-default"
      style={{
        width: w,
        left: '50%',
        top: '50%',
        marginLeft: x - w / 2,
        marginTop: y,
        opacity,
        y: translateY,
        x: collapseX,
        scale: collapseScale,
        rotate: collapseRotate,
        perspective: 600,
        willChange: 'transform, opacity',
      }}
      whileHover={{
        rotateX: -8,
        rotateY: rotate > 0 ? -12 : 12,
        scale: 1.03,
        transition: { duration: 0.25, ease: 'easeOut' },
      }}
    >
      <div
        className="relative p-4 backdrop-blur-xl overflow-hidden transition-shadow duration-300 hover:shadow-[0_16px_48px_rgba(14,165,233,0.12)]"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(248,252,255,0.4) 50%, rgba(255,255,255,0.6) 100%)',
          boxShadow: '0 1px 0 rgba(255,255,255,0.8) inset, 0 -1px 0 rgba(0,0,0,0.02) inset, 0 10px 40px rgba(0,0,0,0.06), 0 2px 10px rgba(14,165,233,0.05)',
          border: '1px solid rgba(255,255,255,0.5)',
          borderBottom: '1px solid rgba(14,165,233,0.1)',
        }}
      >
        {/* Top edge highlight */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
        {children}
      </div>
    </motion.div>
  );
}

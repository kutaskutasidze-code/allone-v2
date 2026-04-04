'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ChatPlaybackGlassy as ChatPlayback } from './ChatPlaybackGlassy';
import { WebDevFloatingElements } from './WebDevFloatingElements';
import { LeadFlowVisual } from './LeadFlowVisual';
import { FAQSchema } from '@/components/seo';

function useViewportDims() {
  const [dims, setDims] = useState({ vw: 1200, vh: 800, ready: false });
  useEffect(() => {
    let rafId: number;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setDims({ vw: window.innerWidth, vh: window.innerHeight, ready: true }));
    };
    update();
    window.addEventListener('resize', update);
    return () => { window.removeEventListener('resize', update); cancelAnimationFrame(rafId); };
  }, []);
  return dims;
}

function AnimatedLine({ text, scrollYProgress, delay, exitRange }: { text: string; scrollYProgress: MotionValue<number>; delay: number; exitRange: [number, number] }) {
  const lineOpacity = useTransform(scrollYProgress, [0.12 + delay, 0.19 + delay, exitRange[0], exitRange[1]], [0, 1, 1, 0]);
  const lineY = useTransform(scrollYProgress, [0.12 + delay, 0.19 + delay, exitRange[0], exitRange[1]], [40, 0, 0, -30]);
  return (
    <motion.span
      className="font-display text-[clamp(28px,4vw,44px)] font-medium text-[#071D2F] text-center leading-[1.2] tracking-[-0.03em] block"
      style={{ opacity: lineOpacity, y: lineY }}
    >
      {text}
    </motion.span>
  );
}

function AnimatedWord({ word, scrollYProgress, delay, exitRange }: { word: string; scrollYProgress: MotionValue<number>; delay: number; exitRange: [number, number] }) {
  const wordOpacity = useTransform(scrollYProgress, [0.16 + delay, 0.24 + delay, exitRange[0], exitRange[1]], [0, 1, 1, 0]);
  const wordY = useTransform(scrollYProgress, [0.16 + delay, 0.24 + delay], [40, 0]);
  return (
    <motion.span
      className="font-mono text-[clamp(22px,6vw,72px)] font-medium uppercase tracking-wider lg:tracking-widest leading-none inline-block"
      style={{ color: '#071D2F', opacity: wordOpacity, y: wordY }}
    >
      {word}
    </motion.span>
  );
}

function CornerBrackets({ size = 'md', color = 'border-[#0ea5e9]/40' }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const s = size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  return (
    <>
      <div className={`absolute top-0 left-0 ${s} border-t border-l ${color}`} />
      <div className={`absolute top-0 right-0 ${s} border-t border-r ${color}`} />
      <div className={`absolute bottom-0 left-0 ${s} border-b border-l ${color}`} />
      <div className={`absolute bottom-0 right-0 ${s} border-b border-r ${color}`} />
    </>
  );
}

function TypeWriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const [started, setStarted] = useState(false);
  const [showCursor, setShowCursor] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
      setShowCursor(true);
    }, delay * 1000);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started || displayed >= text.length) {
      if (started && displayed >= text.length) {
        const hide = setTimeout(() => setShowCursor(false), 600);
        return () => clearTimeout(hide);
      }
      return;
    }
    // Natural variance: occasional pauses, speed bursts
    const base = 75;
    const rand = Math.random();
    let speed = base;
    if (rand < 0.08) speed = base * 2.5;       // brief pause
    else if (rand > 0.92) speed = base * 0.4;   // fast burst
    else speed = base + (Math.random() - 0.5) * 40; // normal variance

    const timer = setTimeout(() => setDisplayed(d => d + 1), speed);
    return () => clearTimeout(timer);
  }, [started, displayed, text.length]);

  return (
    <span className="block">
      {text.slice(0, displayed)}
      {showCursor && (
        <motion.span
          className="inline-block w-[2px] h-[0.85em] bg-[#071D2F]/60 align-middle ml-0.5"
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      )}
      {!started && <span className="invisible">{text}</span>}
    </span>
  );
}

function MeshGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 50;
    let isVisible = true;

    // Cap DPR at 2 on mobile for performance
    const isMobile = window.innerWidth < 1024;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 3);
    let curW = 0, curH = 0;

    // Pause animation when off-screen
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) animId = requestAnimationFrame(draw);
    }, { threshold: 0 });
    if (containerRef.current) observer.observe(containerRef.current);

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w > 0 && h > 0 && (w !== curW || h !== curH)) {
        curW = w; curH = h;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // On mobile, use fewer points (12 vs 19) for performance
    const blueCount = isMobile ? 5 : 8;
    const accentCount = isMobile ? 2 : 3;
    const silverCount = isMobile ? 2 : 3;
    const whiteCount = isMobile ? 3 : 5;
    const totalPoints = blueCount + accentCount + silverCount + whiteCount;

    const blues: number[][] = [
      [40, 160, 235, 0.45], [20, 130, 220, 0.4], [70, 190, 248, 0.42], [30, 145, 230, 0.4],
      [85, 200, 250, 0.4], [50, 170, 240, 0.38], [60, 180, 245, 0.38], [95, 210, 252, 0.35],
    ];
    const accents = [
      { color: [10, 80, 170, 0.18], r: 0.22 },
      { color: [5, 65, 150, 0.15], r: 0.2 },
      { color: [15, 95, 185, 0.14], r: 0.24 },
    ];
    const silvers = [
      { color: [180, 190, 200, 0.2], r: 0.25 },
      { color: [195, 205, 215, 0.18], r: 0.22 },
      { color: [170, 180, 195, 0.15], r: 0.2 },
    ];
    const whiteColor = [255, 255, 255, 0.25];
    const points: { x: number; y: number; r: number; color: number[] }[] = Array.from({ length: totalPoints }, () => ({ x: 0, y: 0, r: 0, color: [0, 0, 0, 0] }));

    const s = Math.sin;
    const c = Math.cos;

    const draw = () => {
      if (!isVisible) return; // pause when off-screen
      const w = curW;
      const h = curH;
      if (w === 0 || h === 0) { animId = requestAnimationFrame(draw); return; }
      time += 0.008;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      const t = time;
      const dim = Math.max(w, h);
      let idx = 0;

      // Blues
      for (let i = 0; i < blueCount; i++) {
        const phase = (i / 8) * Math.PI * 2;
        const speed1 = 0.5 + (i % 3) * 0.15;
        const speed2 = 0.55 + (i % 4) * 0.12;
        const range = 0.42 + (i % 3) * 0.07;
        const p = points[idx++];
        p.x = w * (0.5 + s(t * speed1 + phase) * range + c(t * speed2 + phase * 1.3) * range * 0.5);
        p.y = h * (0.5 + c(t * speed2 + phase) * range + s(t * speed1 + phase * 0.7) * range * 0.5);
        p.r = dim * (0.35 + (i % 3) * 0.05);
        p.color = blues[i];
      }

      // Accents
      for (let i = 0; i < accentCount; i++) {
        const phase = (i / accents.length) * Math.PI * 2 + 1.2;
        const speed1 = 0.35 + (i % 2) * 0.15;
        const speed2 = 0.4 + (i % 2) * 0.1;
        const range = 0.25 + (i % 2) * 0.05;
        const p = points[idx++];
        p.x = w * (0.5 + s(t * speed1 + phase) * range + c(t * speed2 + phase * 1.4) * range * 0.35);
        p.y = h * (0.5 + c(t * speed2 + phase) * range + s(t * speed1 + phase * 0.9) * range * 0.35);
        p.r = dim * accents[i].r;
        p.color = accents[i].color;
      }

      // Silvers
      for (let i = 0; i < silverCount; i++) {
        const phase = (i / silvers.length) * Math.PI * 2 + 2.5;
        const speed1 = 0.45 + (i % 2) * 0.12;
        const speed2 = 0.5 + (i % 2) * 0.1;
        const range = 0.25 + (i % 2) * 0.06;
        const p = points[idx++];
        p.x = w * (0.5 + s(t * speed1 + phase) * range + c(t * speed2 + phase * 1.3) * range * 0.35);
        p.y = h * (0.5 + c(t * speed2 + phase) * range + s(t * speed1 + phase * 0.9) * range * 0.35);
        p.r = dim * silvers[i].r;
        p.color = silvers[i].color;
      }

      // Whites
      for (let i = 0; i < whiteCount; i++) {
        const phase = (i / whiteCount) * Math.PI * 2 + 0.5;
        const speed1 = 0.4 + (i % 3) * 0.1;
        const speed2 = 0.45 + (i % 2) * 0.12;
        const range = 0.28 + (i % 3) * 0.05;
        const p = points[idx++];
        p.x = w * (0.5 + s(t * speed1 + phase) * range + c(t * speed2 + phase * 1.5) * range * 0.4);
        p.y = h * (0.5 + c(t * speed2 + phase) * range + s(t * speed1 + phase * 0.8) * range * 0.4);
        p.r = dim * 0.3;
        p.color = whiteColor;
      }

      for (const p of points) {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        const [r, g, b, a] = p.color;
        grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
        grad.addColorStop(0.5, `rgba(${r},${g},${b},${a * 0.4})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const dims = useViewportDims();

  const headline1 = t('landing.hero.h1a');
  const headline2 = t('landing.hero.h1b');

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const startW = Math.min(920, dims.vw - 32);
  const startH = dims.vh * 0.65;
  const mxStart = (dims.vw - startW) / 2;
  const myStart = (dims.vh - startH) / 2;
  // Card expands → full screen → collapses back
  const marginX = useTransform(scrollYProgress, [0, 0.2, 0.6, 0.78], [mxStart, -2, -2, mxStart]);
  const marginTop = useTransform(scrollYProgress, [0, 0.2, 0.6, 0.78], [myStart, -2, -2, -2]);
  const marginBottom = useTransform(scrollYProgress, [0, 0.2, 0.6, 0.78], [myStart, -2, -2, dims.vh]);
  const bgRadius = useTransform(scrollYProgress, [0, 0.2, 0.6, 0.78], [16, 0, 0, 16]);
  const borderOpacity = useTransform(scrollYProgress, [0, 0.15, 0.65, 0.78], [1, 0, 0, 1]);

  // Hero text: moves up and fades
  const textY = useTransform(scrollYProgress, [0, 0.25], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.15, 0.2, 1], [1, 0, 0, 0]);

  // Services section — scrolls up from below, then scrolls up and out
  const servicesY = useTransform(scrollYProgress, [0.25, 0.4, 0.6, 0.75], [dims.vh, 0, 0, -dims.vh]);

  return (
    <div ref={sectionRef} className="relative h-[220vh]">
      {/* Background layer — fixed to viewport, expands from card to full screen */}
      <motion.div
        className="fixed z-0 overflow-hidden will-change-transform"
        style={{
          top: marginTop,
          left: marginX,
          right: marginX,
          bottom: marginBottom,
          borderRadius: bgRadius,
          visibility: dims.ready ? 'visible' : 'hidden',
        }}
      >
        <MeshGradient />

        {/* Premium border overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: borderOpacity,
            borderRadius: bgRadius,
            boxShadow: 'inset 0 0 0 1px rgba(56,189,248,0.4)',
          }}
        />
      </motion.div>

      <div className="sticky top-0 h-screen">
        {/* Hero text layer */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ y: textY, opacity: textOpacity }}
        >
          <div className="flex flex-col items-center text-center gap-8 px-4">
            <h1 className="font-display text-[clamp(34px,5.5vw,54px)] font-normal leading-[1.1] tracking-[-0.047em] text-[#071D2F]">
              <TypeWriter text={headline1} delay={0.3} />
              <TypeWriter text={headline2} delay={0.3 + headline1.length * 0.08 + 0.3} />
            </h1>

            <motion.p
              className="max-w-[540px] text-base text-[#4D4D4D] leading-relaxed"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {t('landing.hero.desc')}
            </motion.p>

            <motion.div
              className="flex flex-wrap items-center justify-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href="/contact" className="flex items-center gap-1.5 lg:gap-2 h-10 lg:h-12 px-4 lg:px-6 text-sm lg:text-base font-medium text-white bg-[#0369a1] rounded-full hover:bg-[#0284c7] transition-all duration-150">
                <Image src="/images/allone-logo-transparent.png" alt="" width={22} height={22} className="brightness-0 invert w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" />
                {t('landing.hero.cta1')}
              </Link>
              <Link href="/contact" className="relative flex items-center h-10 lg:h-12 px-4 lg:px-6 text-sm lg:text-base font-medium text-[#071D2F] rounded-full backdrop-blur-xl transition-all duration-200 hover:shadow-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.25) 100%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.3)' }}>
                {t('landing.hero.cta2')}
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Tagline — line by line blur-deblur reveal */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-8">
          <div className="flex flex-col items-center gap-2 max-w-[700px]">
            <AnimatedLine text="We build AI-powered systems" scrollYProgress={scrollYProgress} delay={0} exitRange={[0.28, 0.35]} />
            <AnimatedLine text="that automate your business" scrollYProgress={scrollYProgress} delay={0.04} exitRange={[0.28, 0.35]} />
            <AnimatedLine text="and let you focus on what matters." scrollYProgress={scrollYProgress} delay={0.08} exitRange={[0.28, 0.35]} />
          </div>
        </div>

        {/* Services — scrolls up from below */}
        <motion.div
          className="absolute left-0 right-0 top-0 z-10 flex items-center justify-center h-full"
          style={{ y: servicesY }}
        >
          <div className="max-w-[1100px] mx-auto px-6">
            <div className="text-center mb-4 lg:mb-10">
              <span className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal mb-2 lg:mb-3 block">What we build</span>
              <h2 className="font-mono text-[clamp(18px,4vw,48px)] font-medium uppercase tracking-wider lg:tracking-widest leading-none text-[#071D2F]">Solutions that work for you</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
              {[
                { num: '01', title: 'AI Chatbots', desc: 'Custom AI chatbots deployed on WhatsApp, Telegram, Instagram, and web. 24/7 support with CRM integration. Delivered in 1-2 weeks.', details: ['Multi-channel deployment', 'Natural language understanding', 'CRM & tool integrations', 'Lead qualification & routing', '24/7 autonomous operation'] },
                { num: '02', title: 'Web Development', desc: 'High-performance Next.js websites and web apps. SEO-optimized, Lighthouse 90+, mobile-first. Delivered in 4-8 weeks.', details: ['High-performance web apps', 'SEO & Core Web Vitals', 'Admin panels & dashboards', 'Payment & auth integration', 'Mobile-first responsive design'] },
                { num: '03', title: 'Workflow Automation', desc: 'Automate lead scoring, invoices, and data sync across platforms. Custom pipelines with n8n and Zapier. Delivered in 2-4 weeks.', details: ['Invoice & document processing', 'Lead scoring & enrichment', 'Custom trigger & action logic', 'Data sync across platforms', 'Real-time monitoring dashboard'] },
              ].map((service) => (
                <div
                  key={service.title}
                  className="p-3 lg:p-6 backdrop-blur-sm lg:backdrop-blur-xl border border-white/30 flex flex-col group"
                  style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 24px rgba(0,0,0,0.03)',
                  }}
                >
                  <span className="font-mono text-[8px] lg:text-[10px] text-[#0ea5e9]/60 mb-1 lg:mb-3">{service.num}</span>
                  <div className="relative px-2.5 py-1.5 lg:px-4 lg:py-3 mb-2 lg:mb-5">
                    <CornerBrackets />
                    <h3 className="font-display text-sm lg:text-2xl font-semibold text-[#071D2F] mb-0.5 lg:mb-2 tracking-[-0.03em]">{service.title}</h3>
                    <p className="text-[10px] lg:text-[13px] text-[#4D4D4D] leading-snug lg:leading-relaxed">{service.desc}</p>
                  </div>
                  <ul className="flex flex-col gap-1 lg:gap-2.5 mt-auto">
                    {service.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-1.5 lg:gap-2.5 text-[10px] lg:text-[12px] text-[#555] leading-snug">
                        <span className="w-1 h-1 rounded-full bg-[#0ea5e9] shrink-0 mt-1" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}


const channelData = [
  { name: 'WhatsApp', color: '#25D366', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  { name: 'Instagram', color: '#E1306C', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { name: 'Messenger', color: '#0084FF', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z"/></svg> },
  { name: 'Telegram', color: '#0088CC', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  { name: 'Viber', color: '#7360F2', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.4 0C9.473.028 5.333.344 3.213 2.296 1.633 3.876.96 6.27.87 9.21.78 12.15.56 17.717 5.9 19.2h.004l-.004 2.2s-.04.89.553 1.072c.716.22 1.136-.46 1.82-1.195.375-.404.89-.996 1.28-1.448 3.53.298 6.246-.38 6.554-.48.71-.23 4.726-.745 5.382-6.08.677-5.498-.327-8.975-2.16-10.543C18.04 1.594 14.547.044 11.4 0zm.317 1.9c2.73.04 5.752 1.283 6.86 2.207 1.49 1.27 2.381 4.285 1.81 8.927-.534 4.345-3.783 4.673-4.383 4.868-.256.083-2.553.657-5.476.458 0 0-2.17 2.62-2.85 3.313-.105.107-.23.15-.313.13-.12-.028-.152-.153-.15-.34l.03-3.6C3.09 16.483 2.72 11.9 2.79 9.39c.074-2.512.64-4.478 1.888-5.713C6.278 2.098 9.047 1.862 11.717 1.9z"/></svg> },
  { name: 'Website', color: '#0A68F5', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
];

const integrationData = [
  { name: 'Google Calendar', icon: <svg viewBox="0 0 24 24" className="w-4 h-4"><path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1967D2"/><path d="M5.684 24v-5.684h12.632V24H5.684z" fill="#188038"/><path d="M18.316 5.684V0H5.684v5.684h12.632z" fill="#4285F4"/><path d="M5.684 18.316H0V5.684h5.684v12.632z" fill="#FBBC04"/><path d="M18.316 18.316H5.684V5.684h12.632v12.632z" fill="#fff"/></svg> },
  { name: 'HubSpot', icon: <svg viewBox="0 0 24 24" fill="#FF7A59" className="w-4 h-4"><path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984v-.066A2.2 2.2 0 0017.238.84h-.066a2.2 2.2 0 00-2.193 2.193v.066a2.198 2.198 0 001.267 1.984V7.93a6.152 6.152 0 00-2.932 1.458l-7.73-6.014a2.636 2.636 0 00.096-.695A2.637 2.637 0 003.043.042 2.637 2.637 0 00.406 2.679 2.637 2.637 0 003.043 5.316c.5 0 .963-.142 1.362-.383l7.6 5.913a6.168 6.168 0 00-.932 3.263c0 1.227.365 2.37.986 3.334l-2.834 2.834a2.133 2.133 0 00-.632-.104 2.147 2.147 0 00-2.145 2.145A2.147 2.147 0 008.593 24.46a2.147 2.147 0 002.145-2.145c0-.224-.036-.44-.1-.643l2.797-2.797a6.198 6.198 0 103.87-3.34l.858-7.605z"/></svg> },
  { name: 'Notion', icon: <svg viewBox="0 0 24 24" fill="#000" className="w-4 h-4"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.11 2.1c-.42-.326-.98-.7-2.055-.607L3.01 2.64c-.466.046-.56.28-.374.466l1.823 1.1zM5.252 7.617v13.916c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.824c0-.606-.233-.933-.746-.886l-15.177.84c-.56.047-.747.327-.747.84z"/></svg> },
  { name: 'Stripe', icon: <svg viewBox="0 0 24 24" fill="#635BFF" className="w-4 h-4"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> },
  { name: 'Salesforce', icon: <svg viewBox="0 0 24 24" fill="#00A1E0" className="w-4 h-4"><path d="M10.006 5.87a4.387 4.387 0 013.137-1.324 4.376 4.376 0 014.133 2.94 5.326 5.326 0 011.344-.172C21.09 7.314 23.3 9.52 23.3 12.257c0 2.737-2.21 4.943-4.68 4.943a4.63 4.63 0 01-1.05-.114 3.94 3.94 0 01-3.44 2.044 3.93 3.93 0 01-2.04-.57A4.68 4.68 0 018 20.468a4.66 4.66 0 01-2.537-.748A4.297 4.297 0 01.7 15.638a4.29 4.29 0 012.09-3.682 5.08 5.08 0 01-.22-1.49C2.57 7.14 5.39 4.32 8.86 4.32c1.42 0 2.74.45 3.814 1.22l-2.668.33z"/></svg> },
  { name: 'Zapier', icon: <svg viewBox="0 0 24 24" fill="#FF4A00" className="w-4 h-4"><path d="M15.557 12.007l4.213-4.213a1.2 1.2 0 000-1.698l-1.87-1.869a1.2 1.2 0 00-1.697 0l-4.213 4.213-4.213-4.213a1.2 1.2 0 00-1.698 0l-1.869 1.87a1.2 1.2 0 000 1.697l4.213 4.213-4.213 4.213a1.2 1.2 0 000 1.698l1.87 1.869a1.2 1.2 0 001.697 0l4.213-4.213 4.213 4.213a1.2 1.2 0 001.698 0l1.869-1.87a1.2 1.2 0 000-1.697l-4.213-4.213zM12 14.4a2.4 2.4 0 110-4.8 2.4 2.4 0 010 4.8z"/></svg> },
];

function Pill({ name, color, icon }: { name: string; color?: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white/60 backdrop-blur-lg border border-[#0ea5e9]/15 hover:border-[#0ea5e9]/30 hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0" style={color ? { color } : undefined}>
        {icon}
      </div>
      <span className="text-[11px] font-medium text-gray-600 group-hover:text-gray-900 transition-colors">{name}</span>
    </div>
  );
}

function ChatbotSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const dims = useViewportDims();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  const isMobile = dims.vw < 1024;

  // Desktop: left/right split
  const leftX = useTransform(scrollYProgress, [0.15, 0.3], [0, -dims.vw * 0.7]);
  const rightX = useTransform(scrollYProgress, [0.15, 0.3], [0, dims.vw * 0.7]);

  // Mobile: top/bottom split (channels up, integrations down) — later start so user sees more
  const topY = useTransform(scrollYProgress, [0.22, 0.38], [0, -dims.vh]);
  const bottomY = useTransform(scrollYProgress, [0.22, 0.38], [0, dims.vh]);

  // Card container fades with the split
  const cardContainerOpacity = useTransform(scrollYProgress, [0.15, 0.25], [1, 0]);

  // Title moves up + shrinks
  const titleY = useTransform(scrollYProgress, [0.35, 0.45], [0, -(dims.vh * 0.3)]);
  const titleScale2 = useTransform(scrollYProgress, [0.35, 0.45], [1, 0.55]);

  // Glassy text frame — stays visible while elements collapse behind it
  const frameOpacity = useTransform(scrollYProgress, [0.42, 0.5, 0.85, 0.92], [0, 1, 1, 0]);
  const frameY2 = useTransform(scrollYProgress, [0.42, 0.5, 0.85, 0.92], [40, 0, 0, -30]);
  const frameScale = useTransform(scrollYProgress, [0.85, 0.92], [1, 0.9]);



  return (
    <div id="services" ref={sectionRef} className="relative z-10 bg-white -mt-8">
      <div className="relative h-[400vh]">
        <div className="sticky top-0 h-screen flex items-start pt-2 lg:items-center lg:pt-0 justify-center overflow-hidden">
          {/* "Your Vision, Deployed." reveal — each word staggers in */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-0"
            style={{ y: titleY }}
          >
            <motion.div
              className="flex flex-col items-center"
              style={{ scale: titleScale2 }}
            >
              <div className="flex items-center justify-center gap-[0.5em] flex-wrap px-4">
                <AnimatedWord word="Websites" scrollYProgress={scrollYProgress} delay={0} exitRange={[0.75, 0.82]} />
                <AnimatedWord word="Engineered" scrollYProgress={scrollYProgress} delay={0.03} exitRange={[0.75, 0.82]} />
                <AnimatedWord word="to" scrollYProgress={scrollYProgress} delay={0.06} exitRange={[0.75, 0.82]} />
                <AnimatedWord word="Perform." scrollYProgress={scrollYProgress} delay={0.09} exitRange={[0.75, 0.82]} />
              </div>
            </motion.div>
          </motion.div>

          {/* Glassy text frame — appears first, fades before folder */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-[5] pointer-events-none"
            style={{ opacity: frameOpacity, y: frameY2, scale: frameScale }}
          >
            <div
              className="max-w-[600px] w-full mx-6 p-8 backdrop-blur-xl border border-white/30 relative"
              style={{
                background: 'linear-gradient(160deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 100%)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 8px 40px rgba(0,0,0,0.04)',
                marginTop: dims.vh * 0.15,
              }}
            >
              <div className="absolute -inset-6 -z-10 rounded-full bg-[#0ea5e9]/15 blur-[40px]" />
              <CornerBrackets size="lg" />
              <p className="text-center text-[15px] text-[#071D2F] leading-relaxed mb-6">
                High-performance websites and web apps that convert visitors into customers. Built for speed, designed for impact.
              </p>
              <div className="flex justify-center gap-6 text-[12px] text-[#4D4D4D]/80 font-mono">
                <span>Blazing fast</span>
                <span className="text-[#0ea5e9]/30">|</span>
                <span>SEO optimized</span>
                <span className="text-[#0ea5e9]/30">|</span>
                <span>Fully responsive</span>
              </div>
            </div>
          </motion.div>

          {/* Floating UI elements — behind the textbox (lower z) */}
          <div className="absolute inset-0 z-[3] flex items-center justify-center" style={{ pointerEvents: 'none' }}>
            <WebDevFloatingElements scrollYProgress={scrollYProgress} />
          </div>

          {/* Chatbot cards — split apart on scroll */}
          <motion.div
            className="relative z-10 max-w-7xl w-full mx-3 sm:mx-6 lg:mx-auto"
            style={{ opacity: cardContainerOpacity }}
          >
            <div
              className="border border-[#0ea5e9]/25"
              style={{
                boxShadow: '0 25px 80px rgba(14,165,233,0.06), 0 8px 24px rgba(0,0,0,0.03)',
                background: 'linear-gradient(160deg, #f0f9ff 0%, #e8f4fd 30%, #ffffff 60%, #f0f9ff 100%)',
              }}
            >
              {isMobile ? (
                /* ─── MOBILE: vertical split between channels (top) and integrations (bottom) ─── */
                <div className="flex flex-col">
                  {/* TOP HALF: Chatbot + Channels — slides up */}
                  <motion.div style={{ y: topY }}>
                    <div className="relative flex flex-col items-center justify-center px-4 py-5 overflow-hidden border-b border-[#0ea5e9]/25">
                      <div className="relative z-10 text-center mb-3">
                        <h2 className="font-mono text-lg font-medium uppercase tracking-widest" style={{ color: '#0ea5e9' }}>AI Chatbots</h2>
                        <p className="text-[11px] text-[#4D4D4D]/60 mt-1">Deploy on every channel, one brain behind it all</p>
                      </div>
                      <div className="relative z-10 w-full max-w-[280px]">
                        <div className="absolute inset-6 -z-10 rounded-full bg-[#38bdf8]/35 blur-[15px]" />
                        <ChatPlayback />
                      </div>
                    </div>
                    <div className="relative p-4 overflow-hidden border-b border-[#0ea5e9]/25">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="font-mono text-[10px] text-[#0ea5e9]/30 font-medium">01</span>
                        <span className="font-mono text-[11px] font-medium text-[#0ea5e9] uppercase tracking-widest">{t('services.chatbot.channels')}</span>
                      </div>
                      <h3 className="font-display text-sm font-semibold text-[#071D2F] mb-1 tracking-[-0.02em]">{t('services.chatbot.channels.h3a')}{' '}{t('services.chatbot.channels.h3b')}</h3>
                      <p className="text-[11px] text-[#4D4D4D]/70 leading-[1.5] mb-3">{t('services.chatbot.channels.desc')}</p>
                      <div className="flex flex-wrap gap-1">{channelData.map((ch) => <Pill key={ch.name} {...ch} />)}</div>
                    </div>
                  </motion.div>

                  {/* BOTTOM HALF: Integrations — slides down */}
                  <motion.div style={{ y: bottomY }}>
                    <div className="relative p-4 overflow-hidden">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="font-mono text-[10px] text-[#0ea5e9]/30 font-medium">02</span>
                        <span className="font-mono text-[11px] font-medium text-[#0ea5e9] uppercase tracking-widest">{t('services.chatbot.integrations')}</span>
                      </div>
                      <h3 className="font-display text-sm font-semibold text-[#071D2F] mb-1 tracking-[-0.02em]">{t('services.chatbot.integrations.h3a')}{' '}{t('services.chatbot.integrations.h3b')}</h3>
                      <p className="text-[11px] text-[#4D4D4D]/70 leading-[1.5] mb-3">{t('services.chatbot.integrations.desc')}</p>
                      <div className="flex flex-wrap gap-1">{integrationData.map((integ) => <Pill key={integ.name} {...integ} />)}</div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                /* ─── DESKTOP: left/right split ─── */
                <div className="grid grid-cols-2">
                  {/* Left — Channels + Integrations */}
                  <motion.div className="flex flex-col" style={{ x: leftX }}>
                    <div className="relative p-7 flex-1 overflow-hidden border-b border-[#0ea5e9]/25">
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="font-mono text-[10px] text-[#0ea5e9]/30 font-medium">01</span>
                        <span className="font-mono text-[11px] font-medium text-[#0ea5e9] uppercase tracking-widest">{t('services.chatbot.channels')}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-[#071D2F] mb-1.5 tracking-[-0.02em] leading-[1.2]">{t('services.chatbot.channels.h3a')}{' '}{t('services.chatbot.channels.h3b')}</h3>
                      <p className="text-[12px] text-[#4D4D4D]/70 leading-[1.6] mb-4">{t('services.chatbot.channels.desc')}</p>
                      <div className="flex flex-wrap gap-1.5">{channelData.map((ch) => <Pill key={ch.name} {...ch} />)}</div>
                    </div>
                    <div className="relative p-7 flex-1 overflow-hidden">
                      <div className="flex items-baseline gap-3 mb-3">
                        <span className="font-mono text-[10px] text-[#0ea5e9]/30 font-medium">02</span>
                        <span className="font-mono text-[11px] font-medium text-[#0ea5e9] uppercase tracking-widest">{t('services.chatbot.integrations')}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-[#071D2F] mb-1.5 tracking-[-0.02em] leading-[1.2]">{t('services.chatbot.integrations.h3a')}{' '}{t('services.chatbot.integrations.h3b')}</h3>
                      <p className="text-[12px] text-[#4D4D4D]/70 leading-[1.6] mb-4">{t('services.chatbot.integrations.desc')}</p>
                      <div className="flex flex-wrap gap-1.5">{integrationData.map((integ) => <Pill key={integ.name} {...integ} />)}</div>
                    </div>
                  </motion.div>

                  {/* Right — Title + Chatbot */}
                  <motion.div
                    className="relative flex flex-col items-center justify-center py-10 overflow-hidden border-l border-[#0ea5e9]/25"
                    style={{ x: rightX }}
                  >
                    <div className="relative z-10 text-center mb-4">
                      <h2 className="font-mono text-lg sm:text-xl font-medium uppercase tracking-widest" style={{ color: '#0ea5e9' }}>AI Chatbots</h2>
                      <p className="text-[12px] text-[#4D4D4D]/60 mt-1.5">Deploy on every channel, one brain behind it all</p>
                    </div>
                    <div className="relative z-10 w-full max-w-[360px]">
                      <div className="absolute inset-6 -z-10 rounded-full bg-[#38bdf8]/35 blur-[15px]" />
                      <ChatPlayback />
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function WorkflowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const cardOpacity = useTransform(scrollYProgress, [0.06, 0.18], [0, 1]);
  const cardY = useTransform(scrollYProgress, [0.06, 0.22], [80, 0]);
  const textOpacity = useTransform(scrollYProgress, [0.10, 0.20], [0, 1]);
  const textX = useTransform(scrollYProgress, [0.10, 0.22], [40, 0]);
  const glowOpacity = useTransform(scrollYProgress, [0.05, 0.2], [0, 1]);

  return (
    <section id="automation" ref={sectionRef} className="relative pt-0 pb-24 lg:pb-32 overflow-hidden">
      {/* Blue glow — scales in, smaller + less blur on mobile */}
      <motion.div
        className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 pointer-events-none will-change-[opacity]"
        style={{ opacity: glowOpacity }}
      >
        <div className="relative w-[400px] h-[300px] lg:w-[800px] lg:h-[600px]" style={{ transform: 'translate3d(0,0,0)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-sky-300/15 to-blue-500/10 rounded-full blur-[50px] lg:blur-[100px]" />
        </div>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div style={{ opacity: cardOpacity, y: cardY }}>
          <div
            className="border border-[#0ea5e9]/25"
            style={{
              boxShadow: '0 25px 80px rgba(14,165,233,0.06), 0 8px 24px rgba(0,0,0,0.03)',
              background: 'linear-gradient(160deg, #f0f9ff 0%, #e8f4fd 30%, #ffffff 60%, #f0f9ff 100%)',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]">
              {/* Lead Flow Visual — second on mobile, first on desktop */}
              <div className="relative p-7 overflow-hidden order-last lg:order-first">
                <LeadFlowVisual />
              </div>

              {/* Title + Description — first on mobile, second on desktop */}
              <motion.div
                className="relative flex flex-col justify-center p-7 lg:p-10 order-first lg:order-last border-b lg:border-b-0 lg:border-t-0 lg:border-l border-[#0ea5e9]/25"
                style={{ opacity: textOpacity, x: textX }}
              >
                <motion.div
                  className="flex items-baseline gap-3 mb-3"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <span className="font-mono text-[10px] text-[#0ea5e9]/30 font-medium">03</span>
                  <span className="font-mono text-[11px] font-medium text-[#0ea5e9] uppercase tracking-widest">Workflow Automation</span>
                </motion.div>
                <motion.h3
                  className="font-display text-xl lg:text-2xl font-semibold text-[#071D2F] mb-3 tracking-[-0.02em] leading-[1.2]"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Automate the work that slows you down
                </motion.h3>
                <motion.p
                  className="text-[13px] text-[#4D4D4D]/70 leading-[1.7] mb-6"
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  From lead scoring to invoice processing, we build custom workflows that run 24/7 — so your team focuses on what matters.
                </motion.p>
                <div className="space-y-3">
                  {[
                    'New lead captured',
                    'Personalized outreach sent',
                    'Meeting auto-booked',
                    'Team notified instantly',
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-2.5"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                    >
                      <span className="w-1 h-1 rounded-full bg-[#0ea5e9] shrink-0" />
                      <span className="text-[12px] text-[#555] leading-snug">{step}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const faqItems = [
  { question: 'What does ALLONE do?', answer: 'ALLONE is an AI automation agency with offices in Tbilisi, Georgia and Brussels, Belgium. We build three things: custom AI chatbots that deploy on WhatsApp, Telegram, Instagram and web; workflow automation that connects your CRM, invoicing, and internal tools; and high-performance websites built with Next.js. Our AI-native approach means we deliver in weeks, not months.' },
  { question: 'How quickly can you deliver a project?', answer: 'It depends on complexity. A multi-channel AI chatbot with CRM integration typically goes live in 1-2 weeks. Workflow automation pipelines take 2-4 weeks. A full website or web application takes 4-8 weeks. We move fast because we use AI throughout our own delivery process — the same tools we build for clients.' },
  { question: 'How much do your services cost?', answer: 'Our AI-powered delivery reduces costs by up to 90% compared to traditional agencies. We offer three engagement models: project-based (fixed scope with milestone payments), monthly retainer (ongoing development), and consulting (hourly advisory). Reach out to info@allonelabs.com for a tailored estimate.' },
  { question: 'Which industries do you work with?', answer: 'We work across e-commerce, real estate, finance, hospitality, manufacturing, fashion, and publishing. Past projects include platforms for Equivalenza Georgia (perfume e-commerce), DataRooms (AI-powered investor data rooms), HostWise (property management SaaS), and KaoTenders (B2B industrial tenders).' },
  { question: 'Can you work with clients outside Georgia?', answer: 'Yes — we serve clients globally from our offices in Tbilisi and Brussels. Our team works in English and Georgian. We handle everything remotely: discovery calls, design reviews, development sprints, and ongoing support.' },
  { question: 'What technologies do you use?', answer: 'Frontend: Next.js, React, TypeScript, Tailwind CSS. Backend: Node.js, Python, Supabase, PostgreSQL. AI: OpenAI and Anthropic LLM integration, RAG systems, custom ML models. Automation: n8n, Zapier, and custom workflow engines. Cloud: Vercel, AWS, Cloudflare.' },
  { question: 'What makes ALLONE different from other agencies?', answer: 'We use AI in our own workflow — not just in what we deliver. This means a 3-person team at ALLONE outputs what typically requires 10-15 people at a traditional agency. The result: faster delivery, lower cost, and a team that deeply understands the AI tools we build for you.' },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#E0EEFB] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-[#f8fbff] transition-colors"
      >
        <h3 className="font-display text-sm lg:text-base font-semibold text-[#071D2F] pr-4">{question}</h3>
        <motion.svg
          width="20" height="20" viewBox="0 0 20 20" fill="none"
          className="flex-shrink-0 text-[#0ea5e9]"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-5 text-sm text-[#4D4D4D] leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

function FAQSection() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <FAQSchema questions={faqItems} />
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-10">
          <span className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal mb-2 block">Common Questions</span>
          <h2 className="font-display text-2xl lg:text-3xl font-semibold text-[#071D2F] tracking-[-0.03em]">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-2">
          {faqItems.map((faq, i) => (
            <FAQItem key={i} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function HeroExperiment() {
  return (
    <div className="bg-white text-[#071D2F] font-body antialiased">
      <Hero />
      <ChatbotSection />
      <WorkflowSection />
      <FAQSection />
    </div>
  );
}

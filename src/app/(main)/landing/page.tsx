'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';
import { motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ChatPlaybackGlassy as ChatPlayback } from './ChatPlaybackGlassy';
import { WebDevFloatingElements } from './WebDevFloatingElements';
import { WorkflowVisualV2 } from './WorkflowVisualV2';
import { FAQSchema } from '@/components/seo';
import { ContactForm } from '@/components/forms/ContactForm';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

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
  const mobile = useIsMobile();
  const lineOpacity = useTransform(scrollYProgress, [0.05 + delay, 0.10 + delay, exitRange[0], exitRange[1]], [0, 1, 1, 0]);
  const lineY = useTransform(scrollYProgress, [0.05 + delay, 0.10 + delay, exitRange[0], exitRange[1]], [40, 0, 0, -30]);
  return (
    <motion.span
      className="font-instrument text-[clamp(28px,4vw,44px)] font-medium text-[#071D2F] text-center leading-[1.2] tracking-[-0.03em] block"
      style={mobile ? { opacity: 1, y: 0 } : { opacity: lineOpacity, y: lineY }}
    >
      {text}
    </motion.span>
  );
}

function AnimatedWord({ word, scrollYProgress, delay, exitRange, accent }: { word: string; scrollYProgress: MotionValue<number>; delay: number; exitRange: [number, number]; accent?: boolean }) {
  const wordOpacity = useTransform(scrollYProgress, [0.45 + delay, 0.52 + delay, exitRange[0], exitRange[1]], [0, 1, 1, 0]);
  const wordY = useTransform(scrollYProgress, [0.45 + delay, 0.52 + delay], [120, 0]);
  return (
    <motion.span
      className="font-instrument text-[clamp(22px,6vw,72px)] font-medium tracking-[-0.02em] leading-none inline-block mr-[0.25em]"
      style={{ color: accent ? '#87CEEB' : '#071D2F', opacity: wordOpacity, y: wordY }}
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
    let lastFrame = performance.now();

    // Cap DPR at 2 on mobile for performance
    const isMobile = window.innerWidth < 1024;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 2 : 3);
    let curW = 0, curH = 0;

    const observer = isMobile ? null : new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) animId = requestAnimationFrame(draw);
    }, { threshold: 0 });
    if (observer && containerRef.current) observer.observe(containerRef.current);

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
      if (!isVisible) return;
      const w = curW;
      const h = curH;
      if (w === 0 || h === 0) { animId = requestAnimationFrame(draw); return; }
      const now = performance.now();
      const dt = Math.min(now - lastFrame, 50) / 1000; // cap at 50ms to avoid jumps
      lastFrame = now;
      time += dt * 0.4;

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

      if (!isMobile) animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      observer?.disconnect();
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
  const isMobile = dims.vw < 1024;
  const mobile = useIsMobile();

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
  // Card expands → full screen (stays until next section covers it)
  const marginX = useTransform(scrollYProgress, [0, 0.1], [mxStart, -2]);
  const marginTop = useTransform(scrollYProgress, [0, 0.1], [myStart, -2]);
  const marginBottom = useTransform(scrollYProgress, [0, 0.1], [myStart, -2]);
  const bgRadius = useTransform(scrollYProgress, [0, 0.1], [16, 0]);
  const borderOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  // Hero text: moves up and fades
  const textY = useTransform(scrollYProgress, [0, 0.12], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.08, 0.1, 1], [1, 0, 0, 0]);

  // Services section — scrolls up from below and stays
  const servicesY = useTransform(scrollYProgress, [0.18, 0.33], [dims.vh, 0]);

  // Keep gradient fully visible through hero, fade only at the very end when chatbot section covers
  const bgOpacity = useTransform(scrollYProgress, [0.97, 1], [1, 0]);

  return (
    <div ref={sectionRef} className="relative" style={{ height: mobile ? 'auto' : '160vh' }}>
      {/* Background layer — fixed to viewport, expands from card to full screen */}
      <motion.div
        className="fixed z-0 overflow-hidden will-change-transform pointer-events-none"
        style={mobile ? {
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: 0, opacity: 1,
          visibility: dims.ready ? 'visible' : 'hidden',
        } : {
          top: marginTop,
          left: marginX,
          right: marginX,
          bottom: marginBottom,
          borderRadius: bgRadius,
          opacity: bgOpacity,
          visibility: dims.ready ? 'visible' : 'hidden',
        }}
      >
        <MeshGradient />

        {/* Premium border overlay */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={mobile ? { opacity: 0 } : {
            opacity: borderOpacity,
            borderRadius: bgRadius,
            boxShadow: 'inset 0 0 0 1px rgba(56,189,248,0.4)',
          }}
        />
      </motion.div>

      <div className={mobile ? '' : 'sticky top-0 h-screen'}>
        {/* Hero text layer */}
        <motion.div
          className={mobile ? 'relative flex items-center justify-center z-10 min-h-[70vh]' : 'absolute inset-0 flex items-center justify-center z-10'}
          style={mobile ? { y: 0, opacity: 1 } : { y: textY, opacity: textOpacity }}
        >
          <div className="flex flex-col items-center text-center gap-8 px-4">
            <h1 className="font-instrument text-[clamp(26px,4.5vw,44px)] font-medium leading-[1.1] tracking-[-0.047em] text-[#071D2F]">
              <TypeWriter text={headline1} delay={0.3} />
              <TypeWriter text={headline2} delay={0.3 + headline1.length * 0.08 + 0.3} />
            </h1>

            <motion.p
              className="hidden lg:block max-w-[540px] text-base text-[#4D4D4D] leading-relaxed"
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
                <Image src="/images/allone-logo-transparent.png" alt="" width={22} height={22} className="w-[18px] h-[18px] lg:w-[22px] lg:h-[22px]" style={{ filter: 'brightness(0) saturate(100%) invert(83%) sepia(18%) saturate(531%) hue-rotate(166deg) brightness(99%) contrast(87%)' }} />
                {t('landing.hero.cta1')}
              </Link>
              <Link href="/contact" className="relative flex items-center h-10 lg:h-12 px-4 lg:px-6 text-sm lg:text-base font-medium text-[#071D2F] rounded-full backdrop-blur-xl transition-all duration-200 hover:shadow-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.25) 100%)', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 1px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(255,255,255,0.3)' }}>
                {t('landing.hero.cta2')}
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Tagline — line by line blur-deblur reveal (hidden on mobile) */}
        {!mobile && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none px-8">
          <div className="flex flex-col items-center gap-2 max-w-[700px]">
            <AnimatedLine text={t('landing.tagline.l1')} scrollYProgress={scrollYProgress} delay={0} exitRange={[0.18, 0.23]} />
            <AnimatedLine text={t('landing.tagline.l2')} scrollYProgress={scrollYProgress} delay={0.03} exitRange={[0.18, 0.23]} />
            <AnimatedLine text={t('landing.tagline.l3')} scrollYProgress={scrollYProgress} delay={0.06} exitRange={[0.18, 0.23]} />
          </div>
        </div>
        )}

        {/* Services — scrolls up from below */}
        <motion.div
          className={mobile ? 'relative z-10 pt-8' : 'absolute left-0 right-0 top-0 z-10 flex items-start lg:items-center justify-center h-full overflow-y-auto pt-4 lg:pt-0'}
          style={mobile ? { y: 0 } : { y: servicesY }}
        >
          <div className="max-w-[1100px] mx-auto px-6 pb-8 lg:pb-0">
            <div className="text-center mb-2 lg:mb-10">
              <span className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal mb-1 lg:mb-3 block">{t('landing.svc.label')}</span>
              <h2 className="font-instrument text-[clamp(18px,4vw,48px)] font-medium tracking-[-0.02em] leading-[1.1] text-[#071D2F]">{t('landing.svc.heading')}</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-3">
              {[
                { num: '01', title: t('landing.svc.card1.title'), desc: t('landing.svc.card1.desc'), details: [t('landing.svc.card1.d1'), t('landing.svc.card1.d2'), t('landing.svc.card1.d3'), t('landing.svc.card1.d4'), t('landing.svc.card1.d5')] },
                { num: '02', title: t('landing.svc.card2.title'), desc: t('landing.svc.card2.desc'), details: [t('landing.svc.card2.d1'), t('landing.svc.card2.d2'), t('landing.svc.card2.d3'), t('landing.svc.card2.d4'), t('landing.svc.card2.d5')] },
                { num: '03', title: t('landing.svc.card3.title'), desc: t('landing.svc.card3.desc'), details: [t('landing.svc.card3.d1'), t('landing.svc.card3.d2'), t('landing.svc.card3.d3'), t('landing.svc.card3.d4'), t('landing.svc.card3.d5')] },
              ].map((service) => (
                <div
                  key={service.title}
                  className="p-3 lg:p-6 rounded-2xl lg:backdrop-blur-xl border border-white/30 flex flex-col group"
                  style={{
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.08) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 24px rgba(0,0,0,0.03)',
                  }}
                >
                  <span className="font-mono text-[10px] text-[#0ea5e9]/60 mb-1 lg:mb-3">{service.num}</span>
                  <div className="relative px-0 py-0 lg:px-4 lg:py-3 mb-2 lg:mb-5">
                    <div className="hidden lg:block"><CornerBrackets /></div>
                    <h3 className="font-display text-base lg:text-2xl font-semibold text-[#071D2F] mb-0.5 lg:mb-2 tracking-[-0.03em]">{service.title}</h3>
                    <p className="text-[12px] lg:text-[13px] text-[#4D4D4D] leading-snug lg:leading-relaxed">{service.desc}</p>
                  </div>
                  <ul className="flex flex-col gap-1 lg:gap-2.5 mt-auto">
                    {service.details.slice(0, isMobile ? 3 : 5).map((detail) => (
                      <li key={detail} className="flex items-start gap-1.5 lg:gap-2.5 text-[11px] lg:text-[12px] text-[#555] leading-snug">
                        <span className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-[#0ea5e9] shrink-0 mt-1" />
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
function AnimatedChatbotHeading({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const { t } = useI18n();
  const lines: Array<Array<{ text: string; accent?: boolean }>> = [
    [{ text: t('landing.chatbot.h.1') }, { text: t('landing.chatbot.h.2') }],
    [{ text: t('landing.chatbot.h.3'), accent: true }],
    [{ text: t('landing.chatbot.h.4') }, { text: t('landing.chatbot.h.5'), accent: true }],
  ];
  let wordIdx = 0;
  return (
    <h1 className="font-instrument text-[40px] lg:text-[56px] font-medium text-black leading-[1.1] tracking-[-0.02em] mb-6">
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.map((w, wi) => {
            const idx = wordIdx++;
            return (
              <AnimatedHeadingWord key={`${li}-${wi}`} text={w.text} accent={w.accent} scrollYProgress={scrollYProgress} index={idx} />
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function AnimatedChatbotParagraph({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const { t } = useI18n();
  const mobile = useIsMobile();
  const opacity = useTransform(scrollYProgress, [0.70, 0.85], [0, 1]);
  const y = useTransform(scrollYProgress, [0.70, 0.85], [16, 0]);
  return (
    <motion.p className="text-[18px] text-gray-500 leading-[1.6] max-w-md mb-6" style={mobile ? { opacity: 1, y: 0 } : { opacity, y }}>
      {t('landing.chatbot.desc')}
    </motion.p>
  );
}

function AnimatedChatbotCTA({ scrollYProgress }: { scrollYProgress: MotionValue<number> }) {
  const { t } = useI18n();
  const mobile = useIsMobile();
  const opacity = useTransform(scrollYProgress, [0.78, 0.92], [0, 1]);
  const y = useTransform(scrollYProgress, [0.78, 0.92], [16, 0]);
  return (
    <motion.div style={mobile ? { opacity: 1, y: 0 } : { opacity, y }}>
      <Link
        href="/contact"
        className="inline-flex items-center h-9 px-4 text-[13px] font-medium text-black rounded-md hover:opacity-90 transition-opacity duration-150"
        style={{ backgroundColor: '#87CEEB' }}
      >
        {t('landing.chatbot.cta')}
      </Link>
    </motion.div>
  );
}

function AnimatedHeadingWord({ text, accent, scrollYProgress, index }: { text: string; accent?: boolean; scrollYProgress: MotionValue<number>; index: number }) {
  const mobile = useIsMobile();
  const start = 0.45 + index * 0.03;
  const end = start + 0.12;
  const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);
  const y = useTransform(scrollYProgress, [start, end], [16, 0]);
  return (
    <motion.span
      className="inline-block mr-[0.25em]"
      style={mobile ? { color: accent ? '#87CEEB' : undefined, opacity: 1, y: 0 } : { color: accent ? '#87CEEB' : undefined, opacity, y }}
    >
      {text}
    </motion.span>
  );
}

type ExpTile = { name: string; color?: string; icon: React.ReactNode };
const expChannels: ExpTile[] = [
  { name: 'WhatsApp', color: '#25D366', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
  { name: 'Instagram', color: '#E1306C', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
  { name: 'Messenger', color: '#0084FF', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8.2l3.131 3.259L19.752 8.2l-6.561 6.763z"/></svg> },
  { name: 'Telegram', color: '#0088CC', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
  { name: 'Viber', color: '#7360F2', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M11.4 0C9.473.028 5.333.344 3.213 2.296 1.633 3.876.96 6.27.87 9.21.78 12.15.56 17.717 5.9 19.2h.004l-.004 2.2s-.04.89.553 1.072c.716.22 1.136-.46 1.82-1.195.375-.404.89-.996 1.28-1.448 3.53.298 6.246-.38 6.554-.48.71-.23 4.726-.745 5.382-6.08.677-5.498-.327-8.975-2.16-10.543C18.04 1.594 14.547.044 11.4 0zm.317 1.9c2.73.04 5.752 1.283 6.86 2.207 1.49 1.27 2.381 4.285 1.81 8.927-.534 4.345-3.783 4.673-4.383 4.868-.256.083-2.553.657-5.476.458 0 0-2.17 2.62-2.85 3.313-.105.107-.23.15-.313.13-.12-.028-.152-.153-.15-.34l.03-3.6C3.09 16.483 2.72 11.9 2.79 9.39c.074-2.512.64-4.478 1.888-5.713C6.278 2.098 9.047 1.862 11.717 1.9z"/></svg> },
  { name: 'Website', color: '#0A68F5', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-9 h-9"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
];
const expIntegrations: ExpTile[] = [
  { name: 'Google Sheets', icon: <svg viewBox="0 0 24 24" className="w-9 h-9"><path d="M14.727 6.727H14V0H4.91c-.905 0-1.637.732-1.637 1.636v20.728c0 .904.732 1.636 1.636 1.636h14.182c.904 0 1.636-.732 1.636-1.636V6.727h-6.727z" fill="#0F9D58"/><path d="M14 0l6.727 6.727H14V0z" fill="#87CEAB"/><path d="M7.364 12.545h9.272v1.091H7.364v-1.09zm0 2.182h9.272v1.091H7.364v-1.09zm0 2.182h9.272v1.091H7.364V16.91zm0-6.546h9.272V11.454H7.364v-1.09z" fill="#F1F1F1"/></svg> },
  { name: 'Facebook', color: '#1877F2', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { name: 'Gmail', icon: <svg viewBox="0 0 24 24" className="w-9 h-9"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/></svg> },
  { name: 'Shopify', color: '#96BF48', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.2-.192s-1.738-.126-1.738-.126-1.148-1.16-1.29-1.291a.39.39 0 00-.2-.1l-.776 17.236-.387 3.764zm-2.882-18.56s-.663-.347-1.47-.347c-1.197 0-1.244.752-1.244.94 0 1.032 2.689 1.428 2.689 3.851 0 1.905-1.208 3.132-2.838 3.132-1.955 0-2.953-1.217-2.953-1.217l.524-1.73s1.028.884 1.896.884c.568 0 .8-.448.8-.776 0-1.349-2.206-1.408-2.206-3.627 0-1.865 1.34-3.67 4.04-3.67.862 0 1.426.25 1.426.25l-.664 2.31z"/></svg> },
  { name: 'WordPress', color: '#21759B', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9"><path d="M12.158 12.786l-2.698 7.84c.806.236 1.657.365 2.54.365 1.047 0 2.051-.18 2.986-.51-.024-.038-.046-.079-.065-.122l-2.763-7.573zM3.009 12c0 3.56 2.07 6.634 5.068 8.092L3.788 8.341A8.951 8.951 0 003.009 12zm17.159-1.096c0-1.112-.399-1.881-.741-2.48-.456-.741-.883-1.368-.883-2.109 0-.826.626-1.596 1.51-1.596.04 0 .078.005.116.007A8.963 8.963 0 0012 3.009 8.98 8.98 0 004.87 6.244c.337.01.654.017.923.017 1.497 0 3.816-.183 3.816-.183.771-.046.862 1.088.092 1.18 0 0-.776.091-1.639.137l5.216 15.513 3.135-9.4-2.231-6.113c-.771-.046-1.502-.137-1.502-.137-.772-.046-.681-1.226.09-1.18 0 0 2.366.183 3.77.183 1.497 0 3.816-.183 3.816-.183.772-.046.863 1.088.091 1.18 0 0-.776.091-1.638.137l5.176 15.388 1.43-4.78c.618-1.978.928-3.47.928-4.713zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm8.984 12c0 1.635-.271 3.196-.768 4.662l-3.101-8.992a8.961 8.961 0 00.877-8.674A8.96 8.96 0 0020.984 12z"/></svg> },
  { name: 'Google Analytics', icon: <svg viewBox="0 0 24 24" className="w-9 h-9"><path d="M22.844 20.862c0 1.614-1.238 2.862-2.737 2.862-1.5 0-2.738-1.248-2.738-2.862V3.138C17.37 1.524 18.607.276 20.107.276c1.5 0 2.737 1.248 2.737 2.862v17.724z" fill="#F9AB00"/><path d="M13.37 20.862c0 1.614-1.24 2.862-2.738 2.862-1.5 0-2.738-1.248-2.738-2.862v-8.724c0-1.614 1.238-2.862 2.738-2.862 1.5 0 2.737 1.248 2.737 2.862v8.724z" fill="#E37400"/><path d="M3.894 23.724c1.5 0 2.738-1.248 2.738-2.862s-1.238-2.862-2.738-2.862c-1.5 0-2.737 1.248-2.737 2.862s1.237 2.862 2.737 2.862z" fill="#E37400"/></svg> },
  { name: 'Stripe', icon: <svg viewBox="0 0 24 24" fill="#635BFF" className="w-9 h-9"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg> },
  { name: 'Notion', icon: <svg viewBox="0 0 24 24" fill="#000" className="w-9 h-9"><path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.11 2.1c-.42-.326-.98-.7-2.055-.607L3.01 2.64c-.466.046-.56.28-.374.466l1.823 1.1zM5.252 7.617v13.916c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.824c0-.606-.233-.933-.746-.886l-15.177.84c-.56.047-.747.327-.747.84z"/></svg> },
];
const expAllTiles = [...expChannels, ...expIntegrations];
const expRow1 = expAllTiles.slice(0, 9);
const expRow2 = expAllTiles.slice(3, 12);
const expRow3 = expAllTiles.slice(6, 14).concat(expAllTiles.slice(0, 3));
const expRow4 = expAllTiles.slice(5, 13).concat(expAllTiles.slice(0, 4));

function ExpLogoTile({ tile }: { tile: ExpTile }) {
  return (
    <div
      className="w-[80px] h-[80px] flex items-center justify-center rounded-[18px] bg-white border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.04)] flex-shrink-0"
      title={tile.name}
    >
      <div style={tile.color ? { color: tile.color } : undefined}>{tile.icon}</div>
    </div>
  );
}

function ExpLogoRow({ tiles, reverse = false, duration = 35 }: { tiles: ExpTile[]; reverse?: boolean; duration?: number }) {
  const doubled = [...tiles, ...tiles, ...tiles];
  return (
    <div
      className="flex gap-3 animate-logo-scroll"
      style={{ animationDuration: `${duration}s`, animationDirection: reverse ? 'reverse' : 'normal' }}
    >
      {doubled.map((tile, i) => <ExpLogoTile key={i} tile={tile} />)}
    </div>
  );
}

function ChatbotSection() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLDivElement>(null);
  const dims = useViewportDims();
  const mobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Fires before the sticky activates so text finishes animating as the section arrives.
  const { scrollYProgress: textEntryProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'start start'],
  });

  const isMobile = dims.vw < 1024;

  const cardContainerY = useTransform(scrollYProgress, [0.5, 0.9], [0, -dims.vh * 0.3]);
  const cardContainerOpacity = useTransform(scrollYProgress, [0.7, 0.95], [1, 0]);



  return (
    <div id="services" ref={sectionRef} className="relative z-10 bg-white -mt-8">
      <div className="relative" style={{ height: mobile ? 'auto' : (isMobile ? '150vh' : '180vh') }}>
        <div className={mobile ? 'relative py-12' : 'sticky top-0 h-screen flex items-start pt-2 lg:pt-[8vh] justify-center overflow-hidden'}>
          <motion.div
            className="relative z-10 max-w-7xl mx-auto px-6"
            style={mobile ? { opacity: 1, y: 0 } : { opacity: cardContainerOpacity, y: cardContainerY }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center">
              {/* Text */}
              <div>
                <AnimatedChatbotHeading scrollYProgress={textEntryProgress} />
                <AnimatedChatbotParagraph scrollYProgress={textEntryProgress} />
                <AnimatedChatbotCTA scrollYProgress={textEntryProgress} />
              </div>

              {/* Scrolling logos with chatbot floating in center */}
              <div className="relative w-full h-[360px] lg:h-[480px]">
                <div
                  className="absolute inset-0 flex flex-col justify-center gap-3"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
                  }}
                >
                  <ExpLogoRow tiles={expRow1} reverse={false} duration={45} />
                  <ExpLogoRow tiles={expRow2} reverse={true} duration={50} />
                  <ExpLogoRow tiles={expRow3} reverse={false} duration={40} />
                  <ExpLogoRow tiles={expRow4} reverse={true} duration={48} />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-full max-w-[280px] lg:max-w-[360px] chatbot-transparent rounded-[20px] overflow-hidden">
                    <motion.div
                      className="absolute -inset-12 -z-10 rounded-full bg-[#38bdf8]/40 blur-[60px]"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true, margin: '-150px' }}
                      transition={{ duration: 0.5 }}
                    />
                    <ChatPlayback />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-10 relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen border-t border-b border-gray-200 bg-gray-50 py-16 px-6">
              <p className="font-instrument text-[30px] lg:text-[42px] font-medium leading-[1.1] tracking-[-0.02em] text-center max-w-4xl mx-auto">
                <span className="text-black">{t('landing.quote.1')}</span>
                <span style={{ color: '#87CEEB' }}>{t('landing.quote.ai')}</span>
                <span className="text-black">{t('landing.quote.2')}</span>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function BentoCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={`rounded-2xl overflow-hidden bg-white ${className}`}
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.07), 0 8px 20px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.03), 0 0 0 1px rgba(0,0,0,0.02), 0 0 40px rgba(37,99,235,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function useInViewOnce(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function useAnimatedNumber(target: number, duration = 2000, decimals = 0) {
  const [value, setValue] = useState(0);
  const { ref, inView } = useInViewOnce(0.3);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Number((eased * target).toFixed(decimals)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target, duration, decimals]);
  return { value, ref };
}

function useCyclingIndex(count: number, interval = 3000) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % count), interval);
    return () => clearInterval(id);
  }, [count, interval]);
  return index;
}

function TrafficLightDots() {
  return (
    <div className="flex gap-1">
      <span className="w-[6px] h-[6px] rounded-full bg-gray-300" />
      <span className="w-[6px] h-[6px] rounded-full bg-gray-300" />
      <span className="w-[6px] h-[6px] rounded-full bg-gray-300" />
    </div>
  );
}

function UIDesignCard() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(0);
  const configs = [
    { label: 'Desktop', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3.5 h-3.5"><rect x="1.5" y="2" width="13" height="9" rx="1.5"/><path d="M5.5 14h5M8 11v3"/></svg>, width: '100%', height: 155, radius: 12, cols: 3, showImage: true, showNav: true },
    { label: 'Tablet', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3.5 h-3.5"><rect x="3" y="1" width="10" height="14" rx="1.5"/><circle cx="8" cy="13" r="0.5" fill="currentColor"/></svg>, width: '68%', height: 165, radius: 16, cols: 2, showImage: false, showNav: false },
    { label: 'Mobile', icon: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-3.5 h-3.5"><rect x="4" y="1" width="8" height="14" rx="1.5"/><path d="M7 13h2"/></svg>, width: '40%', height: 180, radius: 20, cols: 1, showImage: false, showNav: false },
  ];
  useEffect(() => {
    const id = setInterval(() => setActiveTab(i => (i + 1) % 3), 3000);
    return () => clearInterval(id);
  }, []);
  const cfg = configs[activeTab];
  return (
    <BentoCard className="h-full" delay={0.05}>
      <div className="p-5 h-full flex flex-col">
        <div className="flex items-center justify-center mb-4">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {configs.map((c, i) => (
              <button key={c.label} onClick={() => setActiveTab(i)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[8px] font-medium transition-all duration-300 ${i === activeTab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 flex justify-center items-start">
          <motion.div
            className="overflow-hidden bg-[#f8f9fa] border border-gray-200"
            animate={{ width: cfg.width, height: cfg.height, borderRadius: cfg.radius }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-gray-100">
              <TrafficLightDots />
              <motion.div className="flex-1 mx-3" animate={{ opacity: cfg.showNav ? 1 : 0 }} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded px-2 py-0.5 text-[7px] text-gray-400 text-center border border-gray-200/60">allone.ge</div>
              </motion.div>
              {!cfg.showNav && <svg viewBox="0 0 16 16" fill="none" stroke="#ccc" strokeWidth="1.2" className="w-3 h-3 ml-auto"><path d="M2 5h12M2 8h12M2 11h8"/></svg>}
            </div>
            <div className="p-3 overflow-hidden">
              <div className="flex gap-2 mb-2">
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-2/3 rounded bg-gray-300" />
                  <div className="h-1.5 w-full rounded bg-gray-200/70" />
                  <motion.div className="h-1.5 rounded bg-gray-200/70" animate={{ width: activeTab === 2 ? '60%' : '80%' }} transition={{ duration: 0.4 }} />
                  <div className="flex gap-1.5 mt-2">
                    <div className="h-5 w-14 rounded-md bg-[#2563eb]" />
                    <motion.div className="h-5 w-10 rounded-md bg-gray-200" animate={{ opacity: activeTab === 2 ? 0 : 1 }} transition={{ duration: 0.3 }} />
                  </div>
                </div>
                <motion.div className="rounded-lg bg-gradient-to-br from-[#2563eb]/8 to-transparent border border-[#2563eb]/10"
                  animate={{ width: cfg.showImage ? 64 : 0, height: cfg.showImage ? 56 : 0, opacity: cfg.showImage ? 1 : 0 }}
                  transition={{ duration: 0.4 }} />
              </div>
              <div className="flex gap-1.5 mt-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="h-8 rounded-lg bg-gray-100 border border-gray-200/40"
                    animate={{ flex: i < cfg.cols ? 1 : 0, opacity: i < cfg.cols ? 1 : 0, width: i < cfg.cols ? 'auto' : 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
        <h3 className="font-display text-[15px] font-semibold text-gray-900 mb-1 mt-4">{t('landing.webdev.bento.ui.title')}</h3>
        <p className="text-[12px] text-gray-400 leading-relaxed">{t('landing.webdev.bento.ui.desc')}</p>
      </div>
    </BentoCard>
  );
}

const CODE_LINES = [
  { tokens: [{ t: 'export', c: '#2563eb' }, { t: ' async ', c: '#2563eb' }, { t: 'function ', c: '#2563eb' }, { t: 'GET', c: '#111' }, { t: '(req) {', c: '#999' }] },
  { tokens: [{ t: '  const ', c: '#2563eb' }, { t: 'data', c: '#333' }, { t: ' = ', c: '#999' }, { t: 'await ', c: '#2563eb' }, { t: 'db', c: '#111' }, { t: '.', c: '#999' }, { t: 'query', c: '#111' }, { t: '()', c: '#999' }] },
  { tokens: [{ t: '  const ', c: '#2563eb' }, { t: 'enriched', c: '#333' }, { t: ' = ', c: '#999' }, { t: 'ai', c: '#111' }, { t: '.', c: '#999' }, { t: 'process', c: '#111' }, { t: '(data)', c: '#999' }] },
  { tokens: [{ t: '  return ', c: '#2563eb' }, { t: 'Response', c: '#111' }, { t: '.', c: '#999' }, { t: 'json', c: '#111' }, { t: '(enriched)', c: '#999' }] },
  { tokens: [{ t: '}', c: '#999' }] },
];
const CODE_CHAR_MAP = CODE_LINES.flatMap((line, li) => line.tokens.flatMap(tk => Array.from(tk.t, () => ({ lineIdx: li }))));
const CODE_TOTAL = CODE_CHAR_MAP.length;

function BackendCard() {
  const { t } = useI18n();
  const [visibleChars, setVisibleChars] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const { ref, inView } = useInViewOnce(0.3);

  useEffect(() => {
    if (!inView) return;
    let pos = 0;
    let prevLine = 0;
    let timeout: ReturnType<typeof setTimeout>;
    setIsTyping(true);
    const type = () => {
      if (pos >= CODE_TOTAL) {
        setIsTyping(false);
        timeout = setTimeout(() => { setVisibleChars(0); pos = 0; prevLine = 0; setIsTyping(true); timeout = setTimeout(type, 600); }, 3500);
        return;
      }
      const entry = CODE_CHAR_MAP[pos];
      const isNewLine = entry.lineIdx !== prevLine;
      prevLine = entry.lineIdx;
      pos++;
      setVisibleChars(pos);
      const baseDelay = 30 + Math.random() * 30;
      timeout = setTimeout(type, isNewLine ? baseDelay + 200 : baseDelay);
    };
    timeout = setTimeout(type, 500);
    return () => clearTimeout(timeout);
  }, [inView]);

  let charCount = 0;
  const showCursor = isTyping || visibleChars >= CODE_TOTAL;
  return (
    <BentoCard className="h-full" delay={0.1}>
      <div className="p-5 h-full flex flex-col" ref={ref}>
        <div className="rounded-xl overflow-hidden bg-[#f8f9fa] border border-gray-100 mb-5 flex-1">
          <div className="flex items-center border-b border-gray-100">
            <div className="px-3 py-2"><TrafficLightDots /></div>
            <div className="flex">
              <div className="px-3 py-1.5 text-[8px] font-mono text-gray-800 bg-white border-b-2 border-[#2563eb]">route.ts</div>
              <div className="px-3 py-1.5 text-[8px] font-mono text-gray-400">schema.ts</div>
            </div>
          </div>
          <div className="p-3 font-mono text-[9px] leading-[2]">
            {CODE_LINES.map((line, li) => {
              const lineStart = charCount;
              const lineChars = line.tokens.reduce((s, tk) => s + tk.t.length, 0);
              const lineEnd = lineStart + lineChars;
              const cursorHere = showCursor && ((visibleChars >= lineStart && visibleChars < lineEnd) || (visibleChars >= CODE_TOTAL && li === CODE_LINES.length - 1));
              return (
                <div key={li} className="flex">
                  <span className="w-5 text-right mr-3 text-gray-300 select-none text-[8px]">{li + 1}</span>
                  <div>
                    {line.tokens.map((tk, ti) => {
                      const chars = tk.t.split('').map((ch, ci) => {
                        const idx = charCount++;
                        return <span key={ci} style={{ color: tk.c, opacity: idx < visibleChars ? 1 : 0, transition: 'opacity 0.04s' }}>{ch}</span>;
                      });
                      return <span key={ti}>{chars}</span>;
                    })}
                    {cursorHere && <span className={`inline-block w-[5px] h-[11px] bg-[#2563eb] align-middle ${isTyping ? '' : 'animate-pulse'}`} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <h3 className="font-display text-[15px] font-semibold text-gray-900 mb-1">{t('landing.webdev.bento.backend.title')}</h3>
        <p className="text-[12px] text-gray-400 leading-relaxed">{t('landing.webdev.bento.backend.desc')}</p>
      </div>
    </BentoCard>
  );
}

function SEOCard() {
  const { t } = useI18n();
  const rankIdx = useCyclingIndex(3, 2200);
  const { value: seoScore, ref } = useAnimatedNumber(98, 1500, 0);
  const [scanStep, setScanStep] = useState(-1);
  const keywords = [
    { term: 'AI automation company', pos: '#1', change: '+2' },
    { term: 'AI chatbot Georgia', pos: '#1', change: '+5' },
    { term: 'workflow automation', pos: '#2', change: '+3' },
  ];
  const checks = ['Meta tags', 'Structured data', 'Core Web Vitals', 'Sitemap', 'Open Graph', 'robots.txt'];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let scanId: ReturnType<typeof setInterval>;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let step = 0;
        scanId = setInterval(() => {
          setScanStep(step);
          step++;
          if (step >= checks.length) clearInterval(scanId);
        }, 300);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => { obs.disconnect(); clearInterval(scanId); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <BentoCard className="h-full" delay={0.15}>
      <div className="p-5 h-full flex flex-col" ref={ref}>
        <div className="rounded-xl bg-[#f8f9fa] border border-gray-100 p-4 mb-5 flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[8px] text-gray-400 font-mono uppercase">Search Rankings</span>
            <motion.span className="font-mono text-[11px] font-semibold text-[#2563eb]"
              animate={seoScore === 98 ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.3 }}
            >{seoScore}/100</motion.span>
          </div>
          <div className="space-y-1.5 mb-3">
            {keywords.map((kw, i) => (
              <div key={kw.term} className={`flex items-center justify-between p-1.5 rounded-md transition-all duration-500 ${i === rankIdx ? 'bg-white shadow-sm' : ''}`}>
                <span className={`text-[9px] transition-colors duration-300 ${i === rankIdx ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{kw.term}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-emerald-500">{kw.change}</span>
                  <span className={`text-[9px] font-semibold transition-colors duration-300 ${i === rankIdx ? 'text-[#2563eb]' : 'text-gray-400'}`}>{kw.pos}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {checks.map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 ${i <= scanStep ? 'bg-emerald-500/15' : 'bg-gray-200'}`}>
                  {i <= scanStep && <svg viewBox="0 0 12 12" className="w-2 h-2 text-emerald-500"><path d="M3 6l2 2L9 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <span className={`text-[8px] transition-colors duration-300 ${i <= scanStep ? 'text-gray-700' : 'text-gray-300'}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <h3 className="font-display text-[15px] font-semibold text-gray-900 mb-1">{t('landing.webdev.bento.seo.title')}</h3>
        <p className="text-[12px] text-gray-400 leading-relaxed">{t('landing.webdev.bento.seo.desc')}</p>
      </div>
    </BentoCard>
  );
}

const DOT_OPACITIES = Array.from({ length: 28 }, (_, i) => i === 19 ? 0.4 : 0.15 + (((i * 7 + 3) % 10) / 10) * 0.85);

function PerformanceCard() {
  const { t } = useI18n();
  const { ref, inView } = useInViewOnce(0.3);
  const activeIdx = useCyclingIndex(3, 3200);

  const views = [
    {
      label: 'Lighthouse',
      render: () => (
        <div className="space-y-2.5 w-full">
          {[
            { label: 'Performance', value: 98, color: '#2563eb' },
            { label: 'Accessibility', value: 100, color: '#10b981' },
            { label: 'Best Practices', value: 95, color: '#f59e0b' },
            { label: 'SEO', value: 100, color: '#8b5cf6' },
          ].map((m, i) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[8px] text-gray-500">{m.label}</span>
                <span className="text-[8px] font-mono font-semibold" style={{ color: m.color }}>{m.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: m.color }}
                  key={`bar-${activeIdx}-${i}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${m.value}%` }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }} />
              </div>
            </div>
          ))}
        </div>
      ),
      items: [{ k: 'LCP', v: '1.2s' }, { k: 'FID', v: '12ms' }, { k: 'CLS', v: '0.003' }],
    },
    {
      label: 'Load Speed',
      render: () => (
        <div className="flex items-end gap-2 h-[80px] w-full px-1">
          {[0.25, 0.55, 0.85, 0.45, 0.95, 0.65, 1.0].map((h, i) => (
            <motion.div key={`load-${activeIdx}-${i}`} className="flex-1 rounded-t bg-[#10b981]"
              initial={{ height: 0 }}
              animate={{ height: `${h * 100}%` }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }} />
          ))}
        </div>
      ),
      items: [{ k: 'TTFB', v: '120ms' }, { k: 'FCP', v: '0.6s' }, { k: 'TTI', v: '1.1s' }],
    },
    {
      label: 'Uptime',
      render: () => (
        <div className="grid grid-cols-7 gap-1 w-full">
          {DOT_OPACITIES.map((op, i) => (
            <motion.div key={`dot-${activeIdx}-${i}`} className="aspect-square rounded-sm"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: op, scale: 1 }}
              transition={{ duration: 0.15, delay: i * 0.02 }}
              style={{ backgroundColor: i === 19 ? '#e5e7eb' : '#8b5cf6' }} />
          ))}
        </div>
      ),
      items: [{ k: 'Avg', v: '99.9%' }, { k: 'Incidents', v: '0' }, { k: 'Resp', v: '45ms' }],
    },
  ];

  const view = views[activeIdx];

  return (
    <BentoCard className="h-full" delay={0.2}>
      <div className="p-5 h-full flex flex-col" ref={ref}>
        <div className="rounded-xl bg-[#f8f9fa] border border-gray-100 p-4 mb-5 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[8px] text-gray-400 font-mono uppercase">{view.label}</span>
            <div className="flex gap-1">
              {views.map((_, i) => (
                <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i === activeIdx ? 'bg-[#2563eb] scale-125' : 'bg-gray-300'}`} />
              ))}
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {inView && view.render()}
          </div>
          <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
            {view.items.map(m => (
              <div key={m.k} className="text-center flex-1">
                <div className="text-[9px] font-mono font-semibold text-emerald-500">{m.v}</div>
                <div className="text-[7px] text-gray-400 uppercase">{m.k}</div>
              </div>
            ))}
          </div>
        </div>
        <h3 className="font-display text-[15px] font-semibold text-gray-900 mb-1">{t('landing.webdev.bento.perf.title')}</h3>
        <p className="text-[12px] text-gray-400 leading-relaxed">{t('landing.webdev.bento.perf.desc')}</p>
      </div>
    </BentoCard>
  );
}

function MiniSparkline({ data, color = '#2563eb' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 60},${20 - (v / max) * 16}`).join(' ');
  return (
    <svg viewBox="0 0 60 20" className="w-12 h-4">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

function AnalyticsCard() {
  const { t } = useI18n();
  const { value: visitors, ref } = useAnimatedNumber(12847, 2000, 0);
  const [bars, setBars] = useState([40, 55, 50, 65, 60, 75, 70, 85, 80, 90, 45, 60]);
  const convIdx = useCyclingIndex(3, 3000);
  const convRates = ['3.2%', '4.1%', '3.8%'];
  useEffect(() => {
    const id = setInterval(() => {
      setBars(prev => prev.map(() => 25 + Math.random() * 75));
    }, 2000);
    return () => clearInterval(id);
  }, []);
  return (
    <BentoCard className="h-full" delay={0.25}>
      <div className="p-5 h-full flex flex-col" ref={ref}>
        <div className="rounded-xl bg-[#f8f9fa] border border-gray-100 p-4 mb-5 flex-1">
          <div className="flex gap-6 mb-4">
            <div>
              <div className="text-[8px] text-gray-400 font-mono uppercase mb-1">Visitors</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[18px] font-semibold text-gray-900">{visitors.toLocaleString()}</span>
                <MiniSparkline data={[30, 35, 28, 42, 38, 50, 45, 55]} />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-emerald-500"><path d="M6 2v8M3 5l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[8px] text-emerald-500 font-medium">+24.3%</span>
              </div>
            </div>
            <div>
              <div className="text-[8px] text-gray-400 font-mono uppercase mb-1">Conversion</div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[18px] font-semibold text-gray-900 transition-all duration-500">{convRates[convIdx]}</span>
                <MiniSparkline data={[20, 25, 22, 30, 28, 35, 32, 38]} color="#10b981" />
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-emerald-500"><path d="M6 2v8M3 5l3-3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-[8px] text-emerald-500 font-medium">+0.8%</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-1 h-20">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 rounded-t transition-all duration-1000 ease-out" style={{ height: `${h}%`, backgroundColor: i >= 4 && i <= 8 ? '#2563eb' : '#e2e5ea' }} />
            ))}
          </div>
        </div>
        <h3 className="font-display text-[15px] font-semibold text-gray-900 mb-1">{t('landing.webdev.bento.analytics.title')}</h3>
        <p className="text-[12px] text-gray-400 leading-relaxed">{t('landing.webdev.bento.analytics.desc')}</p>
      </div>
    </BentoCard>
  );
}

function WebDevBentoSection() {
  const { t } = useI18n();
  return (
    <section className="relative py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12">
          <h2 className="font-instrument text-[40px] lg:text-[56px] font-medium text-black leading-[1.1] tracking-[-0.02em]">
            {t('landing.svc.card2.title').split(' ').map((word, i) => (
              <motion.span
                key={i}
                className="inline-block mr-[0.25em]"
                style={i === 0 ? { color: '#2563eb' } : undefined}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              >
                {word}
              </motion.span>
            ))}
          </h2>
          <motion.p
            className="text-[18px] text-gray-500 leading-[1.6] max-w-xl mt-4"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {t('landing.webdev.bento.subtitle')}
          </motion.p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4"><BackendCard /></div>
          <div className="lg:col-span-5"><UIDesignCard /></div>
          <div className="lg:col-span-3"><PerformanceCard /></div>
          <div className="lg:col-span-5"><SEOCard /></div>
          <div className="lg:col-span-7"><AnalyticsCard /></div>
        </div>
      </div>
    </section>
  );
}

function DotGrid() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="dot-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#e8e8eb" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dot-grid)" />
    </svg>
  );
}

function WebDevMobileHeading() {
  const { t } = useI18n();
  return (
    <section className="lg:hidden bg-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-instrument text-[32px] font-medium text-black leading-[1.1] tracking-[-0.02em]">
          {t('landing.webdev.heading.l1')} {t('landing.webdev.heading.l2')} {t('landing.webdev.heading.l3')} <span style={{ color: '#87CEEB' }}>{t('landing.webdev.heading.l4')}</span>
        </h2>
        <p className="mt-4 text-[16px] text-gray-500 leading-[1.6]">
          {t('landing.webdev.frame.desc')}
        </p>
      </div>
    </section>
  );
}

function WebDevDetailSection() {
  const { t } = useI18n();

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12 lg:gap-16 items-start">
          {/* Left — dot grid with workflow cards */}
          <div className="relative h-[1150px] lg:h-[700px] rounded-2xl overflow-hidden order-last lg:order-first" style={{ backgroundColor: '#fafafa', boxShadow: '0 20px 60px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03)' }}>
            <div className="absolute inset-0" style={{ maskImage: 'radial-gradient(ellipse 70% 60% at center, black 40%, transparent 100%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at center, black 40%, transparent 100%)' }}>
              <DotGrid />
            </div>
            <div className="relative z-10 h-full overflow-hidden">
              <WorkflowVisualV2 />
            </div>
          </div>

          {/* Right — chatbot-style text */}
          <div>
            <h2 className="font-instrument text-[32px] lg:text-[56px] font-medium text-black leading-[1.1] tracking-[-0.02em] mb-6">
              {t('landing.workflow.heading').split(' ').map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block mr-[0.25em]"
                  style={i === 0 ? { color: '#87CEEB' } : undefined}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  {word}
                </motion.span>
              ))}
            </h2>
            <motion.p
              className="text-[18px] text-gray-500 leading-[1.6] max-w-md"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {t('landing.workflow.desc')}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}


const faqKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'] as const;

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left cursor-pointer hover:opacity-80 transition-opacity"
      >
        <h3 className="font-display text-base lg:text-lg font-semibold text-[#071D2F] pr-4">{question}</h3>
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
        <p className="pb-5 text-sm text-[#4D4D4D] leading-relaxed">{answer}</p>
      </motion.div>
    </div>
  );
}

function FAQSection() {
  const { t } = useI18n();
  const items = faqKeys.map(k => ({ question: t(`landing.faq.${k}.q`), answer: t(`landing.faq.${k}.a`) }));
  return (
    <section id="faq" className="py-16 lg:py-24 bg-white">
      <FAQSchema questions={items} />
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <h2 className="font-instrument text-[40px] lg:text-[56px] font-medium leading-[1.1] tracking-[-0.02em] mb-8" style={{ color: '#87CEEB' }}>
              {t('landing.faq.title.1')}<br />{t('landing.faq.title.2')}
            </h2>
            <div>
              {items.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HeroExperiment() {
  return (
    <div className="bg-white text-[#071D2F] font-body antialiased">
      <style jsx global>{`
        html .chatbot-transparent,
        html .chatbot-transparent div,
        html .chatbot-transparent button,
        html .chatbot-transparent input {
          background: rgba(255, 255, 255, 0.06) !important;
          background-color: rgba(255, 255, 255, 0.06) !important;
          -webkit-backdrop-filter: blur(23px) !important;
          backdrop-filter: blur(23px) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          box-shadow: none !important;
        }
        html .chatbot-transparent div[class*="rounded-[20px]"] {
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04) inset !important;
        }
        html .chatbot-transparent div[class*="rounded-br-md"] {
          background-color: rgba(255, 255, 255, 0.55) !important;
        }
        html .chatbot-transparent div[class*="rounded-br-md"] p {
          color: #000 !important;
        }
        html .chatbot-transparent span[class*="bg-[#ff5f57]"] {
          background-color: #ff5f57 !important;
        }
        html .chatbot-transparent span[class*="bg-[#febc2e]"] {
          background-color: #febc2e !important;
        }
        html .chatbot-transparent span[class*="bg-[#28c840]"] {
          background-color: #28c840 !important;
        }
      `}</style>
      <Hero />
      <ChatbotSection />
      <WebDevMobileHeading />
      <WebDevDetailSection />
      <FAQSection />
    </div>
  );
}

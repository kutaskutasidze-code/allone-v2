'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';

/* ─────────────────────────────────────────────
   ALLONE V2 — Vercel-Inspired Landing Page
   ───────────────────────────────────────────── */

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative grid grid-cols-1 max-w-[1080px] mx-auto px-4 pt-8 sm:pt-16 pb-24 overflow-hidden border-b border-[#EBEBEB]">
      <div className="flex flex-col items-center text-center gap-8">
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-semibold leading-[1] tracking-[-0.047em] text-[#071D2F]">
          {t('landing.hero.h1a')}<br />
          <span className="text-[#071D2F]">{t('landing.hero.h1b')}</span>
        </h1>
        <p className="max-w-[540px] text-base text-[#4D4D4D] leading-relaxed">
          {t('landing.hero.desc')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/contact" className="flex items-center gap-2 h-12 px-6 text-base font-medium text-white bg-[#071D2F] rounded-full hover:bg-[#0a2a45] transition-all duration-150">
            <Image src="/images/allone-logo-transparent.png" alt="" width={22} height={22} className="brightness-0 invert" />
            {t('landing.hero.cta1')}
          </Link>
          <Link href="/contact" className="flex items-center h-12 px-6 text-base font-medium text-[#071D2F] bg-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#F2F2F2] transition-all duration-150">
            {t('landing.hero.cta2')}
          </Link>
        </div>
      </div>

      <div className="relative mt-10 sm:mt-16 h-[200px] sm:h-[300px] flex items-center justify-center">
        <motion.div className="absolute w-[700px] h-[200px] rounded-[50%]" style={{ backgroundColor: 'rgb(0,90,255)', opacity: 0.8, filter: 'blur(80px)', WebkitFilter: 'blur(80px)', transform: 'translate3d(0,0,0)' }} animate={{ x: [-120, -60, -140, -80, -120], y: [0, -20, 15, -10, 0], scaleX: [1, 1.2, 0.95, 1.1, 1], opacity: [0.8, 0.6, 0.85, 0.65, 0.8] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[600px] h-[180px] rounded-[50%]" style={{ backgroundColor: 'rgb(0,90,200)', opacity: 0.75, filter: 'blur(70px)', WebkitFilter: 'blur(70px)', transform: 'translate3d(0,0,0)' }} animate={{ x: [80, 30, 120, 60, 80], y: [-10, 20, -15, 10, -10], scaleX: [1.1, 0.9, 1.15, 1, 1.1], opacity: [0.75, 0.85, 0.6, 0.8, 0.75] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[650px] h-[170px] rounded-[50%]" style={{ backgroundColor: 'rgb(0,210,210)', opacity: 0.7, filter: 'blur(75px)', WebkitFilter: 'blur(75px)', transform: 'translate3d(0,0,0)' }} animate={{ x: [0, 70, -50, 30, 0], y: [30, 10, 40, 15, 30], scaleX: [1, 1.15, 1.05, 1.2, 1], opacity: [0.7, 0.55, 0.8, 0.6, 0.7] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[550px] h-[160px] rounded-[50%]" style={{ backgroundColor: 'rgb(16,185,129)', opacity: 0.7, filter: 'blur(70px)', WebkitFilter: 'blur(70px)', transform: 'translate3d(0,0,0)' }} animate={{ x: [-30, 50, -60, 20, -30], y: [-25, -40, -15, -35, -25], scaleX: [1.05, 0.95, 1.1, 1, 1.05], opacity: [0.7, 0.8, 0.55, 0.75, 0.7] }} transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="absolute w-[180px] h-[100px] rounded-[50%] z-20" style={{ backgroundColor: 'rgb(0,120,255)', opacity: 0.35, filter: 'blur(50px)', WebkitFilter: 'blur(50px)', transform: 'translate3d(0,0,0)' }} animate={{ x: [160, -160, 150, -140, 160], y: [-100, 100, -90, 80, -100], backgroundColor: ['rgb(0,120,255)', 'rgb(0,90,200)', 'rgb(0,210,210)', 'rgb(0,120,255)'], opacity: [0.35, 0.45, 0.25, 0.4, 0.35] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
        <div className="relative z-10">
          <Image src="/images/allone-logo-rounded.png" alt="allone" width={240} height={240} className="brightness-0 invert drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] w-[160px] h-[160px] sm:w-[240px] sm:h-[240px]" priority />
        </div>
      </div>
    </section>
  );
}

function VideoShowcase() {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoMuted, setVideoMuted] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    let disposed = false;

    // Play when in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (disposed) return;
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(v);

    // Resume when tab comes back
    const handleVisibility = () => {
      if (disposed || !videoRef.current) return;
      if (document.visibilityState === 'visible') {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (v) {
      v.muted = !v.muted;
      setVideoMuted(v.muted);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (v) v.paused ? v.play() : v.pause();
  };

  return (
    <section className="max-w-[1080px] mx-auto px-4 py-12 sm:py-20 border-b border-[#EBEBEB]">
      <div className="mb-10">
        <h3 className="font-display text-[24px] sm:text-[32px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#071D2F]">
          {t('landing.video.title')}
        </h3>
        <p className="mt-2 text-sm text-[#4D4D4D]">{t('landing.video.desc')}</p>
      </div>
      <div className="bg-[#000] relative" onClick={togglePlay}>
        <video ref={videoRef} src="/videos/allone-ad.mp4" muted playsInline preload="auto" className="w-full aspect-video block cursor-pointer" style={{ WebkitTransform: 'translate3d(0,0,0)' }} />
        <button
          onClick={toggleMute}
          className="absolute bottom-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-[#071D2F]/80 flex items-center justify-center text-white hover:bg-[#071D2F] transition-colors cursor-pointer"
        >
          {videoMuted ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          )}
        </button>
      </div>
    </section>
  );
}

function SocialProof() {
  const clients: { name: string; logo?: string; style: string }[] = [
    { name: 'DataRooms', style: 'font-mono font-bold tracking-tight' },
    { name: 'FIFTY', style: 'font-display font-black tracking-[0.15em] text-xs' },
    { name: 'Equivalenza', logo: '/images/clients/equivalenza.png', style: '' },
    { name: 'Chaos Concept', style: 'font-display font-semibold italic tracking-tight' },
    { name: 'HostWise', style: 'font-mono font-bold tracking-tight' },
    { name: 'KaoTenders', style: 'font-display font-extrabold uppercase tracking-wide text-xs' },
    { name: 'INNRBURIAL', logo: '/images/clients/innrburial.png', style: '' },
    { name: 'SparkleClean', style: 'font-display font-semibold tracking-tight' },
  ];

  return (
    <section className="max-w-[1080px] mx-auto px-4 py-12 border-b border-[#EBEBEB] overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}>
      <div className="flex items-center gap-16 animate-[scroll_35s_linear_infinite]">
        {[...clients, ...clients].map((c, i) => (
          <div key={i} className="shrink-0 flex items-center">
            {c.logo ? (
              <Image src={c.logo} alt={c.name} width={100} height={28} className="h-4 w-auto object-contain opacity-60 grayscale" />
            ) : (
              <span className={`text-[#071D2F]/50 text-sm whitespace-nowrap ${c.style}`}>{c.name}</span>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </section>
  );
}

function ServicesGrid() {
  const { t } = useI18n();
  const services = [
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 0.5V0H3.5V0.5C3.5 1.6 4.4 2.5 5.5 2.5H6V3.5H5.5C4.4 3.5 3.5 4.4 3.5 5.5V6H2.5V5.5C2.5 4.4 1.6 3.5 0.5 3.5H0V2.5H0.5C1.6 2.5 2.5 1.6 2.5 0.5Z"/><path d="M8.4 4.9L8.5 4H9.5L9.6 4.9C9.8 7.3 11.7 9.2 14.1 9.4L15 9.5V10.5L14.1 10.6C11.7 10.8 9.8 12.7 9.6 15.1L9.5 16H8.5L8.4 15.1C8.2 12.7 6.3 10.8 3.9 10.6L3 10.5V9.5L3.9 9.4C6.3 9.2 8.2 7.3 8.4 4.9Z"/></svg>, titleKey: 'landing.services.chatbot', descKey: 'landing.services.chatbot.desc', href: '/services#chatbot' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="14" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="3" fill="currentColor"/></svg>, titleKey: 'landing.services.customai', descKey: 'landing.services.customai.desc', href: '/services#custom_ai' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M2 4h12v1H2zM2 7.5h12v1H2zM2 11h8v1H2z"/></svg>, titleKey: 'landing.services.workflow', descKey: 'landing.services.workflow.desc', href: '/services#workflow' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="3" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="1.5" r="1" fill="currentColor"/></svg>, titleKey: 'landing.services.webdev', descKey: 'landing.services.webdev.desc', href: '/services#website' },
    { icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM7.25 5v4l3 1.5.5-1-2.5-1.25V5h-1z"/></svg>, titleKey: 'landing.services.consulting', descKey: 'landing.services.consulting.desc', href: '/services#consulting' },
  ];

  return (
    <section className="max-w-[1080px] mx-auto px-4 py-12 sm:py-20 border-b border-[#EBEBEB]">
      <div className="mb-12">
        <h3 className="font-display text-[24px] sm:text-[32px] font-semibold leading-[1.2] tracking-[-0.04em] text-[#071D2F]">{t('landing.services.title')}</h3>
        <p className="mt-2 text-sm text-[#4D4D4D]">{t('landing.services.desc')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((s) => (
          <Link key={s.titleKey} href={s.href} className="group flex flex-col gap-4 p-5 sm:p-8 bg-white rounded-2xl border border-[#EBEBEB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-center gap-2 text-sm font-medium text-[#071D2F]">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-[#071D2F]/[0.06] text-[#071D2F]">{s.icon}</span>
              {t(s.titleKey)}
            </div>
            <p className="text-sm text-[#4D4D4D] leading-relaxed">{t(s.descKey)}</p>
            <div className="mt-auto flex items-center gap-1 text-sm text-[#071D2F] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {t('landing.services.learn')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 4l4 4-4 4"/></svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TechShowcase() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'chatbot' | 'workflow' | 'api'>('chatbot');
  const codeExamples = {
    chatbot: `import { AlloneBot } from '@allone/sdk'\n\nconst bot = new AlloneBot({\n  model: 'allone-chat-v2',\n  context: 'customer-support',\n  language: 'ka'\n})\n\nconst response = await bot.chat({\n  message: 'How do I track my order?',\n  userId: 'user_123'\n})`,
    workflow: `import { Pipeline } from '@allone/workflows'\n\nconst pipeline = new Pipeline('invoice-processor')\n  .extract('pdf', { ocr: true })\n  .classify('document-type')\n  .validate('schema/invoice-v2')\n  .transform('accounting-format')\n  .load('supabase', { table: 'invoices' })\n\nawait pipeline.run({ input: './invoices/' })`,
    api: `curl -X POST https://api.allone.ge/v1/chat \\\\\n  -H "Authorization: Bearer $ALLONE_KEY" \\\\\n  -H "Content-Type: application/json" \\\\\n  -d '{\n    "model": "allone-chat-v2",\n    "messages": [{\n      "role": "user",\n      "content": "Analyze Q4 sales data"\n    }],\n    "stream": true\n  }'`,
  };

  return (
    <section className="max-w-[1080px] mx-auto px-4 py-12 sm:py-20 border-b border-[#EBEBEB]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-px bg-[#EBEBEB] lg:bg-transparent">
        <div className="lg:col-span-2 bg-white p-8 lg:p-12">
          <div className="flex items-center gap-2 font-mono text-xs font-medium text-[#4D4D4D] mb-4 uppercase tracking-normal">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#071D2F]"><path d="M2.5 0.5V0H3.5V0.5C3.5 1.6 4.4 2.5 5.5 2.5H6V3.5H5.5C4.4 3.5 3.5 4.4 3.5 5.5V6H2.5V5.5C2.5 4.4 1.6 3.5 0.5 3.5H0V2.5H0.5C1.6 2.5 2.5 1.6 2.5 0.5Z"/><path d="M8.4 4.9L8.5 4H9.5L9.6 4.9C9.8 7.3 11.7 9.2 14.1 9.4L15 9.5V10.5L14.1 10.6C11.7 10.8 9.8 12.7 9.6 15.1L9.5 16H8.5L8.4 15.1C8.2 12.7 6.3 10.8 3.9 10.6L3 10.5V9.5L3.9 9.4C6.3 9.2 8.2 7.3 8.4 4.9Z"/></svg>
            {t('landing.tech.label')}
          </div>
          <h2 className="font-display text-[24px] font-semibold leading-[32px] tracking-[-0.04em] text-[#071D2F] mb-2">
            <span className="text-[#071D2F]">{t('landing.tech.h2a')}</span>{' '}
            <span className="text-[#4D4D4D] font-normal">{t('landing.tech.h2b')}</span>
          </h2>
          <div className="mt-8 rounded-lg overflow-hidden border border-[#EBEBEB]">
            <div className="flex items-center bg-[#FAFAFA] border-b border-[#EBEBEB] px-2 h-11">
              {(['chatbot', 'workflow', 'api'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-3 text-xs sm:text-sm font-sans capitalize transition-all ${activeTab === tab ? 'text-[#071D2F] border-b-2 border-[#071D2F] -mb-px' : 'text-[#4D4D4D] hover:text-[#071D2F]'}`}>
                  {tab === 'api' ? 'REST API' : tab === 'chatbot' ? 'AI SDK' : 'Workflow'}
                </button>
              ))}
            </div>
            <div className="bg-white p-4 overflow-x-auto">
              <pre className="font-mono text-[11px] sm:text-[13px] leading-5 text-[#071D2F]"><code>{codeExamples[activeTab]}</code></pre>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#4D4D4D]">{t('landing.tech.powered')}</span>
            {['OpenAI', 'Anthropic', 'Gemini', 'Custom Models'].map((p, i) => (
              <span key={p} className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${i === 0 ? 'bg-[#071D2F] text-white' : 'bg-[#E6E6E6] text-[#071D2F]'}`}>{p}</span>
            ))}
          </div>
        </div>
        <div className="bg-white p-8 lg:p-6 lg:border-l border-[#EBEBEB]">
          <p className="font-mono text-xs font-medium text-[#4D4D4D] mb-4 uppercase tracking-normal">{t('landing.tech.metrics')}</p>
          <div className="flex flex-col gap-3">
            {[{ label: 'Cost reduction', value: '90%', color: 'bg-[#071D2F]' }, { label: 'Faster delivery', value: '10x', color: 'bg-emerald-600' }, { label: 'Uptime SLA', value: '99.9%', color: 'bg-amber-500' }, { label: 'Response time', value: '<200ms', color: 'bg-pink-600' }, { label: 'Active clients', value: '5+', color: 'bg-violet-600' }, { label: 'Markets', value: '2', color: 'bg-teal-600' }].map((stat, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-right w-6 text-[#4D4D4D] text-sm">{i + 1}</span>
                  <div className="flex items-center gap-1.5"><div className={`w-2.5 h-2.5 rounded-full ${stat.color}`} /><span className="text-sm truncate">{stat.label}</span></div>
                </div>
                <span className="font-mono text-sm text-[#4D4D4D]">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Enterprise() {
  const { t } = useI18n();
  const items = [
    { titleKey: 'landing.enterprise.affiliate', descKey: 'landing.enterprise.affiliate.desc' },
    { titleKey: 'landing.enterprise.franchise', descKey: 'landing.enterprise.franchise.desc' },
    { titleKey: 'landing.enterprise.sales', descKey: 'landing.enterprise.sales.desc' },
    { titleKey: 'landing.enterprise.contact', descKey: 'landing.enterprise.contact.desc' },
  ];
  return (
    <section className="max-w-[1080px] mx-auto px-4 py-14 sm:py-24 border-b border-[#EBEBEB]">
      <div className="flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
        <h2 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-[1.2] tracking-[-0.05em] text-[#071D2F]">
          {t('landing.enterprise.h2a')}<br /><span className="text-[#071D2F]">{t('landing.enterprise.h2b')}</span><br />{t('landing.enterprise.h2c')}
        </h2>
        <p className="text-sm text-[#4D4D4D] max-w-md">{t('landing.enterprise.desc')}</p>
      </div>
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <div key={i} className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-[#EBEBEB] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200">
            <span className="font-mono text-lg text-[#071D2F]/20">0{i + 1}</span>
            <h4 className="font-display text-sm font-semibold text-[#071D2F]">{t(item.titleKey)}</h4>
            <p className="text-xs text-[#4D4D4D]">{t(item.descKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GlobalReach() {
  const { t } = useI18n();
  const steps = [
    { step: '01', titleKey: 'landing.how.s1', descKey: 'landing.how.s1.desc' },
    { step: '02', titleKey: 'landing.how.s2', descKey: 'landing.how.s2.desc' },
    { step: '03', titleKey: 'landing.how.s3', descKey: 'landing.how.s3.desc' },
    { step: '04', titleKey: 'landing.how.s4', descKey: 'landing.how.s4.desc' },
  ];
  return (
    <section className="max-w-[1080px] mx-auto px-4 py-12 sm:py-20 border-b border-[#EBEBEB]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="font-mono text-xs font-medium text-[#4D4D4D] mb-4 uppercase tracking-normal">{t('landing.how.label')}</h2>
          <p className="font-display text-[24px] font-semibold leading-[32px] tracking-[-0.04em] text-[#071D2F]">
            <span className="font-semibold text-[#071D2F]">{t('landing.how.h2a')}</span>{' '}
            <span className="text-[#4D4D4D] font-normal">{t('landing.how.h2b')}</span>
          </p>
          <div className="mt-10 flex flex-col gap-6">
            {steps.map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <span className="font-mono text-xs text-[#4D4D4D] mt-1 shrink-0">{item.step}</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#071D2F]">{t(item.titleKey)}</h4>
                  <p className="text-sm text-[#4D4D4D] mt-1">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal">{t('landing.how.stack')}</p>
          <div className="grid grid-cols-2 gap-2">
            {['Next.js', 'React', 'TypeScript', 'Python', 'Supabase', 'OpenAI', 'Vercel', 'n8n', 'Tailwind', 'Framer', 'Stripe', 'PostgreSQL'].map((tech) => (
              <div key={tech} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#EBEBEB] text-xs text-[#4D4D4D]">
                <div className="w-2 h-2 rounded-full bg-[#EBEBEB]" />{tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { t } = useI18n();
  const checks = ['landing.cta.c1', 'landing.cta.c2', 'landing.cta.c3', 'landing.cta.c4'];
  return (
    <section className="max-w-[1080px] mx-auto px-4 py-14 sm:py-24 border-b border-[#EBEBEB]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-tight tracking-[-0.05em] text-[#071D2F] whitespace-pre-line">{t('landing.cta.h2')}</h2>
          <ul className="mt-8 flex flex-col gap-3">
            {checks.map((key) => (
              <li key={key} className="flex items-center gap-3 text-sm text-[#4D4D4D]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#071D2F] shrink-0"><path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-2">
          {[{ name: 'AI Chatbot', time: '~2 weeks' }, { name: 'Workflow Automation', time: '~1 week' }, { name: 'Custom AI Model', time: '~4 weeks' }, { name: 'Full Website', time: '~3 weeks' }, { name: 'AI Consulting', time: '~3 days' }].map((item) => (
            <Link key={item.name} href="/contact" className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#FAFAFA] border border-[#EBEBEB] hover:bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 transition-all duration-200 group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white border border-[#EBEBEB] flex items-center justify-center"><div className="w-3 h-3 rounded-sm bg-[#071D2F]" /></div>
                <span className="text-sm font-medium text-[#071D2F]">{item.name}</span>
              </div>
              <span className="text-xs text-[#4D4D4D] font-mono">{item.time}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  const { t } = useI18n();
  return (
    <section className="max-w-[1080px] mx-auto px-4 py-14 sm:py-24 flex flex-col items-center text-center gap-8">
      <h2 className="font-display text-[clamp(32px,5vw,48px)] font-semibold leading-tight tracking-[-0.06em] text-[#071D2F]">{t('landing.final.h2')}</h2>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/contact" className="flex items-center gap-2 h-12 px-8 text-base font-medium text-white bg-[#071D2F] rounded-full hover:bg-[#0a2a45] transition-all duration-150">
          {t('landing.final.h2')}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
        </Link>
        <Link href="/contact" className="flex items-center h-12 px-8 text-base font-medium text-[#071D2F] bg-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#F2F2F2] transition-all duration-150">
          {t('landing.final.cta2')}
        </Link>
      </div>
      <div className="mt-8 flex items-center gap-8 opacity-40">
        {['DataRooms', 'FIFTY', 'Equivalenza', 'KaoTenders', 'HostWise'].map((name) => (
          <span key={name} className="text-sm font-mono text-[#4D4D4D]">{name}</span>
        ))}
      </div>
    </section>
  );
}

function LandingFooter() {
  const { t } = useI18n();
  const columns = [
    { title: t('footer.services'), links: [t('footer.link.chatbots'), t('footer.link.customai'), t('footer.link.automation'), t('footer.link.webdev'), t('footer.link.consulting')] },
    { title: t('footer.company'), links: [t('footer.link.work'), t('footer.link.contact')] },
  ];
  return (
    <footer className="max-w-[1280px] mx-auto px-6 py-10 border-t border-[#EBEBEB]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="font-mono text-xs font-medium text-[#071D2F] mb-4 tracking-normal">{col.title}</h5>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link}><Link href="#" className="text-sm text-[#666666] hover:text-[#071D2F] transition-colors duration-100">{link}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-12 pt-6 border-t border-[#EBEBEB] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="6" fill="#071D2F"/><path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/></svg>
          <span>&copy; 2026 allone.ge</span>
        </div>
        <div className="flex items-center gap-4">
          {['GitHub', 'LinkedIn', 'X'].map((s) => (<Link key={s} href="#" className="text-xs text-[#666666] hover:text-[#071D2F] transition-colors duration-100">{s}</Link>))}
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="bg-white text-[#071D2F] font-body antialiased">
      <Hero />
      <VideoShowcase />
      <SocialProof />
      <ServicesGrid />
      <TechShowcase />
      <Enterprise />
      <GlobalReach />
      <CTASection />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}

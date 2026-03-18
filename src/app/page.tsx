'use client';

import { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

/* ─────────────────────────────────────────────
   ALLONE V2 — Vercel-Inspired Landing Page
   Design DNA: Vercel.com (Awwwards SOTD)
   Adapted for allone.ge tech/AI positioning
   ───────────────────────────────────────────── */

// ═══════════════════════════════════════════════
// BOTTOM DOCK NAVBAR
// ═══════════════════════════════════════════════
function Header() {
  const [hovered, setHovered] = useState<string | null>(null);

  const navItems = [
    { name: 'Home', href: '/v2' },
    { name: 'Services', href: '/v2/services' },
    { name: 'Work', href: '/v2/work' },
    { name: 'Lab', href: '/v2/lab' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5 pointer-events-none">
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.3 }}
        className="pointer-events-auto flex items-center justify-between px-5 py-1.5 rounded-full bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] w-[780px] max-w-[calc(100vw-32px)]"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 pl-2 pr-3"
        >
          <Image
            src="/images/allone-logo-green.png"
            alt="allone"
            width={26}
            height={26}
            className="object-contain"
          />
          <span className="font-display font-semibold text-[15px] tracking-tight"><span className="text-[#071D2F]">All</span><span className="text-[#008000]">One</span></span>
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-[#071D2F]/10 mx-1" />

        {/* Nav items */}
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onMouseEnter={() => setHovered(item.name)}
            onMouseLeave={() => setHovered(null)}
            className="relative px-4 py-2 text-[13px] font-medium text-[#071D2F]/60 hover:text-[#071D2F] rounded-full transition-colors duration-150"
          >
            {hovered === item.name && (
              <motion.div
                layoutId="dock-hover"
                className="absolute inset-0 bg-[#071D2F]/[0.04] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{item.name}</span>
          </Link>
        ))}

        {/* Divider */}
        <div className="w-px h-5 bg-[#071D2F]/10 mx-1" />

        {/* Ask AI */}
        <button
          className="flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold text-[#071D2F]/70 hover:text-[#008000] rounded-full transition-colors duration-150 cursor-pointer"
        >
          Ask AI
        </button>
      </motion.div>
    </nav>
  );
}

// ═══════════════════════════════════════════════
// HERO — Gradient prism visual + dual CTAs
// ═══════════════════════════════════════════════
function Hero() {
  return (
    <section className="relative grid grid-cols-1 max-w-[1080px] mx-auto px-4 pt-16 pb-24 overflow-hidden border-b border-[#EBEBEB]">
      {/* Content */}
      <div className="flex flex-col items-center text-center gap-8">
        <h1 className="font-display text-[clamp(32px,5vw,48px)] font-semibold leading-[1] tracking-[-0.047em] text-[#071D2F]">
          All systems.<br />
          <span className="text-[#008000]">One intelligence.</span>
        </h1>
        <p className="max-w-[540px] text-base text-[#4D4D4D] leading-relaxed">
          Replace expensive manual processes with autonomous AI agents.
          Customer support, data processing, content, code — agents handle it
          at a fraction of the cost.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/contact"
            className="flex items-center gap-2 h-12 px-6 text-base font-medium text-white bg-[#071D2F] rounded-full hover:bg-[#0a2a45] transition-all duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1l7 13H1z"/>
            </svg>
            Start Building
          </Link>
          <Link
            href="/contact"
            className="flex items-center h-12 px-6 text-base font-medium text-[#071D2F] bg-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#F2F2F2] transition-all duration-150"
          >
            Book a Demo
          </Link>
        </div>
      </div>

      {/* Logo visual with morphing multi-hue gradient cloud */}
      <div className="relative mt-16 h-[300px] flex items-center justify-center">
        {/* Deep blue blob — wide, left */}
        <motion.div
          className="absolute w-[700px] h-[200px] rounded-[50%] blur-[80px]"
          style={{ backgroundColor: 'rgb(0,90,255)', opacity: 0.8 }}
          animate={{
            x: [-120, -60, -140, -80, -120],
            y: [0, -20, 15, -10, 0],
            scaleX: [1, 1.2, 0.95, 1.1, 1],
            opacity: [0.8, 0.6, 0.85, 0.65, 0.8],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Spotify green blob — center-right */}
        <motion.div
          className="absolute w-[600px] h-[180px] rounded-[50%] blur-[70px]"
          style={{ backgroundColor: 'rgb(0,128,0)', opacity: 0.75 }}
          animate={{
            x: [80, 30, 120, 60, 80],
            y: [-10, 20, -15, 10, -10],
            scaleX: [1.1, 0.9, 1.15, 1, 1.1],
            opacity: [0.75, 0.85, 0.6, 0.8, 0.75],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Cyan/teal blob — wide, bottom */}
        <motion.div
          className="absolute w-[650px] h-[170px] rounded-[50%] blur-[75px]"
          style={{ backgroundColor: 'rgb(0,210,210)', opacity: 0.7 }}
          animate={{
            x: [0, 70, -50, 30, 0],
            y: [30, 10, 40, 15, 30],
            scaleX: [1, 1.15, 1.05, 1.2, 1],
            opacity: [0.7, 0.55, 0.8, 0.6, 0.7],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Emerald blob — upper area */}
        <motion.div
          className="absolute w-[550px] h-[160px] rounded-[50%] blur-[70px]"
          style={{ backgroundColor: 'rgb(16,185,129)', opacity: 0.7 }}
          animate={{
            x: [-30, 50, -60, 20, -30],
            y: [-25, -40, -15, -35, -25],
            scaleX: [1.05, 0.95, 1.1, 1, 1.05],
            opacity: [0.7, 0.8, 0.55, 0.75, 0.7],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Small blob — only grazes corners of the logo */}
        <motion.div
          className="absolute w-[180px] h-[100px] rounded-[50%] z-20 blur-[50px]"
          style={{ backgroundColor: 'rgb(0,120,255)', opacity: 0.35 }}
          animate={{
            x: [160, -160, 150, -140, 160],
            y: [-100, 100, -90, 80, -100],
            backgroundColor: ['rgb(0,120,255)', 'rgb(0,128,0)', 'rgb(0,210,210)', 'rgb(0,120,255)'],
            opacity: [0.35, 0.45, 0.25, 0.4, 0.35],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Allone logo mark — white */}
        <div className="relative z-10">
          <Image
            src="/images/allone-logo-rounded.png"
            alt="allone"
            width={240}
            height={240}
            className="brightness-0 invert drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            priority
          />
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════
// SOCIAL PROOF — Scrolling testimonials ticker
// ═══════════════════════════════════════════════
function SocialProof() {
  const testimonials = [
    { company: 'TBC Bank', metric: 'reduced processing time by 70%', logo: 'TBC' },
    { company: 'SPAR Georgia', metric: 'automated 85% of customer support', logo: 'SPAR' },
    { company: 'Wissol Group', metric: 'saw 3x faster deployment cycles', logo: 'WIS' },
    { company: 'StartupGeorgia', metric: '90% cost reduction on AI delivery', logo: 'SG' },
    { company: 'Global Tech', metric: 'scaled to 50K users in 2 weeks', logo: 'GT' },
  ];

  return (
    <section className="max-w-[1080px] mx-auto px-4 py-12 border-b border-[#EBEBEB] overflow-hidden">
      <div className="flex gap-12 animate-[scroll_30s_linear_infinite]">
        {[...testimonials, ...testimonials].map((t, i) => (
          <div key={i} className="flex items-center gap-4 shrink-0">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#F4F7FB] text-xs font-mono font-medium text-[#4D4D4D]">
              {t.logo}
            </span>
            <p className="text-sm text-[#4D4D4D] whitespace-nowrap">
              <span className="font-medium text-[#071D2F]">{t.company}</span>{' '}
              {t.metric}
            </p>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

// ═══════════════════════════════════════════════
// SERVICES GRID — "Your solution, delivered."
// ═══════════════════════════════════════════════
function ServicesGrid() {
  const services = [
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.5 0.5V0H3.5V0.5C3.5 1.6 4.4 2.5 5.5 2.5H6V3.5H5.5C4.4 3.5 3.5 4.4 3.5 5.5V6H2.5V5.5C2.5 4.4 1.6 3.5 0.5 3.5H0V2.5H0.5C1.6 2.5 2.5 1.6 2.5 0.5Z"/>
          <path d="M8.4 4.9L8.5 4H9.5L9.6 4.9C9.8 7.3 11.7 9.2 14.1 9.4L15 9.5V10.5L14.1 10.6C11.7 10.8 9.8 12.7 9.6 15.1L9.5 16H8.5L8.4 15.1C8.2 12.7 6.3 10.8 3.9 10.6L3 10.5V9.5L3.9 9.4C6.3 9.2 8.2 7.3 8.4 4.9Z"/>
        </svg>
      ),
      title: 'AI Chatbots',
      description: 'Intelligent customer support that handles 85% of inquiries automatically.',
      href: '/services#chatbot',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="1" width="14" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8" cy="8" r="3" fill="currentColor"/>
        </svg>
      ),
      title: 'Custom AI',
      description: 'Bespoke AI models tailored to your industry and data.',
      href: '/services#custom_ai',
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 4h12v1H2zM2 7.5h12v1H2zM2 11h8v1H2z"/>
        </svg>
      ),
      title: 'Workflow Automation',
      description: 'Eliminate manual processes. Connect your tools with AI-powered pipelines.',
      href: '/services#workflow',
      color: 'bg-amber-100 text-amber-700',
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <rect x="1" y="3" width="14" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8" cy="1.5" r="1" fill="currentColor"/>
        </svg>
      ),
      title: 'Web Development',
      description: 'High-performance websites and apps that convert.',
      href: '/services#website',
      color: 'bg-pink-100 text-pink-700',
    },
    {
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 1.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zM7.25 5v4l3 1.5.5-1-2.5-1.25V5h-1z"/>
        </svg>
      ),
      title: 'AI Consulting',
      description: 'Strategic guidance on AI adoption. From audit to implementation.',
      href: '/services#consulting',
      color: 'bg-violet-100 text-violet-700',
    },
  ];

  return (
    <section className="max-w-[1080px] mx-auto px-4 py-20 border-b border-[#EBEBEB]">
      {/* Section header */}
      <div className="mb-12">
        <h3 className="font-display text-[32px] font-semibold leading-[40px] tracking-[-0.04em] text-[#071D2F]">
          Agents for every workflow.
        </h3>
        <p className="mt-2 text-sm text-[#4D4D4D]">
          Deploy AI agents that replace entire teams. Same output, 90% less cost.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#EBEBEB]">
        {services.map((service) => (
          <Link
            key={service.title}
            href={service.href}
            className="group flex flex-col gap-4 p-8 bg-white hover:bg-[#FAFAFA] transition-colors duration-150"
          >
            {/* Icon */}
            <div className={`flex items-center gap-2 text-sm font-medium ${service.color.split(' ')[1]}`}>
              <span className={`flex items-center justify-center w-6 h-6 rounded ${service.color}`}>
                {service.icon}
              </span>
              {service.title}
            </div>

            {/* Description */}
            <p className="text-sm text-[#4D4D4D] leading-relaxed">
              {service.description}
            </p>

            {/* Arrow */}
            <div className="mt-auto flex items-center gap-1 text-sm text-[#071D2F] opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Learn more
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 4l4 4-4 4"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════
// TECH SHOWCASE — Code editor (like Vercel AI Gateway)
// ═══════════════════════════════════════════════
function TechShowcase() {
  const [activeTab, setActiveTab] = useState<'chatbot' | 'workflow' | 'api'>('chatbot');

  const codeExamples = {
    chatbot: `import { AlloneBot } from '@allone/sdk'

const bot = new AlloneBot({
  model: 'allone-chat-v2',
  context: 'customer-support',
  language: 'ka' // Georgian
})

const response = await bot.chat({
  message: 'How do I track my order?',
  userId: 'user_123'
})`,
    workflow: `import { Pipeline } from '@allone/workflows'

const pipeline = new Pipeline('invoice-processor')
  .extract('pdf', { ocr: true })
  .classify('document-type')
  .validate('schema/invoice-v2')
  .transform('accounting-format')
  .load('supabase', { table: 'invoices' })

await pipeline.run({ input: './invoices/' })`,
    api: `curl -X POST https://api.allone.ge/v1/chat \\
  -H "Authorization: Bearer $ALLONE_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "allone-chat-v2",
    "messages": [{
      "role": "user",
      "content": "Analyze Q4 sales data"
    }],
    "stream": true
  }'`,
  };

  return (
    <section className="max-w-[1080px] mx-auto px-4 py-20 border-b border-[#EBEBEB]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-px bg-[#EBEBEB] lg:bg-transparent">
        {/* Left: heading + code */}
        <div className="lg:col-span-2 bg-white p-8 lg:p-12">
          {/* Label */}
          <div className="flex items-center gap-2 font-mono text-xs font-medium text-[#4D4D4D] mb-4 uppercase tracking-normal">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-[#008000]">
              <path d="M2.5 0.5V0H3.5V0.5C3.5 1.6 4.4 2.5 5.5 2.5H6V3.5H5.5C4.4 3.5 3.5 4.4 3.5 5.5V6H2.5V5.5C2.5 4.4 1.6 3.5 0.5 3.5H0V2.5H0.5C1.6 2.5 2.5 1.6 2.5 0.5Z"/>
              <path d="M8.4 4.9L8.5 4H9.5L9.6 4.9C9.8 7.3 11.7 9.2 14.1 9.4L15 9.5V10.5L14.1 10.6C11.7 10.8 9.8 12.7 9.6 15.1L9.5 16H8.5L8.4 15.1C8.2 12.7 6.3 10.8 3.9 10.6L3 10.5V9.5L3.9 9.4C6.3 9.2 8.2 7.3 8.4 4.9Z"/>
            </svg>
            AI Platform
          </div>
          <h2 className="font-display text-[24px] font-semibold leading-[32px] tracking-[-0.04em] text-[#071D2F] mb-2">
            <span className="text-[#071D2F]">One platform. Every agent.</span>{' '}
            <span className="text-[#4D4D4D] font-normal">Deploy autonomous agents that handle customer support, process documents, write code, and manage workflows — replacing manual labor entirely.</span>
          </h2>

          {/* Code editor */}
          <div className="mt-8 rounded-lg overflow-hidden border border-[#EBEBEB]">
            {/* Tabs */}
            <div className="flex items-center bg-[#FAFAFA] border-b border-[#EBEBEB] px-2 h-11">
              {(['chatbot', 'workflow', 'api'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-3 text-xs sm:text-sm font-sans capitalize transition-all ${
                    activeTab === tab
                      ? 'text-[#071D2F] border-b-2 border-[#071D2F] -mb-px'
                      : 'text-[#4D4D4D] hover:text-[#071D2F]'
                  }`}
                >
                  {tab === 'api' ? 'REST API' : tab === 'chatbot' ? 'AI SDK' : 'Workflow'}
                </button>
              ))}
            </div>
            {/* Code */}
            <div className="bg-white p-4 overflow-x-auto">
              <pre className="font-mono text-[13px] leading-5 text-[#071D2F]">
                <code>{codeExamples[activeTab]}</code>
              </pre>
            </div>
          </div>

          {/* Provider buttons */}
          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[#4D4D4D]">Powered by</span>
            {['OpenAI', 'Anthropic', 'Gemini', 'Custom Models'].map((provider, i) => (
              <span
                key={provider}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium ${
                  i === 0
                    ? 'bg-[#008000] text-white'
                    : 'bg-[#E6E6E6] text-[#071D2F]'
                }`}
              >
                {provider}
              </span>
            ))}
          </div>
        </div>

        {/* Right: stats */}
        <div className="bg-white p-8 lg:p-6 lg:border-l border-[#EBEBEB]">
          <p className="font-mono text-xs font-medium text-[#4D4D4D] mb-4 uppercase tracking-normal">Platform metrics</p>
          <div className="flex flex-col gap-3">
            {[
              { label: 'Cost reduction', value: '90%', color: 'bg-[#008000]' },
              { label: 'Faster delivery', value: '10x', color: 'bg-emerald-600' },
              { label: 'Uptime SLA', value: '99.9%', color: 'bg-amber-500' },
              { label: 'Response time', value: '<200ms', color: 'bg-pink-600' },
              { label: 'Active clients', value: '5+', color: 'bg-violet-600' },
              { label: 'Markets', value: '2', color: 'bg-teal-600' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-right w-6 text-[#4D4D4D] text-sm">{i + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${stat.color}`} />
                    <span className="text-sm truncate">{stat.label}</span>
                  </div>
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

// ═══════════════════════════════════════════════
// ENTERPRISE / SCALE SECTION
// ═══════════════════════════════════════════════
function Enterprise() {
  return (
    <section className="max-w-[1080px] mx-auto px-4 py-24 border-b border-[#EBEBEB]">
      <div className="flex flex-col items-center text-center gap-6 max-w-2xl mx-auto">
        <h2 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-[1.2] tracking-[-0.05em] text-[#071D2F]">
          Replace teams,<br />
          <span className="text-[#008000]">not people</span><br />
          — scale infinitely
        </h2>
        <p className="text-sm text-[#4D4D4D] max-w-md">
          AI agents handle the repetitive work so your people focus on what matters.
          Offices in Tbilisi and Belgium, expanding globally.
        </p>
      </div>

      {/* Feature pills */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Tbilisi HQ', desc: 'Core operations & engineering' },
          { title: 'Belgium Office', desc: 'European market expansion' },
          { title: '30 Sales Agents', desc: 'Commission-based, zero overhead' },
          { title: '$0 Office Cost', desc: 'Deal-based global expansion' },
        ].map((item, i) => (
          <div key={item.title} className="flex flex-col gap-3 p-6 rounded-lg bg-[#FAFAFA] border border-[#EBEBEB]">
            <span className="font-mono text-xs text-[#4D4D4D]">0{i + 1}</span>
            <h4 className="font-display text-sm font-semibold text-[#071D2F]">{item.title}</h4>
            <p className="text-xs text-[#4D4D4D]">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════
// DEPLOY / GLOBAL REACH
// ═══════════════════════════════════════════════
function GlobalReach() {
  return (
    <section className="max-w-[1080px] mx-auto px-4 py-20 border-b border-[#EBEBEB]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="font-mono text-xs font-medium text-[#4D4D4D] mb-4 uppercase tracking-normal">
            How It Works
          </h2>
          <p className="font-display text-[24px] font-semibold leading-[32px] tracking-[-0.04em] text-[#071D2F]">
            <span className="font-semibold text-[#071D2F]">From manual process to autonomous agent.</span>{' '}
            <span className="text-[#4D4D4D] font-normal">
              We analyze your workflows, identify what agents can replace,
              and deploy them. You stop paying for repetitive labor.
            </span>
          </p>

          {/* Steps */}
          <div className="mt-10 flex flex-col gap-6">
            {[
              { step: '01', title: 'Discovery', desc: 'We analyze your business processes and identify AI opportunities.' },
              { step: '02', title: 'Build', desc: 'Our AI stack delivers solutions at 90% lower cost than traditional agencies.' },
              { step: '03', title: 'Deploy', desc: 'Launch in days, not months. Continuous monitoring and optimization.' },
              { step: '04', title: 'Scale', desc: 'From prototype to production — infrastructure that grows with you.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <span className="font-mono text-xs text-[#4D4D4D] mt-1 shrink-0">{item.step}</span>
                <div>
                  <h4 className="text-sm font-semibold text-[#071D2F]">{item.title}</h4>
                  <p className="text-sm text-[#4D4D4D] mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — tech stack */}
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs font-medium text-[#4D4D4D] uppercase tracking-normal">Tech stack</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              'Next.js', 'React', 'TypeScript', 'Python',
              'Supabase', 'OpenAI', 'Vercel', 'n8n',
              'Tailwind', 'Framer', 'Stripe', 'PostgreSQL',
            ].map((tech) => (
              <div key={tech} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#FAFAFA] border border-[#EBEBEB] text-xs text-[#4D4D4D]">
                <div className="w-2 h-2 rounded-full bg-[#EBEBEB]" />
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════
// CTA — "Start building with AI"
// ═══════════════════════════════════════════════
function CTASection() {
  return (
    <section className="max-w-[1080px] mx-auto px-4 py-24 border-b border-[#EBEBEB]">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="font-display text-[clamp(28px,4vw,40px)] font-semibold leading-[48px] tracking-[-0.05em] text-[#071D2F]">
            Stop paying for<br />work agents can do.
          </h2>
          <ul className="mt-8 flex flex-col gap-3">
            {[
              'Free consultation and AI audit',
              'Custom solution scoped in 48 hours',
              'Delivery in weeks, not months',
              'Pay only for results',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#4D4D4D]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#008000] shrink-0">
                  <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Framework/service cards */}
        <div className="flex flex-col gap-2">
          {[
            { name: 'AI Chatbot', time: '~2 weeks' },
            { name: 'Workflow Automation', time: '~1 week' },
            { name: 'Custom AI Model', time: '~4 weeks' },
            { name: 'Full Website', time: '~3 weeks' },
            { name: 'AI Consulting', time: '~3 days' },
          ].map((item) => (
            <Link
              key={item.name}
              href="/contact"
              className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#FAFAFA] border border-[#EBEBEB] hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white border border-[#EBEBEB] flex items-center justify-center">
                  <div className="w-3 h-3 rounded-sm bg-[#071D2F]" />
                </div>
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

// ═══════════════════════════════════════════════
// FINAL CTA — Large text
// ═══════════════════════════════════════════════
function FinalCTA() {
  return (
    <section className="max-w-[1080px] mx-auto px-4 py-24 flex flex-col items-center text-center gap-8">
      <h2 className="font-display text-[clamp(32px,5vw,48px)] font-semibold leading-[56px] tracking-[-0.06em] text-[#071D2F]">
        Start Building
      </h2>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/contact"
          className="flex items-center gap-2 h-12 px-8 text-base font-medium text-white bg-[#071D2F] rounded-full hover:bg-[#0a2a45] transition-all duration-150"
        >
          Start Building
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 8h10M9 4l4 4-4 4"/>
          </svg>
        </Link>
        <Link
          href="/contact"
          className="flex items-center h-12 px-8 text-base font-medium text-[#071D2F] bg-white rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:bg-[#F2F2F2] transition-all duration-150"
        >
          Talk to an Expert
        </Link>
      </div>

      {/* Client logos */}
      <div className="mt-8 flex items-center gap-8 opacity-40">
        {['TBC', 'SPAR', 'Wissol', 'Axcel', 'GSS'].map((name) => (
          <span key={name} className="text-sm font-mono text-[#4D4D4D]">{name}</span>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════
// FOOTER
// ═══════════════════════════════════════════════
function Footer() {
  const columns = [
    {
      title: 'Services',
      links: ['AI Chatbots', 'Custom AI', 'Workflow Automation', 'Web Development', 'AI Consulting'],
    },
    {
      title: 'Company',
      links: ['About', 'Work', 'Clients', 'Careers', 'Contact'],
    },
    {
      title: 'Resources',
      links: ['Blog', 'Case Studies', 'Documentation', 'AI Audit'],
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'Cookies'],
    },
  ];

  return (
    <footer className="max-w-[1280px] mx-auto px-6 py-10 border-t border-[#EBEBEB]">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {columns.map((col) => (
          <div key={col.title}>
            <h5 className="font-mono text-xs font-medium text-[#071D2F] mb-4 tracking-normal">
              {col.title}
            </h5>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => (
                <li key={link}>
                  <Link
                    href="#"
                    className="text-sm text-[#666666] hover:text-[#071D2F] transition-colors duration-100"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="mt-12 pt-6 border-t border-[#EBEBEB] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-[#666666]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="6" fill="#071D2F"/>
            <path d="M7 12h10M12 7v10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <span>&copy; 2026 allone.ge</span>
        </div>
        <div className="flex items-center gap-4">
          {['GitHub', 'LinkedIn', 'X'].map((social) => (
            <Link key={social} href="#" className="text-xs text-[#666666] hover:text-[#071D2F] transition-colors duration-100">
              {social}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════
// PAGE ASSEMBLY
// ═══════════════════════════════════════════════
export default function V2Page() {
  return (
    <div className="min-h-screen bg-white text-[#071D2F] font-body antialiased">
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <ServicesGrid />
        <TechShowcase />
        <Enterprise />
        <GlobalReach />
        <CTASection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

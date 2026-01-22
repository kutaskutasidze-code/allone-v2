'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';

const slides = [
  {
    id: 1,
    type: 'title',
    title: 'Allone',
    subtitle: 'We build AI tools that run businesses automatically',
    tagline: 'Tbilisi, Georgia',
  },
  {
    id: 2,
    type: 'problem',
    title: 'The Problem',
    statement: 'Small businesses can\'t afford AI',
    points: [
      { text: 'Hiring an AI developer costs $150,000+/year', icon: '💰' },
      { text: 'Custom AI solutions take 6-12 months to build', icon: '⏳' },
      { text: 'Most businesses are stuck with manual repetitive work', icon: '🔄' },
    ],
    bottom: '90% of small businesses want AI but can\'t access it',
  },
  {
    id: 3,
    type: 'solution',
    title: 'Our Solution',
    statement: 'Ready-made AI tools at $300/month',
    products: [
      { name: 'Voice Agents', desc: 'AI answers your phone 24/7, books appointments, takes orders' },
      { name: 'Smart Chatbots', desc: 'AI learns your business documents & answers customer questions' },
      { name: 'Automations', desc: 'AI handles repetitive tasks: emails, data entry, follow-ups' },
    ],
    analogy: 'Think of it as hiring a digital employee that never sleeps — for $10/day',
  },
  {
    id: 4,
    type: 'market',
    title: 'The Market',
    statement: 'AI automation is a $200B+ industry by 2030',
    layers: [
      { label: 'Total Market', value: '$200B+', desc: 'Global AI automation' },
      { label: 'Our Segment', value: '$15B', desc: 'SMB AI tools' },
      { label: 'Year 3 Target', value: '$2M', desc: 'Realistic annual revenue' },
    ],
    context: 'Similar companies have grown 10-50x in 2-3 years',
  },
  {
    id: 5,
    type: 'revenue',
    title: 'How We Make Money',
    statement: 'Simple recurring revenue model',
    model: [
      { metric: 'Monthly price', value: '$300', note: 'per customer' },
      { metric: 'Our cost to serve', value: '$90', note: 'per customer' },
      { metric: 'Profit per customer', value: '$210', note: '70% margin' },
      { metric: 'Customer stays', value: '15 months', note: 'average' },
      { metric: 'Lifetime value', value: '$3,150', note: 'per customer' },
    ],
    insight: 'Every customer we sign generates $3,150 in profit over their lifetime',
  },
  {
    id: 6,
    type: 'advantage',
    title: 'Why Georgia?',
    statement: 'Our costs are 3-5x lower than competitors',
    comparisons: [
      { item: 'Developer salary', georgia: '$2,500/mo', usa: '$12,000/mo', savings: '5x cheaper' },
      { item: 'Electricity (data center)', georgia: '$0.10/kWh', usa: '$0.17/kWh', savings: '40% cheaper' },
      { item: 'Office & operations', georgia: '$1,500/mo', usa: '$8,000/mo', savings: '5x cheaper' },
    ],
    tax: 'Plus: 0% income tax for first 3 years (government program)',
  },
  {
    id: 7,
    type: 'plan',
    title: 'The Plan',
    statement: 'Three clear phases to profitability',
    phases: [
      {
        phase: 'Phase 1',
        investment: '$40K',
        equity: '10%',
        timeline: '0-6 months',
        milestone: 'Build product + First paying customers',
        deliverables: ['Working product', 'First 10-20 paying customers', '$3,000-6,000 monthly revenue'],
      },
      {
        phase: 'Phase 2',
        investment: '$200K',
        equity: '15%',
        timeline: '6-18 months',
        milestone: 'Data center + Scale sales team',
        deliverables: ['Own GPU servers (cuts costs 60%)', '50-100 customers', '$15,000-30,000 monthly revenue'],
      },
      {
        phase: 'Phase 3',
        investment: '$1M',
        equity: '15%',
        timeline: '18-36 months',
        milestone: 'Proven business model + Rapid growth',
        deliverables: ['200+ customers', '$60,000+ monthly revenue', 'Profitable operations'],
      },
    ],
  },
  {
    id: 8,
    type: 'returns',
    title: 'Your Return',
    statement: 'Total investment: $1.24M for 40% ownership',
    scenarios: [
      { scenario: 'Conservative', revenue: '$720K/year', valuation: '$5M', yourShare: '$2M', multiple: '1.6x' },
      { scenario: 'Base Case', revenue: '$2M/year', valuation: '$15M', yourShare: '$6M', multiple: '4.8x' },
      { scenario: 'Upside', revenue: '$5M/year', valuation: '$40M', yourShare: '$16M', multiple: '12.9x' },
    ],
    timeline: 'Comparable companies reach these valuations in 3-5 years',
    exit: 'Exit options: acquisition by larger company, or ongoing dividends from profits',
  },
  {
    id: 9,
    type: 'team',
    title: 'Why Us',
    strengths: [
      'Technical founders with AI/ML expertise',
      'Based in Tbilisi — lowest operating costs in Europe',
      'Product already built and functional',
      'Access to Georgian tech talent pool',
    ],
  },
  {
    id: 10,
    type: 'ask',
    title: 'The Ask',
    investment: '$1.24M total',
    equity: '40% ownership',
    structure: 'Deployed in 3 phases tied to clear milestones',
    rounds: [
      { amount: '$40K', equity: '10%', trigger: 'Now — to build & launch' },
      { amount: '$200K', equity: '15%', trigger: 'After first revenue' },
      { amount: '$1M', equity: '15%', trigger: 'After proven model' },
    ],
    closing: 'You only invest more when we prove each milestone.',
  },
];

export default function PitchPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const slide = slides[currentSlide];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 800 : -800,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 800 : -800,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const stagger = (i: number, base = 0.15) => ({ delay: 0.2 + i * base });

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1d1d1f] overflow-hidden select-none">
      {/* Slide Content */}
      <div className="h-screen flex items-center justify-center p-8 md:p-20">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-5xl"
          >
            {/* TITLE */}
            {slide.type === 'title' && (
              <div className="text-center">
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-7xl md:text-[10rem] font-bold tracking-tight text-[#1d1d1f]"
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-xl md:text-3xl text-[#6e6e73] mt-6 font-light max-w-2xl mx-auto"
                >
                  {slide.subtitle}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-base text-[#86868b] mt-8"
                >
                  {slide.tagline}
                </motion.p>
              </div>
            )}

            {/* PROBLEM */}
            {slide.type === 'problem' && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-4"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl text-[#6e6e73] mb-12"
                >
                  {slide.statement}
                </motion.p>
                <div className="space-y-6">
                  {slide.points?.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={stagger(i)}
                      className="flex items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-[#e5e5e7]"
                    >
                      <span className="text-4xl">{point.icon}</span>
                      <span className="text-xl text-[#1d1d1f]">{point.text}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-lg text-[#86868b] mt-8 text-center italic"
                >
                  {slide.bottom}
                </motion.p>
              </div>
            )}

            {/* SOLUTION */}
            {slide.type === 'solution' && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-4"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl text-[#6e6e73] mb-12"
                >
                  {slide.statement}
                </motion.p>
                <div className="grid md:grid-cols-3 gap-6">
                  {slide.products?.map((product, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i)}
                      className="bg-white rounded-3xl p-8 shadow-sm border border-[#e5e5e7]"
                    >
                      <h3 className="text-xl font-semibold mb-3">{product.name}</h3>
                      <p className="text-[#6e6e73] leading-relaxed">{product.desc}</p>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-10 bg-[#1d1d1f] text-white rounded-2xl p-6 text-center"
                >
                  <p className="text-lg font-light">{slide.analogy}</p>
                </motion.div>
              </div>
            )}

            {/* MARKET */}
            {slide.type === 'market' && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-4"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl text-[#6e6e73] mb-12"
                >
                  {slide.statement}
                </motion.p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  {slide.layers?.map((layer, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={stagger(i, 0.2)}
                      className="bg-white rounded-3xl p-8 shadow-sm border border-[#e5e5e7] text-center w-full md:w-64"
                    >
                      <div className="text-sm text-[#86868b] uppercase tracking-wider mb-2">{layer.label}</div>
                      <div className="text-4xl md:text-5xl font-bold text-[#1d1d1f]">{layer.value}</div>
                      <div className="text-sm text-[#6e6e73] mt-2">{layer.desc}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-lg text-[#86868b] mt-8 text-center"
                >
                  {slide.context}
                </motion.p>
              </div>
            )}

            {/* REVENUE */}
            {slide.type === 'revenue' && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-4"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl text-[#6e6e73] mb-10"
                >
                  {slide.statement}
                </motion.p>
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#e5e5e7]">
                  {slide.model?.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={stagger(i, 0.1)}
                      className="flex items-center justify-between py-4 border-b border-[#e5e5e7] last:border-0"
                    >
                      <span className="text-lg text-[#6e6e73]">{item.metric}</span>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-[#1d1d1f]">{item.value}</span>
                        <span className="text-sm text-[#86868b] ml-2">{item.note}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8 bg-[#f5f5f7] rounded-2xl p-6 text-center"
                >
                  <p className="text-lg font-medium text-[#1d1d1f]">{slide.insight}</p>
                </motion.div>
              </div>
            )}

            {/* ADVANTAGE */}
            {slide.type === 'advantage' && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-4"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl text-[#6e6e73] mb-10"
                >
                  {slide.statement}
                </motion.p>
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e5e5e7]">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-[#f5f5f7] text-sm font-medium text-[#86868b]">
                    <div>Item</div>
                    <div>Georgia</div>
                    <div>USA</div>
                    <div>Savings</div>
                  </div>
                  {slide.comparisons?.map((row, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={stagger(i)}
                      className="grid grid-cols-4 gap-4 p-4 border-t border-[#e5e5e7]"
                    >
                      <div className="text-[#1d1d1f] font-medium">{row.item}</div>
                      <div className="text-[#1d1d1f] font-bold">{row.georgia}</div>
                      <div className="text-[#86868b] line-through">{row.usa}</div>
                      <div className="text-green-600 font-semibold">{row.savings}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5 text-center"
                >
                  <p className="text-lg text-green-800 font-medium">{slide.tax}</p>
                </motion.div>
              </div>
            )}

            {/* PLAN */}
            {slide.type === 'plan' && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-6xl font-bold mb-4"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl text-[#6e6e73] mb-8"
                >
                  {slide.statement}
                </motion.p>
                <div className="space-y-4">
                  {slide.phases?.map((phase, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={stagger(i, 0.2)}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-[#e5e5e7]"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-sm font-medium text-[#86868b]">{phase.phase} · {phase.timeline}</span>
                          <h3 className="text-lg font-semibold text-[#1d1d1f] mt-1">{phase.milestone}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#1d1d1f]">{phase.investment}</div>
                          <div className="text-sm font-medium text-blue-600">→ {phase.equity} equity</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {phase.deliverables.map((d, j) => (
                          <span key={j} className="text-sm bg-[#f5f5f7] text-[#6e6e73] rounded-full px-3 py-1">
                            {d}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* RETURNS */}
            {slide.type === 'returns' && (
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-6xl font-bold mb-4"
                >
                  {slide.title}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl text-[#6e6e73] mb-10"
                >
                  {slide.statement}
                </motion.p>
                <div className="grid md:grid-cols-3 gap-6">
                  {slide.scenarios?.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i, 0.2)}
                      className={`rounded-3xl p-8 text-center border ${
                        i === 1 ? 'bg-[#1d1d1f] text-white border-transparent shadow-lg' : 'bg-white border-[#e5e5e7] shadow-sm'
                      }`}
                    >
                      <div className={`text-sm uppercase tracking-wider mb-4 ${i === 1 ? 'text-white/60' : 'text-[#86868b]'}`}>
                        {s.scenario}
                      </div>
                      <div className={`text-lg mb-1 ${i === 1 ? 'text-white/80' : 'text-[#6e6e73]'}`}>
                        {s.revenue} revenue
                      </div>
                      <div className={`text-3xl font-bold mb-1 ${i === 1 ? 'text-white' : 'text-[#1d1d1f]'}`}>
                        {s.yourShare}
                      </div>
                      <div className={`text-sm ${i === 1 ? 'text-white/60' : 'text-[#86868b]'}`}>
                        your 40% = {s.multiple} return
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 text-center space-y-2"
                >
                  <p className="text-[#6e6e73]">{slide.timeline}</p>
                  <p className="text-sm text-[#86868b]">{slide.exit}</p>
                </motion.div>
              </div>
            )}

            {/* TEAM */}
            {slide.type === 'team' && (
              <div className="text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-12"
                >
                  {slide.title}
                </motion.h2>
                <div className="max-w-2xl mx-auto space-y-6">
                  {slide.strengths?.map((strength, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={stagger(i)}
                      className="flex items-center gap-4 text-left bg-white rounded-2xl p-5 shadow-sm border border-[#e5e5e7]"
                    >
                      <div className="w-3 h-3 rounded-full bg-[#1d1d1f]" />
                      <span className="text-xl text-[#1d1d1f]">{strength}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* ASK */}
            {slide.type === 'ask' && (
              <div className="text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-12"
                >
                  {slide.title}
                </motion.h2>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block bg-[#1d1d1f] text-white rounded-3xl p-10 mb-8"
                >
                  <div className="text-5xl md:text-6xl font-bold">{slide.investment}</div>
                  <div className="text-2xl text-white/80 mt-2">for {slide.equity}</div>
                  <div className="text-base text-white/50 mt-4">{slide.structure}</div>
                </motion.div>
                <div className="max-w-lg mx-auto space-y-3 mb-8">
                  {slide.rounds?.map((round, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={stagger(i)}
                      className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-[#e5e5e7]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold">{round.amount}</span>
                        <span className="text-sm text-blue-600 font-medium">({round.equity})</span>
                      </div>
                      <span className="text-sm text-[#6e6e73]">{round.trigger}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xl text-[#6e6e73] font-medium"
                >
                  {slide.closing}
                </motion.p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-[#e5e5e7]">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="p-2 rounded-full hover:bg-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5 text-[#1d1d1f]" />
        </button>

        <div className="flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > currentSlide ? 1 : -1);
                setCurrentSlide(i);
              }}
              className="group"
            >
              <Circle
                className={`w-2 h-2 transition-all ${
                  i === currentSlide
                    ? 'fill-[#1d1d1f] text-[#1d1d1f] scale-125'
                    : 'text-[#d2d2d7] group-hover:text-[#86868b]'
                }`}
              />
            </button>
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="p-2 rounded-full hover:bg-[#f5f5f7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5 text-[#1d1d1f]" />
        </button>
      </div>

      {/* Slide Counter */}
      <div className="fixed top-8 right-8 text-sm text-[#86868b]">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
}

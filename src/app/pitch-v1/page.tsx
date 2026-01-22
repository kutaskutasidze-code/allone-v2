'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Circle } from 'lucide-react';

const slides = [
  {
    id: 1,
    type: 'title',
    title: 'Allone',
    subtitle: 'AI Automation for the Next Billion Businesses',
    location: 'Tbilisi, Georgia',
    tagline: 'Investment Opportunity',
  },
  {
    id: 2,
    type: 'highlight',
    label: 'The Opportunity',
    title: 'Georgia\'s Unfair Advantage',
    points: [
      { value: '$0.10', label: 'per kWh electricity', detail: '40-70% below US/EU' },
      { value: '3-5x', label: 'lower developer costs', detail: 'vs. Western markets' },
      { value: '0%', label: 'income tax', detail: 'Years 1-3 for startups' },
    ],
  },
  {
    id: 3,
    type: 'funding',
    label: 'Investment Structure',
    title: 'Three-Stage Funding',
    stages: [
      { amount: '$20K', valuation: '$500K-800K', dilution: '2.5-4%', milestone: 'MVP + Beta Users' },
      { amount: '$200K', valuation: '$2-4M', dilution: '5-10%', milestone: 'First Revenue + Data Center' },
      { amount: '$3M', valuation: '$12-15M', dilution: '17-20%', milestone: 'Proven Unit Economics' },
    ],
    total: '25-35% total ownership',
  },
  {
    id: 4,
    type: 'metrics',
    label: 'Unit Economics',
    title: 'Conservative Projections',
    metrics: [
      { label: 'Average Deal Size', value: '$300', sub: '/month' },
      { label: 'Gross Margin', value: '70%', sub: 'target' },
      { label: 'Customer Lifetime', value: '15', sub: 'months' },
      { label: 'LTV', value: '$3,150', sub: 'per customer' },
      { label: 'Target LTV:CAC', value: '3:1', sub: 'ratio' },
      { label: 'Max CAC', value: '$1,050', sub: 'sustainable' },
    ],
  },
  {
    id: 5,
    type: 'datacenter',
    label: 'Infrastructure',
    title: 'GPU Data Center Economics',
    investment: '$120K initial',
    config: '8x NVIDIA L40S GPUs',
    pricing: '$1.25/hour (vs $1.95+ Western)',
    table: [
      { util: '50%', revenue: '$3,600', profit: '$1,200-2,000' },
      { util: '75%', revenue: '$5,400', profit: '$3,000-3,800' },
      { util: '90%', revenue: '$6,480', profit: '$4,080-4,880' },
    ],
    breakeven: '~50% utilization',
  },
  {
    id: 6,
    type: 'comparables',
    label: 'Market Validation',
    title: 'Comparable Valuations',
    companies: [
      { name: 'n8n', valuation: '$2.5B', multiple: '62.5x ARR', funding: '$180M' },
      { name: 'Zapier', valuation: '$5B', multiple: '30x ARR', funding: '$2.68M total' },
      { name: 'Vapi', valuation: '$130M', multiple: '15-30x', funding: 'Dec 2024' },
      { name: 'Synthflow', valuation: '-', multiple: '-', funding: '$30M Series A' },
    ],
  },
  {
    id: 7,
    type: 'costs',
    label: 'Operational Efficiency',
    title: 'Georgian Cost Advantage',
    teams: [
      { role: 'Junior Full-Stack', georgia: '$12-18K', western: '$80-120K' },
      { role: 'Senior Full-Stack', georgia: '$34-48K', western: '$150-200K' },
      { role: 'AI/ML Engineer', georgia: '$42-60K', western: '$180-250K' },
    ],
    savings: '3-5x cost reduction',
  },
  {
    id: 8,
    type: 'incentives',
    label: 'Tax Benefits',
    title: 'Innovative Startup Status',
    timeline: [
      { period: 'Years 1-3', income: '0%', corporate: 'Standard' },
      { period: 'Years 4-6', income: '5%', corporate: '5%' },
      { period: 'Years 7-10', income: '10%', corporate: '10%' },
    ],
    note: '10-year progressive tax benefit',
  },
  {
    id: 9,
    type: 'closing',
    title: 'Investment Thesis',
    bullets: [
      'Structural cost advantages create sustainable moat',
      'Stage-gated structure de-risks capital deployment',
      'AI automation market at 15-60x ARR multiples',
      'Georgian ecosystem actively supporting startups',
    ],
    ask: '$20K → $200K → $3M',
    target: '25-35% ownership',
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
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-[#000] text-white overflow-hidden select-none">
      {/* Slide Content */}
      <div className="h-screen flex items-center justify-center p-8 md:p-16">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-6xl"
          >
            {slide.type === 'title' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="mb-8"
                >
                  <span className="text-xs tracking-[0.3em] text-white/40 uppercase">{slide.tagline}</span>
                </motion.div>
                <motion.h1
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-8xl md:text-[12rem] font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent"
                >
                  {slide.title}
                </motion.h1>
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-xl md:text-2xl text-white/60 mt-6 font-light"
                >
                  {slide.subtitle}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-sm text-white/30 mt-4"
                >
                  {slide.location}
                </motion.p>
              </div>
            )}

            {slide.type === 'highlight' && (
              <div>
                <motion.span
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs tracking-[0.2em] text-blue-400 uppercase"
                >
                  {slide.label}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold mt-4 mb-16"
                >
                  {slide.title}
                </motion.h2>
                <div className="grid md:grid-cols-3 gap-8">
                  {slide.points?.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10"
                    >
                      <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        {point.value}
                      </div>
                      <div className="text-lg text-white/80 mt-2">{point.label}</div>
                      <div className="text-sm text-white/40 mt-1">{point.detail}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'funding' && (
              <div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs tracking-[0.2em] text-emerald-400 uppercase"
                >
                  {slide.label}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold mt-4 mb-12"
                >
                  {slide.title}
                </motion.h2>
                <div className="space-y-4">
                  {slide.stages?.map((stage, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="flex items-center gap-6 bg-white/5 rounded-2xl p-6 border border-white/10"
                    >
                      <div className="text-4xl md:text-5xl font-bold text-emerald-400 w-32">{stage.amount}</div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-white/40 uppercase tracking-wider">Valuation</div>
                          <div className="text-lg text-white/80">{stage.valuation}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/40 uppercase tracking-wider">Dilution</div>
                          <div className="text-lg text-white/80">{stage.dilution}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/40 uppercase tracking-wider">Milestone</div>
                          <div className="text-lg text-white/80">{stage.milestone}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8 text-center text-xl text-white/60"
                >
                  {slide.total}
                </motion.div>
              </div>
            )}

            {slide.type === 'metrics' && (
              <div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs tracking-[0.2em] text-purple-400 uppercase"
                >
                  {slide.label}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold mt-4 mb-12"
                >
                  {slide.title}
                </motion.h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {slide.metrics?.map((metric, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.15 + i * 0.1 }}
                      className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center"
                    >
                      <div className="text-3xl md:text-4xl font-bold text-purple-400">{metric.value}</div>
                      <div className="text-sm text-white/40 mt-1">{metric.sub}</div>
                      <div className="text-xs text-white/60 mt-2 uppercase tracking-wider">{metric.label}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'datacenter' && (
              <div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs tracking-[0.2em] text-orange-400 uppercase"
                >
                  {slide.label}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-6xl font-bold mt-4 mb-8"
                >
                  {slide.title}
                </motion.h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="text-sm text-white/40">Initial Investment</div>
                      <div className="text-3xl font-bold text-orange-400">{slide.investment}</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="text-sm text-white/40">Configuration</div>
                      <div className="text-xl text-white/80">{slide.config}</div>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <div className="text-sm text-white/40">Pricing Advantage</div>
                      <div className="text-xl text-white/80">{slide.pricing}</div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 rounded-2xl p-6 border border-white/10"
                  >
                    <div className="text-sm text-white/40 mb-4">Revenue by Utilization</div>
                    <div className="space-y-3">
                      {slide.table?.map((row, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                          <span className="text-white/60">{row.util}</span>
                          <span className="text-white/80">{row.revenue}/mo</span>
                          <span className="text-emerald-400 font-medium">{row.profit}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 text-center">
                      <span className="text-sm text-white/40">Break-even: </span>
                      <span className="text-orange-400 font-medium">{slide.breakeven}</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            )}

            {slide.type === 'comparables' && (
              <div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs tracking-[0.2em] text-cyan-400 uppercase"
                >
                  {slide.label}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold mt-4 mb-12"
                >
                  {slide.title}
                </motion.h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {slide.companies?.map((company, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="bg-white/5 rounded-2xl p-6 border border-white/10 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-2xl font-bold">{company.name}</div>
                        <div className="text-sm text-white/40 mt-1">{company.funding}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-cyan-400">{company.valuation}</div>
                        <div className="text-sm text-white/60">{company.multiple}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {slide.type === 'costs' && (
              <div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs tracking-[0.2em] text-pink-400 uppercase"
                >
                  {slide.label}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold mt-4 mb-12"
                >
                  {slide.title}
                </motion.h2>
                <div className="space-y-4">
                  {slide.teams?.map((team, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="bg-white/5 rounded-2xl p-6 border border-white/10 flex items-center"
                    >
                      <div className="flex-1 text-lg">{team.role}</div>
                      <div className="text-right mr-8">
                        <div className="text-xs text-white/40">Georgia</div>
                        <div className="text-2xl font-bold text-pink-400">{team.georgia}</div>
                      </div>
                      <div className="text-right opacity-40">
                        <div className="text-xs text-white/40">Western</div>
                        <div className="text-xl line-through">{team.western}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 text-center text-2xl text-pink-400 font-bold"
                >
                  {slide.savings}
                </motion.div>
              </div>
            )}

            {slide.type === 'incentives' && (
              <div>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs tracking-[0.2em] text-yellow-400 uppercase"
                >
                  {slide.label}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-5xl md:text-7xl font-bold mt-4 mb-12"
                >
                  {slide.title}
                </motion.h2>
                <div className="grid md:grid-cols-3 gap-6">
                  {slide.timeline?.map((period, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="bg-white/5 rounded-3xl p-8 border border-white/10 text-center"
                    >
                      <div className="text-lg text-white/60 mb-4">{period.period}</div>
                      <div className="space-y-4">
                        <div>
                          <div className="text-4xl font-bold text-yellow-400">{period.income}</div>
                          <div className="text-xs text-white/40 uppercase tracking-wider">Income Tax</div>
                        </div>
                        <div>
                          <div className="text-2xl font-semibold text-white/60">{period.corporate}</div>
                          <div className="text-xs text-white/40 uppercase tracking-wider">Corporate Tax</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="mt-8 text-center text-lg text-white/40"
                >
                  {slide.note}
                </motion.div>
              </div>
            )}

            {slide.type === 'closing' && (
              <div className="text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-12"
                >
                  {slide.title}
                </motion.h2>
                <div className="max-w-2xl mx-auto space-y-4 mb-12">
                  {slide.bullets?.map((bullet, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-4 text-left"
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
                      <span className="text-lg text-white/80">{bullet}</span>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="inline-block bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-3xl p-8 border border-white/10"
                >
                  <div className="text-sm text-white/40 uppercase tracking-wider mb-2">The Ask</div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    {slide.ask}
                  </div>
                  <div className="text-lg text-white/60 mt-2">{slide.target}</div>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
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
                    ? 'fill-white text-white scale-125'
                    : 'text-white/30 group-hover:text-white/60'
                }`}
              />
            </button>
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Counter */}
      <div className="fixed top-8 right-8 text-sm text-white/30">
        {currentSlide + 1} / {slides.length}
      </div>

      {/* Keyboard hint */}
      <div className="fixed bottom-8 right-8 text-xs text-white/20">
        ← → or Space to navigate
      </div>
    </div>
  );
}

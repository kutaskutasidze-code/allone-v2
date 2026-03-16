'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';
import Link from 'next/link';
import OrbVoiceInterface from '@/components/pitch/OrbVoiceInterface';

const slides = [
  { id: 1, type: 'title' },
  { id: 2, type: 'service', title: 'რას ვაკეთებთ', statement: 'ჩვენ AI-ით გაძლიერებული ტექნოლოგიური სერვისების კომპანია ვართ', steps: [{ number: '01', name: 'კონსულტაცია', desc: 'ვაანალიზებთ, რა სჭირდება კლიენტს' }, { number: '02', name: 'დაგეგმვა', desc: 'ვპროექტებთ AI გადაწყვეტილებას' }, { number: '03', name: 'შესრულება', desc: 'ვაშენებთ და ვნერგავთ სწრაფად' }, { number: '04', name: 'მხარდაჭერა', desc: 'ვმართავთ, ვაახლებთ — ყოველთვიურად' }], analogy: 'მაღალი ხარისხი, მაღალი სიჩქარე, დაბალი ფასი — ერთ სივრცეში' },
  { id: 3, type: 'products', title: 'ჩვენი პროდუქტები', items: [{ name: 'ვებსაიტი', desc: 'თანამედროვე ვებსაიტები — ვიზიტორები გადაიქცევიან კლიენტებად. ფასი: 1,000₾-დან', price: '1,000₾' }, { name: 'AI ექსპერტი', desc: 'კომპანიის "საკუთარი ChatGPT" — გაწვრთნილი მხოლოდ თქვენს მონაცემებზე. ჩაშენება: 3,000₾-დან + 600₾/თვე', price: '3,000₾' }, { name: 'AI ჩატბოტი', desc: 'Customer Support 24/7 — 94% resolution rate, <2წმ პასუხის დრო. ასობით მომხმარებელს ერთდროულად', price: 'Custom' }] },
  { id: 4, type: 'sales_strategy', title: 'როგორ ვყიდით', strategies: [{ name: 'აჩვენე პრობლემა', desc: '70%+ კომპანიას ვებსაიტი არ ეხმარება გაყიდვებში' }, { name: 'ცოდნის დაკარგვა', desc: 'კომპანიის know-how გაფანტულია — თანამშრომელი წავა, ცოდნა იკარგება' }, { name: 'მომხმარებლის დაკარგვა', desc: 'სწრაფი პასუხი ვერ მიიღო? → კონკურენტთან წავიდა' }, { name: 'AI ექსპერტის დემო', desc: 'აჩვენე როგორ პასუხობს კომპანიის კითხვებს მყისიერად' }, { name: 'ჩატბოტის დემო', desc: '94% resolution, <2 წამი — ცოცხალი დემო ადგილზე' }, { name: 'რისკის გარეშე', desc: '7 დღეში არ მუშაობს? სრული თანხა უკან' }] },
  { id: 5, type: 'operations', title: 'როგორ მუშაობს', flow: [{ step: 'გაყიდვები', detail: 'საკომისიო აგენტები (10%)' }, { step: 'ტექნიკური', detail: 'კონსულტაცია + აშენება' }, { step: 'AI პლატფორმა', detail: 'ავტომატურად, 24/7' }, { step: 'მხარდაჭერა', detail: 'ყოველთვიური მოვლა' }] },
  { id: 6, type: 'closing', title: 'ფასები & ეკონომიკა', reasons: [{ point: 'ვებსაიტი', detail: '1,000₾-დან' }, { point: 'AI ექსპერტი — ჩაშენება', detail: '3,000₾-დან' }, { point: 'AI ექსპერტი — სერვისი', detail: '600₾/თვე-დან' }, { point: 'AI ჩატბოტი', detail: 'ინდივიდუალური შეფასება' }, { point: '10% საკომისიო', detail: 'გაყიდვების აგენტებისთვის' }, { point: 'რისკის გარეშე', detail: '7-დღიანი გარანტია' }] },
  { id: 7, type: 'brand' },
];

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, "Outfit", sans-serif';

export default function PitchPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

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

  const isTitle = slide.type === 'title';

  const slideVariants = {
    enter: (dir: number) => ({ y: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { y: 0, opacity: 1 },
    exit: (dir: number) => ({ y: dir < 0 ? 40 : -40, opacity: 0 }),
  };

  return (
    <div className="min-h-[100dvh] bg-white text-[#1d1d1f] overflow-hidden select-none" style={{ fontFamily: FONT_STACK }}>

      {/* Orb — title slide only */}
      {isTitle && (
        <div className="fixed inset-0 flex items-center justify-center z-10">
          <OrbVoiceInterface
            size="hero"
            interactive
          />
        </div>
      )}

      {/* Header — download only on last slide */}
      {isLastSlide && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-end">
            <Link href="/pitch/files" className="flex items-center gap-1.5 text-xs text-[#86868b]/50 hover:text-[#1d1d1f] transition-colors">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ჩამოტვირთვა</span>
            </Link>
          </div>
        </div>
      )}

      {/* Slide Content */}
      <div className={`h-[100dvh] flex items-center justify-center pt-12 pb-16 px-4 sm:px-8 relative z-20 ${isTitle ? 'pointer-events-none' : ''}`}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-5xl"
          >
            {/* TITLE — just the orb, nothing else */}
            {slide.type === 'title' && <div />}

            {/* SERVICE */}
            {slide.type === 'service' && (
              <div>
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2">{slide.title}</motion.h2>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-[#86868b] mb-6 sm:mb-8">{slide.statement}</motion.p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  {slide.steps?.map((step: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }} className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e5e7]">
                      <div className="text-2xl font-bold text-[#86868b]/40 mb-2">{step.number}</div>
                      <div className="text-sm font-semibold mb-1">{step.name}</div>
                      <div className="text-xs text-[#86868b] leading-relaxed">{step.desc}</div>
                    </motion.div>
                  ))}
                </div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-4 bg-[#1d1d1f] text-white rounded-2xl p-4 text-center">
                  <p className="text-sm font-light tracking-wide">{slide.analogy}</p>
                </motion.div>
              </div>
            )}

            {/* PRODUCTS */}
            {slide.type === 'products' && (
              <div>
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 sm:mb-8">{slide.title}</motion.h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {slide.items?.map((item: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }} className="bg-white rounded-2xl p-5 shadow-sm border border-[#e5e5e7]">
                      <div className="text-base font-semibold mb-1">{item.name}</div>
                      <div className="text-sm text-[#86868b] leading-relaxed">{item.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}


            {/* SALES STRATEGY */}
            {slide.type === 'sales_strategy' && (
              <div>
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 sm:mb-8">{slide.title}</motion.h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {slide.strategies?.map((s: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#e5e5e7]">
                      <div className="text-sm sm:text-base font-semibold mb-1">{s.name}</div>
                      <div className="text-xs sm:text-sm text-[#86868b] leading-relaxed">{s.desc}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* OPERATIONS */}
            {slide.type === 'operations' && (
              <div>
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 sm:mb-8">{slide.title}</motion.h2>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {slide.flow?.map((f: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.1 }} className="flex-1 bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#e5e5e7] relative">
                      <div className="text-sm sm:text-base font-semibold mb-1">{f.step}</div>
                      <div className="text-xs sm:text-sm text-[#86868b]">{f.detail}</div>
                      {i < (slide.flow?.length || 0) - 1 && (
                        <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 text-[#d2d2d7]">&rarr;</div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}


            {/* CLOSING */}
            {slide.type === 'closing' && (
              <div>
                <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-6 sm:mb-8">{slide.title}</motion.h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {slide.reasons?.map((r: any, i: number) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.06 }} className="bg-white rounded-2xl p-4 shadow-sm border border-[#e5e5e7]">
                      <div className="text-sm font-semibold mb-0.5">{r.point}</div>
                      <div className="text-xs text-[#86868b]">{r.detail}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* BRAND */}
            {slide.type === 'brand' && (
              <div className="flex items-center justify-center min-h-[60vh]">
                <motion.h1 initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }} className="text-6xl sm:text-8xl md:text-9xl font-bold tracking-tight text-[#1d1d1f]">
                  ALLONE
                </motion.h1>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Dots */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-50">
        {slides.map((_, i) => (
          <button key={i} onClick={() => { setDirection(i > currentSlide ? 1 : -1); setCurrentSlide(i); }} className="touch-manipulation">
            <div className={`rounded-full transition-all duration-300 ${i === currentSlide ? 'w-6 h-1.5 bg-[#1d1d1f]' : 'w-1.5 h-1.5 bg-[#1d1d1f]/20 hover:bg-[#1d1d1f]/40'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

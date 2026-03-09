'use client';

import { motion, useInView } from 'framer-motion';
import { ArrowRight, Target, Lightbulb, Users, Rocket, Globe } from 'lucide-react';
import Link from 'next/link';
import { Container } from '@/components/layout';
import { useRef, useState, useEffect } from 'react';
import type { Stat, CompanyValue, AboutContent as AboutContentType } from '@/types/database';
import { ShineBorder } from '@/components/ui/ShineBorder';

const valueIcons = [Target, Lightbulb, Users, Rocket];

function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;
  const suffix = value.replace(/[0-9]/g, '');
  const hasPlus = value.includes('+');

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 1500;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * numericValue));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, numericValue]);

  return <span ref={ref}>{count}{hasPlus ? '+' : ''}{suffix}</span>;
}

interface AboutContentProps {
  stats: Stat[];
  values: CompanyValue[];
  about: Partial<AboutContentType>;
}

export function AboutContent({ stats, values, about }: AboutContentProps) {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="pt-28 pb-12 lg:pt-36 lg:pb-16 bg-[#F8FAFE]/50 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
        
        <Container>
          <div className="max-w-4xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="mono-label mb-6">{about.hero_subtitle || 'About Us'}</p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold text-[#071D2F] leading-[1.05] tracking-[-0.03em] mb-8"
            >
              Building the future of <span className="text-accent">autonomous intelligence</span>.
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-24 h-1 bg-accent origin-left rounded-full"
            />
          </div>
        </Container>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="py-12 lg:py-16">
          <Container>
            <ShineBorder borderRadius={40} borderWidth={2} duration={10} className="border border-border p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 px-8 py-12 lg:px-12 lg:py-16 bg-white w-full">
                {stats.map((stat, i) => (
                  <motion.div
                    key={stat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-4xl md:text-5xl font-semibold text-[#071D2F] font-[family-name:var(--font-display)] tracking-[-0.03em] mb-2">
                      <AnimatedCounter value={stat.value} />
                    </div>
                    <div className="font-mono text-[10px] text-[#7E8A97] uppercase tracking-[0.1em]">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ShineBorder>
          </Container>
        </section>
      )}

      {/* Story */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="mono-label mb-4">{about.story_subtitle || 'Our Story'}</p>
              <h2 className="text-3xl lg:text-4xl font-semibold text-[#071D2F] leading-tight tracking-[-0.03em] mb-6">
                Built by engineers who believe in accessible AI
              </h2>
              <div className="space-y-4 text-[#4A5B70] leading-relaxed text-lg">
                {(about.story_paragraphs || []).map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
              <div className="mt-8">
                <Link href="/contact" className="btn-primary inline-flex">
                  Start a Project
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative aspect-square lg:aspect-[4/3] rounded-2xl overflow-hidden bg-[#F8FAFE] border border-border"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="w-32 h-32 text-accent/10 animate-float" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-white via-transparent to-transparent" />
            </motion.div>
          </div>
        </Container>
      </section>

      {/* Locations */}
      <section className="py-12 lg:py-16 bg-[#F8FAFE]/30">
        <Container>
          <div className="grid md:grid-cols-2 gap-6">
            <ShineBorder borderRadius={20} className="border border-border p-0">
              <div className="p-8 bg-white w-full text-left">
                <p className="mono-label mb-3 text-accent/60">Headquarters</p>
                <h3 className="text-2xl font-bold text-[#071D2F] mb-1">Tbilisi</h3>
                <p className="text-[#071D2F] font-semibold mb-2">Georgia</p>
                <p className="text-[#7E8A97] text-sm">Engineering & Strategy Hub</p>
              </div>
            </ShineBorder>
            
            <ShineBorder borderRadius={20} className="border border-border p-0">
              <div className="p-8 bg-white w-full text-left">
                <p className="mono-label mb-3 text-accent/60">Operations</p>
                <h3 className="text-2xl font-bold text-[#071D2F] mb-1">Brussels</h3>
                <p className="text-[#071D2F] font-semibold mb-2">Belgium</p>
                <p className="text-[#7E8A97] text-sm">European Partnerships</p>
              </div>
            </ShineBorder>
          </div>
        </Container>
      </section>

      {/* Values */}
      {values.length > 0 && (
        <section className="py-16 lg:py-24">
          <Container>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 text-center"
            >
              <p className="mono-label mb-4">{about.values_subtitle || 'Our Values'}</p>
              <h2 className="text-3xl lg:text-4xl font-semibold text-[#071D2F] leading-tight tracking-[-0.03em]">
                What drives us
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, i) => {
                const IconComponent = valueIcons[i % valueIcons.length];
                return (
                  <motion.div
                    key={value.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="group"
                  >
                    <div className="h-full rounded-2xl bg-white border border-border p-8 hover:border-accent/30 transition-all hover:shadow-xl hover:shadow-accent/5">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#F8FAFE] border border-[#DCE9F6] mb-6 group-hover:scale-110 transition-transform">
                        <IconComponent className="w-6 h-6 text-accent" />
                      </div>
                      <span className="font-mono text-[10px] text-accent/50 uppercase tracking-[0.2em] mb-2 block font-bold">
                        {value.number || `0${i + 1}`}
                      </span>
                      <h3 className="text-xl font-bold text-[#071D2F] mb-3">
                        {value.title}
                      </h3>
                      <p className="text-[#4A5B70] leading-relaxed text-sm">
                        {value.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Container>
        </section>
      )}
    </div>
  );
}

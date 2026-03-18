'use client';

import { motion } from 'framer-motion';
import { TypewriterTitle } from '@/components/ui/TypewriterTitle';
import SlideTextButton from '@/components/kokonutui/slide-text-button';

// Skeleton card variations for organic feel
const skeletonCards = [
  { width: 300, height: 200, hasImage: true, lines: 2 },
  { width: 280, height: 180, hasImage: true, lines: 3 },
  { width: 320, height: 220, hasImage: false, lines: 4 },
  { width: 260, height: 190, hasImage: true, lines: 2 },
  { width: 300, height: 210, hasImage: false, lines: 3 },
  { width: 290, height: 185, hasImage: true, lines: 2 },
  { width: 310, height: 200, hasImage: true, lines: 3 },
  { width: 270, height: 195, hasImage: false, lines: 4 },
];

// Duplicate for seamless infinite scroll
const duplicatedCards = [...skeletonCards, ...skeletonCards];

function SkeletonCard({
  width,
  height,
  hasImage,
  lines
}: {
  width: number;
  height: number;
  hasImage: boolean;
  lines: number;
}) {
  return (
    <div
      className="flex-shrink-0 rounded-xl bg-zinc-100 border border-zinc-200 p-4 overflow-hidden"
      style={{ width, height }}
    >
      {/* Image placeholder with shimmer */}
      {hasImage && (
        <div className="relative w-full h-24 rounded-lg bg-zinc-200 mb-3 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      {/* Text line placeholders with staggered shimmer */}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="relative h-3 rounded bg-zinc-200 overflow-hidden"
            style={{
              width: i === lines - 1 ? '60%' : i === 0 ? '80%' : '100%',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: `shimmer 2.5s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Tags placeholder */}
      <div className="flex gap-2 mt-3">
        <div className="relative h-5 w-16 rounded-full bg-zinc-200 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s ease-in-out infinite',
              animationDelay: '0.3s',
            }}
          />
        </div>
        <div className="relative h-5 w-12 rounded-full bg-zinc-200 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s ease-in-out infinite',
              animationDelay: '0.45s',
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function WorkComingSoon() {
  return (
    <section id="projects" className="py-24 lg:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-12"
        >
          <p className="text-zinc-500 text-sm font-medium tracking-wide uppercase mb-4">
            Our work
          </p>
          <h2 className="text-4xl lg:text-5xl font-light text-zinc-900 leading-[1.1]">
            A selection of our recent work
          </h2>
        </motion.div>
      </div>

      {/* Infinite scrolling skeleton cards */}
      <div className="relative">
        {/* Left fade gradient */}
        <div
          className="absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, white 0%, transparent 100%)',
          }}
        />

        {/* Right fade gradient */}
        <div
          className="absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, white 0%, transparent 100%)',
          }}
        />

        {/* Scrolling container */}
        <motion.div
          className="flex gap-6 py-4"
          animate={{
            x: [0, -50 * duplicatedCards.length],
          }}
          transition={{
            x: {
              duration: 40,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          style={{
            width: 'fit-content',
          }}
        >
          {duplicatedCards.map((card, i) => (
            <SkeletonCard key={i} {...card} />
          ))}
        </motion.div>
      </div>

      {/* Typewriter text */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center justify-center pt-12 lg:pt-16"
        >
          <TypewriterTitle
            sequences={[
              { text: "Loading...", deleteAfter: true, pauseAfter: 1500 },
              { text: "Check back soon.", deleteAfter: false },
            ]}
            typingSpeed={60}
            deleteSpeed={40}
            startDelay={800}
            autoLoop={true}
            loopDelay={3000}
            naturalVariance={true}
            className="text-zinc-900"
            cursorClassName="bg-zinc-900"
          />
        </motion.div>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center mt-10"
        >
          <SlideTextButton
            text="See all projects"
            hoverText="Browse work →"
            href="/projects"
            variant="ghost"
            className="h-12 px-10 rounded-full border-zinc-900/20"
          />
        </motion.div>
      </div>
    </section>
  );
}

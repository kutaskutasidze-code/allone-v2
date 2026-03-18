'use client';

import { motion } from 'framer-motion';

const items = [
  'AI Automation',
  'Custom Solutions',
  'Workflow Optimization',
  'Machine Learning',
  'Intelligent Chatbots',
  'Process Automation',
  'Data Analytics',
  'AI Strategy',
];

export function Marquee() {
  return (
    <section className="py-6 border-y border-[var(--gray-200)] overflow-hidden bg-white">
      <div className="relative flex">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            x: {
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          className="flex shrink-0"
        >
          {[...items, ...items].map((item, index) => (
            <div
              key={index}
              className="flex items-center shrink-0 px-8"
            >
              <span className="text-sm font-[var(--font-display)] font-light uppercase tracking-[0.15em] text-[var(--gray-400)] whitespace-nowrap hover:text-[var(--black)] transition-colors duration-300 cursor-default">
                {item}
              </span>
              <span className="w-2 h-2 bg-[var(--black)] rounded-full ml-8" />
            </div>
          ))}
        </motion.div>
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            x: {
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
          className="flex shrink-0"
        >
          {[...items, ...items].map((item, index) => (
            <div
              key={index}
              className="flex items-center shrink-0 px-8"
            >
              <span className="text-sm font-[var(--font-display)] font-light uppercase tracking-[0.15em] text-[var(--gray-400)] whitespace-nowrap hover:text-[var(--black)] transition-colors duration-300 cursor-default">
                {item}
              </span>
              <span className="w-2 h-2 bg-[var(--black)] rounded-full ml-8" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

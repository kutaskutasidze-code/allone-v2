'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AccordionItem {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}

interface InteractiveImageAccordionProps {
  items: AccordionItem[];
  defaultActive?: number;
}

function AccordionPanel({
  item,
  isActive,
  onMouseEnter,
  onTouchStart,
  index,
}: {
  item: AccordionItem;
  isActive: boolean;
  onMouseEnter: () => void;
  onTouchStart: () => void;
  index: number;
}) {
  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]
        ${isActive ? 'flex-[6] md:flex-[4]' : 'flex-[0.3] md:flex-[0.6]'}
      `}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
    >
      <Image
        src={item.src}
        alt={item.alt}
        fill
        quality={90}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover object-left-top"
        priority={index <= 1}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Active state content */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 p-6 md:p-8
          transition-all duration-500 ease-out
          ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <p className="text-white/60 text-xs uppercase tracking-widest mb-1 font-[family-name:var(--font-mono)]">
          {item.subtitle}
        </p>
        <h3 className="text-white text-xl md:text-2xl font-semibold tracking-tight">
          {item.title}
        </h3>
      </div>

      {/* Collapsed state - vertical label */}
      <div
        className={`
          absolute inset-0 flex items-center justify-center
          transition-all duration-500 ease-out
          ${isActive ? 'opacity-0' : 'opacity-100'}
        `}
      >
        <span
          className="text-white text-sm font-medium whitespace-nowrap -rotate-90 tracking-wider"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {item.title}
        </span>
      </div>
    </div>
  );
}

export function InteractiveImageAccordion({
  items,
  defaultActive = 0,
}: InteractiveImageAccordionProps) {
  const [activeIndex, setActiveIndex] = useState(defaultActive);

  return (
    <div className="flex gap-1 md:gap-3 w-full h-[200px] md:h-[380px] lg:h-[450px]">
      {items.map((item, index) => (
        <AccordionPanel
          key={index}
          item={item}
          isActive={index === activeIndex}
          onMouseEnter={() => setActiveIndex(index)}
          onTouchStart={() => setActiveIndex(index)}
          index={index}
        />
      ))}
    </div>
  );
}

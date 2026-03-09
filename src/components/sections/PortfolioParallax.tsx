'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import Lenis from 'lenis';
import { ZoomParallax } from "@/components/ui/zoom-parallax";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import Image from 'next/image';

export function PortfolioParallax() {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  const images = [
    {
      src: '/images/work/equivalenza.webp',
      alt: 'Equivalenza Georgia - E-Commerce Platform',
      objectPosition: 'top',
    },
    {
      src: '/images/work/chaos-concept.webp',
      alt: 'Chaos Concept - Fashion & Art Concept Store',
      objectPosition: 'top',
    },
    {
      src: '/images/work/datarooms.webp',
      alt: 'DataRooms - AI-Powered Investor Data Rooms',
      objectPosition: 'top',
    },
    {
      src: '/images/work/fifty.webp',
      alt: 'FIFTY - Community-Owned Innovation Space',
      objectPosition: 'top',
    },
    {
      src: '/images/work/hostwise.webp',
      alt: 'HostWise - Property Management SaaS',
      objectPosition: 'top',
    },
    {
      src: '/images/work/kaotenders.webp',
      alt: 'KaoTenders - B2B Industrial Platform',
      objectPosition: 'top',
    },
    {
      src: '/images/work/innrburial.webp',
      alt: 'INNRBURIAL - Publishing & Art Platform',
      objectPosition: 'top',
    },
  ];

  return (
    <div className="bg-white">
      <div className="relative flex h-[50vh] flex-col items-center justify-center text-center px-4">
        <p className="mono-label mb-4">Portfolio</p>
        <h2 className="text-4xl lg:text-6xl font-semibold text-heading tracking-tight mb-6">
          Selected Works
        </h2>
        <p className="text-muted max-w-xl text-lg">
          Dive into our latest implementations of intelligent automation and digital transformation.
        </p>
      </div>
      
      <ZoomParallax images={images} />

      <div className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <p className="mono-label mb-4">Integrations</p>
          <h3 className="text-3xl font-semibold text-heading">Trusted by Industry Leaders</h3>
        </div>
        
        <InfiniteSlider gap={80} reverse className="w-full bg-white py-12">
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            Equivalenza
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            DataRooms
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            FIFTY
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            Chaos Concept
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            HostWise
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            KaoTenders
          </span>
          <span className="text-2xl md:text-3xl font-semibold text-foreground/15 whitespace-nowrap select-none tracking-tight font-[family-name:var(--font-display)]">
            INNRBURIAL
          </span>
        </InfiniteSlider>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, HTMLAttributes } from 'react';
import Image from 'next/image';

const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export interface GalleryItem {
  common: string;
  binomial: string;
  href?: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  radius?: number;
  autoRotateSpeed?: number;
}

// Card dimensions: 16:10 web ratio
const CARD_W = 420;
const CARD_H = 263;

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 700, autoRotateSpeed = 0.02, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [recentlyScrolled, setRecentlyScrolled] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const clickGuardRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const touchYRef = useRef<number | null>(null);

    // Effect to handle manual wheel/touch based rotation (Infinite)
    useEffect(() => {
      const handleInteraction = (deltaY: number) => {
        setIsScrolling(true);
        setRecentlyScrolled(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (clickGuardRef.current) {
          clearTimeout(clickGuardRef.current);
        }

        setRotation(prev => prev + deltaY * 0.2);

        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);

        // Block clicks for a short window after scrolling stops
        clickGuardRef.current = setTimeout(() => {
          setRecentlyScrolled(false);
        }, 300);
      };

      const handleWheel = (e: WheelEvent) => {
        handleInteraction(e.deltaY);
      };

      const handleTouchStart = (e: TouchEvent) => {
        touchYRef.current = e.touches[0].clientY;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (touchYRef.current === null) return;
        const deltaY = touchYRef.current - e.touches[0].clientY;
        touchYRef.current = e.touches[0].clientY;
        handleInteraction(deltaY * 2.5);
      };

      const handleTouchEnd = () => {
        touchYRef.current = null;
      };

      window.addEventListener('wheel', handleWheel, { passive: true });
      window.addEventListener('touchstart', handleTouchStart, { passive: true });
      window.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        window.removeEventListener('wheel', handleWheel);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (clickGuardRef.current) {
          clearTimeout(clickGuardRef.current);
        }
      };
    }, []);

    // Effect for auto-rotation when not scrolling
    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling) {
          setRotation(prev => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isScrolling, autoRotateSpeed]);

    const anglePerItem = 360 / items.length;

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Circular 3D Gallery"
        className={cn("relative w-full h-full flex items-center justify-center", className)}
        style={{ perspective: '2000px' }}
        {...props}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle);
            const opacity = Math.max(0.3, 1 - (normalizedAngle / 180));
            const isHovered = hoveredIndex === i;

            const handleCardClick = (e: React.MouseEvent) => {
              if (!item.href || recentlyScrolled) {
                e.preventDefault();
                return;
              }
              window.open(item.href, '_blank', 'noopener,noreferrer');
            };

            const card = (
              <div className="relative w-full h-full rounded-xl shadow-2xl overflow-hidden border border-white/10">
                <Image
                  src={item.photo.url}
                  alt={item.photo.text}
                  fill
                  sizes="420px"
                  className="object-cover"
                  style={{ objectPosition: item.photo.pos || 'top' }}
                  quality={90}
                  priority={i < 3}
                />
              </div>
            );

            return (
              <div
                key={`${item.photo.url}-${i}`}
                role="group"
                aria-label={item.common}
                className="absolute left-1/2 top-1/2"
                style={{
                  width: `${CARD_W}px`,
                  height: `${CARD_H}px`,
                  marginLeft: `${-CARD_W / 2}px`,
                  marginTop: `${-CARD_H / 2}px`,
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px) translateY(${isHovered ? -18 : 0}px)`,
                  opacity,
                  transition: 'opacity 0.3s linear, transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform, opacity',
                  cursor: item.href ? 'pointer' : 'default',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={handleCardClick}
              >
                {card}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = 'CircularGallery';

export { CircularGallery };

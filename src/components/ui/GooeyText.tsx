"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
  id?: string;
}

export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName,
  id,
}: GooeyTextProps) {
  const filterId = `gooey-filter-${id || "default"}`;
  const turbId = `gooey-turb-${id || "default"}`;
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);
  const turbRef = React.useRef<SVGAnimateElement>(null);

  React.useEffect(() => {
    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;
    let animationId: number;

    // Smooth easing: cubic bezier-like
    const ease = (t: number) => {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const setMorph = (fraction: number) => {
      if (text1Ref.current && text2Ref.current) {
        const eased = ease(fraction);

        // Incoming text: sharper blur curve, smooth opacity
        const inBlur = Math.max(0, Math.min(12 / eased - 12, 100));
        text2Ref.current.style.filter = `blur(${inBlur}px)`;
        text2Ref.current.style.opacity = `${Math.pow(eased, 0.3) * 100}%`;

        // Outgoing text: inverse
        const outFraction = 1 - eased;
        const outBlur = Math.max(0, Math.min(12 / outFraction - 12, 100));
        text1Ref.current.style.filter = `blur(${outBlur}px)`;
        text1Ref.current.style.opacity = `${Math.pow(outFraction, 0.3) * 100}%`;
      }
    };

    const doCooldown = () => {
      morph = 0;
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = "";
        text2Ref.current.style.opacity = "100%";
        text1Ref.current.style.filter = "";
        text1Ref.current.style.opacity = "0%";
      }
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    };

    function animate() {
      animationId = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length];
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [texts, morphTime, cooldownTime]);

  const longestText = texts.reduce((a, b) => a.length > b.length ? a : b, "");

  return (
    <div className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            {/* Subtle organic turbulence for liquid feel */}
            <feTurbulence
              id={turbId}
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="3"
              seed="2"
              result="noise"
            >
              <animate
                ref={turbRef}
                attributeName="baseFrequency"
                values="0.015;0.02;0.015"
                dur="8s"
                repeatCount="indefinite"
              />
            </feTurbulence>

            {/* Displace the source slightly using the noise — gives organic warping */}
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
              result="displaced"
            />

            {/* Gaussian blur to merge the two blurred texts into one blob */}
            <feGaussianBlur in="displaced" stdDeviation="0.6" result="blurred" />

            {/* Hard alpha threshold — this is the core gooey effect */}
            <feColorMatrix
              in="blurred"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 300 -150"
              result="thresholded"
            />

            {/* Composite: use thresholded alpha but original colors for crispness */}
            <feComposite in="displaced" in2="thresholded" operator="in" result="crisp" />

            {/* Subtle outer glow for depth */}
            <feGaussianBlur in="crisp" stdDeviation="0.4" result="glow" />
            <feColorMatrix
              in="glow"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 0.15 0"
              result="softGlow"
            />

            {/* Merge glow behind crisp text */}
            <feMerge>
              <feMergeNode in="softGlow" />
              <feMergeNode in="crisp" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center"
        style={{ filter: `url(#${filterId})` }}
      >
        <span
          aria-hidden="true"
          className={cn(
            "invisible inline-block select-none text-center",
            textClassName
          )}
        >
          {longestText}
        </span>
        <span
          ref={text1Ref}
          className={cn(
            "absolute inline-block select-none text-center",
            textClassName
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute inline-block select-none text-center",
            textClassName
          )}
        />
      </div>
    </div>
  );
}

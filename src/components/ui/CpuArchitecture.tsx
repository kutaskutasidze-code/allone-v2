'use client';

import { cn } from "@/lib/utils";
import React from "react";

export interface CpuArchitectureSvgProps {
  className?: string;
  width?: string;
  height?: string;
}

const CpuArchitecture = ({
  className,
  width = "100%",
  height = "100%",
}: CpuArchitectureSvgProps) => {
  return (
    <svg
      className={cn(className)}
      width={width}
      height={height}
      viewBox="0 0 200 100"
    >
      {/* 14 animated orbs on different paths */}
      <g mask="url(#cpu-mask-1)">
        <circle className="cpu-architecture cpu-line-1" cx="0" cy="0" r="10" fill="url(#cpu-blue-grad)" />
      </g>
      <g mask="url(#cpu-mask-2)">
        <circle className="cpu-architecture cpu-line-2" cx="0" cy="0" r="10" fill="url(#cpu-yellow-grad)" />
      </g>
      <g mask="url(#cpu-mask-3)">
        <circle className="cpu-architecture cpu-line-3" cx="0" cy="0" r="10" fill="url(#cpu-pinkish-grad)" />
      </g>
      <g mask="url(#cpu-mask-4)">
        <circle className="cpu-architecture cpu-line-4" cx="0" cy="0" r="10" fill="url(#cpu-white-grad)" />
      </g>
      <g mask="url(#cpu-mask-5)">
        <circle className="cpu-architecture cpu-line-5" cx="0" cy="0" r="10" fill="url(#cpu-green-grad)" />
      </g>
      <g mask="url(#cpu-mask-6)">
        <circle className="cpu-architecture cpu-line-6" cx="0" cy="0" r="10" fill="url(#cpu-orange-grad)" />
      </g>
      <g mask="url(#cpu-mask-7)">
        <circle className="cpu-architecture cpu-line-7" cx="0" cy="0" r="10" fill="url(#cpu-cyan-grad)" />
      </g>
      <g mask="url(#cpu-mask-8)">
        <circle className="cpu-architecture cpu-line-8" cx="0" cy="0" r="10" fill="url(#cpu-rose-grad)" />
      </g>
      {/* Additional orbs */}
      <g mask="url(#cpu-mask-9)">
        <circle className="cpu-architecture cpu-line-9" cx="0" cy="0" r="10" fill="url(#cpu-violet-grad)" />
      </g>
      <g mask="url(#cpu-mask-10)">
        <circle className="cpu-architecture cpu-line-10" cx="0" cy="0" r="10" fill="url(#cpu-lime-grad)" />
      </g>
      <g mask="url(#cpu-mask-11)">
        <circle className="cpu-architecture cpu-line-11" cx="0" cy="0" r="8" fill="url(#cpu-blue-grad)" />
      </g>
      <g mask="url(#cpu-mask-12)">
        <circle className="cpu-architecture cpu-line-12" cx="0" cy="0" r="8" fill="url(#cpu-amber-grad)" />
      </g>
      <g mask="url(#cpu-mask-13)">
        <circle className="cpu-architecture cpu-line-13" cx="0" cy="0" r="8" fill="url(#cpu-pinkish-grad)" />
      </g>
      <g mask="url(#cpu-mask-14)">
        <circle className="cpu-architecture cpu-line-14" cx="0" cy="0" r="8" fill="url(#cpu-cyan-grad)" />
      </g>

      <defs>
        {/* Random directions — crossing, diverging, no common center */}
        <mask id="cpu-mask-1">
          <path d="M 80 45 h -40 q -5 0 -5 -5 v -15 q 0 -5 -5 -5 h -25" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-2">
          <path d="M 60 10 v 25 q 0 5 5 5 h 40 q 5 0 5 5 v 30 q 0 5 5 5 h 30" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-3">
          <path d="M 140 55 h 30 q 5 0 5 5 v 20 q 0 5 5 5 h 20" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-4">
          <path d="M 170 80 v -30 q 0 -5 -5 -5 h -35 q -5 0 -5 -5 v -25 q 0 -5 5 -5 h 10" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-5">
          <path d="M 30 70 h 25 q 5 0 5 5 v 25" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-6">
          <path d="M 120 95 v -20 q 0 -5 5 -5 h 30 q 5 0 5 -5 v -30 q 0 -5 5 -5 h 15" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-7">
          <path d="M 160 15 h -50 q -5 0 -5 5 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-8">
          <path d="M 95 85 v -25 q 0 -5 -5 -5 h -30 q -5 0 -5 -5 v -25 q 0 -5 -5 -5 h -20 v -20" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-9">
          <path d="M 15 40 h 30 q 5 0 5 5 v 35 q 0 5 5 5 h 45" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-10">
          <path d="M 190 50 h -35 q -5 0 -5 -5 v -20 q 0 -5 -5 -5 h -40 q -5 0 -5 5 v 15" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-11">
          <path d="M 75 0 v 20 q 0 5 -5 5 h -25 q -5 0 -5 5 v 10 q 0 5 -5 5 h -35" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-12">
          <path d="M 50 95 v -15 q 0 -5 -5 -5 h -20 q -5 0 -5 -5 v -30" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-13">
          <path d="M 130 5 v 30 q 0 5 5 5 h 20 q 5 0 5 5 v 20 q 0 5 -5 5 h -25" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-14">
          <path d="M 185 75 h -40 q -5 0 -5 -5 v -15 q 0 -5 -5 -5 h -15 v -20 q 0 -5 -5 -5 h -10" strokeWidth="0.5" stroke="white" />
        </mask>

        <radialGradient id="cpu-blue-grad" fx="1">
          <stop offset="0%" stopColor="#00E8ED" />
          <stop offset="50%" stopColor="#08F" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-yellow-grad" fx="1">
          <stop offset="0%" stopColor="#FFD800" />
          <stop offset="50%" stopColor="#FFD800" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-pinkish-grad" fx="1">
          <stop offset="0%" stopColor="#830CD1" />
          <stop offset="50%" stopColor="#FF008B" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-white-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-green-grad" fx="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad" fx="1">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-cyan-grad" fx="1">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-rose-grad" fx="1">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-violet-grad" fx="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-lime-grad" fx="1">
          <stop offset="0%" stopColor="#84cc16" />
          <stop offset="50%" stopColor="#65a30d" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="cpu-amber-grad" fx="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export { CpuArchitecture };

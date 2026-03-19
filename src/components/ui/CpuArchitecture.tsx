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
      overflow="hidden"
    >
      {/* ALL defs merged at TOP — masks, gradients, filter defined before use */}
      <defs>
        {/* Elongated electric streaks */}
        <ellipse id="spark-lg" rx="12" ry="3" />
        <ellipse id="spark-sm" rx="9" ry="2.5" />

        {/* Tight electric glow */}
        <filter id="cpu-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" result="glow" />
          <feColorMatrix in="glow" type="saturate" values="2.5" result="sat" />
          <feMerge>
            <feMergeNode in="sat" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Extended paths — longer routes for each orb */}
        <mask id="cpu-mask-1">
          <path d="M 80 45 h -40 q -5 0 -5 -5 v -15 q 0 -5 -5 -5 h -25 q -5 0 -5 5 v 30 q 0 5 5 5 h 40 q 5 0 5 5 v 20" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-2">
          <path d="M 60 10 v 25 q 0 5 5 5 h 40 q 5 0 5 5 v 30 q 0 5 5 5 h 30 q 5 0 5 -5 v -25 q 0 -5 -5 -5 h -20" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-3">
          <path d="M 140 55 h 30 q 5 0 5 5 v 20 q 0 5 5 5 h 20 v -40 q 0 -5 -5 -5 h -35 q -5 0 -5 -5 v -15" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-4">
          <path d="M 170 80 v -30 q 0 -5 -5 -5 h -35 q -5 0 -5 -5 v -25 q 0 -5 5 -5 h 10 q 5 0 5 -5 v -10 q 0 -5 -5 -5 h -30 q -5 0 -5 5 v 20" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-5">
          <path d="M 30 70 h 25 q 5 0 5 5 v 25 h 30 q 5 0 5 -5 v -40 q 0 -5 -5 -5 h -20 q -5 0 -5 -5 v -15" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-6">
          <path d="M 120 95 v -20 q 0 -5 5 -5 h 30 q 5 0 5 -5 v -30 q 0 -5 5 -5 h 15 q 5 0 5 -5 v -15 q 0 -5 -5 -5 h -25" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-7">
          <path d="M 160 15 h -50 q -5 0 -5 5 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10 q 0 5 5 5 h 40 q 5 0 5 5 v 20 q 0 5 -5 5 h -30" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-8">
          <path d="M 95 85 v -25 q 0 -5 -5 -5 h -30 q -5 0 -5 -5 v -25 q 0 -5 -5 -5 h -20 v -20 q 0 -5 5 -5 h 35 q 5 0 5 5 v 30" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-9">
          <path d="M 15 40 h 30 q 5 0 5 5 v 35 q 0 5 5 5 h 45 q 5 0 5 -5 v -20 q 0 -5 5 -5 h 25 q 5 0 5 5 v 15" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-10">
          <path d="M 190 50 h -35 q -5 0 -5 -5 v -20 q 0 -5 -5 -5 h -40 q -5 0 -5 5 v 15 q 0 5 -5 5 h -30 q -5 0 -5 5 v 25 q 0 5 5 5 h 20" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-11">
          <path d="M 75 0 v 20 q 0 5 -5 5 h -25 q -5 0 -5 5 v 10 q 0 5 -5 5 h -35 q -5 0 -5 5 v 20 q 0 5 5 5 h 40" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-12">
          <path d="M 50 95 v -15 q 0 -5 -5 -5 h -20 q -5 0 -5 -5 v -30 q 0 -5 5 -5 h 35 q 5 0 5 -5 v -15 q 0 -5 -5 -5 h -25" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-13">
          <path d="M 130 5 v 30 q 0 5 5 5 h 20 q 5 0 5 5 v 20 q 0 5 -5 5 h -25 q -5 0 -5 5 v 15 q 0 5 5 5 h 30" strokeWidth="0.5" stroke="white" />
        </mask>
        <mask id="cpu-mask-14">
          <path d="M 185 75 h -40 q -5 0 -5 -5 v -15 q 0 -5 -5 -5 h -15 v -20 q 0 -5 -5 -5 h -10 q -5 0 -5 5 v 25 q 0 5 -5 5 h -30 q -5 0 -5 5 v 10" strokeWidth="0.5" stroke="white" />
        </mask>

        <radialGradient id="cpu-blue-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#00FFFF" />
          <stop offset="70%" stopColor="#0088FF" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-yellow-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#00EAFF" />
          <stop offset="70%" stopColor="#0066FF" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-pinkish-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#A78BFA" />
          <stop offset="70%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-white-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#E0F2FE" />
          <stop offset="70%" stopColor="#7DD3FC" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-green-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#00FFD0" />
          <stop offset="70%" stopColor="#00C9A7" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-orange-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#00D4FF" />
          <stop offset="70%" stopColor="#0099FF" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-cyan-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#00FFF0" />
          <stop offset="70%" stopColor="#00BBDD" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-rose-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#A78BFA" />
          <stop offset="70%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-violet-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#22D3EE" />
          <stop offset="70%" stopColor="#0891B2" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-lime-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#00FFAA" />
          <stop offset="70%" stopColor="#00CC88" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cpu-amber-grad" fx="1">
          <stop offset="0%" stopColor="white" />
          <stop offset="10%" stopColor="#38BDF8" />
          <stop offset="70%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 14 animated sparks — with electric glow */}
      <g filter="url(#cpu-glow)">
      <g mask="url(#cpu-mask-1)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-1" fill="url(#cpu-blue-grad)" />
      </g>
      <g mask="url(#cpu-mask-2)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-2" fill="url(#cpu-yellow-grad)" />
      </g>
      <g mask="url(#cpu-mask-3)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-3" fill="url(#cpu-pinkish-grad)" />
      </g>
      <g mask="url(#cpu-mask-4)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-4" fill="url(#cpu-white-grad)" />
      </g>
      <g mask="url(#cpu-mask-5)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-5" fill="url(#cpu-green-grad)" />
      </g>
      <g mask="url(#cpu-mask-6)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-6" fill="url(#cpu-orange-grad)" />
      </g>
      <g mask="url(#cpu-mask-7)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-7" fill="url(#cpu-cyan-grad)" />
      </g>
      <g mask="url(#cpu-mask-8)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-8" fill="url(#cpu-rose-grad)" />
      </g>
      <g mask="url(#cpu-mask-9)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-9" fill="url(#cpu-violet-grad)" />
      </g>
      <g mask="url(#cpu-mask-10)">
        <use href="#spark-lg" className="cpu-architecture cpu-line-10" fill="url(#cpu-lime-grad)" />
      </g>
      <g mask="url(#cpu-mask-11)">
        <use href="#spark-sm" className="cpu-architecture cpu-line-11" fill="url(#cpu-blue-grad)" />
      </g>
      <g mask="url(#cpu-mask-12)">
        <use href="#spark-sm" className="cpu-architecture cpu-line-12" fill="url(#cpu-amber-grad)" />
      </g>
      <g mask="url(#cpu-mask-13)">
        <use href="#spark-sm" className="cpu-architecture cpu-line-13" fill="url(#cpu-pinkish-grad)" />
      </g>
      <g mask="url(#cpu-mask-14)">
        <use href="#spark-sm" className="cpu-architecture cpu-line-14" fill="url(#cpu-cyan-grad)" />
      </g>
      </g>
    </svg>
  );
};

export { CpuArchitecture };

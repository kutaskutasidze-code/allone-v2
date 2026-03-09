"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface ShineBorderProps {
  borderRadius?: number;
  borderWidth?: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

/**
 * @name Shine Border
 * @description A dynamic rotating glowing border effect with cold tints.
 */
function ShineBorder({
  borderRadius = 20,
  borderWidth = 2,
  duration = 8,
  className,
  children,
}: ShineBorderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden", 
        className
      )}
      style={{
        borderRadius: `${borderRadius}px`,
        padding: `${borderWidth}px`,
      }}
    >
      {/* The rotating gradient background */}
      <div 
        className="absolute inset-[-1000%] animate-[spin_var(--duration)_linear_infinite] opacity-60"
        style={{
          "--duration": `${duration}s`,
          background: "conic-gradient(from 0deg, transparent 0 340deg, #0A68F5 360deg)",
        } as React.CSSProperties}
      />
      
      {/* The static background color of the card */}
      <div 
        className="relative h-full w-full bg-white overflow-hidden"
        style={{
          borderRadius: `${borderRadius - borderWidth}px`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export { ShineBorder }

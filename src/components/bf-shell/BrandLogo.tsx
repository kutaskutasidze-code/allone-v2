"use client";

import Image from "next/image";

type LogoSize = "sm" | "md" | "lg" | number;
type LogoVariant = "mark" | "wordmark";

const SIZE_PX: Record<Exclude<LogoSize, number>, number> = {
  sm: 20,
  md: 28,
  lg: 36,
};

interface BrandLogoProps {
  size?: LogoSize;
  variant?: LogoVariant;
}

export function BrandLogo({ size = "md", variant = "mark" }: BrandLogoProps) {
  const px = typeof size === "number" ? size : SIZE_PX[size];
  if (variant === "wordmark") {
    return (
      <span
        className="font-semibold tracking-tight"
        style={{ fontSize: px * 0.45, color: "var(--ink-900)" }}
      >
        Allone Labs
      </span>
    );
  }
  // Allone mark — swoosh + dot. The source PNG is wider than tall
  // (362×192), so we render at a 2:1 ratio anchored to the requested
  // height so the swoosh keeps its full proportion instead of being
  // squished into a square.
  const h = Math.round(px * 0.9);
  const w = Math.round(h * (362 / 192));
  return (
    <Image
      src="/images/allone-logo-mark.png"
      alt="Allone Labs"
      width={w}
      height={h}
      priority
      style={{ display: "block", width: w, height: h }}
    />
  );
}

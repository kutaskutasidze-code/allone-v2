"use client";

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

export function BrandLogo({
  size = "md",
  variant = "mark",
}: BrandLogoProps) {
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
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Allone Labs"
    >
      <rect x="0.5" y="0.5" width="27" height="27" rx="6.5" fill="#0047FF" />
      <text
        x="14"
        y="19"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="14"
        fontWeight="700"
        fill="#FFFFFF"
      >
        A
      </text>
    </svg>
  );
}

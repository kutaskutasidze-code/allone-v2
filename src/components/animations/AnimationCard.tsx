'use client';

import { useReplay } from './shared/useReplay';

interface AnimationCardProps {
  title: string;
  description: string;
  children: (key: number) => React.ReactNode;
}

export function AnimationCard({ title, description, children }: AnimationCardProps) {
  const { key, replay } = useReplay();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="font-display text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/50 mt-1">{description}</p>
      </div>
      <div className="relative aspect-square mx-4 mb-4 rounded-xl bg-[#071D2F]/60 overflow-hidden">
        {children(key)}
      </div>
      <div className="px-5 pb-4 flex justify-end">
        <button
          onClick={replay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white text-xs font-medium transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          Replay
        </button>
      </div>
    </div>
  );
}

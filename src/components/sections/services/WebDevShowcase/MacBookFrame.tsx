'use client';

interface MacBookFrameProps {
  children: React.ReactNode;
}

export function MacBookFrame({ children }: MacBookFrameProps) {
  return (
    <div className="relative mx-auto w-full max-w-[900px]">
      {/* Shadow */}
      <div className="absolute -bottom-8 left-[12%] right-[12%] h-12 bg-black/20 blur-2xl rounded-[50%]" />

      {/* ─── Screen lid ─── */}
      <div className="relative rounded-[8px] sm:rounded-[12px] overflow-hidden bg-[#1d1d1f] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.3)]">
        {/* Bezel */}
        <div className="bg-[#0a0a0a] px-[4px] pb-[4px] pt-[4px] sm:px-[8px] sm:pb-[8px] sm:pt-[8px]">
          {/* Screen + notch */}
          <div className="relative rounded-[4px] overflow-hidden bg-black" style={{ aspectRatio: '16 / 10', containerType: 'inline-size' }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30">
              <div className="relative w-[40px] h-[10px] sm:w-[70px] sm:h-[16px] bg-[#0a0a0a] rounded-b-[6px] sm:rounded-b-[10px] flex items-center justify-center">
                <div className="w-[3px] h-[3px] sm:w-[4px] sm:h-[4px] rounded-full bg-[#1a1a2a] shadow-[inset_0_0_2px_rgba(255,255,255,0.08),0_0_0_0.5px_rgba(255,255,255,0.05)]" />
              </div>
            </div>

            {children}

            <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-br from-white/[0.02] via-transparent to-transparent" />
          </div>
        </div>
      </div>

      {/* ─── Base ─── */}
      <div className="relative mx-[-3%]">
        <div className="relative h-[11px] sm:h-[18px] rounded-b-[4px] sm:rounded-b-[8px] shadow-[0_3px_8px_rgba(0,0,0,0.2),0_1px_3px_rgba(0,0,0,0.15)]" style={{ background: 'linear-gradient(180deg, #2a2a2e 0%, #1d1d1f 25%, #252528 65%, #323236 92%, #1c1c1e 100%)' }}>
          {/* Top edge highlight — aluminum catch */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-[#3a3a3c] via-[#555] to-[#3a3a3c]" />
          {/* Brushed texture */}
          <div className="absolute inset-0 rounded-b-[4px] sm:rounded-b-[8px] opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.15) 1px, rgba(255,255,255,0.15) 2px)' }} />
          {/* Bottom edge — chamfer highlight */}
          <div className="absolute bottom-0 left-[3%] right-[3%] h-[1px] bg-gradient-to-r from-transparent via-[#4a4a4e] to-transparent" />
          {/* Finger cutout */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[12%] h-[3px] sm:h-[5px] rounded-b-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),inset_0_0_2px_rgba(0,0,0,0.3)]" style={{ background: 'linear-gradient(180deg, #111113, #181819)' }} />
        </div>
      </div>
    </div>
  );
}

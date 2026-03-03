'use client';

/**
 * Layered Browser Screens visual for Website Development card
 * Shows three stacked browser windows with abstract content — dark palette
 */
export function LayeredScreens() {
  return (
    <div className="relative w-full h-[220px]">
      {/* Back screen - furthest */}
      <div
        className="absolute w-[160px] h-[110px] rounded-sm bg-white/[0.04] border border-white/10 overflow-hidden"
        style={{
          top: '5%',
          left: '5%',
          transform: 'rotate(-6deg)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
        }}
      >
        {/* Browser chrome */}
        <div className="h-4 bg-white/[0.03] border-b border-white/10 flex items-center px-2 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        {/* Abstract hero content */}
        <div className="p-2.5">
          <div className="w-10 h-1.5 bg-white/10 rounded mb-1.5" />
          <div className="w-16 h-1 bg-white/[0.06] rounded mb-2" />
          <div className="flex gap-1">
            <div className="w-6 h-2.5 bg-white/10 rounded" />
            <div className="w-6 h-2.5 bg-white/[0.06] rounded" />
          </div>
        </div>
      </div>

      {/* Middle screen */}
      <div
        className="absolute w-[160px] h-[110px] rounded-sm bg-white/[0.04] border border-white/10 overflow-hidden"
        style={{
          top: '20%',
          left: '22%',
          transform: 'rotate(-2deg)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)'
        }}
      >
        {/* Browser chrome */}
        <div className="h-4 bg-white/[0.03] border-b border-white/10 flex items-center px-2 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        {/* Abstract dashboard content */}
        <div className="p-2.5">
          <div className="flex gap-1.5 mb-2">
            <div className="w-8 h-5 bg-white/[0.06] rounded" />
            <div className="w-8 h-5 bg-white/[0.06] rounded" />
          </div>
          <div className="w-full h-6 bg-white/[0.04] rounded" />
        </div>
      </div>

      {/* Front screen - closest */}
      <div
        className="absolute w-[160px] h-[110px] rounded-sm bg-white/[0.04] border border-white/10 overflow-hidden"
        style={{
          top: '35%',
          left: '40%',
          transform: 'rotate(3deg)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.4)'
        }}
      >
        {/* Browser chrome */}
        <div className="h-4 bg-white/[0.03] border-b border-white/10 flex items-center px-2 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
        {/* Abstract form content */}
        <div className="p-2.5">
          <div className="w-12 h-1.5 bg-white/15 rounded mb-1.5" />
          <div className="w-full h-3 bg-white/[0.06] rounded mb-1.5" />
          <div className="w-full h-3 bg-white/[0.06] rounded mb-1.5" />
          <div className="w-10 h-3 bg-[var(--accent)] rounded opacity-50" />
        </div>
      </div>
    </div>
  );
}

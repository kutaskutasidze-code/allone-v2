'use client';

/**
 * Layered Browser Screens visual for Website Development card
 * Shows three stacked browser windows with abstract content — light palette
 */
export function LayeredScreens() {
  return (
    <div className="relative w-full h-[220px]">
      {/* Back screen - furthest */}
      <div
        className="absolute w-[160px] h-[110px] rounded-sm bg-[#F8FAFE] border border-[#DCE9F6] overflow-hidden"
        style={{
          top: '5%',
          left: '5%',
          transform: 'rotate(-6deg)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)'
        }}
      >
        {/* Browser chrome */}
        <div className="h-4 bg-[#F1F6FB] border-b border-[#DCE9F6] flex items-center px-2 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
        </div>
        {/* Abstract hero content */}
        <div className="p-2.5">
          <div className="w-10 h-1.5 bg-[#DCE9F6] rounded mb-1.5" />
          <div className="w-16 h-1 bg-[#E8EEF4] rounded mb-2" />
          <div className="flex gap-1">
            <div className="w-6 h-2.5 bg-[#DCE9F6] rounded" />
            <div className="w-6 h-2.5 bg-[#E8EEF4] rounded" />
          </div>
        </div>
      </div>

      {/* Middle screen */}
      <div
        className="absolute w-[160px] h-[110px] rounded-sm bg-[#F8FAFE] border border-[#DCE9F6] overflow-hidden"
        style={{
          top: '20%',
          left: '22%',
          transform: 'rotate(-2deg)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)'
        }}
      >
        {/* Browser chrome */}
        <div className="h-4 bg-[#F1F6FB] border-b border-[#DCE9F6] flex items-center px-2 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
        </div>
        {/* Abstract dashboard content */}
        <div className="p-2.5">
          <div className="flex gap-1.5 mb-2">
            <div className="w-8 h-5 bg-[#E8EEF4] rounded" />
            <div className="w-8 h-5 bg-[#E8EEF4] rounded" />
          </div>
          <div className="w-full h-6 bg-[#E8EEF4] rounded" />
        </div>
      </div>

      {/* Front screen - closest */}
      <div
        className="absolute w-[160px] h-[110px] rounded-sm bg-[#F8FAFE] border border-[#DCE9F6] overflow-hidden"
        style={{
          top: '35%',
          left: '40%',
          transform: 'rotate(3deg)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.06)'
        }}
      >
        {/* Browser chrome */}
        <div className="h-4 bg-[#F1F6FB] border-b border-[#DCE9F6] flex items-center px-2 gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#DCE9F6]" />
        </div>
        {/* Abstract form content */}
        <div className="p-2.5">
          <div className="w-12 h-1.5 bg-[#DCE9F6] rounded mb-1.5" />
          <div className="w-full h-3 bg-[#E8EEF4] rounded mb-1.5" />
          <div className="w-full h-3 bg-[#E8EEF4] rounded mb-1.5" />
          <div className="w-10 h-3 bg-[var(--accent)] rounded opacity-70" />
        </div>
      </div>
    </div>
  );
}

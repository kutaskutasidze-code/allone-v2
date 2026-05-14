'use client';

import { useEffect, useState } from 'react';
import { Flame, ChevronDown } from 'lucide-react';

interface IndustryRow {
  industry: string;
  count: number;
}

interface HotLinesDropdownProps {
  selectedIndustry: string | null;
  onSelect: (industry: string | null) => void;
  sourceFilter?: string;
  endpoint?: string;
}

export function HotLinesDropdown({ selectedIndustry, onSelect, sourceFilter, endpoint = '/api/sales/leads/industries' }: HotLinesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<IndustryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const qs = sourceFilter ? `?source=${encodeURIComponent(sourceFilter)}` : '';
        const res = await fetch(`${endpoint}${qs}`);
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        const data = (json.data || []) as IndustryRow[];
        setRows(data);
        setTotal(data.reduce((sum, r) => sum + r.count, 0));
      } catch {
        // silent
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sourceFilter, endpoint]);

  const active = selectedIndustry !== null;
  const buttonLabel = selectedIndustry ?? 'Hot Lines';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
          active
            ? 'bg-amber-500 text-white shadow-sm'
            : 'bg-white border border-gray-200 text-gray-700 hover:border-gray-300'
        }`}
      >
        <Flame className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-amber-500'}`} />
        <span className="truncate max-w-[160px]">{buttonLabel}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg shadow-black/[0.08] py-1 min-w-[240px] max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-6 flex justify-center">
                <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => { onSelect(null); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50 transition-colors ${
                    selectedIndustry === null ? 'font-semibold' : ''
                  }`}
                >
                  <span>All</span>
                  <span className="text-[10px] text-gray-400 tabular-nums">{total.toLocaleString()}</span>
                </button>
                {rows.length > 0 && <div className="my-1 mx-2 h-px bg-gray-100" />}
                {rows.map((r) => (
                  <button
                    key={r.industry}
                    onClick={() => { onSelect(r.industry); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50 transition-colors ${
                      selectedIndustry === r.industry ? 'font-semibold' : ''
                    }`}
                  >
                    <span className="truncate">{r.industry}</span>
                    <span className="text-[10px] text-gray-400 tabular-nums shrink-0">{r.count.toLocaleString()}</span>
                  </button>
                ))}
                {!isLoading && rows.length === 0 && (
                  <div className="px-3 py-4 text-xs text-gray-400 text-center">No industries yet</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

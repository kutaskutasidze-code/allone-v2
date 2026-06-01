'use client';

import { useEffect, useState } from 'react';
import { Flame, ChevronDown, type LucideIcon } from 'lucide-react';

interface IndustryRow {
  industry: string;
  count: number;
}

interface HotLinesDropdownProps {
  selectedIndustry: string | null;
  onSelect: (industry: string | null) => void;
  phonePrefix?: string;
  excludePhonePrefix?: string;
  endpoint?: string;
  label?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  activeClassName?: string;
}

export function HotLinesDropdown({
  selectedIndustry,
  onSelect,
  phonePrefix,
  excludePhonePrefix,
  endpoint = '/api/sales/leads/industries',
  label = 'Hot Lines',
  icon: Icon = Flame,
  iconClassName = 'text-amber-500',
  activeClassName = 'bg-amber-500 text-white shadow-[var(--shadow-xs)]',
}: HotLinesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<IndustryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (phonePrefix) params.set('phone_prefix', phonePrefix);
        if (excludePhonePrefix) params.set('exclude_phone_prefix', excludePhonePrefix);
        const qs = params.toString() ? `?${params.toString()}` : '';
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
  }, [phonePrefix, excludePhonePrefix, endpoint]);

  const active = selectedIndustry !== null;
  const buttonLabel = selectedIndustry ?? label;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-sm)] text-xs font-medium transition-all ${
          active
            ? activeClassName
            : 'bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)]'
        }`}
      >
        <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : iconClassName}`} />
        <span className="truncate max-w-[160px]">{buttonLabel}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 bg-[var(--bg-surface)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] shadow-[var(--shadow-md)] shadow-black/[0.08] py-1 min-w-[240px] max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-6 flex justify-center">
                <div className="w-4 h-4 border-2 border-[var(--allone-line)] border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => { onSelect(null); setOpen(false); }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-surface-alt)] transition-colors ${
                    selectedIndustry === null ? 'font-semibold' : ''
                  }`}
                >
                  <span>All</span>
                  <span className="text-[10px] text-[var(--ink-400)] tabular-nums">{total.toLocaleString()}</span>
                </button>
                {rows.length > 0 && <div className="my-1 mx-2 h-px bg-[var(--bg-sunken)]" />}
                {rows.map((r) => (
                  <button
                    key={r.industry}
                    onClick={() => { onSelect(r.industry); setOpen(false); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-left text-xs hover:bg-[var(--bg-surface-alt)] transition-colors ${
                      selectedIndustry === r.industry ? 'font-semibold' : ''
                    }`}
                  >
                    <span className="truncate">{r.industry}</span>
                    <span className="text-[10px] text-[var(--ink-400)] tabular-nums shrink-0">{r.count.toLocaleString()}</span>
                  </button>
                ))}
                {!isLoading && rows.length === 0 && (
                  <div className="px-3 py-4 text-xs text-[var(--ink-400)] text-center">No industries yet</div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

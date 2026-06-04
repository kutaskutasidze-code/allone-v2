"use client";

import { useState } from "react";
import { Bookmark, Plus, Trash2, ChevronDown } from "lucide-react";

interface SavedView<F> {
  name: string;
  filters: F;
}

/**
 * Named, localStorage-backed filter presets for a list. Generic over the
 * filter shape `F`. Save the current filters under a name; click a saved view
 * to re-apply it. Per-browser (no server sync).
 */
export function SavedViews<F>({
  storageKey,
  current,
  onApply,
}: {
  storageKey: string;
  current: F;
  onApply: (filters: F) => void;
}) {
  const [views, setViews] = useState<SavedView<F>[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  const persist = (next: SavedView<F>[]) => {
    setViews(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const saveCurrent = () => {
    const name = prompt("Name this view")?.trim();
    if (!name) return;
    persist([...views.filter((v) => v.name !== name), { name, filters: current }]);
  };

  const remove = (name: string) =>
    persist(views.filter((v) => v.name !== name));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--bg-surface)] border border-[var(--allone-line)] text-[var(--ink-700)] hover:border-[var(--allone-line-strong)] transition-colors"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Views
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] py-1 shadow-[var(--shadow-md)] shadow-black/[0.08]">
            <button
              onClick={() => {
                saveCurrent();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-[var(--ink-800)] hover:bg-[var(--bg-surface-alt)]"
            >
              <Plus className="h-3.5 w-3.5" />
              Save current view
            </button>
            {views.length > 0 && (
              <div className="my-1 border-t border-[var(--allone-line-soft)]" />
            )}
            {views.map((v) => (
              <div
                key={v.name}
                className="group flex items-center justify-between px-3 py-1.5 text-xs hover:bg-[var(--bg-surface-alt)]"
              >
                <button
                  onClick={() => {
                    onApply(v.filters);
                    setOpen(false);
                  }}
                  className="flex-1 truncate text-left text-[var(--ink-800)]"
                >
                  {v.name}
                </button>
                <button
                  onClick={() => remove(v.name)}
                  className="ml-2 text-[var(--ink-400)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                  aria-label={`Delete view ${v.name}`}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {views.length === 0 && (
              <div className="px-3 py-1.5 text-[11px] text-[var(--ink-400)]">
                No saved views yet.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

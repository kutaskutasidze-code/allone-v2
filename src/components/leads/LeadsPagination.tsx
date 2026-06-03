"use client";

interface LeadsPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Format the "{total} leads" count. Defaults to `${total} leads`. */
  formatTotal?: (total: number) => string;
}

export function LeadsPagination({
  page,
  totalPages,
  total,
  onPageChange,
  formatTotal,
}: LeadsPaginationProps) {
  if (totalPages <= 1) return null;

  const btn =
    "px-2.5 py-1.5 text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-30 transition-colors";

  return (
    <div className="flex items-center justify-between pt-4">
      <span className="text-xs text-[var(--ink-500)]">
        {formatTotal ? formatTotal(total) : `${total} leads`}
      </span>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onPageChange(1)} disabled={page === 1} className={btn}>
          First
        </button>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={btn}
        >
          Prev
        </button>
        <div className="flex items-center gap-1 text-xs text-[var(--ink-500)]">
          <input
            type="number"
            min={1}
            max={totalPages}
            defaultValue={page}
            key={page}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = parseInt((e.target as HTMLInputElement).value);
                if (v >= 1 && v <= totalPages) onPageChange(v);
              }
            }}
            onBlur={(e) => {
              const v = parseInt(e.target.value);
              if (v >= 1 && v <= totalPages) onPageChange(v);
            }}
            className="w-12 py-1.5 text-center text-xs rounded-[var(--radius-sm)] border border-[var(--allone-line)] focus:border-gray-400 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span>of {totalPages}</span>
        </div>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={btn}
        >
          Next
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className={btn}
        >
          Last
        </button>
      </div>
    </div>
  );
}

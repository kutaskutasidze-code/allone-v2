"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
  forwardRef,
} from "react";
import {
  ArrowRightLeft,
  Phone,
  CheckSquare,
  Calendar,
  Mail,
  Sparkles,
  StickyNote,
  AlertCircle,
  Activity,
} from "lucide-react";

interface StreamEvent {
  id: string;
  kind: "status" | "call" | "task" | "meeting" | "email" | "demo" | "note";
  at: string;
  actorId: string | null;
  actorName: string | null;
  title: string;
  detail?: string;
  meta?: Record<string, unknown>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeadStreamHandle {
  refresh: () => void;
}

const KIND_ICON: Record<StreamEvent["kind"], typeof Phone> = {
  status: ArrowRightLeft,
  call: Phone,
  task: CheckSquare,
  meeting: Calendar,
  email: Mail,
  demo: Sparkles,
  note: StickyNote,
};

const KIND_TINT: Record<StreamEvent["kind"], string> = {
  status: "bg-blue-50 text-blue-600",
  call: "bg-emerald-50 text-emerald-600",
  task: "bg-amber-50 text-amber-600",
  meeting: "bg-purple-50 text-purple-600",
  email: "bg-sky-50 text-sky-600",
  demo: "bg-indigo-50 text-indigo-600",
  note: "bg-[var(--bg-surface-alt)] text-[var(--ink-500)]",
};

const formatRelative = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
};

const formatAbsolute = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  leadId: string;
  apiBase: "/api/sales" | "/api/admin";
}

export const LeadStream = forwardRef<LeadStreamHandle, Props>(
  function LeadStream({ leadId, apiBase }, ref) {
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState("");

    const limit = 20;

    const load = useCallback(
      async (targetPage: number) => {
        const append = targetPage > 1;
        if (append) setIsLoadingMore(true);
        else setIsLoading(true);
        setError("");
        try {
          const res = await fetch(
            `${apiBase}/leads/${leadId}/stream?page=${targetPage}&limit=${limit}`,
          );
          if (!res.ok) throw new Error("Failed");
          const json = await res.json();
          const next: StreamEvent[] = json.data || [];
          setEvents((prev) => (append ? [...prev, ...next] : next));
          setPagination(json.pagination || null);
          setPage(targetPage);
        } catch {
          setError("Failed to load activity");
        } finally {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      },
      [apiBase, leadId],
    );

    useEffect(() => {
      load(1);
    }, [load]);

    useImperativeHandle(ref, () => ({ refresh: () => load(1) }), [load]);

    const hasMore = pagination ? page < pagination.totalPages : false;

    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="w-5 h-5 border-2 border-[var(--allone-line)] border-t-[var(--ink-900)] rounded-full animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-[var(--radius-sm)] text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => load(1)} className="text-xs underline">
            Retry
          </button>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center text-center py-12 gap-3">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-alt)] flex items-center justify-center">
            <Activity className="w-6 h-6 text-[var(--ink-400)]" />
          </div>
          <p className="text-sm font-medium text-[var(--ink-900)]">
            No activity yet
          </p>
          <p className="text-xs text-[var(--ink-500)] max-w-xs">
            Calls, follow-ups, status changes, and notes will show up here.
          </p>
        </div>
      );
    }

    return (
      <div>
        <ol className="relative">
          {events.map((ev, idx) => {
            const Icon = KIND_ICON[ev.kind] ?? StickyNote;
            const tint = KIND_TINT[ev.kind] ?? KIND_TINT.note;
            const isLast = idx === events.length - 1;
            return (
              <li key={ev.id} className="relative flex gap-3 pb-5">
                {!isLast && (
                  <span
                    className="absolute left-[15px] top-8 bottom-0 w-px bg-[var(--allone-line-soft)]"
                    aria-hidden
                  />
                )}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tint}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-[var(--ink-900)] leading-snug">
                    {ev.title}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--ink-500)]">
                    {ev.actorName && (
                      <>
                        <span className="text-[var(--ink-700)]">
                          {ev.actorName}
                        </span>
                        <span className="text-[var(--ink-300)]">·</span>
                      </>
                    )}
                    <span title={formatAbsolute(ev.at)}>
                      {formatRelative(ev.at)}
                    </span>
                  </div>
                  {ev.detail && (
                    <div className="mt-2 text-xs text-[var(--ink-700)] bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] px-3 py-2 whitespace-pre-wrap break-words">
                      {ev.detail}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        {hasMore && (
          <button
            onClick={() => load(page + 1)}
            disabled={isLoadingMore}
            className="w-full mt-1 py-2 text-xs font-medium text-[var(--ink-700)] border border-[var(--allone-line)] rounded-[var(--radius-sm)] hover:bg-[var(--bg-surface-alt)] disabled:opacity-50 transition-colors"
          >
            {isLoadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    );
  },
);

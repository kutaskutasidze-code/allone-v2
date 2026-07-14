'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  at: string; // ISO timestamp
  unread: boolean;
  href?: string;
  kind: 'proposal' | 'deploy' | 'firing' | 'billing' | 'team' | 'system' | 'followup';
}

const POLL_MS = 45_000;

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.round((Date.now() - then) / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  // Stop polling once we learn this surface isn't a sales session (401/403);
  // the topbar is shared across apps, so the feed may not apply here.
  const disabledRef = useRef(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (disabledRef.current) return;
    try {
      const res = await fetch('/api/sales/notifications/feed', { cache: 'no-store' });
      if (res.status === 401 || res.status === 403) {
        disabledRef.current = true;
        return;
      }
      if (!res.ok) return;
      const json = await res.json();
      const data = json?.data ?? {};
      setItems(Array.isArray(data.items) ? data.items : []);
      setUnread(typeof data.unread === 'number' ? data.unread : 0);
    } catch {
      // network hiccup — keep the last known state
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const markAll = useCallback(async () => {
    setItems((it) => it.map((x) => ({ ...x, unread: false })));
    setUnread(0);
    try {
      await fetch('/api/sales/notifications/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
    } catch {
      /* optimistic; next poll reconciles */
    }
  }, []);

  const markOne = useCallback(async (id: string) => {
    setItems((it) => it.map((x) => (x.id === id ? { ...x, unread: false } : x)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch('/api/sales/notifications/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* optimistic */
    }
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [open]);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false); }
    if (open) window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-500)] transition hover:bg-[var(--bg-sunken)] hover:text-[var(--ink-900)]"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[var(--allonce-err)] ring-2 ring-[var(--bg-surface-alt)]" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[380px] overflow-hidden rounded-[var(--radius-lg)] border border-black/8 bg-[var(--bg-surface)] shadow-[0_24px_56px_-12px_rgba(0,0,0,0.18),0_4px_12px_-2px_rgba(0,0,0,0.08)] ring-1 ring-black/5 animate-fade-in"
        >
          <div className="flex items-center justify-between border-b border-[var(--allonce-line-soft)] px-4 py-3">
            <p className="text-[14px] font-semibold text-[var(--ink-900)]">Notifications</p>
            <button
              type="button"
              onClick={markAll}
              className="text-[12px] text-[var(--ink-500)] transition hover:text-[var(--ink-900)] disabled:opacity-40"
              disabled={unread === 0}
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] text-[var(--ink-900)]">No notifications yet</p>
                <p className="mt-1 text-[11.5px] text-[var(--ink-500)]">
                  Follow-up reminders and alerts will appear here when they happen.
                </p>
              </div>
            ) : (
              items.map((n) => (
                <NotificationRow
                  key={n.id}
                  n={n}
                  onClick={() => {
                    if (n.unread) markOne(n.id);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--allonce-line-soft)] bg-[var(--bg-surface-alt)] px-4 py-2 text-[11.5px] text-[var(--ink-500)]">
            <span>{items.length} total</span>
            {unread > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--allonce-err)] px-1 text-[9px] font-semibold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
                unread
              </span>
            ) : (
              <span>All read</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({ n, onClick }: { n: NotificationItem; onClick: () => void }) {
  const dot =
    n.kind === 'followup'
      ? 'bg-[var(--allonce-warn)]'
      : n.kind === 'proposal'
      ? 'bg-[var(--ink-900)]'
      : n.kind === 'deploy'
      ? 'bg-[var(--allonce-ok)]'
      : n.kind === 'firing'
      ? 'bg-[var(--allonce-warn)]'
      : n.kind === 'billing'
      ? 'bg-[var(--allonce-err)]'
      : 'bg-[var(--ink-400)]';

  const content = (
    <div className={`group flex gap-3 px-4 py-3 transition hover:bg-[var(--bg-surface-alt)] ${n.unread ? '' : 'opacity-60'}`}>
      <div className="mt-1 flex-shrink-0">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-medium text-[var(--ink-900)]">
          {n.title}
        </p>
        {n.body && (
          <p className="mt-0.5 truncate text-[12.5px] text-[var(--ink-500)]">
            {n.body}
          </p>
        )}
        <p className="mt-1 text-[11px] text-[var(--ink-400)]">{timeAgo(n.at)}</p>
      </div>
    </div>
  );

  return n.href ? (
    <Link href={n.href} onClick={onClick} className="block border-b border-[var(--allonce-line-soft)] last:border-b-0">
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className="block w-full border-b border-[var(--allonce-line-soft)] last:border-b-0 text-left">
      {content}
    </button>
  );
}

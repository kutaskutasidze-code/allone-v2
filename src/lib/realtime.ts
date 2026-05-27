"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-side Supabase client used only for Realtime subscriptions.
 *
 * We use the anon (publishable) key because:
 *   - It's safe to ship in the browser bundle (it already is, via `app/api/health`).
 *   - Realtime evaluates RLS using whatever auth context is on the
 *     connection. The app uses NextAuth instead of Supabase Auth, so
 *     there's no Supabase JWT to pass; the anon role is what Realtime
 *     sees.
 *
 * WARNING — RLS interaction
 * =========================
 * Migration 0006 enables RLS on every data table and the policy keys off
 * `current_setting('app.current_org_id')`, a session GUC. The Realtime
 * worker is a separate connection that does NOT see that GUC, so under
 * the current policies the anon role receives ZERO postgres_changes
 * events from `hotel`, `p_order`, `whatsapp_*`, `audit_log`, `org_memory`.
 *
 * The subscription helper below is built to degrade gracefully: when no
 * events arrive, the existing periodic refresh in each page keeps
 * working. See `supabase/migrations/0012_realtime.sql` for the design
 * note on the three ways to unlock actual event delivery in a follow-up.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function getRealtimeClient(): SupabaseClient | null {
  if (!url || !anon) return null;
  if (!client) {
    client = createBrowserClient(url, anon, {
      // We are NOT using Supabase Auth in this app; disable session bits
      // so the client doesn't try to refresh a token it never had.
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export type PgEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export interface SubscribeOptions {
  event?: PgEvent;
  /** Optional equality filter (e.g. `{ column: "organization_id", value: 7 }`). */
  filter?: { column: string; value: string | number };
  /** Called when channel transitions between connected/reconnecting/offline. */
  onStatus?: (status: RealtimeStatus) => void;
}

export type RealtimeStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "offline";

export interface RowEvent<T> {
  event: "INSERT" | "UPDATE" | "DELETE";
  new: T | null;
  old: T | null;
}

/**
 * Subscribe to row events on a public-schema table.
 *
 * Returns an `unsubscribe` function. Safe to call when the env vars are
 * missing (returns a noop) — the page keeps working via its existing
 * non-realtime data path.
 *
 * Implementation note: we use Supabase BROADCAST channels (not
 * `postgres_changes`) because the latter respects RLS and our RLS
 * policies key off `current_setting('app.current_org_id')` which the
 * Realtime worker can't see (separate Postgres connection, no session
 * GUC). Migration 0013 attaches an `after insert/update/delete` trigger
 * to all org-scoped tables that calls `realtime.send` with a minimal
 * payload (table + action + row_id) on channel `org:<org_id>:<table>`.
 * Clients subscribe to their own org's channel and refetch via REST
 * (org-scoped) on receipt. No row data is broadcast, so even a
 * malicious subscriber to another org's channel only learns "something
 * changed" — not what.
 */
export function subscribeRows<T>(
  table: string,
  opts: SubscribeOptions & { organizationId?: number | null },
  handler: (event: RowEvent<T>) => void,
): () => void {
  const sb = getRealtimeClient();
  if (!sb || !opts.organizationId) return () => {};

  const channelName = `org:${opts.organizationId}:${table}`;
  opts.onStatus?.("connecting");

  const channel: RealtimeChannel = sb
    .channel(channelName, { config: { broadcast: { self: false } } })
    // Broadcast payload shape from migration 0013's notify_org_row_change():
    //   { table, action: "insert"|"update"|"delete", row_id }
    .on(
      "broadcast",
      { event: "row_change" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (msg: any) => {
        const payload = msg?.payload ?? {};
        const action = String(payload.action ?? "").toUpperCase();
        if (action !== "INSERT" && action !== "UPDATE" && action !== "DELETE") {
          return;
        }
        // We only have row_id, not the full row. Pass it in `new` for
        // INSERT/UPDATE and `old` for DELETE so consumers can refetch.
        const stub = { id: payload.row_id } as unknown as T;
        handler({
          event: action,
          new: action === "DELETE" ? null : stub,
          old: action === "DELETE" ? stub : null,
        });
      },
    )
    .subscribe((status) => {
      // supabase-js status: SUBSCRIBED / TIMED_OUT / CLOSED / CHANNEL_ERROR
      if (status === "SUBSCRIBED") opts.onStatus?.("connected");
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
        opts.onStatus?.("reconnecting");
      else if (status === "CLOSED") opts.onStatus?.("offline");
    });

  return () => {
    try {
      sb.removeChannel(channel);
    } catch {
      /* ignore */
    }
  };
}

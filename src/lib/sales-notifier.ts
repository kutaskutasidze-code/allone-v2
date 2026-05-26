// Renders + dispatches scheduled sales-team notifications.
// Server-side; uses the service-role Supabase client passed in.

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeAllAims,
  metricLabel,
  metricFormat,
  type AimResult,
  type Period,
} from "./sales-aims";
import { fetchMetricEventsForUser } from "./sales-metric-events";
import {
  fetchGrowthOverridesForUser,
  applyGrowthOverrides,
} from "./sales-aim-overrides";
import { sendMessage, escapeHTML, isTelegramConfigured } from "./telegram";

export type MessageKind =
  | "daily_aim"
  | "daily_report"
  | "weekly_aim"
  | "weekly_report"
  | "monthly_aim"
  | "monthly_report";

interface SalesUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ChannelRow {
  sales_user_id: string;
  telegram_chat_id: string | null;
}

export interface RunSummary {
  attempted: number;
  delivered: number;
  failed: number;
  errors: Array<{ sales_user_id: string; error: string }>;
}

export interface DeliverOpts {
  // When set, send only to this sales_user (used by the preview button).
  salesUserId?: string;
}

export async function deliverScheduledRun(
  supabase: SupabaseClient,
  kind: MessageKind,
  now: Date = new Date(),
  opts: DeliverOpts = {},
): Promise<RunSummary> {
  const summary: RunSummary = {
    attempted: 0,
    delivered: 0,
    failed: 0,
    errors: [],
  };
  if (!isTelegramConfigured()) {
    summary.errors.push({
      sales_user_id: "-",
      error: "Telegram not configured",
    });
    return summary;
  }

  // All active sales users with a connected, active telegram channel.
  let q = supabase
    .from("sales_users")
    .select(
      "id, name, email, role, notification_channels!inner ( telegram_chat_id, is_active, channel_type )",
    )
    .eq("notification_channels.channel_type", "telegram")
    .eq("notification_channels.is_active", true);

  if (opts.salesUserId) q = q.eq("id", opts.salesUserId);

  const { data: rows } = await q;
  type Joined = SalesUserRow & {
    notification_channels: ChannelRow[];
  };
  const targets = (rows as unknown as Joined[] | null) ?? [];

  const period = periodForKind(kind);

  for (const user of targets) {
    const chatId = user.notification_channels[0]?.telegram_chat_id;
    if (!chatId) continue;
    summary.attempted += 1;
    try {
      const [events, overrides] = await Promise.all([
        fetchMetricEventsForUser(supabase, user.id, now),
        fetchGrowthOverridesForUser(supabase, user.id),
      ]);
      const aims = applyGrowthOverrides(
        computeAllAims(events, now, period),
        overrides,
      );
      const text =
        user.role === "admin"
          ? await renderAdminMessage(supabase, kind, aims, now)
          : renderUserMessage(kind, user.name, aims);

      const sendRes = await sendMessage({ chatId, text });
      await supabase.from("notification_sends").insert({
        sales_user_id: user.id,
        channel_type: "telegram",
        message_type: kind,
        period_key: periodKey(period, now),
        payload: { aims },
        error: sendRes.ok ? null : sendRes.error,
        external_id: sendRes.messageId ? String(sendRes.messageId) : null,
      });
      if (sendRes.ok) summary.delivered += 1;
      else {
        summary.failed += 1;
        summary.errors.push({
          sales_user_id: user.id,
          error: sendRes.error ?? "unknown",
        });
      }
    } catch (err) {
      summary.failed += 1;
      summary.errors.push({
        sales_user_id: user.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return summary;
}

function periodForKind(kind: MessageKind): Period {
  if (kind === "daily_aim" || kind === "daily_report") return "day";
  if (kind === "weekly_aim" || kind === "weekly_report") return "week";
  return "month";
}

function periodKey(period: Period, now: Date): string {
  if (period === "day") return now.toISOString().slice(0, 10);
  if (period === "week") {
    const monday = new Date(now);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return `${monday.getFullYear()}-W${weekNumber(monday)}`;
  }
  return now.toISOString().slice(0, 7);
}

function weekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 86_400_000));
}

function renderUserMessage(
  kind: MessageKind,
  name: string,
  aims: AimResult[],
): string {
  const first = name.split(" ")[0] || "there";
  const isAim = kind.endsWith("_aim");
  const periodLabel = kind.startsWith("daily")
    ? "today"
    : kind.startsWith("weekly")
      ? "this week"
      : "this month";

  const header = isAim
    ? `<b>Good morning, ${escapeHTML(first)}.</b>\nHere's the aim for ${periodLabel}:`
    : `<b>${escapeHTML(first)} — end-of-${kind.startsWith("daily") ? "day" : kind.startsWith("weekly") ? "week" : "month"} report.</b>`;

  const lines = aims.map((a) => formatAimLine(a, isAim));

  const footer = isAim
    ? `\n<i>Baselines are 3-period rolling averages × growth. Reply /disconnect to stop.</i>`
    : "";

  return [header, "", ...lines, footer].filter(Boolean).join("\n");
}

function formatAimLine(a: AimResult, isAim: boolean): string {
  const label = metricLabel(a.metric);
  const aim = metricFormat(a.metric, a.aim);
  const actual = metricFormat(a.metric, a.actual);
  if (isAim) {
    return `• <b>${escapeHTML(label)}</b> — aim ${aim} (baseline ${metricFormat(a.metric, a.baseline)})`;
  }
  const bar = progressBar(a.progress_pct);
  return `• <b>${escapeHTML(label)}</b> — ${actual} / ${aim}  ${bar} ${a.progress_pct}%`;
}

function progressBar(pct: number): string {
  const slots = 8;
  const filled = Math.max(0, Math.min(slots, Math.round((pct / 100) * slots)));
  return `${"█".repeat(filled)}${"░".repeat(slots - filled)}`;
}

async function renderAdminMessage(
  supabase: SupabaseClient,
  kind: MessageKind,
  _selfAims: AimResult[],
  now: Date,
): Promise<string> {
  // Admin gets aggregated rollup across all sales users with active demos
  // or status updates in the period.
  const period = periodForKind(kind);
  const isAim = kind.endsWith("_aim");

  const { data: users } = await supabase
    .from("sales_users")
    .select("id, name")
    .eq("role", "sales");
  type U = { id: string; name: string };
  const list = (users as U[] | null) ?? [];

  const perUser: Array<{ name: string; aims: AimResult[] }> = [];
  for (const u of list) {
    const events = await fetchMetricEventsForUser(supabase, u.id, now);
    const overrides = await fetchGrowthOverridesForUser(supabase, u.id);
    perUser.push({
      name: u.name,
      aims: applyGrowthOverrides(
        computeAllAims(events, now, period),
        overrides,
      ),
    });
  }

  const totals: Record<string, { aim: number; actual: number }> = {};
  for (const { aims } of perUser) {
    for (const a of aims) {
      const t = (totals[a.metric] ??= { aim: 0, actual: 0 });
      t.aim += a.aim;
      t.actual += a.actual;
    }
  }

  const header = isAim
    ? `<b>Admin briefing — ${period} aim</b>`
    : `<b>Admin briefing — ${period} report</b>`;

  const lines: string[] = [];
  for (const metric of Object.keys(totals)) {
    const { aim, actual } = totals[metric];
    const label = metricLabel(metric as AimResult["metric"]);
    const aimFmt = metricFormat(metric as AimResult["metric"], aim);
    const actualFmt = metricFormat(metric as AimResult["metric"], actual);
    if (isAim) {
      lines.push(`• <b>${escapeHTML(label)}</b> — team aim ${aimFmt}`);
    } else {
      const pct =
        aim === 0 ? (actual > 0 ? 100 : 0) : Math.round((actual / aim) * 100);
      lines.push(
        `• <b>${escapeHTML(label)}</b> — ${actualFmt} / ${aimFmt} (${pct}%)`,
      );
    }
  }

  // Top 3 contributors on the headline metric
  if (!isAim && perUser.length > 1) {
    const ranked = perUser
      .map((p) => {
        const won = p.aims.find((a) => a.metric === "leads_won_revenue");
        return { name: p.name, revenue: won?.actual ?? 0 };
      })
      .filter((r) => r.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);
    if (ranked.length > 0) {
      lines.push("", "<b>Top contributors</b>");
      for (const r of ranked) {
        lines.push(
          `• ${escapeHTML(r.name)} — ${metricFormat("leads_won_revenue", r.revenue)}`,
        );
      }
    }
  }

  return [header, "", ...lines].join("\n");
}

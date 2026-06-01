"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Plus,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Phone,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import type { Lead, SalesUser } from "@/types/database";
import {
  LeadStatusBadge,
  CommissionWidget,
  AimsBoard,
  TelegramConnect,
} from "@/components/sales";
import { formatCurrency } from "@/lib/utils";

interface OverdueCallback {
  id: string;
  company: string | null;
  name: string;
  phone: string | null;
  callback_date: string;
}

interface SalesDashboardContentProps {
  salesUser: SalesUser;
  stats: {
    new: number;
    contacted: number;
    qualified: number;
    won: number;
    lost: number;
    pipelineValue: number;
    wonValue: number;
  };
  recentLeads: Lead[];
  todaysCalls: number;
  todaysQueue: number;
  dailyTarget: number;
  overdueCallbacks: OverdueCallback[];
  demoStats?: {
    inFlight: number;
    awaitingReview: number;
    sent7d: number;
    engagementRate: number;
  };
  telegramStatus?: {
    connected: boolean;
    username: string | null;
  };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d overdue`;
}

// BF-style stat card. Icon disc top-left, optional arrow top-right, big
// tabular-nums value, muted label below. Tone tints the border + bg.
function StatCard({
  icon,
  label,
  value,
  hint,
  href,
  tone = "default",
  children,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: "default" | "good" | "warn" | "bad" | "accent";
  children?: ReactNode;
}) {
  const toneClass =
    tone === "good"
      ? "border-emerald-300/40 bg-emerald-50/40"
      : tone === "warn"
        ? "border-amber-300/40 bg-amber-50/40"
        : tone === "bad"
          ? "border-rose-300/40 bg-rose-50/40"
          : tone === "accent"
            ? "border-[var(--ao-accent-soft)] bg-[var(--ao-accent-soft)]/40"
            : "border-[var(--allone-line)] bg-[var(--bg-surface)]";
  const inner = (
    <div
      className={`flex h-full flex-col gap-3 rounded-[var(--radius-md)] border ${toneClass} p-4 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-md)]`}
    >
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] text-[var(--ink-700)]">
          {icon}
        </div>
        {href && (
          <span className="text-[var(--ink-400)] transition group-hover:text-[var(--ink-700)]">
            →
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] tabular-nums">
          {value}
        </div>
        <div className="text-[12px] text-[var(--ink-500)]">{label}</div>
        {hint && (
          <div className="mt-1.5 text-[11.5px] text-[var(--ink-400)]">
            {hint}
          </div>
        )}
        {children}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="group block">
      {inner}
    </Link>
  ) : (
    <div>{inner}</div>
  );
}

// Smaller stat used in the dense status grid.
function MiniStat({
  label,
  count,
  href,
}: {
  label: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-1.5 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-center justify-between text-[var(--ink-500)]">
        <span className="text-[11px] font-medium uppercase tracking-wider">
          {label}
        </span>
        <span className="transition group-hover:text-[var(--ink-700)]">→</span>
      </div>
      <div className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] tabular-nums">
        {count}
      </div>
    </Link>
  );
}

function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
        {title}
      </h2>
      {action}
    </div>
  );
}

export function SalesDashboardContent({
  salesUser,
  stats,
  recentLeads,
  todaysCalls,
  todaysQueue,
  dailyTarget,
  overdueCallbacks,
  demoStats,
  telegramStatus,
}: SalesDashboardContentProps) {
  const totalLeads =
    stats.new + stats.contacted + stats.qualified + stats.won + stats.lost;
  const conversionRate =
    totalLeads > 0 ? ((stats.won / totalLeads) * 100).toFixed(1) : "0";
  const callTarget = dailyTarget;
  const callProgress =
    callTarget > 0 ? Math.min((todaysCalls / callTarget) * 100, 100) : 0;
  const firstName = salesUser.name.split(" ")[0];

  const statsGrid = [
    { label: "New", count: stats.new, href: "/sales/leads?status=new" },
    {
      label: "Contacted",
      count: stats.contacted,
      href: "/sales/leads?status=contacted",
    },
    {
      label: "Qualified",
      count: stats.qualified,
      href: "/sales/leads?status=qualified",
    },
    { label: "Won", count: stats.won, href: "/sales/leads?status=won" },
    { label: "Lost", count: stats.lost, href: "/sales/leads?status=lost" },
    { label: "Total", count: totalLeads, href: "/sales/leads" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Greeting */}
      <header>
        <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-1 text-[13px] text-[var(--ink-500)]">
          Welcome back, {firstName}. Here&apos;s your pipeline overview.
        </p>
      </header>

      {/* Hero KPIs */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/sales/call" className="group block">
          <div
            className={`flex h-full flex-col gap-3 rounded-[var(--radius-md)] border p-4 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-md)] ${
              todaysQueue > 0
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-[var(--allone-line)] bg-[var(--bg-surface)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] ${
                  todaysQueue > 0
                    ? "bg-white/15"
                    : "bg-[var(--bg-surface-alt)] text-[var(--ink-700)]"
                }`}
              >
                <Phone className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <span
                className={
                  todaysQueue > 0
                    ? "text-white/80"
                    : "text-[var(--ink-400)] transition group-hover:text-[var(--ink-700)]"
                }
              >
                →
              </span>
            </div>
            <div>
              <div
                className={`text-3xl font-semibold tracking-[-0.02em] tabular-nums ${
                  todaysQueue > 0 ? "text-white" : "text-[var(--ink-900)]"
                }`}
              >
                {todaysQueue}
              </div>
              <div
                className={`text-[12px] ${
                  todaysQueue > 0 ? "text-white/80" : "text-[var(--ink-500)]"
                }`}
              >
                Today&apos;s Queue
              </div>
              <div
                className={`mt-1.5 text-[11.5px] ${
                  todaysQueue > 0 ? "text-white/80" : "text-[var(--ink-400)]"
                }`}
              >
                {todaysQueue === 0
                  ? "No leads yet. Ask your admin to assign."
                  : "Tap to enter Call Mode →"}
              </div>
            </div>
          </div>
        </Link>

        <StatCard
          icon={<Phone className="h-4 w-4" strokeWidth={1.75} />}
          label={`Today's Calls · ${callTarget} target`}
          value={`${todaysCalls}`}
        >
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                callProgress >= 100
                  ? "bg-emerald-500"
                  : callProgress >= 50
                    ? "bg-[var(--ao-accent)]"
                    : "bg-amber-500"
              }`}
              style={{ width: `${callProgress}%` }}
            />
          </div>
          <div className="mt-1.5 text-[11.5px] text-[var(--ink-400)]">
            {callProgress >= 100
              ? "Queue cleared. Great work."
              : `${Math.max(0, callTarget - todaysCalls)} more to clear`}
          </div>
        </StatCard>

        <StatCard
          icon={
            <AlertTriangle
              className={`h-4 w-4 ${overdueCallbacks.length > 0 ? "text-rose-500" : "text-emerald-500"}`}
              strokeWidth={1.75}
            />
          }
          label="Overdue Callbacks"
          value={overdueCallbacks.length}
          tone={overdueCallbacks.length > 0 ? "bad" : "good"}
          hint={
            overdueCallbacks.length === 0
              ? "You're all caught up."
              : `${overdueCallbacks.length} need a follow-up`
          }
        >
          {overdueCallbacks.length > 0 && (
            <ul className="mt-3 max-h-[120px] space-y-1.5 overflow-y-auto">
              {overdueCallbacks.slice(0, 4).map((cb) => (
                <li
                  key={cb.id}
                  className="flex items-center justify-between gap-2 border-t border-[var(--allone-line-soft)] pt-1.5 first:border-0 first:pt-0"
                >
                  <span className="min-w-0 truncate text-[12px] font-medium text-[var(--ink-900)]">
                    {cb.company || cb.name}
                  </span>
                  <span className="shrink-0 text-[10.5px] font-medium text-rose-500">
                    {timeAgo(cb.callback_date)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </StatCard>
      </section>

      {/* Aims & Telegram */}
      <section>
        <SectionHead title="Aims & results" />
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <AimsBoard />
          </div>
          <TelegramConnect initial={telegramStatus} />
        </div>
      </section>

      {/* Demo pipeline (only shown when there's data) */}
      {demoStats && (
        <section>
          <SectionHead
            title="Demo pipeline · last 7 days"
            action={
              <Link
                href="/sales/demos"
                className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ink-500)] transition hover:text-[var(--ink-900)]"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
              label="In flight"
              value={demoStats.inFlight}
              href="/sales/demos"
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
              label="Awaiting review"
              value={demoStats.awaitingReview}
              tone={demoStats.awaitingReview > 0 ? "accent" : "default"}
              href="/sales/demos"
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
              label="Sent (7d)"
              value={demoStats.sent7d}
              href="/sales/demos"
            />
            <StatCard
              icon={<Sparkles className="h-4 w-4" strokeWidth={1.75} />}
              label="Engagement"
              value={`${demoStats.engagementRate}%`}
              tone={demoStats.engagementRate >= 30 ? "good" : "default"}
              href="/sales/demos"
            />
          </div>
        </section>
      )}

      {/* Status grid */}
      <section>
        <SectionHead title="Pipeline by status" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statsGrid.map((stat) => (
            <MiniStat
              key={stat.label}
              label={stat.label}
              count={stat.count}
              href={stat.href}
            />
          ))}
        </div>
      </section>

      {/* Money */}
      <section>
        <SectionHead title="Revenue" />
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<TrendingUp className="h-4 w-4" strokeWidth={1.75} />}
            label="Pipeline Value"
            value={formatCurrency(stats.pipelineValue)}
            hint="From active leads"
          />
          <StatCard
            icon={<CheckCircle className="h-4 w-4" strokeWidth={1.75} />}
            label="Won Revenue"
            value={formatCurrency(stats.wonValue)}
            hint="Closed deals"
            tone={stats.wonValue > 0 ? "good" : "default"}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" strokeWidth={1.75} />}
            label="Conversion Rate"
            value={`${conversionRate}%`}
            hint="Won / Total"
          />
        </div>
      </section>

      <CommissionWidget />

      {/* Quick actions */}
      <section>
        <SectionHead title="Quick actions" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/sales/leads/new", icon: Plus, label: "Add new lead" },
            { href: "/sales/leads", icon: Users, label: "View all leads" },
            {
              href: "/sales/leads?status=qualified",
              icon: TrendingUp,
              label: "Qualified leads",
            },
            {
              href: "/sales/leads?status=won",
              icon: CheckCircle,
              label: "Won deals",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--allone-line)] bg-[var(--bg-surface)] px-4 py-3 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-xs)] bg-[var(--bg-surface-alt)] text-[var(--ink-700)]">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <span className="text-[13px] font-medium text-[var(--ink-900)]">
                  {action.label}
                </span>
                <ArrowRight className="ml-auto h-3 w-3 text-[var(--ink-400)] transition group-hover:text-[var(--ink-700)]" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent leads */}
      <section>
        <SectionHead
          title="Recent leads"
          action={
            <Link
              href="/sales/leads"
              className="text-[12px] font-medium text-[var(--ink-500)] transition hover:text-[var(--ink-900)]"
            >
              View all
            </Link>
          }
        />
        {recentLeads.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--allone-line)] bg-[var(--bg-surface)] p-8 text-center">
            <Users className="mx-auto mb-3 h-8 w-8 text-[var(--ink-300)]" />
            <p className="text-[13px] text-[var(--ink-500)]">No leads yet</p>
            <Link
              href="/sales/leads/new"
              className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-[var(--ink-900)] hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add your first lead
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] shadow-[var(--shadow-xs)]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--allone-line-soft)]">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                    Lead
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                    Industry
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className={`transition-colors hover:bg-[var(--bg-surface-alt)]/60 ${
                      i !== recentLeads.length - 1
                        ? "border-b border-[var(--allone-line-soft)]"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-medium text-[var(--ink-900)]">
                        {lead.company || lead.name}
                      </div>
                      {lead.email && (
                        <div className="text-[11.5px] text-[var(--ink-500)]">
                          {lead.email}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-[var(--ink-500)]">
                      {(lead as Lead & { industry?: string }).industry || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-[13px] font-medium tabular-nums text-[var(--ink-900)]">
                      {formatCurrency(lead.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

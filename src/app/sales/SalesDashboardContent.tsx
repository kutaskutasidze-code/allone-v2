"use client";

import Link from "next/link";
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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ink-900)] font-display">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-[var(--ink-500)]">
          Welcome back, {salesUser.name.split(" ")[0]}. Here&apos;s your
          pipeline overview.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Link
          href="/sales/call"
          className={`p-5 rounded-xl shadow-sm transition-shadow block ${
            todaysQueue > 0
              ? "bg-emerald-500 text-white border border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20"
              : "bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] text-[var(--ink-900)] shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04]"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Phone
              className={`h-4 w-4 ${todaysQueue > 0 ? "text-white" : "text-[var(--ao-accent)]"}`}
            />
            <span className="text-sm font-semibold">Today&apos;s Queue</span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold">{todaysQueue}</span>
            <span
              className={`text-sm mb-1 ${todaysQueue > 0 ? "text-white/80" : "text-[var(--ink-400)]"}`}
            >
              leads to call
            </span>
          </div>
          <p
            className={`text-xs mt-2 ${todaysQueue > 0 ? "text-white/80" : "text-[var(--ink-400)]"}`}
          >
            {todaysQueue === 0
              ? "No new leads in your queue yet. Check back later or ask your admin."
              : `Tap to enter Call Mode →`}
          </p>
        </Link>

        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="h-4 w-4 text-[var(--ao-accent)]" />
            <span className="text-sm font-semibold text-[var(--ink-900)]">
              Today&apos;s Calls
            </span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-[var(--ink-900)]">
              {todaysCalls}
            </span>
            <span className="text-sm text-[var(--ink-400)] mb-1">/ {callTarget}</span>
          </div>
          <div className="w-full h-3 bg-[var(--bg-sunken)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                callProgress >= 100
                  ? "bg-green-500"
                  : callProgress >= 50
                    ? "bg-[var(--ao-accent)]"
                    : "bg-amber-500"
              }`}
              style={{ width: `${callProgress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--ink-400)] mt-2">
            {callProgress >= 100
              ? "Queue cleared. Great work!"
              : `${Math.max(0, callTarget - todaysCalls)} more to clear your queue`}
          </p>
        </div>

        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle
              className={`h-4 w-4 ${overdueCallbacks.length > 0 ? "text-red-500" : "text-green-500"}`}
            />
            <span className="text-sm font-semibold text-[var(--ink-900)]">
              Overdue Callbacks
            </span>
            {overdueCallbacks.length > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                {overdueCallbacks.length}
              </span>
            )}
          </div>
          {overdueCallbacks.length === 0 ? (
            <p className="text-sm text-[var(--ink-400)]">
              No overdue callbacks. You&apos;re all caught up!
            </p>
          ) : (
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {overdueCallbacks.map((cb) => (
                <div
                  key={cb.id}
                  className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--allone-line-soft)] last:border-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--ink-900)] truncate">
                      {cb.company || cb.name}
                    </p>
                    {cb.phone && (
                      <a
                        href={`tel:${cb.phone}`}
                        className="text-xs text-[var(--ao-accent)] hover:underline"
                      >
                        {cb.phone}
                      </a>
                    )}
                  </div>
                  <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">
                    {timeAgo(cb.callback_date)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AimsBoard />
        </div>
        <TelegramConnect initial={telegramStatus} />
      </div>

      {demoStats && (
        <div className="rounded-2xl border border-[var(--allone-line-soft)] bg-[var(--bg-surface)] p-5 shadow-sm shadow-black/[0.02]">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ao-accent-soft)] text-[var(--ao-accent)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--ink-900)]">
                  Demo pipeline
                </h2>
                <p className="text-xs text-[var(--ink-400)]">last 7 days</p>
              </div>
            </div>
            <Link
              href="/sales/demos"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ink-500)] hover:text-[var(--ink-900)]"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "In flight", value: demoStats.inFlight },
              {
                label: "Awaiting review",
                value: demoStats.awaitingReview,
                highlight: demoStats.awaitingReview > 0,
              },
              { label: "Sent (7d)", value: demoStats.sent7d },
              {
                label: "Engagement",
                value: `${demoStats.engagementRate}%`,
                positive: demoStats.engagementRate >= 30,
              },
            ].map((m) => (
              <Link
                key={m.label}
                href="/sales/demos"
                className={`block rounded-xl border px-4 py-3 transition hover:border-[var(--allone-line-strong)] ${
                  m.highlight
                    ? "border-[var(--ao-accent-soft)] bg-[var(--ao-accent-soft)]/60"
                    : m.positive
                      ? "border-emerald-200 bg-emerald-50/60"
                      : "border-[var(--allone-line)] bg-[var(--bg-surface)]"
                }`}
              >
                <div className="text-xs text-[var(--ink-500)]">{m.label}</div>
                <div className="mt-0.5 text-xl font-semibold text-[var(--ink-900)]">
                  {m.value}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statsGrid.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group block p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--ink-500)]">{stat.label}</span>
              <ArrowRight className="h-4 w-4 text-[var(--ink-300)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-semibold text-[var(--ink-900)]">
              {stat.count}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02]">
          <p className="text-xs text-[var(--ink-500)] mb-2">Pipeline Value</p>
          <p className="text-2xl font-semibold text-[var(--ink-900)]">
            {formatCurrency(stats.pipelineValue)}
          </p>
          <p className="text-xs text-[var(--ink-400)] mt-1">From active leads</p>
        </div>
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02]">
          <p className="text-xs text-[var(--ink-500)] mb-2">Won Revenue</p>
          <p className="text-2xl font-semibold text-[var(--ink-900)]">
            {formatCurrency(stats.wonValue)}
          </p>
          <p className="text-xs text-[var(--ink-400)] mt-1">Closed deals</p>
        </div>
        <div className="p-5 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02]">
          <p className="text-xs text-[var(--ink-500)] mb-2">Conversion Rate</p>
          <p className="text-2xl font-semibold text-[var(--ink-900)]">
            {conversionRate}%
          </p>
          <p className="text-xs text-[var(--ink-400)] mt-1">Won / Total</p>
        </div>
      </div>

      <CommissionWidget />

      <div>
        <h2 className="text-sm font-semibold text-[var(--ink-900)] mb-3">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/sales/leads/new", icon: Plus, label: "Add New Lead" },
            { href: "/sales/leads", icon: Users, label: "View All Leads" },
            {
              href: "/sales/leads?status=qualified",
              icon: TrendingUp,
              label: "Qualified Leads",
            },
            {
              href: "/sales/leads?status=won",
              icon: CheckCircle,
              label: "Won Deals",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 p-4 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-surface-alt)]">
                  <Icon className="h-4 w-4 text-[var(--ink-700)]" />
                </div>
                <span className="text-sm font-medium text-[var(--ink-700)]">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[var(--ink-900)]">Recent Leads</h2>
          <Link
            href="/sales/leads"
            className="text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors"
          >
            View all
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-8 bg-[var(--bg-surface)] border border-dashed border-[var(--allone-line)] rounded-2xl text-center">
            <Users className="h-8 w-8 text-[var(--ink-300)] mx-auto mb-3" />
            <p className="text-sm text-[var(--ink-500)]">No leads yet</p>
            <Link
              href="/sales/leads/new"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[var(--ink-900)] hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add your first lead
            </Link>
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-xl shadow-sm shadow-black/[0.02] overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--allone-line-soft)]">
                  <th className="text-left text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">
                    Lead
                  </th>
                  <th className="text-left text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">
                    Company
                  </th>
                  <th className="text-left text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-[var(--bg-surface-alt)]/50 transition-colors ${
                      index !== recentLeads.length - 1
                        ? "border-b border-[var(--allone-line-soft)]"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-sm text-[var(--ink-900)]">
                        {lead.company || lead.name}
                      </span>
                      {lead.email && (
                        <p className="text-xs text-[var(--ink-500)]">{lead.email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ink-500)]">
                      {(lead as Lead & { industry?: string }).industry || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--ink-900)] font-medium text-right">
                      {formatCurrency(lead.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

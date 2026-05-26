"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Users,
  Phone,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  ArrowRight,
  Target,
  Sparkles,
} from "lucide-react";
import type { Lead, SalesUser } from "@/types/database";
import { LeadStatusBadge } from "@/components/sales";

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
  demoStats?: {
    inFlight: number;
    awaitingReview: number;
    sent7d: number;
    engagementRate: number;
  };
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

export function SalesDashboardContent({
  salesUser,
  stats,
  recentLeads,
  demoStats,
}: SalesDashboardContentProps) {
  const totalLeads =
    stats.new + stats.contacted + stats.qualified + stats.won + stats.lost;
  const conversionRate =
    totalLeads > 0 ? ((stats.won / totalLeads) * 100).toFixed(1) : "0";

  const statsGrid = [
    {
      key: "new",
      label: "New",
      count: stats.new,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
      href: "/sales/leads?status=new",
    },
    {
      key: "contacted",
      label: "Contacted",
      count: stats.contacted,
      icon: Phone,
      color: "bg-yellow-100 text-yellow-600",
      href: "/sales/leads?status=contacted",
    },
    {
      key: "qualified",
      label: "Qualified",
      count: stats.qualified,
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
      href: "/sales/leads?status=qualified",
    },
    {
      key: "won",
      label: "Won",
      count: stats.won,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      href: "/sales/leads?status=won",
    },
    {
      key: "lost",
      label: "Lost",
      count: stats.lost,
      icon: XCircle,
      color: "bg-gray-100 text-gray-500",
      href: "/sales/leads?status=lost",
    },
    {
      key: "total",
      label: "Total Leads",
      count: totalLeads,
      icon: Target,
      color: "bg-[var(--gray-100)] text-[var(--gray-600)]",
      href: "/sales/leads",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--gray-500)]">
          Welcome back, {salesUser.name.split(" ")[0]}. Here&apos;s your
          pipeline overview.
        </p>
      </div>

      {/* Demo pipeline metrics */}
      {demoStats && (
        <div className="rounded-2xl border border-[var(--gray-200)] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[var(--black)]">
                  Demo pipeline
                </h2>
                <p className="text-xs text-[var(--gray-500)]">last 7 days</p>
              </div>
            </div>
            <Link
              href="/sales/demos"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--gray-500)] hover:text-[var(--black)]"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DemoMetric
              label="In flight"
              value={demoStats.inFlight}
              href="/sales/demos"
              tone="neutral"
            />
            <DemoMetric
              label="Awaiting review"
              value={demoStats.awaitingReview}
              href="/sales/demos"
              tone={demoStats.awaitingReview > 0 ? "highlight" : "neutral"}
            />
            <DemoMetric
              label="Sent (7d)"
              value={demoStats.sent7d}
              href="/sales/demos"
              tone="neutral"
            />
            <DemoMetric
              label="Engagement"
              value={`${demoStats.engagementRate}%`}
              href="/sales/demos"
              tone={demoStats.engagementRate >= 30 ? "positive" : "neutral"}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statsGrid.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={stat.href}
                className="group block p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-lg ${stat.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--gray-300)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-semibold text-[var(--black)]">
                  {stat.count}
                </div>
                <div className="text-xs text-[var(--gray-500)] mt-0.5">
                  {stat.label}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Summary */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 bg-white border border-[var(--gray-200)] rounded-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-100">
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--black)]">
                Pipeline Value
              </h2>
              <p className="text-xs text-[var(--gray-500)]">
                From active leads
              </p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-[var(--black)]">
            {formatCurrency(stats.pipelineValue)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-5 bg-white border border-[var(--gray-200)] rounded-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--black)]">
                Won Revenue
              </h2>
              <p className="text-xs text-[var(--gray-500)]">Closed deals</p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-[var(--black)]">
            {formatCurrency(stats.wonValue)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-5 bg-white border border-[var(--gray-200)] rounded-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
              <TrendingUp className="h-4 w-4 text-[var(--gray-600)]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--black)]">
                Conversion Rate
              </h2>
              <p className="text-xs text-[var(--gray-500)]">Won / Total</p>
            </div>
          </div>
          <p className="text-2xl font-semibold text-[var(--black)]">
            {conversionRate}%
          </p>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <h2 className="text-sm font-medium text-[var(--gray-500)] mb-3">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/sales/leads/new"
            className="group flex items-center gap-3 p-3 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors duration-200"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)] group-hover:bg-[var(--gray-200)] transition-colors">
              <Plus className="h-4 w-4 text-[var(--gray-600)]" />
            </div>
            <span className="text-sm font-medium text-[var(--gray-700)]">
              Add New Lead
            </span>
          </Link>
          <Link
            href="/sales/leads"
            className="group flex items-center gap-3 p-3 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors duration-200"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)] group-hover:bg-[var(--gray-200)] transition-colors">
              <Users className="h-4 w-4 text-[var(--gray-600)]" />
            </div>
            <span className="text-sm font-medium text-[var(--gray-700)]">
              View All Leads
            </span>
          </Link>
          <Link
            href="/sales/leads?status=qualified"
            className="group flex items-center gap-3 p-3 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors duration-200"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-[var(--gray-700)]">
              Qualified Leads
            </span>
          </Link>
          <Link
            href="/sales/leads?status=won"
            className="group flex items-center gap-3 p-3 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors duration-200"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <span className="text-sm font-medium text-[var(--gray-700)]">
              Won Deals
            </span>
          </Link>
        </div>
      </motion.div>

      {/* Recent Leads */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-[var(--gray-500)]">
            Recent Leads
          </h2>
          <Link
            href="/sales/leads"
            className="text-xs text-[var(--gray-500)] hover:text-[var(--black)] transition-colors"
          >
            View all
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-8 bg-white border border-[var(--gray-200)] rounded-xl text-center">
            <Users className="h-8 w-8 text-[var(--gray-300)] mx-auto mb-3" />
            <p className="text-sm text-[var(--gray-500)]">No leads yet</p>
            <Link
              href="/sales/leads/new"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-[var(--black)] hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add your first lead
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[var(--gray-200)] rounded-xl overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[var(--gray-100)]">
                  <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                    Lead
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                    Company
                  </th>
                  <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-right text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-white transition-colors ${
                      index !== recentLeads.length - 1
                        ? "border-b border-[var(--gray-100)]"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/sales/leads/${lead.id}`}
                        className="font-medium text-sm text-[var(--black)] hover:underline"
                      >
                        {lead.name}
                      </Link>
                      {lead.email && (
                        <p className="text-xs text-[var(--gray-500)]">
                          {lead.email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--gray-600)]">
                      {lead.company || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--black)] font-medium text-right">
                      {formatCurrency(lead.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function DemoMetric({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: number | string;
  href: string;
  tone: "neutral" | "positive" | "highlight";
}) {
  const toneClass =
    tone === "highlight"
      ? "border-blue-200 bg-blue-50/60"
      : tone === "positive"
        ? "border-emerald-200 bg-emerald-50/60"
        : "border-[var(--gray-200)] bg-white";
  return (
    <Link
      href={href}
      className={`block rounded-xl border ${toneClass} px-4 py-3 transition hover:border-[var(--gray-300)]`}
    >
      <div className="text-xs text-[var(--gray-500)]">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-[var(--black)]">
        {value}
      </div>
    </Link>
  );
}

"use client";

import Link from "next/link";
import {
  FolderKanban,
  Users,
  ArrowRight,
  Tag,
  DollarSign,
  UserCheck,
} from "lucide-react";
import type { LeadWithSalesUser } from "@/types/database";
import {
  LEAD_STATUS_STYLES,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
} from "@/lib/validations/leads";
import { DailyActivityCard } from "./DailyActivityCard";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardContentProps {
  counts: {
    projects: { total: number; published: number };
    services: { total: number; published: number };
    clients: { total: number; published: number };
    stats: number;
    values: number;
    categories: number;
  };
  dailyRevenue: Array<{ date: string; revenue: number }>;
  categoryRevenue: Array<{ name: string; value: number }>;
  leadsData: {
    count: number;
    recentLeads: LeadWithSalesUser[];
    stats: {
      new: number;
      contacted: number;
      callback: number;
      qualified: number;
      won: number;
      lost: number;
      not_interested: number;
      unavailable: number;
      totalValue: number;
    };
  };
}

const PIE_COLORS = [
  "#111111",
  "#333333",
  "#555555",
  "#777777",
  "#999999",
  "#bbbbbb",
  "#dddddd",
];

export function DashboardContent({
  counts,
  dailyRevenue,
  categoryRevenue,
  leadsData,
}: DashboardContentProps) {
  const [period, setPeriod] = useState<"month" | "year" | "lifetime">("year");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    dailyRevenue.forEach((item) => {
      years.add(new Date(item.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [dailyRevenue]);

  const filteredRevenue = useMemo(() => {
    const now = new Date();
    const revenueMap = new Map<string, number>();

    dailyRevenue.forEach((item) => {
      revenueMap.set(
        item.date,
        (revenueMap.get(item.date) || 0) + item.revenue,
      );
    });

    const result: Array<{ date: string; revenue: number; label: string }> = [];

    if (period === "month") {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayOfMonth = date.getDate();
        result.push({
          date: dateStr,
          revenue: revenueMap.get(dateStr) || 0,
          label:
            dayOfMonth % 5 === 0 || dayOfMonth === 1
              ? `${date.toLocaleDateString("en-US", { month: "short" })} ${dayOfMonth}`
              : "",
        });
      }
    } else if (period === "year") {
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(selectedYear, month, 1);
        const monthEnd = new Date(selectedYear, month + 1, 0);
        let monthRevenue = 0;

        for (
          let d = new Date(monthStart);
          d <= monthEnd;
          d.setDate(d.getDate() + 1)
        ) {
          const dateStr = d.toISOString().split("T")[0];
          monthRevenue += revenueMap.get(dateStr) || 0;
        }

        result.push({
          date: monthStart.toISOString().split("T")[0],
          revenue: monthRevenue,
          label: monthStart.toLocaleDateString("en-US", { month: "short" }),
        });
      }
    } else {
      const years = new Set<number>();
      dailyRevenue.forEach((item) =>
        years.add(new Date(item.date).getFullYear()),
      );
      const sortedYears = Array.from(years).sort((a, b) => a - b);

      if (sortedYears.length === 0) {
        sortedYears.push(now.getFullYear());
      }

      const startYear = sortedYears[0];
      const endYear = Math.max(
        sortedYears[sortedYears.length - 1],
        now.getFullYear(),
      );

      for (let year = startYear; year <= endYear; year++) {
        let yearRevenue = 0;
        dailyRevenue.forEach((item) => {
          if (new Date(item.date).getFullYear() === year) {
            yearRevenue += item.revenue;
          }
        });
        result.push({
          date: `${year}-01-01`,
          revenue: yearRevenue,
          label: year.toString(),
        });
      }
    }

    let cumulative = 0;
    return result.map((item) => {
      cumulative += item.revenue;
      return { ...item, cumulative };
    });
  }, [dailyRevenue, period, selectedYear]);

  const totalRevenue =
    filteredRevenue.length > 0
      ? filteredRevenue[filteredRevenue.length - 1].cumulative
      : 0;

  const stats = [
    {
      title: "Projects",
      count: counts.projects.total,
      published: counts.projects.published,
      icon: FolderKanban,
      href: "/admin/projects",
    },
    {
      title: "Clients",
      count: counts.clients.total,
      published: counts.clients.published,
      icon: Users,
      href: "/admin/clients",
    },
    {
      title: "Leads",
      count: leadsData.count,
      icon: UserCheck,
      href: "/admin/leads",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-1 text-[13px] text-[var(--ink-500)]">
          Overview of content, revenue, and the sales pipeline.
        </p>
      </div>

      {/* Stats Grid — BF stat-card pattern: icon disc top-left, arrow top-right, big tabular value. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.title} href={stat.href} className="group block">
              <div className="flex h-full flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--allone-line)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-xs)] transition hover:shadow-[var(--shadow-sm)]">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--bg-surface-alt)] text-[var(--ink-700)]">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <span className="text-[var(--ink-400)] transition group-hover:text-[var(--ink-700)]">
                    →
                  </span>
                </div>
                <div>
                  <div className="text-3xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] tabular-nums">
                    {stat.count}
                  </div>
                  <div className="text-[12px] text-[var(--ink-500)]">
                    {stat.title}
                  </div>
                  {"published" in stat && stat.count > 0 && (
                    <div className="mt-1.5 text-[11.5px] text-[var(--ink-400)]">
                      {stat.published} published
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Daily call activity by rep */}
      <DailyActivityCard />

      {/* Revenue Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 p-6 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink-900)]">
                Revenue
              </h2>
              <p className="text-xs text-[var(--ink-500)] mt-0.5">
                {period === "month"
                  ? "Last 30 days"
                  : period === "year"
                    ? `Year ${selectedYear}`
                    : "All time"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-[var(--radius-sm)] bg-[var(--bg-sunken)] p-0.5">
                {(["month", "year", "lifetime"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-[var(--radius-xs)] transition-all ${
                      period === p
                        ? "bg-[var(--bg-surface)] text-[var(--ink-900)] shadow-[var(--shadow-xs)]"
                        : "text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                    }`}
                  >
                    {p === "month" ? "1M" : p === "year" ? "1Y" : "All"}
                  </button>
                ))}
              </div>
              {period === "year" && availableYears.length > 0 && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2 py-1 text-xs font-medium rounded-[var(--radius-sm)] bg-[var(--bg-sunken)] border-0 cursor-pointer"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              )}
              <div className="text-right pl-3 border-l border-[var(--allone-line)]">
                <p className="text-lg font-semibold text-[var(--ink-900)]">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
            </div>
          </div>
          {filteredRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--ink-400)]">
              <p className="text-sm">No revenue data available</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredRevenue}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #f3f4f6",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        const date = new Date(payload[0].payload.date);
                        if (period === "lifetime")
                          return date.getFullYear().toString();
                        if (period === "year")
                          return date.toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          });
                        return date.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        });
                      }
                      return "";
                    }}
                    formatter={(value) => [
                      formatCurrency(value as number),
                      "Total",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#111827"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ fill: "#111827", strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Revenue by Category */}
        <div className="p-6 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02]">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-[var(--ink-900)]">
              By Category
            </h2>
            <p className="text-xs text-[var(--ink-500)] mt-0.5">
              Revenue distribution
            </p>
          </div>
          {categoryRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--ink-400)]">
              <p className="text-sm">No category data</p>
            </div>
          ) : (
            <>
              <div className="h-36 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryRevenue.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #f3f4f6",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                      }}
                      formatter={(value) => [
                        formatCurrency(value as number),
                        "Revenue",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto">
                {categoryRevenue.slice(0, 5).map((category, index) => (
                  <div
                    key={category.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            PIE_COLORS[index % PIE_COLORS.length],
                        }}
                      />
                      <span className="text-[var(--ink-700)] truncate max-w-[100px]">
                        {category.name}
                      </span>
                    </div>
                    <span className="font-medium text-[var(--ink-900)]">
                      {formatCurrency(category.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Leads Section */}
      {leadsData.count > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--ink-900)]">
                Sales Leads
              </h2>
              <p className="text-xs text-[var(--ink-500)] mt-0.5">
                {leadsData.count} total ·{" "}
                {formatCurrency(leadsData.stats.totalValue)} pipeline
              </p>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors"
            >
              View all
            </Link>
          </div>

          {/* Lead Status Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            {LEAD_STATUSES.map(({ value }) => (
              <div
                key={value}
                className="p-3 bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-sm)] text-center shadow-[var(--shadow-xs)] shadow-black/[0.02]"
              >
                <div className="text-lg font-semibold text-[var(--ink-900)]">
                  {leadsData.stats[value as keyof typeof leadsData.stats]}
                </div>
                <div className="text-xs text-[var(--ink-500)]">
                  {LEAD_STATUS_LABELS[value]}
                </div>
              </div>
            ))}
          </div>

          {/* Recent Leads Table */}
          {leadsData.recentLeads.length > 0 && (
            <div className="bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] shadow-[var(--shadow-xs)] shadow-black/[0.02] overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-[var(--allone-line-soft)]">
                    <th className="text-left text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">
                      Lead
                    </th>
                    <th className="text-left text-[11px] font-medium text-[var(--ink-400)] uppercase tracking-wider px-4 py-3">
                      Sales Rep
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
                  {leadsData.recentLeads.map((lead, index) => (
                    <tr
                      key={lead.id}
                      className={`hover:bg-[var(--bg-surface-alt)]/50 transition-colors ${
                        index !== leadsData.recentLeads.length - 1
                          ? "border-b border-[var(--allone-line-soft)]"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm text-[var(--ink-900)]">
                          {lead.name}
                        </div>
                        {lead.company && (
                          <div className="text-xs text-[var(--ink-500)]">
                            {lead.company}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--ink-500)]">
                        {lead.sales_user?.name || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${LEAD_STATUS_STYLES[lead.status]}`}
                        >
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
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
      )}
    </div>
  );
}

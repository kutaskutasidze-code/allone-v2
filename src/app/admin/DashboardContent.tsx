'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Briefcase,
  Users,
  ArrowRight,
  Plus,
  FileText,
  Settings,
  Tag,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import type { Lead, SalesUser, LeadWithSalesUser } from '@/types/database';
import { LEAD_STATUS_STYLES, LEAD_STATUS_LABELS } from '@/lib/validations/leads';
import { useState, useMemo } from 'react';
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
} from 'recharts';

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
      qualified: number;
      won: number;
      lost: number;
      totalValue: number;
    };
  };
}

// Monochrome color palette for pie chart
const PIE_COLORS = [
  '#111111',
  '#333333',
  '#555555',
  '#777777',
  '#999999',
  '#bbbbbb',
  '#dddddd',
];


export function DashboardContent({ counts, dailyRevenue, categoryRevenue, leadsData }: DashboardContentProps) {
  const [period, setPeriod] = useState<'month' | 'year' | 'lifetime'>('year');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    dailyRevenue.forEach(item => {
      years.add(new Date(item.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [dailyRevenue]);

  const filteredRevenue = useMemo(() => {
    const now = new Date();
    const revenueMap = new Map<string, number>();

    dailyRevenue.forEach(item => {
      revenueMap.set(item.date, (revenueMap.get(item.date) || 0) + item.revenue);
    });

    const result: Array<{ date: string; revenue: number; label: string }> = [];

    if (period === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfMonth = date.getDate();
        result.push({
          date: dateStr,
          revenue: revenueMap.get(dateStr) || 0,
          label: dayOfMonth % 5 === 0 || dayOfMonth === 1 ? `${date.toLocaleDateString('en-US', { month: 'short' })} ${dayOfMonth}` : '',
        });
      }
    } else if (period === 'year') {
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(selectedYear, month, 1);
        const monthEnd = new Date(selectedYear, month + 1, 0);
        let monthRevenue = 0;

        for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          monthRevenue += revenueMap.get(dateStr) || 0;
        }

        result.push({
          date: monthStart.toISOString().split('T')[0],
          revenue: monthRevenue,
          label: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        });
      }
    } else {
      const years = new Set<number>();
      dailyRevenue.forEach(item => years.add(new Date(item.date).getFullYear()));
      const sortedYears = Array.from(years).sort((a, b) => a - b);

      if (sortedYears.length === 0) {
        sortedYears.push(now.getFullYear());
      }

      const startYear = sortedYears[0];
      const endYear = Math.max(sortedYears[sortedYears.length - 1], now.getFullYear());

      for (let year = startYear; year <= endYear; year++) {
        let yearRevenue = 0;
        dailyRevenue.forEach(item => {
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
    return result.map(item => {
      cumulative += item.revenue;
      return { ...item, cumulative };
    });
  }, [dailyRevenue, period, selectedYear]);

  const totalRevenue = filteredRevenue.length > 0 ? filteredRevenue[filteredRevenue.length - 1].cumulative : 0;

  const stats = [
    { title: 'Projects', count: counts.projects.total, published: counts.projects.published, icon: FolderKanban, href: '/admin/projects' },
    { title: 'Clients', count: counts.clients.total, published: counts.clients.published, icon: Users, href: '/admin/clients' },
    { title: 'Leads', count: leadsData.count, icon: UserCheck, href: '/admin/leads', highlight: true },
  ];

  const quickActions = [
    { label: 'Add Project', href: '/admin/projects/new', icon: FolderKanban },
    { label: 'Add Service', href: '/admin/services/new', icon: Briefcase },
    { label: 'Edit About', href: '/admin/about', icon: FileText },
    { label: 'Contact Info', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--black)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--gray-500)]">
          Overview of your content and activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={stat.href}
                className="group block p-4 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
                    <Icon className="h-4 w-4 text-[var(--gray-500)]" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-[var(--gray-300)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-2xl font-semibold text-[var(--black)]">
                  {stat.count}
                </div>
                <div className="text-xs text-[var(--gray-500)] mt-0.5">
                  {stat.title}
                  {'published' in stat && stat.count > 0 && (
                    <span className="text-[var(--gray-400)]"> · {stat.published} live</span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Revenue Charts - 2/3 Line Chart + 1/3 Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Line Chart - 2/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 p-5 bg-white border border-[var(--gray-200)] rounded-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
                <DollarSign className="h-4 w-4 text-[var(--gray-500)]" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-[var(--black)]">Revenue</h2>
                <p className="text-xs text-[var(--gray-500)]">
                  {period === 'month' ? 'Last 30 days' : period === 'year' ? `Year ${selectedYear}` : 'All time'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg bg-[var(--gray-100)] p-0.5">
                {(['month', 'year', 'lifetime'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      period === p
                        ? 'bg-white text-[var(--black)] shadow-sm'
                        : 'text-[var(--gray-500)] hover:text-[var(--black)]'
                    }`}
                  >
                    {p === 'month' ? '1M' : p === 'year' ? '1Y' : 'All'}
                  </button>
                ))}
              </div>
              {period === 'year' && availableYears.length > 0 && (
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-2 py-1 text-xs font-medium rounded-lg bg-[var(--gray-100)] border-0 cursor-pointer"
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              )}
              <div className="text-right pl-3 border-l border-[var(--gray-200)]">
                <p className="text-lg font-semibold text-[var(--black)]">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>
          {filteredRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--gray-400)]">
              <p className="text-sm">No revenue data available</p>
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--gray-400)' }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--gray-400)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        const date = new Date(payload[0].payload.date);
                        if (period === 'lifetime') return date.getFullYear().toString();
                        if (period === 'year') return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      }
                      return '';
                    }}
                    formatter={(value) => [formatCurrency(value as number), 'Total']}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulative"
                    stroke="var(--black)"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ fill: 'var(--black)', strokeWidth: 0, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Revenue by Category - Donut Chart - 1/3 width */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="p-5 bg-white border border-[var(--gray-200)] rounded-xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)]">
              <Tag className="h-4 w-4 text-[var(--gray-500)]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-[var(--black)]">By Category</h2>
              <p className="text-xs text-[var(--gray-500)]">Revenue distribution</p>
            </div>
          </div>
          {categoryRevenue.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[var(--gray-400)]">
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
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid var(--gray-200)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 max-h-24 overflow-y-auto">
                {categoryRevenue.slice(0, 5).map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                      />
                      <span className="text-[var(--gray-600)] truncate max-w-[100px]">{category.name}</span>
                    </div>
                    <span className="font-medium text-[var(--black)]">{formatCurrency(category.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-sm font-medium text-[var(--gray-500)] mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 p-3 bg-white border border-[var(--gray-200)] rounded-xl hover:border-[var(--gray-300)] transition-colors duration-200"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--gray-100)] group-hover:bg-[var(--gray-200)] transition-colors">
                  {index === 0 || index === 1 ? (
                    <Plus className="h-4 w-4 text-[var(--gray-600)]" />
                  ) : (
                    <Icon className="h-4 w-4 text-[var(--gray-600)]" />
                  )}
                </div>
                <span className="text-sm font-medium text-[var(--gray-700)]">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Leads Section */}
      {leadsData.count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-100">
                <UserCheck className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-[var(--black)]">Sales Leads</h2>
                <p className="text-xs text-[var(--gray-500)]">
                  {leadsData.count} total · {formatCurrency(leadsData.stats.totalValue)} pipeline
                </p>
              </div>
            </div>
            <Link
              href="/admin/leads"
              className="text-xs text-[var(--gray-500)] hover:text-[var(--black)] transition-colors"
            >
              View all
            </Link>
          </div>

          {/* Lead Status Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
            {(['new', 'contacted', 'qualified', 'won', 'lost'] as const).map((status) => (
              <div
                key={status}
                className="p-3 bg-white border border-[var(--gray-200)] rounded-lg text-center"
              >
                <div className="text-lg font-semibold text-[var(--black)]">
                  {leadsData.stats[status]}
                </div>
                <div className="text-xs text-[var(--gray-500)]">{LEAD_STATUS_LABELS[status]}</div>
              </div>
            ))}
          </div>

          {/* Recent Leads Table */}
          {leadsData.recentLeads.length > 0 && (
            <div className="bg-white border border-[var(--gray-200)] rounded-xl overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-[var(--gray-100)]">
                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                      Lead
                    </th>
                    <th className="text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider px-4 py-3">
                      Sales Rep
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
                  {leadsData.recentLeads.map((lead, index) => (
                    <tr
                      key={lead.id}
                      className={`hover:bg-white transition-colors ${
                        index !== leadsData.recentLeads.length - 1 ? 'border-b border-[var(--gray-100)]' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-sm text-[var(--black)]">{lead.name}</div>
                        {lead.company && (
                          <div className="text-xs text-[var(--gray-500)]">{lead.company}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--gray-600)]">
                        {lead.sales_user?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${LEAD_STATUS_STYLES[lead.status]}`}
                        >
                          {LEAD_STATUS_LABELS[lead.status]}
                        </span>
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
      )}
    </div>
  );
}

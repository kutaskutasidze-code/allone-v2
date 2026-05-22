'use client';

import Link from 'next/link';
import { Plus, Users, TrendingUp, CheckCircle, ArrowRight, Phone, AlertTriangle, Inbox } from 'lucide-react';
import type { Lead, SalesUser } from '@/types/database';
import { LeadStatusBadge, CommissionWidget } from '@/components/sales';
import { formatCurrency } from '@/lib/utils';

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
  overdueCallbacks: OverdueCallback[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d overdue`;
}

export function SalesDashboardContent({ salesUser, stats, recentLeads, todaysCalls, todaysQueue, overdueCallbacks }: SalesDashboardContentProps) {
  const totalLeads = stats.new + stats.contacted + stats.qualified + stats.won + stats.lost;
  const conversionRate = totalLeads > 0 ? ((stats.won / totalLeads) * 100).toFixed(1) : '0';
  // The rep's daily call target is whatever was assigned to them today. If
  // nothing was assigned today, we fall back to a hardcoded floor of 50.
  const callTarget = Math.max(todaysQueue, 50);
  const callProgress = callTarget > 0 ? Math.min((todaysCalls / callTarget) * 100, 100) : 0;

  const statsGrid = [
    { label: 'New', count: stats.new, href: '/sales/leads?status=new' },
    { label: 'Contacted', count: stats.contacted, href: '/sales/leads?status=contacted' },
    { label: 'Qualified', count: stats.qualified, href: '/sales/leads?status=qualified' },
    { label: 'Won', count: stats.won, href: '/sales/leads?status=won' },
    { label: 'Lost', count: stats.lost, href: '/sales/leads?status=lost' },
    { label: 'Total', count: totalLeads, href: '/sales/leads' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 font-display">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Welcome back, {salesUser.name.split(' ')[0]}. Here&apos;s your pipeline overview.
        </p>
      </div>

      {/* Today's queue + Daily Calls + Overdue Callbacks */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Queue */}
        <Link
          href="/sales/leads?scope=today"
          className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow block"
        >
          <div className="flex items-center gap-2 mb-3">
            <Inbox className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-900">Today&apos;s Queue</span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-gray-900">{todaysQueue}</span>
            <span className="text-sm text-gray-400 mb-1">leads assigned today</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {todaysQueue === 0
              ? 'No new leads in your queue yet. Check back later or ask your admin.'
              : `Open queue to start calling →`}
          </p>
        </Link>

        {/* Today's Calls */}
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-900">Today&apos;s Calls</span>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-gray-900">{todaysCalls}</span>
            <span className="text-sm text-gray-400 mb-1">/ {callTarget}</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                callProgress >= 100 ? 'bg-green-500' : callProgress >= 50 ? 'bg-blue-500' : 'bg-amber-500'
              }`}
              style={{ width: `${callProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {callProgress >= 100
              ? 'Queue cleared. Great work!'
              : `${Math.max(0, callTarget - todaysCalls)} more to clear your queue`}
          </p>
        </div>

        {/* Overdue Callbacks */}
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className={`h-4 w-4 ${overdueCallbacks.length > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <span className="text-sm font-semibold text-gray-900">Overdue Callbacks</span>
            {overdueCallbacks.length > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                {overdueCallbacks.length}
              </span>
            )}
          </div>
          {overdueCallbacks.length === 0 ? (
            <p className="text-sm text-gray-400">No overdue callbacks. You&apos;re all caught up!</p>
          ) : (
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {overdueCallbacks.map(cb => (
                <div key={cb.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{cb.company || cb.name}</p>
                    {cb.phone && (
                      <a href={`tel:${cb.phone}`} className="text-xs text-blue-600 hover:underline">{cb.phone}</a>
                    )}
                  </div>
                  <span className="text-[10px] text-red-500 font-medium whitespace-nowrap">{timeAgo(cb.callback_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statsGrid.map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group block p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{stat.label}</span>
              <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-2xl font-semibold text-gray-900">{stat.count}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <p className="text-xs text-gray-500 mb-2">Pipeline Value</p>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.pipelineValue)}</p>
          <p className="text-xs text-gray-400 mt-1">From active leads</p>
        </div>
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <p className="text-xs text-gray-500 mb-2">Won Revenue</p>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.wonValue)}</p>
          <p className="text-xs text-gray-400 mt-1">Closed deals</p>
        </div>
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02]">
          <p className="text-xs text-gray-500 mb-2">Conversion Rate</p>
          <p className="text-2xl font-semibold text-gray-900">{conversionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Won / Total</p>
        </div>
      </div>

      <CommissionWidget />

      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/sales/leads/new', icon: Plus, label: 'Add New Lead' },
            { href: '/sales/leads', icon: Users, label: 'View All Leads' },
            { href: '/sales/leads?status=qualified', icon: TrendingUp, label: 'Qualified Leads' },
            { href: '/sales/leads?status=won', icon: CheckCircle, label: 'Won Deals' },
          ].map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] hover:shadow-md hover:shadow-black/[0.04] transition-shadow duration-200"
              >
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50">
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Leads</h2>
          <Link href="/sales/leads" className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
            View all
          </Link>
        </div>

        {recentLeads.length === 0 ? (
          <div className="p-8 bg-white border border-dashed border-gray-200 rounded-2xl text-center">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No leads yet</p>
            <Link
              href="/sales/leads/new"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-gray-900 hover:underline"
            >
              <Plus className="h-4 w-4" />
              Add your first lead
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-black/[0.02] overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Lead</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Company</th>
                  <th className="text-left text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-right text-[11px] font-medium text-gray-400 uppercase tracking-wider px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, index) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-gray-50/50 transition-colors ${index !== recentLeads.length - 1 ? 'border-b border-gray-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-sm text-gray-900">
                        {lead.company || lead.name}
                      </span>
                      {lead.email && <p className="text-xs text-gray-500">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{lead.industry || '-'}</td>
                    <td className="px-4 py-3">
                      <LeadStatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">{formatCurrency(lead.value)}</td>
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

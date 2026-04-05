'use client';

import Link from 'next/link';
import { Plus, Users, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import type { Lead, SalesUser } from '@/types/database';
import { LeadStatusBadge, CommissionWidget } from '@/components/sales';
import { formatCurrency } from '@/lib/utils';

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
}

export function SalesDashboardContent({ salesUser, stats, recentLeads }: SalesDashboardContentProps) {
  const totalLeads = stats.new + stats.contacted + stats.qualified + stats.won + stats.lost;
  const conversionRate = totalLeads > 0 ? ((stats.won / totalLeads) * 100).toFixed(1) : '0';

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
                      <Link href={`/sales/leads/${lead.id}`} className="font-medium text-sm text-gray-900 hover:underline">
                        {lead.name}
                      </Link>
                      {lead.email && <p className="text-xs text-gray-500">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{lead.company || '-'}</td>
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireSalesAuth } from '@/lib/sales-auth';

export async function GET(request: NextRequest) {
  try {
    await requireSalesAuth();
    const supabase = await createClient();

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch analytics data
    const [leadsData, campaignsData, sourcesData, emailLogsData] = await Promise.all([
      // Total leads stats
      supabase
        .from('leads')
        .select('id, status, matched_service, country, email, phone, relevance_score, created_at, is_scraped')
        .gte('created_at', startDate.toISOString()),

      // Campaign stats
      supabase
        .from('email_campaigns')
        .select('id, name, emails_sent, emails_opened, emails_replied, is_active'),

      // Source stats
      supabase
        .from('lead_sources')
        .select('id, name, leads_count, is_active'),

      // Email logs for recent activity
      supabase
        .from('email_logs')
        .select('id, status, created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (leadsData.error) throw leadsData.error;
    if (campaignsData.error) throw campaignsData.error;
    if (sourcesData.error) throw sourcesData.error;
    if (emailLogsData.error) throw emailLogsData.error;

    const leads = leadsData.data || [];
    const campaigns = campaignsData.data || [];
    const sources = sourcesData.data || [];
    const emailLogs = emailLogsData.data || [];

    // Calculate lead stats
    const totalLeads = leads.length;
    const scrapedLeads = leads.filter(l => l.is_scraped).length;
    const leadsWithEmail = leads.filter(l => l.email).length;
    const leadsWithPhone = leads.filter(l => l.phone).length;

    // Leads by status
    const leadsByStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Leads by service
    const leadsByService = leads.reduce((acc, lead) => {
      const service = lead.matched_service || 'unclassified';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Leads by country
    const leadsByCountry = leads.reduce((acc, lead) => {
      const country = lead.country || 'unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Campaign totals
    const campaignStats = campaigns.reduce(
      (acc, campaign) => ({
        totalSent: acc.totalSent + (campaign.emails_sent || 0),
        totalOpened: acc.totalOpened + (campaign.emails_opened || 0),
        totalReplied: acc.totalReplied + (campaign.emails_replied || 0),
        activeCampaigns: acc.activeCampaigns + (campaign.is_active ? 1 : 0),
      }),
      { totalSent: 0, totalOpened: 0, totalReplied: 0, activeCampaigns: 0 }
    );

    // Email stats from logs
    const emailStats = emailLogs.reduce(
      (acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Source stats
    const activeSourcesCount = sources.filter(s => s.is_active).length;
    const totalSourceLeads = sources.reduce((sum, s) => sum + (s.leads_count || 0), 0);

    // Daily leads trend (last N days)
    const dailyTrend = leads.reduce((acc, lead) => {
      const date = new Date(lead.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      data: {
        overview: {
          totalLeads,
          scrapedLeads,
          leadsWithEmail,
          leadsWithPhone,
          emailRate: totalLeads > 0 ? Math.round((leadsWithEmail / totalLeads) * 100) : 0,
          phoneRate: totalLeads > 0 ? Math.round((leadsWithPhone / totalLeads) * 100) : 0,
        },
        leads: {
          byStatus: leadsByStatus,
          byService: leadsByService,
          byCountry: leadsByCountry,
          dailyTrend,
        },
        campaigns: {
          ...campaignStats,
          openRate: campaignStats.totalSent > 0
            ? Math.round((campaignStats.totalOpened / campaignStats.totalSent) * 100)
            : 0,
          replyRate: campaignStats.totalSent > 0
            ? Math.round((campaignStats.totalReplied / campaignStats.totalSent) * 100)
            : 0,
        },
        emails: emailStats,
        sources: {
          activeCount: activeSourcesCount,
          totalCount: sources.length,
          totalLeads: totalSourceLeads,
        },
        period: {
          days,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Analytics GET error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SalesDashboardContent } from "./SalesDashboardContent";

async function getSalesUser() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/sales/login");
  }

  const { data: salesUser } = await supabase
    .from("sales_users")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (!salesUser) {
    // User is authenticated but not a sales user - redirect to home
    redirect("/");
  }

  return salesUser;
}

async function getLeadStats(salesUserId: string) {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("status, value")
    .eq("sales_user_id", salesUserId);

  const stats = {
    new: 0,
    contacted: 0,
    qualified: 0,
    won: 0,
    lost: 0,
    pipelineValue: 0,
    wonValue: 0,
  };

  if (leads) {
    leads.forEach((lead) => {
      stats[lead.status as keyof typeof stats]++;
      if (lead.status === "qualified" || lead.status === "contacted") {
        stats.pipelineValue += lead.value || 0;
      }
      if (lead.status === "won") {
        stats.wonValue += lead.value || 0;
      }
    });
  }

  return stats;
}

async function getRecentLeads(salesUserId: string) {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .eq("sales_user_id", salesUserId)
    .order("created_at", { ascending: false })
    .limit(5);

  return leads || [];
}

const IN_PROGRESS_STATUSES = [
  "queued",
  "enriching",
  "skinning",
  "wiring_admin",
  "deploying",
  "auditing",
  "drafting",
];

async function getDemoStats(salesUserId: string) {
  const supabase = await createClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Pull demo jobs for this sales user's leads. Filter via the embedded lead's
  // sales_user_id. RLS also enforces this.
  const { data: jobs } = await supabase
    .from("demo_jobs")
    .select(
      "id, status, engagement_count, created_at, lead:leads(sales_user_id)",
    )
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(500);

  type JobRow = {
    id: string;
    status: string;
    engagement_count: number;
    created_at: string;
    lead: { sales_user_id?: string } | null;
  };
  const mine = ((jobs as unknown as JobRow[]) ?? []).filter(
    (j) => j.lead?.sales_user_id === salesUserId,
  );

  let inFlight = 0;
  let awaitingReview = 0;
  let sent7d = 0;
  let engaged = 0;
  for (const j of mine) {
    if (IN_PROGRESS_STATUSES.includes(j.status)) inFlight++;
    if (j.status === "draft_ready") awaitingReview++;
    if (j.status === "sent") sent7d++;
    if ((j.engagement_count ?? 0) > 0) engaged++;
  }
  const engagementRate = sent7d > 0 ? Math.round((engaged / sent7d) * 100) : 0;

  return { inFlight, awaitingReview, sent7d, engagementRate };
}

async function getTelegramStatus(salesUserId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_channels")
    .select("telegram_username, is_active")
    .eq("sales_user_id", salesUserId)
    .eq("channel_type", "telegram")
    .maybeSingle();
  return {
    connected: Boolean(data?.is_active),
    username: data?.telegram_username ?? null,
  };
}

export default async function SalesDashboard() {
  const salesUser = await getSalesUser();
  const [stats, recentLeads, demoStats, telegramStatus] = await Promise.all([
    getLeadStats(salesUser.id),
    getRecentLeads(salesUser.id),
    getDemoStats(salesUser.id),
    getTelegramStatus(salesUser.id),
  ]);

  return (
    <SalesDashboardContent
      salesUser={salesUser}
      stats={stats}
      recentLeads={recentLeads}
      demoStats={demoStats}
      telegramStatus={telegramStatus}
    />
  );
}

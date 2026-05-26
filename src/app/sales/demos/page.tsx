// Sales-side overview of all personalized demo jobs for this sales user's
// leads. Filterable by status; clickable into the per-lead detail page.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DemosOverviewContent } from "./DemosOverviewContent";

interface DemoJobWithLead {
  id: string;
  status: string;
  current_phase: string | null;
  progress: number;
  demo_url: string | null;
  audit_results: { scores?: { overall?: number } } | null;
  expires_at: string | null;
  engagement_count: number;
  created_at: string;
  lead_id: string;
  lead: {
    name: string;
    company: string | null;
    email: string | null;
  } | null;
}

async function getSalesUser() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect("/sales/login");
  const { data: salesUser } = await supabase
    .from("sales_users")
    .select("*")
    .eq("email", session.user.email)
    .single();
  if (!salesUser) redirect("/");
  return { supabase, salesUser };
}

export default async function DemosOverviewPage() {
  const { supabase, salesUser } = await getSalesUser();

  // Demo jobs joined to leads. Filter to this sales user's leads at the
  // policy level (RLS), but be explicit here too for clarity.
  const { data, error } = await supabase
    .from("demo_jobs")
    .select(
      `id, status, current_phase, progress, demo_url, audit_results,
       expires_at, engagement_count, created_at, lead_id,
       lead:leads ( name, company, email, sales_user_id )`,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = ((data as unknown as DemoJobWithLead[]) ?? []).filter(
    (r) => r.lead && (r.lead as any).sales_user_id === salesUser.id,
  );

  return (
    <DemosOverviewContent jobs={rows} errorMessage={error?.message ?? null} />
  );
}

// Shared admin SPA for personalized demos.
// URL: /d/<demoJobId> — opened from the "Open your admin →" pill injected
// into every deployed demo's marketing index.html.
//
// Flow:
//   1. Read demo_jobs from the sales/website Supabase (server, service role)
//      to map demoJobId → demo_supabase_org_id + reference_template_id.
//   2. Read demo_orgs from the DEMOS Supabase to get the org's brand.
//   3. Render the segment-appropriate admin shell.
//
// All reads against the demos project use the anon key (the demos project's
// RLS lets anon SELECT every table). Reads against the sales project use
// the service role from the server-side context.

import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { demosSupabase, isDemosSupabaseConfigured } from "@/lib/supabase/demos";
import { DemoAdminShell } from "./DemoAdminShell";

interface DemoJobRow {
  id: string;
  status: string;
  demo_url: string | null;
  demo_supabase_org_id: string | null;
  reference_template_id: string | null;
}

interface DemoOrgRow {
  id: string;
  name: string;
  brand_color: string | null;
  brand_logo: string | null;
  segment: string;
}

interface ResolveResult {
  job: DemoJobRow;
  org: DemoOrgRow;
}

async function resolveDemo(demoJobId: string): Promise<ResolveResult | null> {
  const salesUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const salesKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!salesUrl || !salesKey) return null;

  const sales = createClient(salesUrl, salesKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: job, error } = await sales
    .from("demo_jobs")
    .select("id, status, demo_url, demo_supabase_org_id, reference_template_id")
    .eq("id", demoJobId)
    .maybeSingle();
  if (error || !job || !job.demo_supabase_org_id) return null;
  if (["deleted", "expired", "failed"].includes(job.status)) return null;

  const demos = demosSupabase();
  if (!demos) return null;
  const { data: org, error: orgErr } = await demos
    .from("demo_orgs")
    .select("id, name, brand_color, brand_logo, segment")
    .eq("id", job.demo_supabase_org_id)
    .maybeSingle();
  if (orgErr || !org) return null;

  return { job: job as DemoJobRow, org: org as DemoOrgRow };
}

export default async function DemoAdminPage({
  params,
}: {
  params: Promise<{ demoJobId: string }>;
}) {
  const { demoJobId } = await params;

  if (!isDemosSupabaseConfigured()) {
    return (
      <UnconfiguredFallback message="Demos Supabase project not configured (NEXT_PUBLIC_DEMO_SUPABASE_URL / NEXT_PUBLIC_DEMO_SUPABASE_ANON_KEY)." />
    );
  }

  const resolved = await resolveDemo(demoJobId);
  if (!resolved) return notFound();

  return <DemoAdminShell job={resolved.job} org={resolved.org} />;
}

function UnconfiguredFallback({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8 text-slate-700">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-900">
          Admin not available
        </p>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import type { FeedbackCompany, FeedbackSubmission, SubmissionWithCompany } from "./types";

export async function getCompanyById(id: string): Promise<FeedbackCompany | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("feedback_companies").select("*").eq("id", id).maybeSingle();
  return (data as FeedbackCompany | null) ?? null;
}

export async function getCompanyByLoginEmail(email: string): Promise<FeedbackCompany | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("feedback_companies")
    .select("*")
    .eq("login_email", email)
    .maybeSingle();
  return (data as FeedbackCompany | null) ?? null;
}

export async function getCompanyByTokenLookup(lookup: string): Promise<FeedbackCompany | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("feedback_companies")
    .select("*")
    .eq("token_lookup", lookup)
    .maybeSingle();
  return (data as FeedbackCompany | null) ?? null;
}

export async function listCompanies(): Promise<FeedbackCompany[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("feedback_companies")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as FeedbackCompany[] | null) ?? [];
}

export async function listRecentSubmissions(limit = 50): Promise<SubmissionWithCompany[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("feedback_submissions")
    .select("*, feedback_companies(name,slug)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as SubmissionWithCompany[] | null) ?? [];
}

export async function submissionsForCompany(
  companyId: string,
  limit = 100,
): Promise<FeedbackSubmission[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("feedback_submissions")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as FeedbackSubmission[] | null) ?? [];
}

// Return a slug not already taken (base, base-2, base-3, ...).
export async function uniqueSlug(baseSlug: string): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("feedback_companies")
    .select("slug")
    .ilike("slug", `${baseSlug}%`);
  const taken = new Set(((data as { slug: string }[] | null) ?? []).map((r) => r.slug));
  if (!taken.has(baseSlug)) return baseSlug;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${baseSlug}-${Date.now()}`;
}

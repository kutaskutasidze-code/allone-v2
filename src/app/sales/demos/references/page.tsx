// Reference template library manager. Lists existing reference_templates,
// lets admins add a new reference (clones via the existing /api/admin/references
// POST → offer-generator → site-xray), trigger a refresh, or deactivate one.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReferencesManagerContent } from "./ReferencesManagerContent";

interface Reference {
  id: string;
  segment: string;
  source_url: string;
  source_label: string | null;
  pre_cloned_path: string;
  aesthetic_tier: number;
  xfly_check_score: number | null;
  ref_map_path: string | null;
  last_refreshed_at: string | null;
  is_active: boolean;
  created_at: string;
}

async function getSalesUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/sales/login");
  const admin = createAdminClient();
  const { data: salesUser } = await admin
    .from("sales_users")
    .select("*")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  if (!salesUser) redirect("/sales/login?error=not_sales_user");
  return { supabase, salesUser };
}

export default async function ReferencesManagerPage() {
  const { supabase } = await getSalesUser();

  const { data, error } = await supabase
    .from("reference_templates")
    .select("*")
    .order("aesthetic_tier", { ascending: false })
    .order("last_refreshed_at", { ascending: false, nullsFirst: false });

  return (
    <ReferencesManagerContent
      initial={(data as Reference[]) ?? []}
      errorMessage={error?.message ?? null}
    />
  );
}

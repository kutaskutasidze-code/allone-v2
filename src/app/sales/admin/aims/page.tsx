// /sales/admin/aims — admin-only growth-pct override matrix.
// Admin picks a sales user × metric, enters a growth percentage, save.
// Sales users see their resolved aim on the dashboard like before.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AimOverridesContent } from "./AimOverridesContent";

interface SalesUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OverrideRow {
  sales_user_id: string;
  metric: string;
  growth_pct: number;
}

async function requireAdmin() {
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
  if ((salesUser as { role?: string }).role !== "admin") redirect("/sales");
  return { supabase, salesUser };
}

export default async function AimOverridesPage() {
  const { supabase } = await requireAdmin();
  const [usersRes, overridesRes] = await Promise.all([
    supabase.from("sales_users").select("id, name, email, role").order("name"),
    supabase
      .from("aim_growth_overrides")
      .select("sales_user_id, metric, growth_pct"),
  ]);
  return (
    <AimOverridesContent
      users={(usersRes.data as SalesUserRow[]) ?? []}
      overrides={(overridesRes.data as OverrideRow[]) ?? []}
    />
  );
}

// /sales home — chat-native first page using BF's real OverviewChat
// (big greeting + starter chips + voice + streaming + attachments). The
// numerical dashboard moved to /sales/dashboard.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OverviewChat } from "@/components/bf-shell/OverviewChat";

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
  return salesUser;
}

const STARTERS: string[] = [
  "What are my aims today and how am I tracking against them?",
  "Show me today's queue",
  "Which leads need follow-up?",
  "Draft an outreach email for my newest qualified lead",
];

export default async function SalesHomePage() {
  const salesUser = await getSalesUser();
  const first = ((salesUser.name as string) || "").split(" ")[0] || "there";
  return <OverviewChat operatorFirstName={first} starters={STARTERS} />;
}

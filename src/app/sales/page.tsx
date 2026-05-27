// /sales home — chat-native first page in the BF shell pattern. Mirrors
// travelplace-bf and equivalenza-bf where the operator's primary entry is
// a chat with quick-action chips, not a dashboard. The numerical dashboard
// moved to /sales/dashboard.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatNativeHome, type QuickAction } from "@/components/bf-shell";

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

const STARTERS: QuickAction[] = [
  {
    label: "Today's aims",
    prompt: "What are my aims today and how am I tracking against them?",
  },
  { label: "Open dashboard", href: "/sales/dashboard" },
  { label: "See my leads", href: "/sales/leads" },
  { label: "Pending demos", href: "/sales/demos" },
  { label: "Reference library", href: "/sales/demos/references" },
  { label: "New lead", href: "/sales/leads/new" },
];

export default async function SalesHomePage() {
  const salesUser = await getSalesUser();
  const first = (salesUser.name as string).split(" ")[0] || "there";
  const hour = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Tbilisi",
    hour: "numeric",
    hour12: false,
  });
  const h = parseInt(hour, 10);
  const greeting =
    h < 11
      ? `Good morning, ${first}.`
      : h < 17
        ? `Hi ${first}.`
        : `Good evening, ${first}.`;

  return (
    <ChatNativeHome
      greeting={greeting}
      subhead="Ask me anything — pipeline, demos, today's aims, or jump straight to a section."
      starters={STARTERS}
      apiPath="/api/sales/chat"
      scopeLabel="Sales"
    />
  );
}

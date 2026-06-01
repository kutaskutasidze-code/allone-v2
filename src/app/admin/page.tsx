// /admin home — chat-native first page using BF's OverviewChat (the same
// component /sales uses). The numerical dashboard lives at /admin/dashboard.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OverviewChat } from "@/components/bf-shell/OverviewChat";

// Greeting helper: prefer user_metadata.name's first word; otherwise the
// email's local part before any dot/underscore so "luka.adamia" greets as
// "luka", not "luka.adamia".
function deriveFirstName(name: string | undefined, email: string): string {
  if (name && name.trim()) return name.trim().split(/\s+/)[0];
  const local = email.split("@")[0];
  const first = local.split(/[._-]+/)[0] || local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/admin/login");
  // Middleware already gates on the ADMIN_EMAILS allowlist, so anyone who
  // makes it here is OK. We just want the name for the greeting.
  return {
    firstName: deriveFirstName(
      user.user_metadata?.name as string | undefined,
      user.email,
    ),
  };
}

const STARTERS: string[] = [
  "Today's team call activity",
  "Which reps are under target this week?",
  "Show me the latest leads by source",
  "Generate a demo for an unassigned hot lead",
];

export default async function AdminHomePage() {
  const { firstName } = await getAdmin();
  return <OverviewChat operatorFirstName={firstName} starters={STARTERS} />;
}

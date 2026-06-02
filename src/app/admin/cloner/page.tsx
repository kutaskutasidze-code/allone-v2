// /admin/cloner — chat-native page. The whole UI is the OverviewChat
// component pointed at /api/admin/cloner/chat, where the system prompt
// teaches the model it's a cloner + web developer and the tools call
// the site-xray / xfly pipeline on Hetzner.
//
// Auth: same admin/supervisor gate as the rest of /admin (enforced by
// the chat route too — defense in depth).

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { OverviewChat } from "@/components/bf-shell/OverviewChat";

async function getAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) redirect("/admin/login");
  const admin = createAdminClient();
  const { data: salesUser } = await admin
    .from("sales_users")
    .select("*")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();
  if (
    !salesUser ||
    (salesUser.role !== "admin" && salesUser.role !== "supervisor")
  ) {
    redirect("/admin/login?error=admin_only");
  }
  return salesUser;
}

const STARTERS: string[] = [
  "Clone allone.ge into a new project",
  "Show me recent clone jobs",
  "Rebrand the last clone as Goga Photography",
  "Deploy clone OFR-2026-1234 to allonelabs",
];

export default async function ClonerHomePage() {
  const me = await getAdmin();
  const first = ((me.name as string) || "").split(" ")[0] || "there";
  return (
    <OverviewChat
      operatorFirstName={first}
      starters={STARTERS}
      chatEndpoint="/api/admin/cloner/chat"
      greetingOverride={`What do we clone today, ${first}?`}
    />
  );
}

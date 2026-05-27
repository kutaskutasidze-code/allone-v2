// /sales/notifications — past Telegram / notification send log for the
// signed-in sales user. Helps debug "I didn't get the daily aim today" etc.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NotificationsContent } from "./NotificationsContent";

interface SendRow {
  id: string;
  channel_type: string;
  message_type: string;
  period_key: string | null;
  sent_at: string;
  error: string | null;
  external_id: string | null;
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

export default async function NotificationsPage() {
  const { supabase, salesUser } = await getSalesUser();
  const { data } = await supabase
    .from("notification_sends")
    .select(
      "id, channel_type, message_type, period_key, sent_at, error, external_id",
    )
    .eq("sales_user_id", salesUser.id)
    .order("sent_at", { ascending: false })
    .limit(100);
  return <NotificationsContent sends={(data as SendRow[]) ?? []} />;
}

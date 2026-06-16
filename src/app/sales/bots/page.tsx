import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listBotConfigs } from "@/lib/bots/repo";
import { BotsContent } from "./BotsContent";

export const dynamic = "force-dynamic";

export default async function BotsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sales/login");
  const bots = await listBotConfigs();
  return <BotsContent bots={bots} />;
}

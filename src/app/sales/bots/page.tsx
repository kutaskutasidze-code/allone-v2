import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listBotConfigs, listAbandonedSessions } from "@/lib/bots/repo";
import { BotsContent } from "./BotsContent";

export const dynamic = "force-dynamic";

export default async function BotsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sales/login");
  const [bots, abandoned] = await Promise.all([
    listBotConfigs(),
    // Only sessions where the visitor actually answered something — one-turn
    // tyre-kickers would just be noise.
    listAbandonedSessions({ minTurns: 2, limit: 50 }),
  ]);
  return <BotsContent bots={bots} abandoned={abandoned} />;
}

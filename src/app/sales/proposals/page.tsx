import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listProposals, listOpenResponses } from "@/lib/offers/repo";
import { ProposalsContent } from "./ProposalsContent";

export const dynamic = "force-dynamic";

export default async function ProposalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sales/login");

  const [proposals, openResponses] = await Promise.all([
    listProposals(),
    listOpenResponses(),
  ]);

  return (
    <ProposalsContent proposals={proposals} openResponses={openResponses} />
  );
}

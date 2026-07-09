import { redirect } from "next/navigation";
import { getCompanySession } from "@/lib/feedback/session";
import { getCompanyById } from "@/lib/feedback/db";
import SubmitForm from "./SubmitForm";

export const dynamic = "force-dynamic";

// Server-guarded: requires a company session, then renders the form in the
// company's configured language (forces Georgian for ka-comms clients).
export default async function SubmitPage() {
  const session = await getCompanySession();
  if (!session) redirect("/feedback");

  const company = await getCompanyById(session.sub);
  if (!company || !company.is_active) redirect("/feedback?error=inactive");

  return <SubmitForm companyName={company.name} />;
}

import { redirect } from "next/navigation";
import { getCompanySession, type CompanySession } from "./session";

// For client-portal server components: require a logged-in company or bounce to login.
export async function requireCompanySession(): Promise<CompanySession> {
  const session = await getCompanySession();
  if (!session) redirect("/feedback");
  return session;
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getCompanySession } from "@/lib/feedback/session";
import type { Locale } from "@/lib/i18n/dict";
import FeedbackShell from "./FeedbackShell";

export const metadata: Metadata = {
  title: "AllOne Feedback",
  robots: { index: false, follow: false },
};

// Standalone light/monochrome shell for the client portal. Reads the active
// locale server-side (fb_locale cookie, set to the company's language at login)
// so the header toggle + pages render without a flash.
export default async function FeedbackLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const c = store.get("fb_locale")?.value;
  const initialLocale: Locale = c === "en" || c === "ka" ? c : "ka";
  const authed = Boolean(await getCompanySession());

  return (
    <FeedbackShell initialLocale={initialLocale} authed={authed}>
      {children}
    </FeedbackShell>
  );
}

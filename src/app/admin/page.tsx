// /admin home — chat-native first page in the BF shell pattern. Mirrors
// the operator-style entry of travelplace-bf + equivalenza-bf. The
// numerical dashboard moved to /admin/dashboard.

import { ChatNativeHome, type QuickAction } from "@/components/bf-shell";

const STARTERS: QuickAction[] = [
  { label: "Open dashboard", href: "/admin/dashboard" },
  { label: "Services", href: "/admin/services" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Clients", href: "/admin/clients" },
  { label: "Offers", href: "/admin/offers" },
  { label: "Leads", href: "/admin/leads" },
];

export default function AdminHomePage() {
  return (
    <ChatNativeHome
      greeting="Allone Admin"
      subhead="Ask anything about the marketing site, content, or sales pipeline. Or jump straight to a section."
      starters={STARTERS}
      apiPath="/api/sales/chat"
      scopeLabel="Admin"
    />
  );
}

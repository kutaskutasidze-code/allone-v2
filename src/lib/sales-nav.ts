import {
  Home,
  LayoutDashboard,
  Users,
  Sparkles,
  Bot,
  Mail,
  BarChart3,
  Database,
  FileText,
  Send,
  Target,
  ClipboardList,
} from "lucide-react";
import type { NavSection } from "@/components/bf-shell";

export const salesNav: NavSection[] = [
  {
    items: [
      { label: "Home", href: "/sales", icon: Home },
      { label: "Dashboard", href: "/sales/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { label: "Leads", href: "/sales/leads", icon: Users },
      { label: "Demos", href: "/sales/demos", icon: Sparkles },
      { label: "Bots", href: "/sales/bots", icon: Bot },
      { label: "Proposals", href: "/sales/proposals", icon: ClipboardList },
      { label: "Campaigns", href: "/sales/campaigns", icon: Mail },
    ],
  },
  {
    label: "Library",
    items: [
      { label: "References", href: "/sales/demos/references", icon: Database },
      { label: "Templates", href: "/sales/templates", icon: FileText },
      { label: "Sources", href: "/sales/sources", icon: Database },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Analytics", href: "/sales/analytics", icon: BarChart3 },
      { label: "Notifications", href: "/sales/notifications", icon: Send },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Aim overrides", href: "/sales/admin/aims", icon: Target },
    ],
  },
];

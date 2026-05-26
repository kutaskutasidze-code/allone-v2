import {
  Home,
  LayoutDashboard,
  FileText,
  Layers,
  Briefcase,
  Building2,
  BarChart3,
  Heart,
  Bot,
  Mail,
  Users,
} from "lucide-react";
import type { NavSection } from "@/components/bf-shell";

export const adminNav: NavSection[] = [
  {
    items: [
      { label: "Home", href: "/admin", icon: Home },
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Pages", href: "/admin/pages", icon: FileText },
      { label: "Services", href: "/admin/services", icon: Layers },
      { label: "Projects", href: "/admin/projects", icon: Briefcase },
      { label: "Clients", href: "/admin/clients", icon: Building2 },
    ],
  },
  {
    label: "Brand",
    items: [
      { label: "Values", href: "/admin/values", icon: Heart },
      { label: "Stats", href: "/admin/stats", icon: BarChart3 },
      { label: "About", href: "/admin/about", icon: FileText },
    ],
  },
  {
    label: "Pipeline",
    items: [
      { label: "Offers", href: "/admin/offers", icon: Mail },
      { label: "Leads", href: "/admin/leads", icon: Users },
      { label: "Claude", href: "/admin/claude", icon: Bot },
    ],
  },
];

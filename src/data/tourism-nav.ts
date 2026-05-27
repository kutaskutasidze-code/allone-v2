// allone-website nav config in the shape BF's AppSidebar expects.
//
// We kept the file name + export names (tourismNav, tourismFooter) so the
// cloned BF AppSidebar imports them unchanged. Internally, this is the
// union of our sales and admin sections — every operator sees all of it,
// gated by role at the route level rather than by hiding sidebar items.

import type { ComponentType, SVGProps } from "react";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  label: string;
  labelKa?: string;
  href: string;
  icon: string;
  count?: number | null;
  subEntities?: { label: string; segment: string }[];
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export interface NavConfig {
  top: NavItem;
  sections: NavSection[];
}

export const tourismNav: NavConfig = {
  top: { label: "Dashboard", href: "/sales", icon: "home" },
  sections: [
    {
      label: "Overview",
      items: [
        { label: "Call Mode", href: "/sales/call", icon: "message-circle" },
        {
          label: "Today's Queue",
          href: "/sales/leads?scope=today",
          icon: "calendar",
        },
        { label: "Analytics", href: "/sales/analytics", icon: "bar-chart-3" },
      ],
    },
    {
      label: "Pipeline",
      items: [
        { label: "Leads", href: "/sales/leads", icon: "users" },
        { label: "Hot Lines", href: "/sales/leads/hotlines", icon: "plane" },
        { label: "Demos", href: "/sales/demos", icon: "globe" },
        { label: "Campaigns", href: "/sales/campaigns", icon: "tags" },
      ],
    },
    {
      label: "Library",
      items: [
        {
          label: "References",
          href: "/sales/demos/references",
          icon: "briefcase",
        },
        { label: "Templates", href: "/sales/templates", icon: "file-text" },
        { label: "Sources", href: "/sales/sources", icon: "plug" },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Notifications", href: "/sales/notifications", icon: "bell" },
        { label: "Team", href: "/sales/team", icon: "user-check" },
      ],
    },
    {
      label: "Admin · Leads",
      items: [
        { label: "All Leads", href: "/admin/leads", icon: "user-check" },
        { label: "Assign Leads", href: "/admin/leads/assign", icon: "compass" },
        { label: "Hot Lines", href: "/admin/leads/hotlines", icon: "plane" },
        { label: "Team Roster", href: "/admin/team", icon: "users" },
        { label: "Audit Log", href: "/admin/leads/audit", icon: "file-text" },
        {
          label: "Analytics",
          href: "/admin/leads/analytics",
          icon: "bar-chart-3",
        },
      ],
    },
    {
      label: "Admin · Content",
      items: [
        { label: "Services", href: "/admin/services", icon: "briefcase" },
        { label: "Projects", href: "/admin/projects", icon: "building" },
        { label: "Clients", href: "/admin/clients", icon: "users" },
        { label: "Categories", href: "/admin/categories", icon: "tag" },
      ],
    },
    {
      label: "Admin · Brand",
      items: [
        { label: "Values", href: "/admin/values", icon: "shield" },
        { label: "Stats", href: "/admin/stats", icon: "trending-down" },
        { label: "About", href: "/admin/about", icon: "file-text" },
        { label: "Settings", href: "/admin/settings", icon: "compass" },
      ],
    },
    {
      label: "Admin · Tools",
      items: [
        { label: "Claude", href: "/admin/claude", icon: "plug" },
        { label: "Aim overrides", href: "/sales/admin/aims", icon: "compass" },
      ],
    },
  ],
};

export const tourismFooter: { label: string; href: string }[] = [
  { label: "Sign out", href: "/sales/logout" },
];

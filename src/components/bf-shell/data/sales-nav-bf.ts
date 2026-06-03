// BF-shaped nav config for /sales (mirrors travelplace-bf's tourism-nav.ts).
// AppSidebar (BF version) reads top + sections + footer in this shape.
// Mirrors master's SalesSidebar + AdminSidebar entries verbatim so nothing
// from master's pipeline UI gets dropped when the BF shell renders.

import type { ComponentType, SVGProps } from "react";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  label: string;
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

// Sales-rep sidebar: only what a rep needs day-to-day. Library (templates,
// sources, references), Team, and Aim overrides are admin-only and live
// under /admin in [[adminNavBF]] — they used to bleed into this nav, which
// confused reps and gave them links to pages they don't own.
export const salesNavBF: NavConfig = {
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
        { label: "Follow-ups", href: "/sales/follow-ups", icon: "calendar" },
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
      label: "Insights",
      items: [
        {
          label: "Commissions",
          href: "/sales/commissions",
          icon: "dollar-sign",
        },
        {
          label: "Notifications",
          href: "/sales/notifications",
          icon: "bell",
        },
      ],
    },
  ],
};

export const salesFooterBF = [{ label: "Sign out", href: "/sales/logout" }];

// Admin/manager sidebar. Includes the sales-rep–facing library (Templates,
// Sources, References, Aim overrides) that admins maintain, plus the
// /admin/team roster that replaced /sales/team.
export const adminNavBF: NavConfig = {
  top: { label: "Dashboard", href: "/admin", icon: "home" },
  sections: [
    {
      label: "Leads",
      items: [
        { label: "All Leads", href: "/admin/leads", icon: "user-check" },
        { label: "Assign Leads", href: "/admin/leads/assign", icon: "compass" },
        { label: "Hot Lines", href: "/admin/leads/hotlines", icon: "plane" },
        { label: "Team", href: "/admin/team", icon: "users" },
        { label: "Audit Log", href: "/admin/leads/audit", icon: "file-text" },
        {
          label: "Analytics",
          href: "/admin/leads/analytics",
          icon: "bar-chart-3",
        },
      ],
    },
    {
      label: "Library",
      items: [
        { label: "References", href: "/admin/references", icon: "briefcase" },
        { label: "Templates", href: "/admin/templates", icon: "file-text" },
        { label: "Sources", href: "/admin/sources", icon: "plug" },
        { label: "Aim overrides", href: "/admin/aims", icon: "compass" },
      ],
    },
    {
      label: "Content",
      items: [
        { label: "Services", href: "/admin/services", icon: "briefcase" },
        { label: "Projects", href: "/admin/projects", icon: "building" },
        { label: "Clients", href: "/admin/clients", icon: "users" },
        { label: "Categories", href: "/admin/categories", icon: "tag" },
      ],
    },
    {
      label: "Brand",
      items: [
        { label: "Values", href: "/admin/values", icon: "shield" },
        { label: "Stats", href: "/admin/stats", icon: "trending-down" },
        { label: "About", href: "/admin/about", icon: "file-text" },
        { label: "Settings", href: "/admin/settings", icon: "compass" },
      ],
    },
    {
      label: "Tools",
      items: [
        { label: "Cloner", href: "/admin/cloner", icon: "git-branch" },
        { label: "Claude", href: "/admin/claude", icon: "plug" },
        { label: "Sales Portal", href: "/sales", icon: "briefcase" },
      ],
    },
  ],
};

export const adminFooterBF = [{ label: "Sign out", href: "/admin/logout" }];

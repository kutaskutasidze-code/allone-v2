// Nav config for the /sales and /admin sidebars. AppSidebar reads top +
// sections + footer in this shape. Single source of truth for the CRM sidebar
// (the old SalesSidebar.tsx / AdminSidebar.tsx components are unused).

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

// Sales-rep sidebar — only what a rep needs day to day, grouped by intent:
// Today (the work in front of them), Pipeline (their leads), Insights (their
// numbers). Notifications (a Telegram send log) lives in the footer.
export const salesNavBF: NavConfig = {
  top: { label: "Home", href: "/sales", icon: "home" },
  sections: [
    {
      label: "Today",
      items: [
        { label: "Call Mode", href: "/sales/call", icon: "message-circle" },
        { label: "Follow-ups", href: "/sales/follow-ups", icon: "rotate-ccw" },
        { label: "Calendar", href: "/sales/calendar", icon: "calendar" },
      ],
    },
    {
      label: "Pipeline",
      items: [
        { label: "Leads", href: "/sales/leads", icon: "users" },
        { label: "Hot Lines", href: "/sales/leads/hotlines", icon: "map-pin" },
        { label: "Demos", href: "/sales/demos", icon: "globe" },
        { label: "Pipeline", href: "/sales/pipeline", icon: "trending-up" },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Overview", href: "/sales/dashboard", icon: "gauge" },
        { label: "Analytics", href: "/sales/analytics", icon: "bar-chart-3" },
        { label: "Commissions", href: "/sales/commissions", icon: "dollar-sign" },
      ],
    },
  ],
};

export const salesFooterBF = [
  { label: "Notifications", href: "/sales/notifications" },
  { label: "Sign out", href: "/sales/logout" },
];

// Admin/manager sidebar. Insights (reporting), Leads (lead management), Team
// (people + their activity), Library (sales-enablement assets), Website (the
// public-site CMS — rarely touched from the CRM), Tools. Sales Portal lives in
// the footer.
export const adminNavBF: NavConfig = {
  top: { label: "Home", href: "/admin", icon: "home" },
  sections: [
    {
      label: "Insights",
      items: [
        { label: "Overview", href: "/admin/dashboard", icon: "gauge" },
        { label: "Pipeline", href: "/admin/pipeline", icon: "trending-up" },
        { label: "Analytics", href: "/admin/leads/analytics", icon: "bar-chart-3" },
        { label: "Receivables", href: "/admin/receivables", icon: "receipt" },
      ],
    },
    {
      label: "Leads",
      items: [
        { label: "All Leads", href: "/admin/leads", icon: "user-check" },
        { label: "Assign Leads", href: "/admin/leads/assign", icon: "compass" },
        { label: "Hot Lines", href: "/admin/leads/hotlines", icon: "map-pin" },
        { label: "Duplicates", href: "/admin/leads/duplicates", icon: "copy" },
      ],
    },
    {
      label: "Team",
      items: [
        { label: "Team", href: "/admin/team", icon: "users" },
        { label: "Calendar", href: "/admin/calendar", icon: "calendar" },
        { label: "Audit Log", href: "/admin/leads/audit", icon: "scroll" },
      ],
    },
    {
      label: "Library",
      items: [
        { label: "References", href: "/admin/references", icon: "briefcase" },
        { label: "Templates", href: "/admin/templates", icon: "file-text" },
        { label: "Sources", href: "/admin/sources", icon: "plug" },
        { label: "Aim overrides", href: "/admin/aims", icon: "trending-down" },
      ],
    },
    {
      label: "Website",
      items: [
        { label: "Services", href: "/admin/services", icon: "tags" },
        { label: "Projects", href: "/admin/projects", icon: "building" },
        { label: "Clients", href: "/admin/clients", icon: "users" },
        { label: "Categories", href: "/admin/categories", icon: "tag" },
        { label: "Values", href: "/admin/values", icon: "shield" },
        { label: "Stats", href: "/admin/stats", icon: "scale" },
        { label: "About", href: "/admin/about", icon: "file-text" },
        { label: "Settings", href: "/admin/settings", icon: "compass" },
      ],
    },
    {
      label: "Tools",
      items: [{ label: "Cloner", href: "/admin/cloner", icon: "git-branch" }],
    },
  ],
};

export const adminFooterBF = [
  { label: "Sales Portal", href: "/sales" },
  { label: "Sign out", href: "/admin/logout" },
];

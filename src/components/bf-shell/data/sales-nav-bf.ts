// BF-shaped nav config for /sales (mirrors travelplace-bf's tourism-nav.ts).
// AppSidebar (BF version) reads top + sections + footer in this shape.

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

export const salesNavBF: NavConfig = {
  top: { label: "Home", href: "/sales", icon: "home" },
  sections: [
    {
      label: "Pipeline",
      items: [
        { label: "Dashboard", href: "/sales/dashboard", icon: "bar-chart-3" },
        { label: "Leads", href: "/sales/leads", icon: "users" },
        { label: "Demos", href: "/sales/demos", icon: "globe" },
        {
          label: "Campaigns",
          href: "/sales/campaigns",
          icon: "message-circle",
        },
      ],
    },
    {
      label: "Library",
      items: [
        { label: "References", href: "/sales/demos/references", icon: "tags" },
        { label: "Templates", href: "/sales/templates", icon: "file-text" },
        { label: "Sources", href: "/sales/sources", icon: "plug" },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Analytics", href: "/sales/analytics", icon: "bar-chart-3" },
        {
          label: "Notifications",
          href: "/sales/notifications",
          icon: "briefcase",
        },
      ],
    },
    {
      label: "Admin",
      items: [
        { label: "Aim overrides", href: "/sales/admin/aims", icon: "compass" },
      ],
    },
  ],
};

export const salesFooterBF = [
  { label: "Account", href: "/sales/account" },
  { label: "Sign out", href: "/sales/logout" },
];

export const adminNavBF: NavConfig = {
  top: { label: "Home", href: "/admin", icon: "home" },
  sections: [
    {
      label: "Content",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: "bar-chart-3" },
        { label: "Pages", href: "/admin/pages", icon: "file-text" },
        { label: "Services", href: "/admin/services", icon: "briefcase" },
        { label: "Projects", href: "/admin/projects", icon: "building" },
        { label: "Clients", href: "/admin/clients", icon: "users" },
      ],
    },
    {
      label: "Brand",
      items: [
        { label: "Values", href: "/admin/values", icon: "shield" },
        { label: "Stats", href: "/admin/stats", icon: "trending-down" },
        { label: "About", href: "/admin/about", icon: "file-text" },
      ],
    },
    {
      label: "Pipeline",
      items: [
        { label: "Offers", href: "/admin/offers", icon: "message-circle" },
        { label: "Leads", href: "/admin/leads", icon: "users" },
        { label: "Claude", href: "/admin/claude", icon: "plug" },
      ],
    },
  ],
};

export const adminFooterBF = [
  { label: "Account", href: "/admin/account" },
  { label: "Sign out", href: "/admin/logout" },
];

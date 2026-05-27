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
        {
          label: "Notifications",
          href: "/sales/notifications",
          icon: "briefcase",
        },
        { label: "Team", href: "/sales/team", icon: "user-check" },
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
      label: "Content",
      items: [
        { label: "Pages", href: "/admin/pages", icon: "file-text" },
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
      label: "Sales",
      items: [
        { label: "Offers", href: "/admin/offers", icon: "message-circle" },
        { label: "Claude", href: "/admin/claude", icon: "plug" },
        { label: "Sales Portal", href: "/sales", icon: "briefcase" },
      ],
    },
  ],
};

export const adminFooterBF = [
  { label: "Account", href: "/admin/account" },
  { label: "Sign out", href: "/admin/logout" },
];

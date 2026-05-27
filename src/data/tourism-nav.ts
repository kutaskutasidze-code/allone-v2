import type { ComponentType, SVGProps } from "react";

export type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  /** Display label (Latin) */
  label: string;
  /** Optional Georgian label, rendered as secondary line in tooltip / collapsed views */
  labelKa?: string;
  /** Route — used for active matching */
  href: string;
  /** Lucide icon name (resolved in AppSidebar.tsx) */
  icon: string;
  /** Live row count, optional — rendered as mono badge on the right */
  count?: number | null;
  /** Sub-entities — shown indented when this item's route prefix is active */
  subEntities?: { label: string; segment: string }[];
}

export interface NavSection {
  /** Section header label (uppercase in UI) */
  label: string;
  items: NavItem[];
}

export interface NavConfig {
  /** Single top item — Home/dashboard */
  top: NavItem;
  sections: NavSection[];
}

const hotelSubEntities = [
  { label: "Contacts", segment: "contacts" },
  { label: "Bank accounts", segment: "banks" },
  { label: "Balance", segment: "balance" },
  { label: "Price list", segment: "prices" },
];

// Same shape minus the price list, shared by avia / transfers / consul /
// insurance / excursions.
const companyVerticalSubEntities = [
  { label: "Contacts", segment: "contacts" },
  { label: "Bank accounts", segment: "banks" },
  { label: "Balance", segment: "balance" },
];

export const tourismNav: NavConfig = {
  top: { label: "Home", href: "/app", icon: "home" },
  sections: [
    {
      label: "Bookings",
      items: [
        {
          label: "Avia",
          labelKa: "ავია",
          href: "/app/avia",
          icon: "plane",
          subEntities: companyVerticalSubEntities,
        },
        {
          label: "Hotels",
          labelKa: "სასტუმროები",
          href: "/app/hotels",
          icon: "building",
          subEntities: hotelSubEntities,
        },
        {
          label: "Transfers",
          labelKa: "ტრანსფერი",
          href: "/app/transfers",
          icon: "truck",
          subEntities: companyVerticalSubEntities,
        },
        {
          label: "Guides",
          labelKa: "გიდები",
          href: "/app/guides",
          icon: "user-check",
        },
        {
          label: "Clients",
          labelKa: "კლიენტები",
          href: "/app/clients",
          icon: "users",
        },
        {
          label: "Companies",
          labelKa: "კომპანიები",
          href: "/app/companies",
          icon: "briefcase",
          subEntities: [
            { label: "Contacts", segment: "contacts" },
            { label: "Bank accounts", segment: "bank-accounts" },
            { label: "Balance", segment: "balance" },
            { label: "Parameters", segment: "parameters" },
          ],
        },
        {
          label: "Consul · Visa",
          labelKa: "საკონსულო",
          href: "/app/consul",
          icon: "file-text",
          subEntities: companyVerticalSubEntities,
        },
        {
          label: "Insurance",
          labelKa: "დაზღვევა",
          href: "/app/insurance",
          icon: "shield",
          subEntities: companyVerticalSubEntities,
        },
        {
          label: "Excursions",
          labelKa: "ექსკურსიები",
          href: "/app/excursions",
          icon: "compass",
          subEntities: companyVerticalSubEntities,
        },
        {
          label: "Transport",
          labelKa: "ტრანსპორტი",
          href: "/app/transport",
          icon: "car",
        },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Dashboard", href: "/app/dashboard", icon: "bar-chart-3" },
        { label: "Calendar", href: "/app/calendar", icon: "calendar" },
        { label: "Orders", href: "/app/orders", icon: "receipt" },
        { label: "Refunds", href: "/app/refunds", icon: "rotate-ccw" },
        { label: "Balance", href: "/app/balance", icon: "wallet" },
        { label: "WhatsApp", href: "/app/whatsapp", icon: "message-circle" },
        { label: "Audit log", href: "/app/audit", icon: "scroll" },
        { label: "Automations", href: "/app/automations", icon: "git-branch" },
        { label: "Integrations", href: "/app/integrations", icon: "plug" },
      ],
    },
    {
      label: "Catalog",
      items: [
        { label: "Countries", href: "/app/countries", icon: "globe" },
        { label: "Regions", href: "/app/regions", icon: "git-branch" },
        { label: "Cities", href: "/app/cities", icon: "map-pin" },
        { label: "Juridical form", href: "/app/juridical-form", icon: "scale" },
        { label: "Hotel groups", href: "/app/hotel-groups", icon: "tags" },
        { label: "Avia groups", href: "/app/avia-groups", icon: "tags" },
        {
          label: "Transfer groups",
          href: "/app/transfer-groups",
          icon: "tags",
        },
        { label: "Consul groups", href: "/app/consul-groups", icon: "tags" },
        {
          label: "Insurance groups",
          href: "/app/ensure-groups",
          icon: "tags",
        },
        {
          label: "Excursion groups",
          href: "/app/excursion-groups",
          icon: "tags",
        },
        {
          label: "Guide categories",
          href: "/app/guide-categories",
          icon: "tags",
        },
        {
          label: "Client categories",
          href: "/app/client-categories",
          icon: "tags",
        },
        {
          label: "Currencies",
          href: "/app/currency",
          icon: "dollar-sign",
        },
        {
          label: "Transport marks",
          href: "/app/transport-marks",
          icon: "tags",
        },
        {
          label: "Transport models",
          href: "/app/transport-models",
          icon: "tags",
        },
        {
          label: "Transport hydros",
          href: "/app/transport-hydros",
          icon: "tags",
        },
        {
          label: "Transport colors",
          href: "/app/transport-colors",
          icon: "tags",
        },
        {
          label: "Transport doors",
          href: "/app/transport-doors",
          icon: "tags",
        },
        {
          label: "Transport categories",
          href: "/app/transport-categories",
          icon: "tags",
        },
        // ── Payment (4) ────────────────────────────────────────────────
        { label: "Payment names", href: "/app/pay-name", icon: "credit-card" },
        {
          label: "Payment prescripts",
          href: "/app/pay-prescript",
          icon: "credit-card",
        },
        {
          label: "Payment provisos",
          href: "/app/pay-proviso",
          icon: "credit-card",
        },
        { label: "Payment types", href: "/app/pay-type", icon: "credit-card" },
        // ── Travel (6) ─────────────────────────────────────────────────
        {
          label: "Avia directions",
          href: "/app/avia-direction",
          icon: "plane",
        },
        {
          label: "Avia ticket types",
          href: "/app/avia-ticket-type",
          icon: "plane",
        },
        { label: "Booking class", href: "/app/bron-class", icon: "ticket" },
        { label: "Board types", href: "/app/board-type", icon: "coffee" },
        { label: "Ticket types", href: "/app/ticket-type", icon: "ticket" },
        { label: "Room types", href: "/app/room-type", icon: "bed" },
        // ── Verticals (4) ──────────────────────────────────────────────
        {
          label: "Insurance types",
          href: "/app/ensure-type",
          icon: "shield",
        },
        {
          label: "Excursion types",
          href: "/app/excursion-type",
          icon: "compass",
        },
        {
          label: "Transfer directions",
          href: "/app/transfer-direction",
          icon: "truck",
        },
        {
          label: "Transfer types",
          href: "/app/transfer-type",
          icon: "truck",
        },
        // ── Documents (3) ──────────────────────────────────────────────
        {
          label: "Issue places",
          href: "/app/issue-place",
          icon: "file-text",
        },
        {
          label: "Number categories",
          href: "/app/number-category",
          icon: "hash",
        },
        {
          label: "Purpose codes",
          href: "/app/purpose-code",
          icon: "file-text",
        },
        // ── Business (4) ───────────────────────────────────────────────
        {
          label: "Business sectors",
          href: "/app/business-sector",
          icon: "briefcase",
        },
        {
          label: "Company groups",
          href: "/app/company-group",
          icon: "briefcase",
        },
        { label: "Positions", href: "/app/position", icon: "user-check" },
        { label: "Categories", href: "/app/category", icon: "tags" },
        // ── Accounting (4) ─────────────────────────────────────────────
        {
          label: "Sub-accounts",
          href: "/app/sub-account",
          icon: "calculator",
        },
        {
          label: "Analysis codes",
          href: "/app/analisys-code",
          icon: "calculator",
        },
        { label: "Annex codes", href: "/app/annex", icon: "calculator" },
        { label: "Base codes", href: "/app/base", icon: "calculator" },
        // ── Other (3) ──────────────────────────────────────────────────
        { label: "Semblance", href: "/app/semblance", icon: "shuffle" },
        {
          label: "Service types",
          href: "/app/service-type",
          icon: "settings",
        },
        {
          label: "Organization types",
          href: "/app/organization-type",
          icon: "building-2",
        },
      ],
    },
    {
      label: "Reports",
      items: [
        {
          label: "Hotel directory",
          href: "/app/reports/hotel-directory",
          icon: "bar-chart-3",
        },
        {
          label: "Hotel price",
          href: "/app/reports/hotel-price",
          icon: "tag",
        },
        {
          label: "Debitor",
          href: "/app/reports/debitor",
          icon: "trending-down",
        },
        {
          label: "Financial totals",
          href: "/app/reports/sum",
          icon: "bar-chart-3",
        },
      ],
    },
  ],
};

/** The BF default footer items — preserved verbatim from `AppSidebar.tsx`. */
export const tourismFooter = [
  { label: "Account", href: "/app/account" },
  { label: "Organization", href: "/app/organization" },
  { label: "Billing", href: "/app/billing" },
  { label: "Help", href: "/app/help" },
];

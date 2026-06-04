"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/next-auth-shim";
import {
  salesNavBF,
  salesFooterBF,
  adminNavBF,
  adminFooterBF,
} from "./data/sales-nav-bf";
import { useLocale } from "@/lib/i18n/useLocale";
import type { TranslationKey } from "@/lib/i18n/dict";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building,
  Calendar,
  Car,
  Compass,
  DollarSign,
  FileText,
  Gauge,
  GitBranch,
  Globe,
  Home,
  MapPin,
  MessageCircle,
  Plane,
  Plug,
  Receipt,
  RotateCcw,
  Scale,
  Scroll,
  Shield,
  Tag,
  Tags,
  TrendingDown,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";

const ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  home: Home,
  plane: Plane,
  building: Building,
  truck: Truck,
  "user-check": UserCheck,
  "file-text": FileText,
  gauge: Gauge,
  shield: Shield,
  compass: Compass,
  car: Car,
  receipt: Receipt,
  "rotate-ccw": RotateCcw,
  wallet: Wallet,
  globe: Globe,
  "git-branch": GitBranch,
  "map-pin": MapPin,
  scale: Scale,
  scroll: Scroll,
  tags: Tags,
  tag: Tag,
  "trending-down": TrendingDown,
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  calendar: Calendar,
  "message-circle": MessageCircle,
  plug: Plug,
  users: Users,
  "dollar-sign": DollarSign,
  briefcase: Briefcase,
  bell: Bell,
};

// href → translation key (e.g. "/app/avia" → "nav.avia",
// "/app/juridical-form" → "nav.juridical_form",
// "/app/reports/hotel-directory" → "nav.hotel_directory")
const HREF_KEY_OVERRIDE: Record<string, TranslationKey> = {
  "/app/reports/hotel-directory": "nav.hotel_directory",
  "/app/reports/hotel-price": "nav.hotel_price",
  "/app/reports/debitor": "nav.report_debitor",
  "/app/reports/sum": "nav.report_sum",
};

function navKey(href: string): TranslationKey {
  if (href === "/app") return "nav.home";
  if (HREF_KEY_OVERRIDE[href]) return HREF_KEY_OVERRIDE[href];
  const slug = href
    .replace(/^\/app\//, "")
    .replace(/\//g, "_")
    .replace(/-/g, "_");
  return ("nav." + slug) as TranslationKey;
}

const SECTION_KEY: Record<string, TranslationKey> = {
  Bookings: "nav.section.bookings",
  Operations: "nav.section.operations",
  Catalog: "nav.section.catalog",
  Reports: "nav.section.reports",
};

const SUB_KEY: Record<string, TranslationKey> = {
  contacts: "tabs.contacts",
  banks: "tabs.banks",
  "bank-accounts": "tabs.banks",
  balance: "tabs.balance",
  prices: "tabs.prices",
  parameters: "tabs.parameters",
};

const FOOTER_KEY: Record<string, TranslationKey> = {
  "/app/account": "nav.account",
  "/app/organization": "nav.organization",
  "/app/billing": "nav.billing",
  "/app/help": "nav.help",
};

function Icon({ name }: { name: string }) {
  const I = ICONS[name];
  if (!I) return null;
  return <I className="h-4 w-4 shrink-0" strokeWidth={1.75} />;
}

function NavRow({
  href,
  label,
  iconName,
  count,
  active,
}: {
  href: string;
  label: string;
  iconName: string;
  count?: number | null;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-[var(--radius-xs)] px-3 py-1.5 text-[13px] transition ${
        active
          ? "bg-[var(--bg-sunken)] text-[var(--ink-900)] font-medium"
          : "text-[var(--ink-900)] hover:bg-[var(--bg-app)]"
      }`}
    >
      <Icon name={iconName} />
      <span className="flex-1 truncate">{label}</span>
      {count != null && (
        <span className="font-mono text-[11px] tabular-nums text-[var(--ink-400)]">
          {count}
        </span>
      )}
    </Link>
  );
}

function SubRow({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-[var(--radius-xs)] px-3 py-1 pl-10 text-[12px] transition ${
        active
          ? "bg-[var(--bg-sunken)] text-[var(--ink-900)] font-medium"
          : "text-[var(--ink-500)] hover:bg-[var(--bg-app)] hover:text-[var(--ink-900)]"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname() ?? "";
  const { t } = useLocale();

  // Pick the right nav config based on the active route — sales reps get the
  // rep-facing items, admins get the manager surface. Admin wins when both
  // prefixes match (e.g. /admin should never fall through to sales nav).
  const isAdmin = pathname.startsWith("/admin");
  const navConfig = isAdmin ? adminNavBF : salesNavBF;
  const footerConfig = isAdmin ? adminFooterBF : salesFooterBF;

  const matchesItem = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const isOnDetailFor = (itemHref: string) =>
    new RegExp(`^${itemHref}/[^/]+`).test(pathname);

  return (
    <aside className="flex h-full flex-col">
      <nav className="bf-no-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-2 py-4">
        {/* Top — Home */}
        <ul className="space-y-0.5">
          <li>
            {(() => {
              const topKey = navKey(navConfig.top.href);
              const topTranslated = t(topKey);
              const topLabel =
                topTranslated === topKey ? navConfig.top.label : topTranslated;
              return (
                <NavRow
                  href={navConfig.top.href}
                  label={topLabel}
                  iconName={navConfig.top.icon}
                  active={pathname === navConfig.top.href}
                />
              );
            })()}
          </li>
        </ul>

        {/* Sections */}
        {navConfig.sections.map((section) => (
          <div key={section.label} className="mt-6 px-3">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)]">
              {SECTION_KEY[section.label]
                ? t(SECTION_KEY[section.label])
                : section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = matchesItem(item.href);
                const expandSub =
                  !!item.subEntities && isOnDetailFor(item.href);
                const key = navKey(item.href);
                const translated = t(key);
                // Safety: if the dict didn't have it, t() returns the key
                // itself — fall back to the raw label from the nav config.
                const label = translated === key ? item.label : translated;
                return (
                  <li key={item.href}>
                    <NavRow
                      href={item.href}
                      label={label}
                      iconName={item.icon}
                      count={item.count}
                      active={active}
                    />
                    {expandSub && item.subEntities && (
                      <ul className="mt-0.5 space-y-0.5">
                        {item.subEntities.map((sub) => {
                          const subHref = `${item.href}/${pathname.split("/")[3] ?? ""}/${sub.segment}`;
                          const subActive = pathname.endsWith(
                            "/" + sub.segment,
                          );
                          const subLabel = SUB_KEY[sub.segment]
                            ? t(SUB_KEY[sub.segment])
                            : sub.label;
                          return (
                            <li key={sub.segment}>
                              <SubRow
                                href={subHref}
                                label={subLabel}
                                active={subActive}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — BF defaults, translated */}
      <div className="px-2 py-3">
        <ul className="space-y-0.5">
          {footerConfig.map((item) => {
            const label = FOOTER_KEY[item.href]
              ? t(FOOTER_KEY[item.href])
              : item.label;
            // Sign-out must clear the Supabase session client-side (a plain GET
            // to /(admin|sales)/logout does NOT sign out and just bounces back).
            if (item.href.endsWith("/logout")) {
              const loginUrl = item.href.replace(/\/logout$/, "/login");
              return (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => void signOut({ callbackUrl: loginUrl })}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-xs)] px-3 py-1.5 text-left text-[13px] transition text-[var(--ink-700)] hover:bg-[var(--bg-app)] hover:text-[var(--ink-900)]"
                  >
                    <span>{label}</span>
                  </button>
                </li>
              );
            }
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[var(--radius-xs)] px-3 py-1.5 text-[13px] transition ${
                    matchesItem(item.href)
                      ? "bg-[var(--bg-sunken)] text-[var(--ink-900)] font-medium"
                      : "text-[var(--ink-700)] hover:bg-[var(--bg-app)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

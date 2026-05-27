"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/lib/i18n/useLocale";
import type { TranslationKey } from "@/lib/i18n/dict";

const BASE_TABS: { segment: string; key: TranslationKey }[] = [
  { segment: "", key: "tabs.general" },
  { segment: "contacts", key: "tabs.contacts" },
  { segment: "banks", key: "tabs.banks" },
  { segment: "balance", key: "tabs.balance" },
];

// Verticals that carry priced variants (insurance coverage tiers,
// transfer capacity/distance tiers). Mirrors the hotel `prices` tab — see
// migration 0018_pricing_grids.sql for the underlying tables.
const PRICE_LIST_SLUGS = new Set(["insurance", "transfers"]);

// Verticals where operators track per-period opening balances against the
// supplier. Backed by `<vertical>_start_balance` (migration 0019).
const START_BALANCE_SLUGS = new Set(["avia", "consul", "insurance"]);

export function VerticalTabs({
  slug,
  id,
}: {
  slug: string;
  id: string | number;
}) {
  const pathname = usePathname() ?? "";
  const { t } = useLocale();
  const tabs = [...BASE_TABS];
  if (PRICE_LIST_SLUGS.has(slug)) {
    tabs.push({ segment: "price-list", key: "tabs.prices" });
  }
  if (START_BALANCE_SLUGS.has(slug)) {
    tabs.push({ segment: "start-balance", key: "tabs.startBalance" });
  }
  return (
    <div className="overflow-x-auto border-b border-[var(--allonce-line)]">
      <nav className="-mb-px flex min-w-max gap-1">
        {tabs.map((tab) => {
          const href = `/app/${slug}/${id}${tab.segment ? `/${tab.segment}` : ""}`;
          const active =
            tab.segment === ""
              ? pathname === href
              : pathname.endsWith("/" + tab.segment);
          return (
            <Link
              key={tab.key}
              href={href}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-[13px] transition sm:px-4 ${
                active
                  ? "border-[var(--ao-accent)] font-medium text-[var(--ink-900)]"
                  : "border-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]"
              }`}
            >
              {t(tab.key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

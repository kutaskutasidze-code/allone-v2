"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Phone, Mail, Globe, ExternalLink, User, Facebook, MapPin } from "lucide-react";
import { INFOSHOP_PATTERN } from "@/lib/validations/leads";
import { safeHttpUrl } from "@/lib/utils";

export const PITCH_LABELS: Record<string, string> = {
  no_website: "No website",
  website_broken: "Website broken",
  no_https: "Not secure (HTTP)",
  not_mobile_friendly: "Not mobile-friendly",
  no_chat_widget: "No chat widget",
  no_online_booking: "No online booking",
  no_social_links: "No social media",
  slow_website: "Slow website",
  basic_website_builder: "Wix/Tilda site",
  new_business: "New business",
  newly_registered: "Newly registered",
};

export const HIDDEN_TAGS = new Set(["enrich_attempted", "website_audited"]);

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** The fields LeadCard renders. Satisfied structurally by the `leads` Row. */
export interface LeadCardData {
  id: string;
  name: string | null;
  company: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  industry: string | null;
  city: string | null;
  facebook_url: string | null;
  source_url: string | null;
  matched_service: string | null;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  /** Assigned rep, when the caller joins it (admin list). Omit on rep-scoped lists. */
  sales_user?: { id: string; name: string } | null;
}

interface LeadCardProps {
  lead: LeadCardData;
  /** Detail-page base, e.g. "/sales/leads". Omit to render the heading as plain text. */
  basePath?: string;
  /** "row" = bordered row inside a shared container; "card" = standalone shadowed card. */
  variant?: "row" | "card";
  /** Extra wrapper classes (e.g. the per-index `border-t` for the row variant). */
  className?: string;
  /** Right-side controls (status dropdown, follow-up, notes toggle, delete). */
  actions?: ReactNode;
  /** Render a leading checkbox for bulk-select. */
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
}

export function LeadCard({
  lead,
  basePath,
  variant = "row",
  className = "",
  actions,
  selectable,
  selected,
  onSelectToggle,
}: LeadCardProps) {
  const heading = lead.company || lead.name;

  // Compact single-line row (Espo-style) for the leads lists.
  if (variant === "row") {
    const webHref =
      lead.website && !INFOSHOP_PATTERN.test(lead.website)
        ? safeHttpUrl(lead.website)
        : null;
    const fbHref = safeHttpUrl(lead.facebook_url);
    const srcHref =
      lead.source_url && !INFOSHOP_PATTERN.test(lead.source_url)
        ? safeHttpUrl(lead.source_url)
        : null;
    return (
      <div
        className={`group px-4 py-2.5 transition-colors hover:bg-[var(--bg-surface-alt)] ${className}`.trim()}
      >
        <div className="flex items-center gap-3">
          {selectable && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onSelectToggle}
              aria-label="Select lead"
              className="h-4 w-4 shrink-0 cursor-pointer accent-[var(--ao-accent)]"
            />
          )}
          {basePath ? (
            <Link
              href={`${basePath}/${lead.id}`}
              className="shrink-0 max-w-[40%] truncate text-sm font-medium text-[var(--ink-900)] hover:underline"
            >
              {heading}
            </Link>
          ) : (
            <span className="shrink-0 max-w-[40%] truncate text-sm font-medium text-[var(--ink-900)]">
              {heading}
            </span>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-3 text-xs text-[var(--ink-400)]">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex shrink-0 items-center gap-1 text-[var(--ao-accent)] hover:underline"
              >
                <Phone className="h-3 w-3" />
                {lead.phone}
              </a>
            )}
            {lead.city && <span className="truncate">{lead.city}</span>}
            <span className="shrink-0">{formatDate(lead.created_at)}</span>
            {lead.sales_user && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--bg-surface-alt)] px-2 py-0.5 text-[11px] text-[var(--ink-700)]">
                <User className="h-3 w-3" />
                {lead.sales_user.name}
              </span>
            )}
          </div>
          {(webHref || fbHref || srcHref) && (
            <span className="flex shrink-0 items-center gap-2.5">
              {webHref && (
                <a
                  href={webHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Website"
                  className="text-green-600 transition-opacity hover:opacity-60"
                >
                  <Globe className="h-3.5 w-3.5" />
                </a>
              )}
              {fbHref && (
                <a
                  href={fbHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Facebook"
                  className="text-[#1877f2] transition-opacity hover:opacity-60"
                >
                  <Facebook className="h-3.5 w-3.5" />
                </a>
              )}
              {srcHref && (
                <a
                  href={srcHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Source listing (Google Maps / directory)"
                  className="text-[var(--ao-accent)] transition-opacity hover:opacity-60"
                >
                  <MapPin className="h-3.5 w-3.5" />
                </a>
              )}
            </span>
          )}
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </div>
      </div>
    );
  }

  // Detailed card (hotlines).
  const visibleTags = (lead.tags ?? []).filter((t) => !HIDDEN_TAGS.has(t));
  const webHref =
    lead.website && !INFOSHOP_PATTERN.test(lead.website)
      ? safeHttpUrl(lead.website)
      : null;
  const fbHref = safeHttpUrl(lead.facebook_url);
  const srcHref =
    lead.source_url && !INFOSHOP_PATTERN.test(lead.source_url)
      ? safeHttpUrl(lead.source_url)
      : null;

  return (
    <div
      className={`group rounded-[var(--radius-md)] border border-[var(--allone-line-soft)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-xs)] shadow-black/[0.02] transition-shadow duration-200 hover:shadow-[var(--shadow-sm)] hover:shadow-black/[0.04] ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-3">
        {selectable && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onSelectToggle}
            aria-label="Select lead"
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--ao-accent)]"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {basePath ? (
              <Link
                href={`${basePath}/${lead.id}`}
                className="font-medium text-sm text-[var(--ink-900)] truncate hover:underline"
              >
                {heading}
              </Link>
            ) : (
              <h3 className="font-medium text-sm text-[var(--ink-900)] truncate">
                {heading}
              </h3>
            )}
            {lead.industry && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                {lead.industry}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline"
              >
                <Phone className="w-3 h-3" />
                {lead.phone}
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline"
              >
                <Mail className="w-3 h-3" />
                {lead.email}
              </a>
            )}
            {webHref ? (
              <a
                href={webHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
              >
                <Globe className="w-3 h-3" />
                Website
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-red-400">
                <Globe className="w-3 h-3" />
                No website
              </span>
            )}
            {fbHref && (
              <a
                href={fbHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Facebook
              </a>
            )}
            {srcHref && (
              <a
                href={srcHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--ink-500)] hover:text-[var(--ao-accent)]"
              >
                <ExternalLink className="w-3 h-3" />
                Source
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-[var(--ink-400)]">
            {lead.city && <span>{lead.city}</span>}
            {lead.matched_service && <span>· {lead.matched_service}</span>}
            <span>· {formatDate(lead.created_at)}</span>
          </div>
          {visibleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                >
                  {PITCH_LABELS[tag] || tag}
                </span>
              ))}
            </div>
          )}
          {lead.notes && (
            <div className="mt-2 text-xs text-[var(--ink-700)] bg-[var(--bg-surface-alt)] rounded-[var(--radius-sm)] px-3 py-2 whitespace-pre-wrap">
              {lead.notes}
            </div>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

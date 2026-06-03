"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Phone, Mail, Globe, ExternalLink } from "lucide-react";
import { INFOSHOP_PATTERN } from "@/lib/validations/leads";

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
}

export function LeadCard({
  lead,
  basePath,
  variant = "row",
  className = "",
  actions,
}: LeadCardProps) {
  const heading = lead.company || lead.name;
  const visibleTags = (lead.tags ?? []).filter((t) => !HIDDEN_TAGS.has(t));

  const base =
    variant === "card"
      ? "group bg-[var(--bg-surface)] border border-[var(--allone-line-soft)] rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-xs)] shadow-black/[0.02] hover:shadow-[var(--shadow-sm)] hover:shadow-black/[0.04] transition-shadow duration-200"
      : "group p-4 transition-colors hover:bg-[var(--bg-surface-alt)]";

  return (
    <div className={`${base} ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3">
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
            {lead.website && !INFOSHOP_PATTERN.test(lead.website) ? (
              <a
                href={lead.website}
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
            {lead.facebook_url && (
              <a
                href={lead.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--ao-accent)] hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                Facebook
              </a>
            )}
            {lead.source_url && !INFOSHOP_PATTERN.test(lead.source_url) && (
              <a
                href={lead.source_url}
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

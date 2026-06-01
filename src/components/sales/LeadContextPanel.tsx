"use client";

import { Mail, Building2, Globe, Tag } from "lucide-react";

interface LeadContextPanelProps {
  lead: {
    id: string;
    name: string;
    email: string | null;
    company: string | null;
    source: string | null;
  } | null;
}

export function LeadContextPanel({ lead }: LeadContextPanelProps) {
  if (!lead) return null;

  const domain = lead.email?.split("@")[1] ?? null;
  const url = domain ? `https://${domain}` : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--allone-line)] bg-[var(--bg-surface)] lg:col-span-2">
      <div className="border-b border-[var(--allone-line)] px-5 py-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--ink-500)]">
          Lead
        </p>
        <p className="text-sm font-medium text-[var(--ink-900)]">{lead.name}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-4">
        <Item icon={Building2} label="Company" value={lead.company ?? "—"} />
        <Item icon={Mail} label="Email" value={lead.email ?? "—"} />
        <Item icon={Globe} label="Site" value={url ?? "—"} href={url} />
        <Item icon={Tag} label="Source" value={lead.source ?? "—"} />
      </div>
    </div>
  );
}

function Item({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gray-400)]" />
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-500)]">
          {label}
        </p>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm text-[var(--ink-900)] hover:underline"
          >
            {value}
          </a>
        ) : (
          <p className="truncate text-sm text-[var(--ink-900)]">{value}</p>
        )}
      </div>
    </div>
  );
}

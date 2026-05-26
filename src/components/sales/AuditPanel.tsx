"use client";

import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface AuditPanelProps {
  audit: {
    scores?: { overall?: number };
    topIssues?: Array<{
      severity: string;
      category: string;
      headline: string;
      oneLineFix: string;
    }>;
  } | null;
}

const ICONS = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
} as const;

const COLORS = {
  critical: "text-red-600 bg-red-50 border-red-100",
  warning: "text-amber-700 bg-amber-50 border-amber-100",
  info: "text-blue-700 bg-blue-50 border-blue-100",
} as const;

export function AuditPanel({ audit }: AuditPanelProps) {
  const overall = audit?.scores?.overall;
  const issues = audit?.topIssues ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--gray-200)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--gray-200)] px-5 py-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--gray-500)]">
            Audit
          </p>
          <p className="text-sm font-medium text-[#071D2F]">
            {overall != null ? `${overall}/100 overall` : "No audit available"}
          </p>
        </div>
      </div>
      <div className="space-y-3 px-5 py-4" style={{ minHeight: 420 }}>
        {issues.length === 0 ? (
          <p className="text-sm text-[var(--gray-500)]">
            No critical issues found, or audit hasn&apos;t run yet.
          </p>
        ) : (
          issues.slice(0, 5).map((issue, i) => {
            const sev = (issue.severity as keyof typeof ICONS) || "info";
            const Icon = ICONS[sev] ?? Info;
            const color = COLORS[sev] ?? COLORS.info;
            return (
              <div key={i} className={`rounded-lg border px-3 py-2.5 ${color}`}>
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono uppercase tracking-wider opacity-70">
                      {issue.category}
                    </p>
                    <p className="mt-0.5 text-sm font-medium leading-snug text-[#071D2F]">
                      {issue.headline}
                    </p>
                    {issue.oneLineFix && (
                      <p className="mt-1 text-xs text-[var(--gray-600)]">
                        {issue.oneLineFix}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

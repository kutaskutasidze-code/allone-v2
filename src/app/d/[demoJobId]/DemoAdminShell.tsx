// Server component shell for the demo admin. Renders topbar + sidebar with
// the demo org's brand applied, then dispatches to the per-segment view.

import { Suspense } from "react";
import { TourismView } from "./TourismView";
import { EcomView } from "./EcomView";

interface Job {
  id: string;
  demo_url: string | null;
}
interface Org {
  id: string;
  name: string;
  brand_color: string | null;
  brand_logo: string | null;
  segment: string;
}

export function DemoAdminShell({ job, org }: { job: Job; org: Org }) {
  const accent = org.brand_color ?? "#0ea5e9";

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{ ["--accent" as never]: accent }}
    >
      {/* Topbar */}
      <header
        className="border-b border-slate-200 bg-white"
        style={{ borderTopColor: accent, borderTopWidth: 3 }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            {org.brand_logo ? (
              <img
                src={org.brand_logo}
                alt={org.name}
                className="h-8 w-auto"
                style={{ maxWidth: 140 }}
              />
            ) : (
              <span
                className="flex h-8 items-center rounded-md px-2.5 font-semibold text-white"
                style={{ background: accent }}
              >
                {org.name.slice(0, 1)}
              </span>
            )}
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">
                Admin · {org.segment}
              </p>
              <h1 className="text-sm font-semibold text-slate-900">
                {org.name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {job.demo_url && (
              <a
                href={job.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                ↗ View site
              </a>
            )}
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
              Demo
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          {org.segment === "tourism" ? (
            <TourismView orgId={org.id} accent={accent} />
          ) : (
            <EcomView orgId={org.id} accent={accent} />
          )}
        </Suspense>
      </main>

      <footer className="mx-auto max-w-7xl px-6 pb-8 pt-2 text-center text-xs text-slate-400">
        Allone Labs · This is a personalized demo. Data is illustrative.
      </footer>
    </div>
  );
}

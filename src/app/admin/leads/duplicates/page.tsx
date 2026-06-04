import { DuplicatesView } from "./DuplicatesView";

export default function DuplicatesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
          Duplicate leads
        </h1>
        <p className="mt-1 text-[13px] text-[var(--ink-500)]">
          Leads sharing a phone or email. Pick one to keep — the rest merge into
          it (their activity moves over; removals are recorded in a merge audit).
        </p>
      </div>
      <DuplicatesView />
    </div>
  );
}

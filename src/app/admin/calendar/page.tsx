import { CalendarView } from "@/components/calendar/CalendarView";

export default function AdminCalendarPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.022em] text-[var(--ink-900)] sm:text-2xl">
          Calendar
        </h1>
        <p className="mt-1 text-[13px] text-[var(--ink-500)]">
          Follow-ups and meetings across the team.
        </p>
      </div>
      <CalendarView role="admin" />
    </div>
  );
}

// Propose interview slots without any external calendar dependency.
// Picks the next N weekdays (Mon–Fri) at a fixed local hour, starting tomorrow,
// and returns them as UTC ISO strings. Tbilisi is UTC+4 with no DST, so the
// local→UTC conversion is a constant offset.

export type Slot = { startIso: string; endIso: string };

export function proposeSlots(
  now: Date,
  opts: {
    count: number;
    slotHourLocal: number;
    tzOffsetHours: number;
    durationMin: number;
  },
): Slot[] {
  const { count, slotHourLocal, tzOffsetHours, durationMin } = opts;
  const slots: Slot[] = [];
  // Walk forward day-by-day from tomorrow (in UTC terms) until we have `count`
  // weekday slots.
  const cursor = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  let guard = 0;
  while (slots.length < count && guard < 60) {
    guard++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    // The local wall-clock time we want, expressed in UTC.
    const startUtcHour = slotHourLocal - tzOffsetHours;
    const start = new Date(
      Date.UTC(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth(),
        cursor.getUTCDate(),
        startUtcHour,
        0,
        0,
      ),
    );
    // Skip weekends in *local* time (the day the candidate experiences).
    const localDay = new Date(
      start.getTime() + tzOffsetHours * 3600_000,
    ).getUTCDay();
    if (localDay === 0 || localDay === 6) continue; // Sun / Sat
    const end = new Date(start.getTime() + durationMin * 60_000);
    slots.push({ startIso: start.toISOString(), endIso: end.toISOString() });
  }
  return slots;
}

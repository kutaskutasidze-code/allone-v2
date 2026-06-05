// Date-boundary helpers anchored to Asia/Tbilisi (UTC+4 year-round — Georgia
// dropped DST in 2005). Each returns the UTC instant of the requested Tbilisi
// boundary, so the result drops straight into PostgREST timestamp filters and
// `Date` comparisons. Use these instead of `setUTCHours(0,...)` / `Date.UTC`,
// which bucket the first 4 hours of every Tbilisi day into the previous day.
const TZ_OFFSET_MS = 4 * 60 * 60 * 1000;

const shiftIn = (d: Date) => new Date(d.getTime() + TZ_OFFSET_MS);
const shiftOut = (d: Date) => new Date(d.getTime() - TZ_OFFSET_MS);

/** Start of the Tbilisi day containing `now`. */
export function tbilisiDayStart(now: Date = new Date()): Date {
  const t = shiftIn(now);
  t.setUTCHours(0, 0, 0, 0);
  return shiftOut(t);
}

/** Start of the Tbilisi week (Monday) containing `now`. */
export function tbilisiWeekStart(now: Date = new Date()): Date {
  const t = shiftIn(now);
  const dow = (t.getUTCDay() + 6) % 7; // 0 = Monday
  t.setUTCDate(t.getUTCDate() - dow);
  t.setUTCHours(0, 0, 0, 0);
  return shiftOut(t);
}

/** Start of a Tbilisi month relative to `now` (monthOffset 0 = this, -1 = last, 1 = next). */
export function tbilisiMonthStart(now: Date = new Date(), monthOffset = 0): Date {
  const t = shiftIn(now);
  t.setUTCDate(1);
  t.setUTCMonth(t.getUTCMonth() + monthOffset);
  t.setUTCHours(0, 0, 0, 0);
  return shiftOut(t);
}

/** Start of the Tbilisi calendar quarter containing `now`. */
export function tbilisiQuarterStart(now: Date = new Date()): Date {
  const t = shiftIn(now);
  t.setUTCMonth(Math.floor(t.getUTCMonth() / 3) * 3, 1);
  t.setUTCHours(0, 0, 0, 0);
  return shiftOut(t);
}

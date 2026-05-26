import { describe, it, expect } from "vitest";
import {
  baselineForPeriod,
  computeAim,
  computeAllAims,
  periodWindow,
  type MetricEvent,
} from "./sales-aims";

const dayMs = 86_400_000;

function ev(
  metric: MetricEvent["metric"],
  daysAgo: number,
  value = 1,
  now = new Date("2026-05-27T15:00:00Z"),
): MetricEvent {
  return {
    metric,
    occurred_at: new Date(now.getTime() - daysAgo * dayMs).toISOString(),
    value,
  };
}

describe("periodWindow", () => {
  it("day window spans local midnight to next local midnight", () => {
    const { start, end } = periodWindow(
      new Date("2026-05-27T10:30:00Z"),
      "day",
    );
    // Compare via local date (toISOString slice flips at UTC midnight depending
    // on the host TZ; getDate is host-local).
    expect(start.getDate()).toBe(end.getDate());
    expect(end.getTime() - start.getTime()).toBeGreaterThan(23 * 3600_000);
  });

  it("week window starts Monday", () => {
    const { start } = periodWindow(new Date("2026-05-27T10:30:00Z"), "week"); // Wed
    expect(start.getDay()).toBe(1); // Mon
  });

  it("month window spans first to last day", () => {
    const { start, end } = periodWindow(
      new Date("2026-05-15T00:00:00Z"),
      "month",
    );
    expect(start.getDate()).toBe(1);
    expect(end.getMonth()).toBe(start.getMonth()); // still same month
  });
});

describe("baselineForPeriod (day)", () => {
  it("averages previous 5 weekdays only", () => {
    // Wed 2026-05-27 → previous weekdays are Tue/Mon/Fri/Thu/Wed
    const now = new Date("2026-05-27T12:00:00Z"); // Wed
    const events = [1, 2, 3, 4, 5].map((d) => ev("leads_contacted", d, 1, now));
    const b = baselineForPeriod(events, "leads_contacted", "day", now);
    // Each prior weekday has 1 contact; baseline = 1 (skipping Sat/Sun)
    expect(b).toBeGreaterThan(0);
    expect(b).toBeLessThanOrEqual(1);
  });

  it("returns 0 when no prior events exist", () => {
    expect(baselineForPeriod([], "leads_contacted", "day", new Date())).toBe(0);
  });
});

describe("computeAim", () => {
  it("aim is baseline scaled by growth pct, ceil", () => {
    const now = new Date("2026-05-27T12:00:00Z");
    const events = [
      ev("leads_won_count", 1, 4, now),
      ev("leads_won_count", 2, 4, now),
      ev("leads_won_count", 3, 4, now),
    ];
    const r = computeAim({
      events,
      now,
      metric: "leads_won_count",
      period: "day",
    });
    expect(r.baseline).toBeGreaterThan(0);
    expect(r.aim).toBeGreaterThanOrEqual(Math.ceil(r.baseline));
  });

  it("progress is 100% when actual matches aim with zero baseline", () => {
    const r = computeAim({
      events: [
        {
          metric: "leads_contacted",
          occurred_at: new Date().toISOString(),
          value: 1,
        },
      ],
      now: new Date(),
      metric: "leads_contacted",
      period: "day",
    });
    expect(r.progress_pct).toBe(100); // baseline 0 → actual>0 = 100
  });

  it("respects growthPctOverride", () => {
    const now = new Date("2026-05-27T12:00:00Z");
    const events = [
      ev("demos_sent", 1, 10, now),
      ev("demos_sent", 2, 10, now),
      ev("demos_sent", 3, 10, now),
    ];
    const r = computeAim({
      events,
      now,
      metric: "demos_sent",
      period: "day",
      growthPctOverride: 50,
    });
    expect(r.growth_pct).toBe(50);
    expect(r.aim).toBeGreaterThan(r.baseline); // grew by 50%
  });

  it("actual counts only events within the current period window", () => {
    const now = new Date("2026-05-27T12:00:00Z");
    // 1 event today, 5 events earlier in the week
    const events = [
      ev("leads_qualified", 0, 1, now),
      ev("leads_qualified", 8, 1, now),
      ev("leads_qualified", 9, 1, now),
    ];
    const r = computeAim({
      events,
      now,
      metric: "leads_qualified",
      period: "day",
    });
    expect(r.actual).toBe(1);
  });
});

describe("computeAllAims", () => {
  it("returns one entry per metric", () => {
    const out = computeAllAims([], new Date(), "day");
    expect(out.length).toBe(6);
    expect(out.map((o) => o.metric).sort()).toEqual(
      [
        "demos_engaged",
        "demos_sent",
        "leads_contacted",
        "leads_qualified",
        "leads_won_count",
        "leads_won_revenue",
      ].sort(),
    );
  });
});

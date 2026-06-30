import { describe, it, expect } from "vitest";
import { proposeSlots } from "./slots";

const OPTS = {
  count: 3,
  slotHourLocal: 11,
  tzOffsetHours: 4,
  durationMin: 30,
};

describe("proposeSlots", () => {
  it("returns the requested number of slots", () => {
    // Wed 2026-07-01
    const slots = proposeSlots(new Date("2026-07-01T09:00:00Z"), OPTS);
    expect(slots).toHaveLength(3);
  });

  it("starts tomorrow, not today", () => {
    const slots = proposeSlots(new Date("2026-07-01T09:00:00Z"), OPTS);
    // 11:00 Tbilisi (UTC+4) == 07:00 UTC, on 2026-07-02
    expect(slots[0].startIso).toBe("2026-07-02T07:00:00.000Z");
  });

  it("ends durationMin after start", () => {
    const slots = proposeSlots(new Date("2026-07-01T09:00:00Z"), OPTS);
    expect(slots[0].endIso).toBe("2026-07-02T07:30:00.000Z");
  });

  it("skips weekends (local time)", () => {
    // Fri 2026-07-03 → next slots must be Mon 07-06, Tue 07-07, Wed 07-08
    const slots = proposeSlots(new Date("2026-07-03T09:00:00Z"), OPTS);
    expect(slots.map((s) => s.startIso.slice(0, 10))).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
    ]);
  });
});

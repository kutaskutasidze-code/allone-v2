import { describe, it, expect } from "vitest";
import { buildIcs, icsDate } from "./ics";

describe("icsDate", () => {
  it("formats an ISO instant as a UTC ics stamp", () => {
    expect(icsDate("2026-07-02T07:00:00.000Z")).toBe("20260702T070000Z");
  });
});

describe("buildIcs", () => {
  const ics = buildIcs({
    uid: "cand-1@allonelabs.com",
    startIso: "2026-07-02T07:00:00.000Z",
    endIso: "2026-07-02T07:30:00.000Z",
    summary: "Interview: AI Intern",
    description: "Chat with the AllOne team.",
    organizerName: "AllOne Labs",
    organizerEmail: "info@allonelabs.com",
    attendeeName: "Ana, Dev",
    attendeeEmail: "ana@example.com",
    dtstampIso: "2026-07-01T09:00:00.000Z",
  });

  it("is a valid single-event VCALENDAR with CRLF", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VEVENT");
    expect(ics.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  });

  it("carries the start/end/uid and a REQUEST method", () => {
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("UID:cand-1@allonelabs.com");
    expect(ics).toContain("DTSTART:20260702T070000Z");
    expect(ics).toContain("DTEND:20260702T073000Z");
    expect(ics).toContain(
      "ATTENDEE;CN=Ana\\, Dev;RSVP=TRUE:mailto:ana@example.com",
    );
  });
});

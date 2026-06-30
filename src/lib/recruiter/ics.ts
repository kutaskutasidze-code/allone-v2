// Minimal RFC 5545 VCALENDAR builder for a single meeting invite.
// No dependencies — produces text that Google/Apple/Outlook all parse as an
// invite when attached as `invite.ics`.

export function icsDate(iso: string): string {
  // 2026-07-02T07:00:00.000Z -> 20260702T070000Z
  return iso
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")
    .replace(/Z$/, "Z");
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

export function buildIcs(args: {
  uid: string;
  startIso: string;
  endIso: string;
  summary: string;
  description: string;
  organizerName: string;
  organizerEmail: string;
  attendeeName: string;
  attendeeEmail: string;
  dtstampIso: string;
}): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AllOne Labs//Recruiter//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${args.uid}`,
    `DTSTAMP:${icsDate(args.dtstampIso)}`,
    `DTSTART:${icsDate(args.startIso)}`,
    `DTEND:${icsDate(args.endIso)}`,
    `SUMMARY:${escapeText(args.summary)}`,
    `DESCRIPTION:${escapeText(args.description)}`,
    `ORGANIZER;CN=${escapeText(args.organizerName)}:mailto:${args.organizerEmail}`,
    `ATTENDEE;CN=${escapeText(args.attendeeName)};RSVP=TRUE:mailto:${args.attendeeEmail}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  // RFC 5545 wants CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}

// src/app/api/recruiter/cron/poll-meetings/route.ts
//
// Increment 3 — meeting approval poll.
// A recruiter approves a candidate by dragging their Plane card from "Todo"
// (awaiting approval) into the "In Progress" (started) group. This cron finds
// those cards, books the earliest proposed slot, emails the candidate a
// calendar invite (.ics), records the meeting on the application row, and moves
// the card to "Done" (completed). Idempotent: a booked application is skipped.
//
// Gated by the CRON_SECRET Bearer header Vercel sets on scheduled hits.

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recruiterConfig } from "@/lib/recruiter/config";
import {
  listIssuesInGroup,
  firstStateInGroup,
  setIssueState,
  addIssueComment,
} from "@/lib/recruiter/plane";
import { sendCandidateEmail } from "@/lib/recruiter/notify";
import { buildIcs } from "@/lib/recruiter/ics";

export const runtime = "nodejs";

type AppRow = {
  id: string;
  name: string;
  email: string | null;
  vacancy_title: string | null;
  plane_issue_id: string | null;
  proposed_slots: { startIso: string; endIso: string }[] | null;
  meeting_status: string | null;
  ai_language: string | null;
};

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${recruiterConfig.cronSecret()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Cards the recruiter has approved (moved to the started group).
  const approved = await listIssuesInGroup("started");
  if (approved.length === 0) return NextResponse.json({ booked: 0 });

  const issueIds = approved.map((i) => i.id);
  const { data: rows } = await supabase
    .from("job_applications")
    .select(
      "id,name,email,vacancy_title,plane_issue_id,proposed_slots,meeting_status,ai_language",
    )
    .in("plane_issue_id", issueIds);

  const doneStateId = await firstStateInGroup("completed");
  const booked: string[] = [];

  for (const row of (rows ?? []) as AppRow[]) {
    if (row.meeting_status !== "proposed") continue; // already booked / n/a
    const slot = row.proposed_slots?.[0];
    if (!slot || !row.email) continue;

    const summary = `Interview: ${row.vacancy_title ?? "AllOne Labs"}`;
    const ics = buildIcs({
      uid: `recruit-${row.id}@allonelabs.com`,
      startIso: slot.startIso,
      endIso: slot.endIso,
      summary,
      description: `Interview with the AllOne Labs team.`,
      organizerName: recruiterConfig.organizerName,
      organizerEmail: recruiterConfig.organizerEmail,
      attendeeName: row.name,
      attendeeEmail: row.email,
      dtstampIso: new Date().toISOString(),
    });

    let emailReason = "dry_run";
    if (recruiterConfig.sendingEnabled()) {
      const subject =
        row.ai_language === "ka"
          ? "შეხვედრის მოწვევა — AllOne Labs"
          : "Interview invitation — AllOne Labs";
      const localTime = new Date(slot.startIso).toISOString();
      const body =
        row.ai_language === "ka"
          ? `გამარჯობა ${row.name},\n\nმოხარული ვართ მოგიწვიოთ შეხვედრაზე. შემოთავაზებული დრო: ${localTime} (UTC).\nთუ დრო არ გერგებათ, გვაცნობეთ.\n\nAllOne Labs`
          : `Hi ${row.name},\n\nWe'd love to meet. Proposed time: ${localTime} (UTC).\nThe calendar invite is attached — if the time doesn't work, just reply.\n\nAllOne Labs`;
      const r = await sendCandidateEmail({ to: row.email, subject, body, ics });
      emailReason = r.sent ? "sent" : `failed:${r.reason ?? "unknown"}`;
    }

    await supabase
      .from("job_applications")
      .update({
        meeting_status: "booked",
        meeting_starts_at: slot.startIso,
        status: "interview",
        ai_email_status: emailReason,
        ai_emailed_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (row.plane_issue_id) {
      try {
        await addIssueComment(
          row.plane_issue_id,
          `Meeting booked for ${slot.startIso} (UTC). Invite ${emailReason}.`,
        );
        if (doneStateId) await setIssueState(row.plane_issue_id, doneStateId);
      } catch {
        // Plane bookkeeping is best-effort; the booking already persisted.
      }
    }
    booked.push(row.id);
  }

  return NextResponse.json({
    booked: booked.length,
    ids: booked,
    sending_enabled: recruiterConfig.sendingEnabled(),
  });
}

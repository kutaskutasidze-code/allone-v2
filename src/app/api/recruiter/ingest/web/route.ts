// src/app/api/recruiter/ingest/web/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recruiterConfig } from "@/lib/recruiter/config";
import { extractCvText, UnsupportedCvError } from "@/lib/recruiter/cv";
import { getOpenVacancies, matchVacancy } from "@/lib/recruiter/vacancies";
import { evaluateCandidate } from "@/lib/recruiter/evaluate";
import { createCandidateIssue, firstStateInGroup } from "@/lib/recruiter/plane";
import { proposeSlots } from "@/lib/recruiter/slots";
import { sendCandidateEmail } from "@/lib/recruiter/notify";
import type { Candidate } from "@/lib/recruiter/types";

export const runtime = "nodejs"; // pdf-parse/mammoth need Node, not edge

type Row = {
  id: string;
  name: string;
  email: string | null;
  phone?: string | null;
  vacancy_id?: string | null;
  vacancy_title?: string | null;
  cv_path?: string | null;
  projects?: string | null;
  note?: string | null;
  ai_ranked_at?: string | null;
};

export async function POST(req: Request) {
  if (
    req.headers.get("x-webhook-secret")?.trim() !==
    recruiterConfig.webhookSecret()
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { record?: Row };
  const row = body.record;
  if (!row?.id)
    return NextResponse.json({ error: "No record" }, { status: 400 });

  // Idempotency: skip if already ranked.
  if (row.ai_ranked_at)
    return NextResponse.json({ skipped: true, reason: "already_ranked" });

  const supabase = createAdminClient();

  const fail = async (reason: string) => {
    await supabase
      .from("job_applications")
      .update({
        status: "reviewing",
        ai_rationale: reason,
        ai_ranked_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    return NextResponse.json({ held: true, reason });
  };

  // 1. CV text
  let cvText = "";
  if (row.cv_path) {
    const dl = await supabase.storage
      .from("applications")
      .download(row.cv_path);
    if (dl.error || !dl.data)
      return fail(`cv_download_failed: ${dl.error?.message ?? "no data"}`);
    const buf = Buffer.from(await dl.data.arrayBuffer());
    try {
      cvText = await extractCvText(buf, row.cv_path);
    } catch (e) {
      if (e instanceof UnsupportedCvError) return fail("unsupported_cv_type");
      return fail(`cv_parse_failed: ${(e as Error).message}`);
    }
  }

  // 2. Role
  const vacancies = await getOpenVacancies();
  const candidate: Candidate = {
    source: "web",
    externalId: row.id,
    name: row.name,
    email: row.email ?? "",
    phone: row.phone,
    vacancyId: row.vacancy_id,
    cvPath: row.cv_path,
    projects: row.projects,
    note: row.note,
  };
  const vacancy = matchVacancy(candidate, vacancies);
  if (!vacancy) return fail("no_matching_vacancy");

  // 3. Evaluate
  let verdict;
  try {
    verdict = await evaluateCandidate({
      vacancy,
      cvText,
      note: row.note,
      projects: row.projects,
    });
  } catch (e) {
    return fail(`evaluate_failed: ${(e as Error).message}`);
  }

  // 4. Guardrail: low confidence or missing email → hold (no auto-action).
  const held = verdict.confidence < recruiterConfig.confThreshold || !row.email;
  const isMeeting = !held && verdict.decision === "meeting";
  const isReject = !held && verdict.decision === "reject";

  // 5. CV signed URL for the Plane card
  let cvUrl: string | null = null;
  if (row.cv_path) {
    const { data } = await supabase.storage
      .from("applications")
      .createSignedUrl(row.cv_path, 60 * 60 * 24 * 7);
    cvUrl = data?.signedUrl ?? null;
  }

  // 6. Meeting candidates get proposed slots + an "awaiting approval" card
  // (placed in the unstarted/"Todo" Plane state). Reject/held cards keep the
  // project default state.
  const slots = isMeeting
    ? proposeSlots(new Date(), {
        count: recruiterConfig.slotCount,
        slotHourLocal: recruiterConfig.slotHourLocal,
        tzOffsetHours: recruiterConfig.tzOffsetHours,
        durationMin: recruiterConfig.meetingDurationMin,
      })
    : [];

  let stateId: string | null = null;
  if (isMeeting) {
    try {
      stateId = await firstStateInGroup("unstarted");
    } catch {
      stateId = null; // non-fatal: card just lands in the default state
    }
  }

  // 7. Plane card
  let issue;
  try {
    issue = await createCandidateIssue({
      candidate,
      vacancyTitle: vacancy.title,
      verdict,
      cvUrl,
      slots,
      stateId,
    });
  } catch (e) {
    return fail(`plane_create_failed: ${(e as Error).message}`);
  }

  // 8. Mirror into the CRM row.
  const status = held ? "reviewing" : isMeeting ? "shortlisted" : "rejected";
  const update: Record<string, unknown> = {
    ai_score: verdict.score,
    ai_decision: verdict.decision,
    ai_confidence: verdict.confidence,
    ai_language: verdict.language,
    ai_rationale: verdict.rationale,
    ai_strengths: verdict.strengths,
    ai_gaps: verdict.gaps,
    plane_issue_id: issue.id,
    ai_ranked_at: new Date().toISOString(),
    status,
  };
  if (isMeeting) {
    update.proposed_slots = slots;
    update.meeting_status = "proposed";
  }

  // 9. Increment 2 — auto-send rejection (gated by the global kill-switch).
  //    Meetings are NOT emailed here; that waits for human approval (the cron).
  let emailResult: { sent: boolean; reason?: string } | null = null;
  if (isReject && recruiterConfig.sendingEnabled() && row.email) {
    emailResult = await sendCandidateEmail({
      to: row.email,
      subject: verdict.emailSubject,
      body: verdict.emailBody,
    });
    update.ai_emailed_at = new Date().toISOString();
    update.ai_email_status = emailResult.sent
      ? "sent"
      : `failed:${emailResult.reason ?? "unknown"}`;
  }

  const { error } = await supabase
    .from("job_applications")
    .update(update)
    .eq("id", row.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ranked: true,
    decision: verdict.decision,
    held,
    plane_issue_id: issue.id,
    sending_enabled: recruiterConfig.sendingEnabled(),
    emailed: emailResult?.sent ?? false,
    proposed_slots: slots.length,
  });
}

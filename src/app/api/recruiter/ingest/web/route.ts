// src/app/api/recruiter/ingest/web/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recruiterConfig } from "@/lib/recruiter/config";
import { extractCvText, UnsupportedCvError } from "@/lib/recruiter/cv";
import { getOpenVacancies, matchVacancy } from "@/lib/recruiter/vacancies";
import { evaluateCandidate } from "@/lib/recruiter/evaluate";
import { createCandidateIssue } from "@/lib/recruiter/plane";
import type { Candidate } from "@/lib/recruiter/types";

export const runtime = "nodejs"; // pdf-parse/mammoth need Node, not edge

type Row = {
  id: string;
  name: string;
  email: string;
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
    email: row.email,
    phone: row.phone,
    vacancyId: row.vacancy_id,
    cvPath: row.cv_path,
    projects: row.projects,
    note: row.note,
  };
  const vacancy = matchVacancy(candidate, vacancies);
  if (!vacancy) return fail("no_matching_vacancy");

  // 3. Evaluate
  const verdict = await evaluateCandidate({
    vacancy,
    cvText,
    note: row.note,
    projects: row.projects,
  });

  // 4. Guardrail: low confidence → hold (no auto-action even in later increments)
  const held = verdict.confidence < recruiterConfig.confThreshold || !row.email;

  // 5. CV signed URL for the Plane card
  let cvUrl: string | null = null;
  if (row.cv_path) {
    const { data } = await supabase.storage
      .from("applications")
      .createSignedUrl(row.cv_path, 60 * 60 * 24 * 7);
    cvUrl = data?.signedUrl ?? null;
  }

  // 6. Plane card
  const issue = await createCandidateIssue({
    candidate,
    vacancyTitle: vacancy.title,
    verdict,
    cvUrl,
  });

  // 7. Mirror into the CRM row. DRY-RUN: never email; status reflects decision unless held.
  const status = held
    ? "reviewing"
    : verdict.decision === "meeting"
      ? "shortlisted"
      : "rejected";
  const { error } = await supabase
    .from("job_applications")
    .update({
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
    })
    .eq("id", row.id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ranked: true,
    decision: verdict.decision,
    held,
    plane_issue_id: issue.id,
  });
}

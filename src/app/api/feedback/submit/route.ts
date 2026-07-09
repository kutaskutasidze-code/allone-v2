import { NextRequest } from "next/server";
import { getCompanySession } from "@/lib/feedback/session";
import { getCompanyById } from "@/lib/feedback/db";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadScreenshots, MAX_SCREENSHOTS } from "@/lib/feedback/storage";
import { feedbackConfig } from "@/lib/feedback/config";
import { success, error, unauthorized } from "@/lib/api-response";
import * as plane from "@/lib/feedback/plane";

export const dynamic = "force-dynamic";

const TYPE_TAG: Record<string, string> = {
  bug: "[Bug] ",
  feature: "[Feature] ",
  feedback: "[Feedback] ",
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  const session = await getCompanySession();
  if (!session) return unauthorized();
  const company = await getCompanyById(session.sub);
  if (!company || !company.is_active) return unauthorized();

  const form = await request.formData();
  const type = String(form.get("type") ?? "feedback");
  const priority = plane.normalizePriority(String(form.get("priority") ?? "medium"));
  const title = String(form.get("title") ?? "").trim();
  const details = String(form.get("details") ?? "").trim();
  const pageUrl = String(form.get("page_url") ?? "").trim();
  if (!title || !details) return error("Missing title or details", 400);

  const files = form
    .getAll("screenshots")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_SCREENSHOTS);
  const shots = files.length ? await uploadScreenshots(company.slug, files) : [];

  const tag = TYPE_TAG[type] ?? "";
  const planeTitle = `[${company.name}] ${tag}${title}`.slice(0, 250);

  let descHtml = esc(details).replace(/\n/g, "<br/>");
  descHtml += `<br/><br/><b>Type:</b> ${esc(type)} &nbsp; <b>Priority:</b> ${esc(priority)}`;
  if (pageUrl) descHtml += `<br/><b>Page:</b> <a href="${esc(pageUrl)}">${esc(pageUrl)}</a>`;
  if (shots.length) {
    descHtml +=
      "<br/><br/><b>Screenshots:</b><br/>" +
      shots.map((u) => `<a href="${esc(u)}">${esc(u)}</a><br/><img src="${esc(u)}" style="max-width:100%"/>`).join("<br/>");
  }
  descHtml += `<br/><br/><i>Submitted by ${esc(company.name)}${
    company.contact_email ? ` (${esc(company.contact_email)})` : ""
  }</i>`;

  let intake: { intakeIssueId: string | null; issueId: string | null } = {
    intakeIssueId: null,
    issueId: null,
  };
  if (feedbackConfig.plane.configured) {
    try {
      intake = await plane.createIntakeIssue({ name: planeTitle, description_html: descHtml, priority });
      if (intake.issueId && company.plane_label_id) {
        try {
          await plane.addLabelToIssue(intake.issueId, company.plane_label_id);
        } catch {
          /* label attach is best-effort */
        }
      }
    } catch {
      return error("Could not submit to Plane", 502);
    }
  }

  const supabase = createAdminClient();
  const { error: dbErr } = await supabase.from("feedback_submissions").insert({
    company_id: company.id,
    type,
    priority,
    title,
    body: details,
    page_url: pageUrl || null,
    screenshot_urls: shots.length ? shots : null,
    plane_intake_issue_id: intake.intakeIssueId,
    plane_issue_id: intake.issueId,
    status: "submitted",
  });
  if (dbErr) return error("Could not save submission");

  return success({ ok: true }, 201);
}

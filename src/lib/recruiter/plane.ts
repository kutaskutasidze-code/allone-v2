import { recruiterConfig } from "./config";
import type { Candidate, Verdict } from "./types";

function planeUrl(path: string): string {
  return `${recruiterConfig.plane.baseUrl}/api/v1/workspaces/${recruiterConfig.plane.workspace}${path}`;
}

async function planeFetch(
  path: string,
  init: RequestInit = {},
): Promise<unknown> {
  const res = await fetch(planeUrl(path), {
    ...init,
    headers: {
      "X-API-Key": recruiterConfig.plane.apiKey(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Plane ${res.status}: ${await res.text()}`);
  return res.json();
}

export function buildIssueName(
  name: string,
  vacancyTitle: string,
  v: Verdict,
): string {
  return `${name} — ${vacancyTitle} — ${v.score}/100 — ${v.decision.toUpperCase()}`;
}

export function buildIssueDescription(
  c: Candidate,
  vacancyTitle: string,
  v: Verdict,
  cvUrl?: string | null,
): string {
  return [
    `**Role:** ${vacancyTitle}`,
    `**Email:** ${c.email}${c.phone ? `  **Phone:** ${c.phone}` : ""}`,
    `**Score:** ${v.score}/100   **Decision:** ${v.decision}   **Confidence:** ${v.confidence}`,
    `**Language:** ${v.language}`,
    `**Strengths:**\n${v.strengths.map((s) => `- ${s}`).join("\n") || "- (none)"}`,
    `**Gaps:**\n${v.gaps.map((g) => `- ${g}`).join("\n") || "- (none)"}`,
    `**Rationale:** ${v.rationale}`,
    cvUrl ? `**CV:** ${cvUrl}` : "",
    `**Drafted email (NOT sent — dry-run):**\nSubject: ${v.emailSubject}\n\n${v.emailBody}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function createCandidateIssue(args: {
  candidate: Candidate;
  vacancyTitle: string;
  verdict: Verdict;
  cvUrl?: string | null;
}): Promise<{ id: string }> {
  const { candidate, vacancyTitle, verdict } = args;
  const body = {
    name: buildIssueName(candidate.name, vacancyTitle, verdict),
    description_html: `<p>${buildIssueDescription(
      candidate,
      vacancyTitle,
      verdict,
      args.cvUrl,
    )
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/\n/g, "<br/>")}</p>`,
  };
  const issue = (await planeFetch(
    `/projects/${recruiterConfig.plane.projectId()}/issues/`,
    { method: "POST", body: JSON.stringify(body) },
  )) as { id: string };
  return { id: issue.id };
}

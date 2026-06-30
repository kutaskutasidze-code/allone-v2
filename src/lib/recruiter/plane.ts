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

function toHtml(markdownish: string): string {
  return `<p>${markdownish
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/\n/g, "<br/>")}</p>`;
}

export function buildIssueDescription(
  c: Candidate,
  vacancyTitle: string,
  v: Verdict,
  cvUrl?: string | null,
  slots?: { startIso: string }[],
): string {
  const slotLines =
    slots && slots.length
      ? `**Proposed interview slots:**\n${slots
          .map((s, i) => `${i + 1}. ${s.startIso}`)
          .join(
            "\n",
          )}\n\nTo APPROVE a meeting, move this card to **In Progress** — the earliest slot is booked and the candidate is invited automatically.`
      : "";
  return [
    `**Role:** ${vacancyTitle}`,
    `**Email:** ${c.email}${c.phone ? `  **Phone:** ${c.phone}` : ""}`,
    `**Score:** ${v.score}/100   **Decision:** ${v.decision}   **Confidence:** ${v.confidence}`,
    `**Language:** ${v.language}`,
    `**Strengths:**\n${v.strengths.map((s) => `- ${s}`).join("\n") || "- (none)"}`,
    `**Gaps:**\n${v.gaps.map((g) => `- ${g}`).join("\n") || "- (none)"}`,
    `**Rationale:** ${v.rationale}`,
    cvUrl ? `**CV:** ${cvUrl}` : "",
    slotLines,
    `**Drafted email:**\nSubject: ${v.emailSubject}\n\n${v.emailBody}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function createCandidateIssue(args: {
  candidate: Candidate;
  vacancyTitle: string;
  verdict: Verdict;
  cvUrl?: string | null;
  slots?: { startIso: string }[];
  stateId?: string | null;
}): Promise<{ id: string }> {
  const { candidate, vacancyTitle, verdict } = args;
  const body: Record<string, unknown> = {
    name: buildIssueName(candidate.name, vacancyTitle, verdict),
    description_html: toHtml(
      buildIssueDescription(
        candidate,
        vacancyTitle,
        verdict,
        args.cvUrl,
        args.slots,
      ),
    ),
  };
  if (args.stateId) body.state = args.stateId;
  const issue = (await planeFetch(
    `/projects/${recruiterConfig.plane.projectId()}/issues/`,
    { method: "POST", body: JSON.stringify(body) },
  )) as { id: string };
  return { id: issue.id };
}

// ---- Increment 3: state inspection + transitions ----

export type PlaneState = { id: string; name: string; group: string };

export async function listStates(): Promise<PlaneState[]> {
  const data = (await planeFetch(
    `/projects/${recruiterConfig.plane.projectId()}/states/`,
  )) as { results?: PlaneState[] };
  return (data.results ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    group: s.group,
  }));
}

// Resolve the first state id in a Plane state group ("unstarted", "started",
// "completed", "backlog", "cancelled").
export async function firstStateInGroup(group: string): Promise<string | null> {
  const states = await listStates();
  return states.find((s) => s.group === group)?.id ?? null;
}

export type PlaneIssue = { id: string; name: string; state: string };

// List issues currently in the given state group (one page is plenty for
// recruitment volume; bump `per_page` if needed).
export async function listIssuesInGroup(group: string): Promise<PlaneIssue[]> {
  const states = await listStates();
  const ids = new Set(states.filter((s) => s.group === group).map((s) => s.id));
  const data = (await planeFetch(
    `/projects/${recruiterConfig.plane.projectId()}/issues/?per_page=100`,
  )) as { results?: PlaneIssue[] };
  return (data.results ?? []).filter((i) => ids.has(i.state));
}

export async function setIssueState(
  issueId: string,
  stateId: string,
): Promise<void> {
  await planeFetch(
    `/projects/${recruiterConfig.plane.projectId()}/issues/${issueId}/`,
    { method: "PATCH", body: JSON.stringify({ state: stateId }) },
  );
}

export async function addIssueComment(
  issueId: string,
  text: string,
): Promise<void> {
  await planeFetch(
    `/projects/${recruiterConfig.plane.projectId()}/issues/${issueId}/comments/`,
    { method: "POST", body: JSON.stringify({ comment_html: toHtml(text) }) },
  );
}

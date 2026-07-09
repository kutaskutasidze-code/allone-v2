import { feedbackConfig } from "./config";
import type { Priority } from "./types";

const PRIORITIES: readonly Priority[] = ["urgent", "high", "medium", "low", "none"];

export function normalizePriority(p: string | null | undefined): Priority {
  return PRIORITIES.includes((p ?? "") as Priority) ? (p as Priority) : "none";
}

function base(): string {
  const { baseUrl, workspace, projectId } = feedbackConfig.plane;
  return `${baseUrl}/api/v1/workspaces/${workspace}/projects/${projectId}`;
}
function headers(): Record<string, string> {
  return { "X-API-Key": feedbackConfig.plane.apiKey, "Content-Type": "application/json" };
}

export interface CreatedIntake {
  intakeIssueId: string | null;
  issueId: string | null;
}

interface IntakeResponse {
  id?: string;
  issue?: string;
  issue_id?: string;
  issue_detail?: { id?: string };
}

// Create a Plane INTAKE issue (goes to the project's Intake for triage).
export async function createIntakeIssue(input: {
  name: string;
  description_html: string;
  priority: string;
}): Promise<CreatedIntake> {
  const res = await fetch(`${base()}/intake-issues/`, {
    method: "POST",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify({
      issue: {
        name: input.name,
        description_html: input.description_html,
        priority: normalizePriority(input.priority),
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`Plane intake create failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as IntakeResponse;
  const issueId = data.issue_detail?.id ?? data.issue ?? data.issue_id ?? null;
  return { intakeIssueId: data.id ?? null, issueId };
}

// Attach a label to the created issue (labels aren't part of the intake create body).
export async function addLabelToIssue(issueId: string, labelId: string): Promise<void> {
  const res = await fetch(`${base()}/issues/${issueId}/`, {
    method: "PATCH",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify({ labels: [labelId] }),
  });
  if (!res.ok) {
    throw new Error(`Plane label attach failed (${res.status}): ${await res.text()}`);
  }
}

interface Label {
  id?: string;
  name?: string;
}

// Create a per-company label, or find it if the name is already taken.
export async function ensureLabel(name: string, color = "#94a3b8"): Promise<string | null> {
  const createRes = await fetch(`${base()}/labels/`, {
    method: "POST",
    headers: headers(),
    cache: "no-store",
    body: JSON.stringify({ name, color }),
  });
  if (createRes.ok) {
    const data = (await createRes.json()) as Label;
    return data.id ?? null;
  }
  const listRes = await fetch(`${base()}/labels/`, { headers: headers(), cache: "no-store" });
  if (!listRes.ok) return null;
  const list = (await listRes.json()) as Label[] | { results?: Label[] };
  const arr: Label[] = Array.isArray(list) ? list : list.results ?? [];
  const match = arr.find((l) => (l.name ?? "").toLowerCase() === name.toLowerCase());
  return match?.id ?? null;
}

export function issueUrl(issueId: string): string {
  const { baseUrl, workspace, projectId } = feedbackConfig.plane;
  return `${baseUrl}/${workspace}/projects/${projectId}/issues/${issueId}`;
}

export function intakeUrl(): string {
  const { baseUrl, workspace, projectId } = feedbackConfig.plane;
  return `${baseUrl}/${workspace}/projects/${projectId}/intake/`;
}

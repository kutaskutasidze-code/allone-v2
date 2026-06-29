// scripts/recruiter-setup-plane.mjs
// Creates (or finds) the "Recruitment" project in workspace `allone`, prints its id.
const BASE = process.env.PLANE_BASE_URL ?? "https://plane.allonelabs.com";
const WS = process.env.PLANE_WORKSPACE ?? "allone";
const KEY = process.env.PLANE_API_KEY;
if (!KEY) {
  console.error("Set PLANE_API_KEY");
  process.exit(1);
}
const h = { "X-API-Key": KEY, "Content-Type": "application/json" };

const list = await fetch(`${BASE}/api/v1/workspaces/${WS}/projects/`, {
  headers: h,
}).then((r) => r.json());
let proj = (list.results ?? []).find((p) => p.name === "Recruitment");
if (!proj) {
  proj = await fetch(`${BASE}/api/v1/workspaces/${WS}/projects/`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({ name: "Recruitment", identifier: "HIRE" }),
  }).then((r) => r.json());
}
console.log("PLANE_RECRUITMENT_PROJECT_ID=" + proj.id);

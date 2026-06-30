function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

export const recruiterConfig = {
  // Read at call time so the kill-switch can be toggled without a redeploy and
  // so tests can set it per-case. Dry-run (false) by default.
  sendingEnabled: () => process.env.RECRUITER_SENDING_ENABLED === "true",
  confThreshold: Number(process.env.RECRUITER_CONF_THRESHOLD ?? "0.6"),
  model: process.env.RECRUITER_MODEL ?? "claude-opus-4-8",
  webhookSecret: () => need("RECRUITER_WEBHOOK_SECRET"),
  cronSecret: () => need("CRON_SECRET"),
  // Outbound candidate mail (Increment 2/3). Reuses the site Resend key.
  resendApiKey: () => process.env.RESEND_API_KEY ?? "",
  fromAddress:
    process.env.RECRUITER_FROM ?? "AllOne Careers <careers@allonelabs.com>",
  // The human recruiter / organizer for meeting invites.
  organizerEmail:
    process.env.RECRUITER_ORGANIZER_EMAIL ?? "info@allonelabs.com",
  organizerName: process.env.RECRUITER_ORGANIZER_NAME ?? "AllOne Labs",
  // Meeting flow (Increment 3): proposed slots + invite.
  slotCount: Number(process.env.RECRUITER_SLOT_COUNT ?? "3"),
  meetingDurationMin: Number(process.env.RECRUITER_MEETING_MINUTES ?? "30"),
  // Tbilisi is UTC+4 year-round (no DST).
  tzOffsetHours: Number(process.env.RECRUITER_TZ_OFFSET_HOURS ?? "4"),
  slotHourLocal: Number(process.env.RECRUITER_SLOT_HOUR ?? "11"), // 11:00 local
  plane: {
    baseUrl: process.env.PLANE_BASE_URL ?? "https://plane.allonelabs.com",
    apiKey: () => need("PLANE_API_KEY"),
    workspace: process.env.PLANE_WORKSPACE ?? "allone",
    projectId: () => need("PLANE_RECRUITMENT_PROJECT_ID"),
  },
};

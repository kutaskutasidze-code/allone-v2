function need(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

export const recruiterConfig = {
  sendingEnabled: process.env.RECRUITER_SENDING_ENABLED === "true", // dry-run default
  confThreshold: Number(process.env.RECRUITER_CONF_THRESHOLD ?? "0.6"),
  model: process.env.RECRUITER_MODEL ?? "claude-opus-4-8",
  webhookSecret: () => need("RECRUITER_WEBHOOK_SECRET"),
  plane: {
    baseUrl: process.env.PLANE_BASE_URL ?? "https://plane.allonelabs.com",
    apiKey: () => need("PLANE_API_KEY"),
    workspace: process.env.PLANE_WORKSPACE ?? "allone",
    projectId: () => need("PLANE_RECRUITMENT_PROJECT_ID"),
  },
};

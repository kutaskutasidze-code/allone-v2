// Centralized env accessors for the feedback feature. Read at call time (server
// only) so a missing var throws where it's used, not at import/build time.

function need(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}
function opt(key: string, def = ""): string {
  const v = process.env[key];
  return v === undefined || v === "" ? def : v;
}

export const feedbackConfig = {
  // Crypto / session (32-byte hex each).
  get encKey(): string {
    return need("APP_ENCRYPTION_KEY");
  },
  get sessionSecret(): string {
    return need("APP_SESSION_SECRET");
  },

  // Generated client login handles: <slug>@<domain>.
  get clientEmailDomain(): string {
    return opt("CLIENT_EMAIL_DOMAIN", "clients.allonelabs.com");
  },

  // Absolute base for magic links; call sites fall back to the request origin.
  get baseUrl(): string {
    return opt("FEEDBACK_BASE_URL").replace(/\/+$/, "");
  },

  // Lockout (email/password path only; the magic link is unguessable + unthrottled).
  get lockoutMax(): number {
    return parseInt(opt("LOCKOUT_MAX_ATTEMPTS", "5"), 10) || 5;
  },
  get lockoutMinutes(): number {
    return parseInt(opt("LOCKOUT_MINUTES", "15"), 10) || 15;
  },

  get isProd(): boolean {
    return process.env.NODE_ENV === "production";
  },

  // Plane (reuses the CRM's recruiter creds; a separate project id for feedback).
  plane: {
    get baseUrl(): string {
      return opt("PLANE_BASE_URL", "https://plane.allonelabs.com").replace(/\/+$/, "");
    },
    get workspace(): string {
      return opt("PLANE_WORKSPACE", "allone");
    },
    get projectId(): string {
      return need("PLANE_FEEDBACK_PROJECT_ID");
    },
    get apiKey(): string {
      return need("PLANE_API_KEY");
    },
    get configured(): boolean {
      return Boolean(process.env.PLANE_API_KEY && process.env.PLANE_FEEDBACK_PROJECT_ID);
    },
  },

  // Email via Resend HTTP API — reuses the CRM's existing setup (src/lib/email.ts).
  email: {
    get apiKey(): string {
      return opt("RESEND_API_KEY");
    },
    get from(): string {
      return opt("SMTP_FROM", "AllOne <onboarding@resend.dev>");
    },
    get configured(): boolean {
      return Boolean(process.env.RESEND_API_KEY);
    },
  },
};

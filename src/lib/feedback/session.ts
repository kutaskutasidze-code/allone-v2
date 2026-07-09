import crypto from "crypto";
import { cookies } from "next/headers";
import { feedbackConfig } from "./config";

// Portal-owned session for CLIENT companies only (staff use Supabase Auth).
// A compact HMAC-signed token (no external JWT dep): base64url(payload).base64url(sig).
export const SESSION_COOKIE = "fp_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface CompanySession {
  kind: "company";
  sub: string; // company id
  name: string;
}

interface Payload extends CompanySession {
  exp: number; // epoch seconds
}

function hmac(data: string): Buffer {
  return crypto.createHmac("sha256", feedbackConfig.sessionSecret).update(data).digest();
}

export function signSession(s: CompanySession): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const payload: Payload = { ...s, exp: nowSeconds + MAX_AGE_SECONDS };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = hmac(body).toString("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string | undefined): CompanySession | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = hmac(body).toString("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (payload.kind !== "company" || !payload.sub) return null;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { kind: "company", sub: String(payload.sub), name: payload.name ?? "" };
  } catch {
    return null;
  }
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: feedbackConfig.isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}

// Read the current company session from request cookies (server components / route handlers).
export async function getCompanySession(): Promise<CompanySession | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

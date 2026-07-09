import { NextRequest, NextResponse } from "next/server";
import { sha256hex } from "@/lib/feedback/crypto";
import { getCompanyByTokenLookup } from "@/lib/feedback/db";
import { signSession, SESSION_COOKIE, cookieOptions } from "@/lib/feedback/session";
import { feedbackConfig } from "@/lib/feedback/config";

export const dynamic = "force-dynamic";

// Permanent magic link: /feedback/c/<token> → set company session → /feedback/submit.
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = feedbackConfig.baseUrl || request.nextUrl.origin;

  const company = await getCompanyByTokenLookup(sha256hex(token));
  if (!company || !company.is_active) {
    return NextResponse.redirect(`${origin}/feedback?error=badlink`);
  }

  const res = NextResponse.redirect(`${origin}/feedback/submit`);
  const jwt = signSession({ kind: "company", sub: company.id, name: company.name });
  res.cookies.set(SESSION_COOKIE, jwt, cookieOptions());
  return res;
}

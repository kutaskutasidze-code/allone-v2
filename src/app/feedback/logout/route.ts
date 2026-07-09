import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/feedback/session";
import { feedbackConfig } from "@/lib/feedback/config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = feedbackConfig.baseUrl || request.nextUrl.origin;
  const res = NextResponse.redirect(`${origin}/feedback`);
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

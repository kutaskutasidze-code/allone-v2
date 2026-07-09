import { NextRequest, NextResponse } from "next/server";
import { getCompanyByLoginEmail } from "@/lib/feedback/db";
import { verifyPassword } from "@/lib/feedback/passwords";
import { lockState, registerFailure, registerSuccess } from "@/lib/feedback/throttle";
import { signSession, SESSION_COOKIE, cookieOptions } from "@/lib/feedback/session";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    body = {};
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) return NextResponse.json({ error: "missing" }, { status: 400 });

  // Generic "invalid" for not-found / inactive to avoid account enumeration.
  const company = await getCompanyByLoginEmail(email);
  if (!company || !company.is_active) return NextResponse.json({ error: "invalid" }, { status: 401 });

  const lock = lockState(company);
  if (lock.locked) return NextResponse.json({ error: "locked", min: lock.minutes }, { status: 429 });

  if (!verifyPassword(password, company.password_hash)) {
    const r = await registerFailure(company.id, company);
    if (r.locked) return NextResponse.json({ error: "locked", min: r.minutes }, { status: 429 });
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  await registerSuccess(company.id);
  const res = NextResponse.json({ success: true });
  const jwt = signSession({ kind: "company", sub: company.id, name: company.name });
  res.cookies.set(SESSION_COOKIE, jwt, cookieOptions());
  return res;
}

import { NextResponse } from "next/server";

// Compatibility redirect. BF's AuthGuard sends signed-out users to
// /signin?next=<path>; allone-website's login pages live at
// /sales/login and /admin/login. Decide which one to route to based
// on the `next` query (defaults to /sales/login).
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "";
  const zone = next.startsWith("/admin") ? "admin" : "sales";
  const target = new URL(`/${zone}/login`, url.origin);
  if (next) target.searchParams.set("next", next);
  return NextResponse.redirect(target);
}

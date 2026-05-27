import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST only: Next.js prefetches Link hrefs, and a GET that signed the
// user out would kill the session every time the sidebar rendered.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", request.url), {
    status: 303,
  });
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function signOutAndRedirect(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const GET = signOutAndRedirect;
export const POST = signOutAndRedirect;

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// next-auth compatibility endpoint. BF's AuthGuard + AccountMenu fetch
// /api/auth/session and expect either { user: {...} } when signed in or
// null/empty when signed out. We answer that from Supabase so the cloned
// BF shell components work unmodified.

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json(null);

  const user = data.user;
  const name =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "";
  const image = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return NextResponse.json({
    user: {
      name,
      email: user.email ?? "",
      image,
    },
    expires: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
  });
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/bots/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resume an in-progress intake conversation.
 *
 * The visitor's browser holds only an unguessable session UUID (same
 * capability-URL model as the /b/[slug]/c/[rid] thread page). If they refresh
 * or come back later, the client replays the transcript from here instead of
 * starting from scratch and losing everything they already typed.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const { slug, id } = await params;

  let session;
  try {
    session = await getSession(id);
  } catch {
    return NextResponse.json({ error: "lookup failed" }, { status: 500 });
  }

  // Scope to the slug in the URL so a session id can't be read through some
  // other client's bot link.
  if (!session || session.bot_slug !== slug) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    transcript: session.transcript ?? [],
    // Set once the chat completed — the client redirects to the thread instead
    // of resuming.
    response_id: session.response_id,
  });
}

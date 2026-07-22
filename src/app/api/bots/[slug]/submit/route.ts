import { NextRequest, NextResponse, after } from "next/server";
import {
  getBotConfigBySlug,
  buildResponseRow,
  insertResponse,
  closeSession,
} from "@/lib/bots/repo";
import { hasContact } from "@/lib/offers/self-offer";
import { notifySalesUser, ownerForLead } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The post-response `after()` work fires the self-offer pipeline, whose LLM
// draft legitimately takes ~50-90s. Give the instance room to finish it.
export const maxDuration = 150;

/** Absolute origin for internal route-to-route calls (Vercel-safe). */
function resolveOrigin(req: NextRequest): string {
  const env = process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return "https://app.allonelabs.com";
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  let body: {
    answers?: Record<string, string | string[]>;
    messages?: { role?: unknown; content?: unknown }[];
    session_id?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (!body?.answers || typeof body.answers !== "object") {
    return NextResponse.json({ error: "answers required" }, { status: 400 });
  }
  // Public endpoint: cap the payload so a known slug can't be used to bloat the
  // table with megabytes of JSON.
  if (JSON.stringify(body.answers).length > 50_000) {
    return NextResponse.json({ error: "answers too large" }, { status: 413 });
  }

  // Sanitize + bound the conversation transcript (kept for QA / re-extraction /
  // conversation intelligence). Only role+content strings, capped per message.
  const transcript = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m) => typeof m?.role === "string" && typeof m?.content === "string",
        )
        .slice(0, 120)
        .map((m) => ({
          role: String(m.role),
          content: String(m.content).slice(0, 8000),
        }))
    : null;

  try {
    const cfg = await getBotConfigBySlug(slug);
    if (!cfg) return NextResponse.json({ error: "not found" }, { status: 404 });

    const row = buildResponseRow(
      slug,
      cfg.lead_id,
      cfg.client_name,
      body.answers,
      req.headers.get("user-agent"),
      transcript,
    );
    const responseId = await insertResponse(row);

    const answers = body.answers as Record<string, unknown>;
    const canAutoOffer = hasContact(answers);
    const xff = req.headers.get("x-forwarded-for") ?? "";
    const origin = resolveOrigin(req);

    // Runs after the response is sent, so the visitor is redirected to their
    // thread immediately while this finishes server-side (a browser fetch would
    // be aborted by that navigation).
    after(async () => {
      // 0. Mark the session finished so it stops showing as abandoned.
      if (typeof body.session_id === "string" && body.session_id) {
        await closeSession(body.session_id, responseId);
      }

      // 1. Notify the owning rep that a new intake response landed (the bell).
      const { salesUserId, label } = await ownerForLead(cfg.lead_id);
      if (salesUserId) {
        await notifySalesUser({
          salesUserId,
          type: "bot_response",
          title: `New intake response: ${label || cfg.client_name || slug}`,
          body: canAutoOffer
            ? "Chat completed — auto-generating an offer."
            : "Chat completed — no contact captured, needs a manual offer.",
          leadId: cfg.lead_id,
          href: cfg.lead_id
            ? `/sales/leads/${cfg.lead_id}`
            : "/sales/proposals",
        });
      }

      // 2. Auto-generate + deliver the offer when we have a contact to send to.
      // self-offer is idempotent and rate-limited; a no-contact response would
      // 422 there, so we skip it to avoid holding the instance open for nothing.
      if (canAutoOffer) {
        try {
          await fetch(`${origin}/api/bots/${slug}/self-offer`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(xff ? { "x-forwarded-for": xff } : {}),
            },
            body: JSON.stringify({ response_id: responseId }),
            signal: AbortSignal.timeout(140_000),
          });
        } catch {
          // Best-effort: the manual sales path + the bell notification above
          // remain as the fallback.
        }
      }
    });

    return NextResponse.json({ ok: true, response_id: responseId });
  } catch (err) {
    console.error("[bots/submit] save failed", err);
    return NextResponse.json({ error: "save failed" }, { status: 500 });
  }
}

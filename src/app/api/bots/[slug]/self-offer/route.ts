import { NextRequest, NextResponse } from "next/server";
import { getResponse } from "@/lib/bots/repo";
import {
  getProposalByResponseId,
  createProposal,
  updateProposal,
  nextDocNumber,
  countRecentSelfServe,
  logSelfServe,
} from "@/lib/offers/repo";
import { extractContact, offerThreadUrl } from "@/lib/offers/self-offer";
import { sendSelfServeOfferNotice } from "@/lib/email";
import { notifySalesUser, ownerForLead } from "@/lib/notifications";
import type { OfferDraft } from "@/lib/offers/types";
import { selfOfferGuard, RL_WINDOW_MS, RL_MAX } from "./guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Cap total function time so a slow offer-generator can't pin a serverless
// instance. Two external calls (draft + render), bounded below.
export const maxDuration = 150;

const OFFER_API_URL = process.env.OFFER_API_URL ?? "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY ?? "";

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  // The offer DRAFT goes through the claude-bridge LLM and legitimately takes
  // ~50-90s — so the per-attempt timeout must be generous. attempts kept low so
  // the total stays under maxDuration (150s). Callers pass a shorter timeout
  // for the fast render call.
  {
    timeoutMs = 110_000,
    attempts = 1,
  }: { timeoutMs?: number; attempts?: number } = {},
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw lastErr;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: { response_id?: unknown };
  try {
    body = (await req.json()) as { response_id?: unknown };
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  if (typeof body.response_id !== "string") {
    return NextResponse.json(
      { error: "response_id (string) required" },
      { status: 400 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Idempotent: a response already turned into an offer just returns its link.
  const existing = await getProposalByResponseId(body.response_id);
  if (existing) {
    return NextResponse.json({
      offer_url: offerThreadUrl(slug, body.response_id),
      pdf_url: existing.offer_pdf_url,
      doc_number: existing.doc_number,
    });
  }

  // Coarse rate limit per IP.
  if ((await countRecentSelfServe(ip, RL_WINDOW_MS)) >= RL_MAX) {
    return NextResponse.json({ error: "rate limited" }, { status: 429 });
  }

  const response = await getResponse(body.response_id);
  const answers = (response?.answers ?? {}) as Record<string, unknown>;
  const guard = selfOfferGuard({ response, slug, answers });
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });

  const contact = extractContact(answers);
  const client_name =
    response!.client_name ?? contact.name ?? "Website visitor";

  // 1. Draft the offer.
  let offer: OfferDraft;
  try {
    const res = await fetchWithRetry(`${OFFER_API_URL}/api/offers/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify({ client_name, answers }),
    });
    if (!res.ok) throw new Error(`draft ${res.status}: ${await res.text()}`);
    offer = ((await res.json()) as { offer: OfferDraft }).offer;
    if (
      !offer ||
      typeof offer.price !== "number" ||
      !Array.isArray(offer.scope_lines)
    ) {
      throw new Error("malformed offer");
    }
  } catch {
    await logSelfServe(ip);
    return NextResponse.json(
      { error: "offer service unavailable", retriable: true },
      { status: 502 },
    );
  }

  const doc_number = await nextDocNumber();

  // 2. Create the proposal (draft), then render the PDF, then publish as sent.
  const proposal = await createProposal({
    lead_id: response!.lead_id,
    source_response_id: response!.id,
    client_name,
    doc_number,
    language: "en",
    offer,
    price: offer.price,
    currency: offer.currency ?? "GEL",
    status: "draft",
    created_by: null,
    source: "website-self-serve",
  });

  let pdf_url: string | null = null;
  try {
    const res = await fetchWithRetry(`${OFFER_API_URL}/api/offers/render`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify({ offer, doc_number }),
    });
    if (res.ok) pdf_url = ((await res.json()) as { pdf_url: string }).pdf_url;
  } catch {
    // Render failed — still publish the interactive offer; PDF can be regenerated.
  }

  await updateProposal(proposal.id, {
    status: "sent",
    source: "website-self-serve",
    ...(pdf_url ? { offer_pdf_url: pdf_url } : {}),
    chat_documents: pdf_url
      ? [{ kind: "offer", label: "Offer", url: pdf_url }]
      : [],
  });

  await logSelfServe(ip);

  const offer_url = offerThreadUrl(slug, response!.id);
  // Best-effort: fire-and-forget so a notification failure can never fail the
  // offer response (the callee already swallows its own errors).
  void sendSelfServeOfferNotice({
    clientName: client_name,
    contactName: contact.name,
    contactEmail: contact.email,
    contactPhone: contact.phone,
    docNumber: doc_number,
    price: offer.price,
    offerUrl: offer_url,
  }).catch(() => {});

  // Route the auto-generated offer to the owning rep's in-app bell — not just
  // the shared-inbox email above — so a hot inbound offer can't sit unseen.
  try {
    const { salesUserId, label } = await ownerForLead(response!.lead_id);
    if (salesUserId) {
      await notifySalesUser({
        salesUserId,
        type: "offer_ready",
        title: `Offer ${doc_number} ready: ${label || client_name}`,
        body: `Auto-generated • ${offer.price} ${offer.currency ?? "GEL"}`,
        leadId: response!.lead_id,
        href: "/sales/proposals",
      });
    }
  } catch {
    // A notification must never fail the offer response.
  }

  return NextResponse.json({ offer_url, pdf_url, doc_number });
}

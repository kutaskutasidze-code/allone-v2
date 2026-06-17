import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import { getProposal, updateProposal } from "@/lib/offers/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFER_API_URL = process.env.OFFER_API_URL ?? "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY ?? "";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DocsSelection {
  offer?: boolean;
  contract?: boolean;
  invoice?: boolean;
}

interface RequestBody {
  to?: string;
  subject?: string;
  html?: string;
  docs?: DocsSelection;
}

interface ServiceSendResponse {
  ok: boolean;
  resendId?: string;
  error?: string;
}

interface Attachment {
  url: string;
  filename: string;
}

export async function POST(req: NextRequest, context: RouteContext) {
  // Auth
  try {
    await requireSalesAuth();
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 },
    );
  }

  const { id } = await context.params;

  // Load proposal
  const proposal = await getProposal(id);
  if (!proposal) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Must be approved or already sent (re-send allowed)
  if (proposal.status !== "approved" && proposal.status !== "sent") {
    return NextResponse.json(
      { error: "შეთავაზება დასტურდება ჯერ (approved)" },
      { status: 409 },
    );
  }

  // Parse body
  let body: RequestBody = {};
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    // Proceed with empty body — validation below will catch required fields
  }

  const { to: bodyTo, subject, html, docs = {} } = body;

  // Resolve recipient
  const to =
    bodyTo?.trim() ||
    proposal.recipient_email?.trim() ||
    proposal.lead_email?.trim() ||
    "";
  if (!to) {
    return NextResponse.json(
      { error: "recipient email required" },
      { status: 400 },
    );
  }

  // Validate subject and html
  if (!subject?.trim()) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }
  if (!html?.trim()) {
    return NextResponse.json(
      { error: "html body is required" },
      { status: 400 },
    );
  }

  // Build attachments from selected docs that have URLs
  const attachments: Attachment[] = [];
  const docNum = proposal.doc_number ?? "doc";

  if (docs.offer && proposal.offer_pdf_url) {
    attachments.push({
      url: proposal.offer_pdf_url,
      filename: `${docNum}-offer.pdf`,
    });
  }
  if (docs.contract && proposal.contract_pdf_url) {
    attachments.push({
      url: proposal.contract_pdf_url,
      filename: `${docNum}-contract.pdf`,
    });
  }
  if (docs.invoice && proposal.invoice_pdf_url) {
    attachments.push({
      url: proposal.invoice_pdf_url,
      filename: `${docNum}-INV.pdf`,
    });
  }

  if (attachments.length === 0) {
    return NextResponse.json(
      { error: "select at least one available document" },
      { status: 400 },
    );
  }

  // Proxy to service — NO DB write before this succeeds
  let svcData: ServiceSendResponse;
  try {
    const svcRes = await fetch(`${OFFER_API_URL}/api/docs/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify({ to, subject, html, attachments }),
    });

    if (!svcRes.ok) {
      const errText = await svcRes.text();
      return NextResponse.json(
        { error: errText || `service error ${svcRes.status}` },
        { status: 502 },
      );
    }

    svcData = (await svcRes.json()) as ServiceSendResponse;
  } catch (fetchErr) {
    return NextResponse.json(
      {
        error:
          fetchErr instanceof Error
            ? fetchErr.message
            : "სერვისი მიუწვდომელია — სცადეთ მოგვიანებით",
      },
      { status: 502 },
    );
  }

  if (!svcData.ok) {
    return NextResponse.json(
      { error: svcData.error ?? "send failed" },
      { status: 502 },
    );
  }

  // Service succeeded — now write to DB
  const updated = await updateProposal(id, {
    status: "sent",
    sent_at: new Date().toISOString(),
    recipient_email: to,
  });

  return NextResponse.json({ proposal: updated });
}

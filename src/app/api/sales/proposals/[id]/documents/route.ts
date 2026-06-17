import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";
import {
  getProposal,
  updateProposal,
  seedPaymentsFromSchedule,
} from "@/lib/offers/repo";
import type { Recipient } from "@/lib/offers/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OFFER_API_URL = process.env.OFFER_API_URL ?? "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY ?? "";

// Georgian month names (index 0 = January)
const KA_MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
] as const;

function georgianDateLabel(date: Date): string {
  const year = date.getFullYear();
  const month = KA_MONTHS[date.getMonth()];
  const day = date.getDate();
  return `${year} წლის ${day} ${month}`;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface DocsServiceResponse {
  contract_pdf_url: string;
  invoice_pdf_url: string;
}

interface RequestBody {
  recipient?: Recipient;
}

export async function POST(req: NextRequest, context: RouteContext) {
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

  const proposal = await getProposal(id);
  if (!proposal) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (proposal.status !== "approved") {
    return NextResponse.json(
      { error: "proposal must be approved first" },
      { status: 409 },
    );
  }

  // Parse optional recipient from body; merge over proposal.recipient (body wins)
  let bodyRecipient: Recipient | undefined;
  try {
    const body = (await req.json()) as RequestBody;
    bodyRecipient = body.recipient;
  } catch {
    // Body may be empty — that is fine
  }

  const mergedRecipient: Recipient = {
    ...(proposal.recipient ?? {}),
    ...(bodyRecipient ?? {}),
    // name is required on Recipient; fall back to client_name if nothing provided
    name:
      bodyRecipient?.name ?? proposal.recipient?.name ?? proposal.client_name,
  };

  const dateLabel = georgianDateLabel(new Date());

  // Proxy to the offer-generator service — NO DB writes before this resolves
  let svcData: DocsServiceResponse;
  try {
    const svcRes = await fetch(`${OFFER_API_URL}/api/docs/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify({
        proposal: {
          client_name: proposal.client_name,
          doc_number: proposal.doc_number,
          language: proposal.language,
          offer: proposal.offer,
        },
        recipient: mergedRecipient,
        date_label: dateLabel,
      }),
    });

    if (!svcRes.ok) {
      const errText = await svcRes.text();
      return NextResponse.json(
        {
          error: `დოკუმენტის გენერაცია ვერ მოხერხდა: ${errText || svcRes.statusText}`,
        },
        { status: 502 },
      );
    }

    svcData = (await svcRes.json()) as DocsServiceResponse;
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

  // Service succeeded — now write to DB
  const updated = await updateProposal(id, {
    contract_pdf_url: svcData.contract_pdf_url,
    invoice_pdf_url: svcData.invoice_pdf_url,
    recipient: mergedRecipient,
  });

  // Seed lead_payments from the offer schedule — only on FIRST generation
  // (no contract yet), so re-generating the docs doesn't duplicate the rows.
  if (proposal.lead_id && !proposal.contract_pdf_url) {
    await seedPaymentsFromSchedule(
      proposal.lead_id,
      proposal.offer.schedule ?? [],
    );
  }

  return NextResponse.json({ proposal: updated });
}

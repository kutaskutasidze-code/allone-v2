import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";

const OFFER_API_URL = process.env.OFFER_API_URL || "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY || "";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const response = await fetch(
      `${OFFER_API_URL}/api/demos/${id}/draft/revoke`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${OFFER_API_KEY}` },
      },
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to revoke draft" },
      { status: 500 },
    );
  }
}

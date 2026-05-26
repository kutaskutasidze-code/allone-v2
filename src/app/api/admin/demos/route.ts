import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";

const OFFER_API_URL = process.env.OFFER_API_URL || "http://localhost:3100";
const OFFER_API_KEY = process.env.OFFER_API_KEY || "";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const lead_id = request.nextUrl.searchParams.get("lead_id");
    const status = request.nextUrl.searchParams.get("status");

    let query = supabase
      .from("demo_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (lead_id) query = query.eq("lead_id", lead_id);
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();

    const response = await fetch(`${OFFER_API_URL}/api/demos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OFFER_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create demo job" },
      { status: 500 },
    );
  }
}

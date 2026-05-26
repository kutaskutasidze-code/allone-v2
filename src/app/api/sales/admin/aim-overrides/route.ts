// Admin-only endpoint for reading + writing per-user growth-pct overrides.

import { NextRequest, NextResponse } from "next/server";
import { requireSalesAuth } from "@/lib/sales-auth";
import { AuthError } from "@/lib/auth";

async function requireAdmin() {
  const { supabase, salesUser } = await requireSalesAuth();
  if ((salesUser as { role?: string }).role !== "admin") {
    throw new AuthError("Admin only");
  }
  return { supabase, salesUser };
}

export async function GET() {
  try {
    const { supabase } = await requireAdmin();
    const [usersRes, overridesRes] = await Promise.all([
      supabase
        .from("sales_users")
        .select("id, name, email, role")
        .order("name"),
      supabase
        .from("aim_growth_overrides")
        .select("sales_user_id, metric, growth_pct, updated_at, set_by"),
    ]);
    if (usersRes.error) {
      return NextResponse.json(
        { error: usersRes.error.message },
        { status: 500 },
      );
    }
    return NextResponse.json({
      success: true,
      data: {
        users: usersRes.data ?? [],
        overrides: overridesRes.data ?? [],
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, salesUser } = await requireAdmin();
    const body = (await request.json()) as {
      sales_user_id?: string;
      metric?: string;
      growth_pct?: number;
    };
    if (
      !body.sales_user_id ||
      !body.metric ||
      typeof body.growth_pct !== "number"
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("aim_growth_overrides")
      .upsert(
        {
          sales_user_id: body.sales_user_id,
          metric: body.metric,
          growth_pct: body.growth_pct,
          set_by: salesUser.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "sales_user_id,metric" },
      )
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const sales_user_id = request.nextUrl.searchParams.get("sales_user_id");
    const metric = request.nextUrl.searchParams.get("metric");
    if (!sales_user_id || !metric) {
      return NextResponse.json(
        { error: "Missing query params" },
        { status: 400 },
      );
    }
    const { error } = await supabase
      .from("aim_growth_overrides")
      .delete()
      .eq("sales_user_id", sales_user_id)
      .eq("metric", metric);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

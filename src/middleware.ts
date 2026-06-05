import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user && !error;

  const userEmail = (user?.email || "").toLowerCase().trim();

  // Single source of truth: resolve the caller's role from sales_users
  // (one indexed service-role lookup).
  let dbRole: string | null = null;
  if (isAuthenticated && userEmail) {
    const roleUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sales_users?email=eq.${encodeURIComponent(userEmail)}&select=role&limit=1`;
    const lookup = await fetch(roleUrl, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      cache: "no-store",
    });
    if (lookup.ok) {
      const rows = await lookup.json();
      if (Array.isArray(rows) && rows[0]?.role) dbRole = rows[0].role as string;
    }
  }
  // Authorization authority = sales_users.role. Supervisors and admins both
  // reach the admin area; the finer admin-only split (e.g. sales-user
  // management) is enforced per-route by requireRole().
  const isAdminArea = dbRole === "admin" || dbRole === "supervisor";
  const isSalesUser = dbRole !== null;

  // Protect admin routes (except login)
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login") &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (!isAdminArea) {
      // A salesperson who is a sales user belongs in the sales portal — not the
      // public landing page (e.g. a rep who logged in via /admin/login).
      return NextResponse.redirect(new URL(isSalesUser ? "/sales" : "/", request.url));
    }
  }

  // Protect admin API routes
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    if (!isAuthenticated || !isAdminArea) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // Protect sales routes (except login). Anyone who can reach the sales portal
  // must (a) be authenticated and (b) have a row in sales_users — otherwise the
  // sidebar and the per-rep scoping wouldn't make sense and the API would 401
  // every page load.
  if (
    request.nextUrl.pathname.startsWith("/sales") &&
    !request.nextUrl.pathname.startsWith("/sales/login") &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/sales/login", request.url));
    }
    // Any sales role (or a transition allowlist admin) may reach the portal.
    // Reuses the role lookup above — no extra round-trip.
    if (!isSalesUser) {
      // Surface the reason on the login page instead of silently bouncing
      // to the marketing landing.
      const url = new URL("/sales/login", request.url);
      url.searchParams.set("error", "not_sales_user");
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from admin/sales login pages
  if (request.nextUrl.pathname === "/admin/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (request.nextUrl.pathname === "/sales/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/sales", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/sales",
    "/sales/:path*",
    "/api/sales/:path*",
  ],
};

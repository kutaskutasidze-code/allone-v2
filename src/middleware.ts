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

  // Admin allowlist (LEGACY). Retained only as a transition safety net so a
  // current admin can't be locked out while authorization moves to
  // sales_users.role. Removed at cutover once every admin has a role row.
  const ADMIN_EMAILS = (
    process.env.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(",")
      : [
          "nikoloz.gaprindashvili@allonelabs.com",
          "luka.tsulukidze@allonelabs.com",
          "luka.adamia@allonelabs.com",
          "team@allonelabs.com",
          "lizi.nodia@allonelabs.com",
        ]
  )
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  const userEmail = (user?.email || "").toLowerCase().trim();
  const isAllowlistAdmin = ADMIN_EMAILS.includes(userEmail);

  // Single source of truth: resolve the caller's role from sales_users (one
  // indexed service-role lookup). Union with the legacy allowlist during the
  // transition so no current admin is ever locked out.
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
  // Coarse middleware gate. Admin = role 'admin' (or allowlist during transition).
  // The admin-only-vs-supervisor split is enforced per-route by requireRole().
  const isAdmin = dbRole === "admin" || isAllowlistAdmin;
  const isSalesUser = dbRole !== null || isAllowlistAdmin;

  // Protect admin routes (except login)
  if (
    request.nextUrl.pathname.startsWith("/admin") &&
    !request.nextUrl.pathname.startsWith("/admin/login") &&
    !request.nextUrl.pathname.startsWith("/api/")
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    if (!isAdmin) {
      // A non-admin who is a sales user belongs in the sales portal — not the
      // public landing page (e.g. a rep who logged in via /admin/login).
      return NextResponse.redirect(new URL(isSalesUser ? "/sales" : "/", request.url));
    }
  }

  // Protect admin API routes
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    if (!isAuthenticated || !isAdmin) {
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

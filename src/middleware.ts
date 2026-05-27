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

  // Admin allowlist. Configurable via ADMIN_EMAILS env var (comma-separated)
  // so new admins can be added in the Vercel dashboard without a code change.
  // The hardcoded list below is a safety fallback if the env var is unset.
  const ADMIN_EMAILS = (
    process.env.ADMIN_EMAILS
      ? process.env.ADMIN_EMAILS.split(",")
      : [
          "nikoloz.gaprindashvili@allonelabs.com",
          "luka.tsulukidze@allonelabs.com",
          "luka.adamia@allonelabs.com",
          "team@allonelabs.com",
        ]
  )
    .map((e) => e.toLowerCase().trim())
    .filter(Boolean);

  // Case-insensitive comparison — Supabase may store emails with original casing,
  // and a case-sensitive includes() would silently bounce a valid admin.
  const userEmail = (user?.email || "").toLowerCase().trim();
  const isAdmin = ADMIN_EMAILS.includes(userEmail);

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
      return NextResponse.redirect(new URL("/", request.url));
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
    if (!user?.email) {
      return NextResponse.redirect(new URL("/sales/login", request.url));
    }
    // Admin emails (allowlist) bypass the sales_users existence check —
    // they should always be able to reach the sales portal.
    if (!isAdmin) {
      const adminUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/sales_users?email=eq.${encodeURIComponent((user.email||'').toLowerCase())}&select=id&limit=1`;
      const lookup = await fetch(adminUrl, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
        },
        cache: "no-store",
      });
      const rows = lookup.ok ? await lookup.json() : [];
      if (!Array.isArray(rows) || rows.length === 0) {
        // Surface the reason on the login page instead of silently bouncing
        // to the marketing landing.
        const url = new URL("/sales/login", request.url);
        url.searchParams.set("error", "not_sales_user");
        return NextResponse.redirect(url);
      }
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

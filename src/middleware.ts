import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

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
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const isAuthenticated = !!user && !error;

  // Protect admin routes (except login)
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login') &&
    !request.nextUrl.pathname.startsWith('/api/')
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Protect sales routes (except login)
  if (
    request.nextUrl.pathname.startsWith('/sales') &&
    !request.nextUrl.pathname.startsWith('/sales/login') &&
    !request.nextUrl.pathname.startsWith('/api/')
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/sales/login', request.url));
    }
  }

  // Redirect logged-in users away from admin/sales login pages
  if (request.nextUrl.pathname === '/admin/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  if (request.nextUrl.pathname === '/sales/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/sales', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*', '/sales', '/sales/:path*', '/api/sales/:path*'],
};

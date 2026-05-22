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

  const ADMIN_EMAILS = [
    'luka.tsulukidze@allonelabs.com',
    'luka.adamia@allonelabs.com',
    'levan.shavliashvili@allonelabs.com',
    'tato.dzagnidze@allonelabs.com',
    'elene.pirtskhalava@allonelabs.com',
    'nikoloz.gaprindashvili@allonelabs.com',
  ];

  // Protect admin routes (except login)
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login') &&
    !request.nextUrl.pathname.startsWith('/api/')
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (!ADMIN_EMAILS.includes(user!.email || '')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect admin API routes
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    if (!isAuthenticated || !ADMIN_EMAILS.includes(user!.email || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Protect sales routes (except login). Anyone who can reach the sales portal
  // must (a) be authenticated and (b) have a row in sales_users — otherwise the
  // sidebar and the per-rep scoping wouldn't make sense and the API would 401
  // every page load.
  if (
    request.nextUrl.pathname.startsWith('/sales') &&
    !request.nextUrl.pathname.startsWith('/sales/login') &&
    !request.nextUrl.pathname.startsWith('/api/')
  ) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/sales/login', request.url));
    }
    if (!user?.email) {
      return NextResponse.redirect(new URL('/sales/login', request.url));
    }
    const { data: salesUser } = await supabase
      .from('sales_users')
      .select('id')
      .eq('email', user.email)
      .maybeSingle();
    if (!salesUser) {
      return NextResponse.redirect(new URL('/', request.url));
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

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Debug endpoint — returns the auth state the server sees for this request.
// Intentionally NOT under /api/admin so middleware doesn't gate it; use this
// when the admin panel bounces you and you need to know why.
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS
    ? process.env.ADMIN_EMAILS.split(',')
    : [
        'nikoloz.gaprindashvili@allonelabs.com',
        'luka.tsulukidze@allonelabs.com',
        'luka.adamia@allonelabs.com',
        'team@allonelabs.com',
      ]
  ).map(e => e.toLowerCase().trim()).filter(Boolean);

  const userEmail = (user?.email || '').toLowerCase().trim();

  return NextResponse.json({
    authenticated: !!user && !error,
    email: user?.email ?? null,
    emailNormalized: userEmail || null,
    isAdmin: ADMIN_EMAILS.includes(userEmail),
    allowlist: ADMIN_EMAILS,
    authError: error?.message ?? null,
  });
}

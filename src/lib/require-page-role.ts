import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkSalesAuth, type Role } from '@/lib/sales-auth';

/**
 * Server-side page guard for the /admin and /sales layouts — defense-in-depth
 * alongside middleware. Reads the pathname from the `x-pathname` header that
 * middleware sets, so the login route can be skipped without a redirect loop.
 */
export async function requirePageRole(
  roles: Role[],
  opts: { loginPrefix: string; loginPath: string; deniedPath: string },
): Promise<void> {
  const pathname = (await headers()).get('x-pathname') || '';
  if (pathname.startsWith(opts.loginPrefix)) return; // never guard the login route
  const auth = await checkSalesAuth();
  if (!auth) redirect(opts.loginPath);
  if (!roles.includes(auth.salesUser.role as Role)) redirect(opts.deniedPath);
}

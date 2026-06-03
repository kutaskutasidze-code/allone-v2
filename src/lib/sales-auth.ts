import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AuthError } from '@/lib/auth';
import type { SalesUser } from '@/types/database';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface SalesAuthResult {
  supabase: SupabaseClient;
  user: User;
  salesUser: SalesUser;
}

/**
 * Requires the current user to be authenticated as a sales user.
 * Throws AuthError if not authenticated or not a sales user.
 */
export async function requireSalesAuth(): Promise<SalesAuthResult> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user?.email) {
    throw new AuthError('Unauthorized');
  }

  const admin = createAdminClient();
  const { data: salesUser } = await admin
    .from('sales_users')
    .select('*')
    .eq('email', (user.email||'').toLowerCase())
    .maybeSingle();

  if (!salesUser) {
    throw new AuthError('Not authorized as sales user');
  }

  return { supabase, user, salesUser };
}

/**
 * Checks if the current user is authenticated as a sales user.
 * Returns null if not authenticated or not a sales user.
 */
export async function checkSalesAuth(): Promise<SalesAuthResult | null> {
  try {
    return await requireSalesAuth();
  } catch {
    return null;
  }
}

export type Role = 'admin' | 'supervisor' | 'salesperson';

/**
 * Requires the current sales user to hold one of the given roles.
 * Throws AuthError(401) if not a sales user, AuthError(403) if the role is insufficient.
 */
export async function requireRole(roles: Role[]): Promise<SalesAuthResult> {
  const res = await requireSalesAuth();
  if (!roles.includes(res.salesUser.role as Role)) {
    throw new AuthError('Insufficient role', 403);
  }
  return res;
}

/**
 * Requires the current user to be a supervisor or admin. Throws AuthError otherwise.
 */
export async function requireSupervisorAuth(): Promise<SalesAuthResult> {
  return requireRole(['admin', 'supervisor']);
}

export function isSupervisor(salesUser: SalesUser): boolean {
  return salesUser.role === 'supervisor' || salesUser.role === 'admin';
}

export function isAdmin(salesUser: SalesUser): boolean {
  return salesUser.role === 'admin';
}

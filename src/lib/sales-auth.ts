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
    .eq('email', user.email)
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

/**
 * Requires the current user to be a supervisor. Throws AuthError otherwise.
 */
export async function requireSupervisorAuth(): Promise<SalesAuthResult> {
  const res = await requireSalesAuth();
  if (res.salesUser.role !== 'supervisor' && res.salesUser.role !== 'admin') {
    throw new AuthError('Supervisor access required');
  }
  return res;
}

export function isSupervisor(salesUser: SalesUser): boolean {
  return salesUser.role === 'supervisor' || salesUser.role === 'admin';
}

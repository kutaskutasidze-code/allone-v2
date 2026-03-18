import { createClient } from '@/lib/supabase/server';
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

  if (error || !user) {
    throw new AuthError('Unauthorized');
  }

  // Check if user exists in sales_users table
  const { data: salesUser, error: salesError } = await supabase
    .from('sales_users')
    .select('*')
    .eq('email', user.email)
    .single();

  if (salesError || !salesUser) {
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
